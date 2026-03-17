import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { budgetUpdateSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const { id } = await params;
  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  try {
    const parsed = budgetUpdateSchema.parse(await request.json());
    const updated = await prisma.budget.update({
      where: { id },
      data: parsed,
      include: {
        category: {
          select: { id: true, name: true, type: true },
        },
      },
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
  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
