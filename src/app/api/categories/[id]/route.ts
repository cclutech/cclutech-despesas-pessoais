import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticatedUser, errorResponse } from "@/lib/http";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("name" in body) || !("icon" in body)) {
      return NextResponse.json({ error: "Indique um nome e um ícone válidos." }, { status: 400 });
    }
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const icon = typeof body.icon === "string" ? body.icon.trim() : "";
    if (!name || name.length > 40 || !icon || icon.length > 16) {
      return NextResponse.json({ error: "Indique um nome e um ícone válidos." }, { status: 400 });
    }

    const category = await db.category.findFirst({
      where: { id, userId: user.id },
      select: { id: true, type: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }
    const duplicate = await db.category.findFirst({
      where: {
        userId: user.id,
        type: category.type,
        id: { not: id },
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome." }, { status: 409 });
    }

    const updated = await db.category.update({
      where: { id },
      data: { name, icon },
      select: { id: true, name: true, icon: true, type: true, isCustom: true },
    });
    return NextResponse.json({ category: updated });
  } catch (error) {
    return errorResponse(error, "Não foi possível atualizar a categoria.");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const replacementId =
      typeof body === "object" && body !== null && "replacementCategoryId" in body &&
      typeof body.replacementCategoryId === "string"
        ? body.replacementCategoryId
        : "";

    const result = await db.$transaction(
      async (transaction) => {
        const category = await transaction.category.findFirst({
          where: { id, userId: user.id },
          select: { id: true, name: true, type: true },
        });
        if (!category) {
          return { error: "Categoria não encontrada.", status: 404 };
        }

        const transactionCount = await transaction.transaction.count({
          where: { categoryId: id, userId: user.id },
        });
        if (transactionCount > 0 && !replacementId) {
          return {
            error: "Seleciona uma categoria de destino para reclassificar os movimentos.",
            status: 400,
          };
        }

        if (transactionCount > 0) {
          const replacement = await transaction.category.findFirst({
            where: {
              AND: [{ id: replacementId }, { id: { not: id } }],
              type: category.type,
              OR: [{ userId: user.id }, { userId: null }],
            },
            select: { id: true },
          });
          if (!replacement) {
            return {
              error: "A categoria de destino não é válida.",
              status: 400,
            };
          }

          await transaction.transaction.updateMany({
            where: { categoryId: id, userId: user.id },
            data: { categoryId: replacement.id },
          });
        }

        await transaction.category.delete({ where: { id: category.id } });
        return { categoryName: category.name, transactionCount };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      categoryName: result.categoryName,
      reclassifiedCount: result.transactionCount,
    });
  } catch (error) {
    return errorResponse(error, "Não foi possível eliminar a categoria.");
  }
}
