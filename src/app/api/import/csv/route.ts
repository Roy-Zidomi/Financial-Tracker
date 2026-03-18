import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { findCategoryByPrediction, normalizeLabel } from "@/lib/category-mapping";
import { predictCategoryMl } from "@/lib/ml-client";
import { prisma } from "@/lib/prisma";
import { EntryType } from "@prisma/client";
import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";

type CsvRow = {
  date?: string;
  type?: string;
  category?: string;
  description?: string;
  amount?: string;
};

function isUnclearCategory(value: string | undefined) {
  const normalized = normalizeLabel(value ?? "");
  return (
    !normalized ||
    ["unknown", "unclear", "?", "-", "n/a", "na", "none"].includes(normalized)
  );
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const csvText = body?.csv as string;
    if (!csvText) {
      return NextResponse.json({ error: "Missing csv field" }, { status: 400 });
    }

    const parsed = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: parsed.errors[0].message }, { status: 400 });
    }

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true, userId: null }],
      },
      select: { id: true, name: true, type: true },
    });
    const predictionCache = new Map<string, Awaited<ReturnType<typeof predictCategoryMl>>>();

    let imported = 0;
    let aiCategorized = 0;
    for (const row of parsed.data) {
      if (!row.amount || !row.type || !row.date) {
        continue;
      }

      const normalizedType =
        row.type.toUpperCase() === EntryType.INCOME ? EntryType.INCOME : EntryType.EXPENSE;
      const typedCategories = categories.filter((item) => item.type === normalizedType);
      const rowCategory = row.category?.trim();
      let resolvedCategory = rowCategory
        ? typedCategories.find(
            (item) => normalizeLabel(item.name) === normalizeLabel(rowCategory),
          ) ?? null
        : null;

      const description = row.description?.trim() ?? "";
      let prediction: Awaited<ReturnType<typeof predictCategoryMl>> = null;

      if (!resolvedCategory && isUnclearCategory(rowCategory) && description.length > 0) {
        const cacheKey = `${normalizedType}:${description.toLowerCase()}`;
        prediction =
          predictionCache.get(cacheKey) ??
          (await predictCategoryMl({
            description,
            transaction_type: normalizedType,
            candidate_labels: typedCategories.map((item) => item.name),
          }));
        predictionCache.set(cacheKey, prediction);

        if (prediction) {
          resolvedCategory = findCategoryByPrediction(typedCategories, prediction.predicted_label);
        }
      }

      const fallbackCategoryName =
        rowCategory && !isUnclearCategory(rowCategory)
          ? rowCategory
          : prediction?.predicted_label || "Imported";

      if (!resolvedCategory) {
        const existingFallback = typedCategories.find(
          (item) => normalizeLabel(item.name) === normalizeLabel(fallbackCategoryName),
        );
        resolvedCategory =
          existingFallback ??
          (await prisma.category.upsert({
            where: {
              id: `${userId}-${normalizedType}-${fallbackCategoryName}`
                .toLowerCase()
                .replace(/\s+/g, "-"),
            },
            update: {},
            create: {
              id: `${userId}-${normalizedType}-${fallbackCategoryName}`
                .toLowerCase()
                .replace(/\s+/g, "-"),
              userId,
              name: fallbackCategoryName,
              type: normalizedType,
              isDefault: false,
            },
            select: { id: true, name: true, type: true },
          }));

        if (resolvedCategory) {
          const resolvedCategoryId = resolvedCategory.id;
          if (!categories.some((item) => item.id === resolvedCategoryId)) {
            categories.push(resolvedCategory);
          }
        }
      }

      if (!resolvedCategory) {
        continue;
      }

      const amount = Number(row.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      const aiFilled = Boolean(!rowCategory || isUnclearCategory(rowCategory));
      if (prediction && aiFilled) {
        aiCategorized += 1;
      }

      await prisma.transaction.create({
        data: {
          userId,
          categoryId: resolvedCategory.id,
          type: normalizedType,
          amount,
          description: description || null,
          date: new Date(row.date),
          predictedCategoryLabel: prediction?.predicted_label ?? null,
          isAutoCategorized: Boolean(prediction && aiFilled),
          confidenceScore: prediction?.confidence_score ?? null,
          isCorrectedByUser: false,
          mlSource: prediction?.model_source ?? null,
          predictionCreatedAt: prediction ? new Date() : null,
        },
      });
      imported += 1;
    }

    return NextResponse.json({ imported, aiCategorized });
  } catch (error) {
    return badRequest(error);
  }
}
