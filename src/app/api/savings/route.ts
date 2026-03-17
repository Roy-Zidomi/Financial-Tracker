import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { savingsCreateSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const result = goals.map((goal) => {
    const current = Number(goal.currentAmount);
    const target = Number(goal.targetAmount);
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return {
      ...goal,
      progress,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  try {
    const parsed = savingsCreateSchema.parse(await request.json());
    const goal = await prisma.savingsGoal.create({
      data: {
        ...parsed,
        userId,
      },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
