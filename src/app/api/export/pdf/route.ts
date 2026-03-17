import { requireUserId, unauthorized } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const month = Number(request.nextUrl.searchParams.get("month"));
  const year = Number(request.nextUrl.searchParams.get("year"));

  const where =
    Number.isFinite(month) && Number.isFinite(year)
      ? {
          userId,
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59, 999),
          },
        }
      : { userId };

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Personal Finance Report", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated at: ${new Date().toLocaleString("id-ID")}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Type", "Category", "Description", "Amount"]],
    body: transactions.map((item) => [
      new Date(item.date).toLocaleDateString("id-ID"),
      item.type,
      item.category?.name ?? "-",
      item.description ?? "-",
      formatCurrency(Number(item.amount)),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [36, 69, 85] },
  });

  const pdf = doc.output("arraybuffer");
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="finance-report.pdf"',
    },
  });
}
