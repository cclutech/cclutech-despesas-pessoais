import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { defaultCategories } from "@/lib/default-categories";
import { errorResponse } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Introduza um endereço de email válido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A palavra-passe deve ter pelo menos 8 caracteres." }, { status: 400 });
    }
    if (await db.user.findUnique({ where: { email } })) {
      return NextResponse.json({ error: "Já existe uma conta com este email." }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        categories: { create: defaultCategories.map((category) => ({ ...category, isCustom: false })) },
      },
      select: { id: true, email: true },
    });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Não foi possível criar a conta.");
  }
}
