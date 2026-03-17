import { badRequest, requireUserId, unauthorized } from "@/lib/api";
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

    let imported = 0;
    for (const row of parsed.data) {
      if (!row.amount || !row.type || !row.date) {
        continue;
      }

      const normalizedType =
        row.type.toUpperCase() === EntryType.INCOME ? EntryType.INCOME : EntryType.EXPENSE;
      const categoryName = row.category?.trim() || "Imported";

      const category = await prisma.category.upsert({
        where: {
          id: `${userId}-${normalizedType}-${categoryName}`.toLowerCase().replace(/\s+/g, "-"),
        },
        update: {},
        create: {
          id: `${userId}-${normalizedType}-${categoryName}`.toLowerCase().replace(/\s+/g, "-"),
          userId,
          name: categoryName,
          type: normalizedType,
          isDefault: false,
        },
      });

      await prisma.transaction.create({
        data: {
          userId,
          categoryId: category.id,
          type: normalizedType,
          amount: Number(row.amount),
          description: row.description || null,
          date: new Date(row.date),
        },
      });
      imported += 1;
    }

    return NextResponse.json({ imported });
  } catch (error) {
    return badRequest(error);
  }
}
