import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { findCategoryByPrediction } from "@/lib/category-mapping";
import { predictCategoryMl } from "@/lib/ml-client";
import { prisma } from "@/lib/prisma";
import { transactionCreateSchema } from "@/lib/validations";
import { EntryType, PredictionType, Prisma } from "@prisma/client";
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
    const description = parsed.description?.trim() || undefined;
    const categoriesForType = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true, userId: null }],
        type: parsed.type,
      },
      select: { id: true, name: true, type: true },
    });

    if (parsed.categoryId) {
      const category = categoriesForType.find((item) => item.id === parsed.categoryId);
      if (!category) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
    }

    const prediction =
      description && description.length > 0
        ? await predictCategoryMl({
            description,
            transaction_type: parsed.type,
            candidate_labels: categoriesForType.map((item) => item.name),
          })
        : null;

    const predictedCategory = prediction
      ? findCategoryByPrediction(categoriesForType, prediction.predicted_label)
      : null;
    const resolvedCategoryId = parsed.categoryId ?? predictedCategory?.id;
    const isAutoCategorized = !parsed.categoryId && Boolean(predictedCategory);
    const isCorrectedByUser =
      parsed.isCorrectedByUser ??
      Boolean(
        parsed.categoryId &&
          predictedCategory &&
          parsed.categoryId !== predictedCategory.id,
      );

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: parsed.type,
        amount: parsed.amount,
        description,
        date: parsed.date,
        categoryId: resolvedCategoryId,
        predictedCategoryLabel: prediction?.predicted_label ?? null,
        isAutoCategorized,
        confidenceScore: prediction?.confidence_score,
        isCorrectedByUser,
        mlSource: prediction?.model_source ?? null,
        predictionCreatedAt: prediction ? new Date() : null,
      },
      include: {
        category: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (prediction) {
      await prisma.predictionLog.create({
        data: {
          userId,
          predictionType: PredictionType.CATEGORY,
          inputSnapshot: {
            description,
            transactionType: parsed.type,
            categoryId: parsed.categoryId ?? null,
          },
          result: {
            predictedLabel: prediction.predicted_label,
            predictedCategoryId: predictedCategory?.id ?? null,
            resolvedCategoryId: resolvedCategoryId ?? null,
            isAutoCategorized,
            modelSource: prediction.model_source,
          },
          confidence: prediction.confidence_score,
        },
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
