import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticatedUser, errorResponse, validType } from "@/lib/http";

export async function GET() {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;
  try {
    const categories = await db.category.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true, icon: true, isCustom: true },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await authenticatedUser();
  if (response || !user) return response;
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const icon = typeof body.icon === "string" ? body.icon.trim() : "";
    if (!name || name.length > 40 || !icon || icon.length > 16 || !validType(body.type)) {
      return NextResponse.json({ error: "Indique um nome, um ícone e um tipo válidos." }, { status: 400 });
    }
    const duplicate = await db.category.findFirst({
      where: { userId: user.id, name: { equals: name, mode: "insensitive" }, type: body.type },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome." }, { status: 409 });
    }
    const category = await db.category.create({
      data: { userId: user.id, name, icon, type: body.type, isCustom: true },
      select: { id: true, name: true, icon: true, type: true, isCustom: true },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Não foi possível criar a categoria.");
  }
}
