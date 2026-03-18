import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { categoryCreateSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

function normalizeCategoryName(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ userId }, { isDefault: true, userId: null }],
    },
    orderBy: [{ type: "asc" }, { name: "asc" }, { isDefault: "asc" }, { createdAt: "asc" }],
  });

  // Remove duplicates by (type + normalized name), prioritizing user categories.
  const unique = new Map<string, (typeof categories)[number]>();
  for (const category of categories) {
    const key = `${category.type}:${normalizeCategoryName(category.name)}`;
    if (!unique.has(key)) {
      unique.set(key, category);
    }
  }

  return NextResponse.json(Array.from(unique.values()));
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
