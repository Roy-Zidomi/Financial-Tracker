import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { categoryUpdateSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.userId !== userId || category.isDefault) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  try {
    const parsed = categoryUpdateSchema.parse(await request.json());
    const updated = await prisma.category.update({
      where: { id },
      data: parsed,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.userId !== userId || category.isDefault) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
