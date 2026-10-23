import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticatedUser, errorResponse, validType } from "@/lib/http";

export async function GET(request: NextRequest) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;
  try {
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...(from && to ? { date: { gte: new Date(from), lt: new Date(to) } } : {}),
      },
      include: { category: { select: { id: true, name: true, icon: true, type: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 250,
    });
    return NextResponse.json({
      transactions: transactions.map((item) => ({
        ...item,
        amount: Number(item.amount),
        savings: Number(item.savings),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const savings = body.savings === undefined || body.savings === "" ? 0 : Number(body.savings);
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const date = new Date(body.date);

    if (!validType(body.type) || !Number.isFinite(amount) || amount <= 0 || amount > 9999999999) {
      return NextResponse.json({ error: "Indique um valor e tipo de transação válidos." }, { status: 400 });
    }
    if (!Number.isFinite(savings) || savings < 0 || savings > amount || (body.type === "expense" && savings > 0)) {
      return NextResponse.json({ error: "A poupança deve ser inferior à receita associada." }, { status: 400 });
    }
    if (!body.categoryId || !Number.isFinite(date.getTime()) || description.length > 240) {
      return NextResponse.json({ error: "Verifique a categoria, a data e a descrição." }, { status: 400 });
    }

    const category = await db.category.findFirst({
      where: {
        id: body.categoryId,
        type: body.type,
        OR: [{ userId: user.id }, { userId: null }],
      },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "A categoria selecionada não é válida." }, { status: 400 });
    }
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        type: body.type,
        amount: amount.toFixed(2),
        savings: savings.toFixed(2),
        date,
        description: description || null,
      },
      include: { category: { select: { id: true, name: true, icon: true, type: true } } },
    });
    return NextResponse.json(
      { transaction: { ...transaction, amount: Number(transaction.amount), savings: Number(transaction.savings) } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "Não foi possível guardar a transação.");
  }
}
