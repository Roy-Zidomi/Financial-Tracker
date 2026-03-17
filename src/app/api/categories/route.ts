import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { categoryCreateSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ userId }, { isDefault: true, userId: null }],
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  try {
    const parsed = categoryCreateSchema.parse(await request.json());
    const category = await prisma.category.create({
      data: {
        ...parsed,
        userId,
        isDefault: false,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
