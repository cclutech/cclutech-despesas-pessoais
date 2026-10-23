import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lockUserBalance } from "@/lib/finance";
import { authenticatedUser, errorResponse } from "@/lib/http";

type MovementType = "deposit" | "withdrawal";

function parseAmount(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^(?:0|[1-9]\d{0,9})(?:[.,]\d{1,2})?$/.test(raw)) return null;
  const [units, fraction = ""] = raw.replace(",", ".").split(".");
  const cents = Number(units) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

async function migrateLegacySavings(tx: Prisma.TransactionClient, userId: string) {
  await lockUserBalance(tx, userId);
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { savingsMigratedAt: true },
  });
  if (!user || user.savingsMigratedAt) return;

  const legacyTransactions = await tx.transaction.findMany({
    where: { userId, savings: { gt: 0 } },
    select: { id: true, savings: true, date: true, description: true },
  });
  if (legacyTransactions.length) {
    await tx.savingsMovement.createMany({
      data: legacyTransactions.map((item) => ({
        userId,
        type: "deposit" as const,
        amount: item.savings,
        date: item.date,
        description: item.description
          ? `${item.description} — saldo migrado de Poupado (Reservado)`
          : "Saldo migrado de Poupado (Reservado)",
        legacyTransactionId: item.id,
      })),
      skipDuplicates: true,
    });
  }
  await tx.user.update({
    where: { id: userId },
    data: { savingsMigratedAt: new Date() },
  });
}

async function getSummary(tx: Prisma.TransactionClient, userId: string) {
  const [income, expenses, deposits, withdrawals] = await Promise.all([
    tx.transaction.aggregate({
      where: { userId, type: "income" },
      _sum: { amount: true },
    }),
    tx.transaction.aggregate({
      where: { userId, type: "expense" },
      _sum: { amount: true },
    }),
    tx.savingsMovement.aggregate({
      where: { userId, type: "deposit" },
      _sum: { amount: true },
    }),
    tx.savingsMovement.aggregate({
      where: { userId, type: "withdrawal" },
      _sum: { amount: true },
    }),
  ]);
  const savingsBalance = (deposits._sum.amount ?? new Prisma.Decimal(0))
    .minus(withdrawals._sum.amount ?? new Prisma.Decimal(0));
  const availableBalance = (income._sum.amount ?? new Prisma.Decimal(0))
    .minus(expenses._sum.amount ?? new Prisma.Decimal(0))
    .minus(savingsBalance);

  return {
    savingsBalance,
    availableBalance,
  };
}

async function getMonthlySummary(
  tx: Prisma.TransactionClient,
  userId: string,
  start: Date,
  end: Date,
) {
  const date = { gte: start, lt: end };
  const [income, expenses, deposits, withdrawals] = await Promise.all([
    tx.transaction.aggregate({
      where: { userId, type: "income", date },
      _sum: { amount: true },
    }),
    tx.transaction.aggregate({
      where: { userId, type: "expense", date },
      _sum: { amount: true },
    }),
    tx.savingsMovement.aggregate({
      where: { userId, type: "deposit", date },
      _sum: { amount: true },
    }),
    tx.savingsMovement.aggregate({
      where: { userId, type: "withdrawal", date },
      _sum: { amount: true },
    }),
  ]);
  const monthlySavingsBalance = (deposits._sum.amount ?? new Prisma.Decimal(0))
    .minus(withdrawals._sum.amount ?? new Prisma.Decimal(0));
  const monthlyAvailableBalance = (income._sum.amount ?? new Prisma.Decimal(0))
    .minus(expenses._sum.amount ?? new Prisma.Decimal(0))
    .minus(monthlySavingsBalance);

  return { monthlySavingsBalance, monthlyAvailableBalance };
}

export async function GET(request: NextRequest) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;
  try {
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    if (Boolean(from) !== Boolean(to)) {
      return NextResponse.json({ error: "Indique o início e o fim do período." }, { status: 400 });
    }
    const start = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = to ? new Date(to) : new Date(start.getFullYear(), start.getMonth() + 1, 1);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
      return NextResponse.json({ error: "Indique um período válido." }, { status: 400 });
    }
    const data = await db.$transaction(async (tx) => {
      await migrateLegacySavings(tx, user.id);
      const [movements, summary] = await Promise.all([
        tx.savingsMovement.findMany({
          where: { userId: user.id, date: { gte: start, lt: end } },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        }),
        getMonthlySummary(tx, user.id, start, end),
      ]);
      return {
        monthlySavingsBalance: Number(summary.monthlySavingsBalance),
        monthlyAvailableBalance: Number(summary.monthlyAvailableBalance),
        movements: movements.map((movement) => ({
          ...movement,
          amount: Number(movement.amount),
        })),
      };
    });
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error, "Não foi possível carregar as poupanças.");
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Indique os dados da transferência." }, { status: 400 });
    }
    const amountCents = parseAmount(body.amount);
    const type: MovementType | null = body.type === "deposit" || body.type === "withdrawal"
      ? body.type
      : null;
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";

    if (!amountCents || !type) {
      return NextResponse.json({ error: "Indique um valor e um tipo de transferência válidos." }, { status: 400 });
    }
    if (!/^[\w-]{8,100}$/.test(idempotencyKey) || description.length > 240) {
      return NextResponse.json({ error: "Verifique a descrição e tente novamente." }, { status: 400 });
    }

    const amount = new Prisma.Decimal(amountCents).dividedBy(100);
    const result = await db.$transaction(async (tx) => {
      await migrateLegacySavings(tx, user.id);
      const previous = await tx.savingsMovement.findUnique({
        where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } },
      });
      if (previous) {
        if (previous.type !== type || !previous.amount.equals(amount)) {
          return { error: "Esta transferência já foi enviada com outros dados.", status: 409 as const };
        }
        return { movement: previous, duplicated: true };
      }

      const summary = await getSummary(tx, user.id);
      const relevantBalance = type === "deposit" ? summary.availableBalance : summary.savingsBalance;
      if (relevantBalance.lessThan(amount)) {
        return {
          error: type === "deposit"
            ? "O valor excede o saldo disponível."
            : "O valor excede o saldo disponível nas poupanças.",
          status: 400 as const,
        };
      }

      const movement = await tx.savingsMovement.create({
        data: {
          userId: user.id,
          type,
          amount,
          description: description || null,
          idempotencyKey,
        },
      });
      return { movement, duplicated: false };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      movement: { ...result.movement, amount: Number(result.movement.amount) },
    }, { status: result.duplicated ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, "Não foi possível registar a transferência.");
  }
}
