import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { findCategoryByPrediction } from "@/lib/category-mapping";
import { predictCategoryMl } from "@/lib/ml-client";
import { prisma } from "@/lib/prisma";
import { EntryType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  description: z.string().trim().min(2),
  type: z.nativeEnum(EntryType),
});

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  try {
    const parsed = requestSchema.parse(await request.json());
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true, userId: null }],
        type: parsed.type,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const prediction = await predictCategoryMl({
      description: parsed.description,
      transaction_type: parsed.type,
      candidate_labels: categories.map((item) => item.name),
    });

    if (!prediction) {
      return NextResponse.json({ error: "ML service unavailable" }, { status: 503 });
    }

    const matchedCategory = findCategoryByPrediction(categories, prediction.predicted_label);
    return NextResponse.json({
      predictedLabel: prediction.predicted_label,
      confidenceScore: prediction.confidence_score,
      categoryId: matchedCategory?.id ?? null,
      categoryName: matchedCategory?.name ?? prediction.predicted_label,
      modelSource: prediction.model_source,
      alternatives: prediction.alternatives,
    });
  } catch (error) {
    return badRequest(error);
  }
}
