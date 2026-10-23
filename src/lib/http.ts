import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function authenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Sessão expirada. Inicie sessão novamente." }, { status: 401 }),
    };
  }
  return { user, response: null };
}

export function errorResponse(error: unknown, fallback = "Não foi possível concluir o pedido.") {
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function validType(value: unknown): value is "income" | "expense" {
  return value === "income" || value === "expense";
}
