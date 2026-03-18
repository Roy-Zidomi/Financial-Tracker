import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { transactionUpdateSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  try {
    const parsed = transactionUpdateSchema.parse(await request.json());
    const { isCorrectedByUser, ...rest } = parsed;

    if (rest.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: rest.categoryId,
          OR: [{ userId }, { isDefault: true, userId: null }],
        },
      });
      if (!category) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
    }

    const updateData: Prisma.TransactionUpdateInput = {
      ...rest,
      isCorrectedByUser:
        isCorrectedByUser ??
        (rest.categoryId !== undefined &&
        existing.isAutoCategorized &&
        rest.categoryId !== existing.categoryId
          ? true
          : existing.isCorrectedByUser),
    };

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
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
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
