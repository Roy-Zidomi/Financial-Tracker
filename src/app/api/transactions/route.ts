import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { transactionCreateSchema } from "@/lib/validations";
import { EntryType, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as EntryType | null;
  const categoryId = searchParams.get("categoryId");
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 20);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Prisma.TransactionWhereInput = {
    userId,
  };

  if (type && Object.values(EntryType).includes(type)) {
    where.type = type;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  try {
    const parsed = transactionCreateSchema.parse(await request.json());

    if (parsed.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: parsed.categoryId,
          OR: [{ userId }, { isDefault: true, userId: null }],
        },
      });
      if (!category) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...parsed,
        userId,
      },
      include: {
        category: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
