import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lockUserBalance } from "@/lib/finance";
import { authenticatedUser, errorResponse } from "@/lib/http";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;
  try {
    const { id } = await params;
    const result = await db.$transaction(async (tx) => {
      await lockUserBalance(tx, user.id);
      return tx.transaction.deleteMany({ where: { id, userId: user.id } });
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Não foi possível eliminar a transação.");
  }
}
