type CategoryLike = {
  id: string;
  name: string;
};

const canonicalLabelMap: Record<string, string> = {
  makanan: "makanan",
  food: "makanan",
  kuliner: "makanan",
  transportasi: "transportasi",
  transport: "transportasi",
  transportation: "transportasi",
  perjalanan: "transportasi",
  hiburan: "hiburan",
  entertainment: "hiburan",
  fun: "hiburan",
  gaji: "gaji",
  income: "gaji",
  salary: "gaji",
  lainnya: "lainnya",
  other: "lainnya",
  uncategorized: "lainnya",
};

export function normalizeLabel(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function toCanonical(value: string) {
  const normalized = normalizeLabel(value);
  return canonicalLabelMap[normalized] ?? normalized;
}

export function findCategoryByPrediction<T extends CategoryLike>(
  categories: T[],
  predictedLabel: string,
): T | null {
  if (categories.length === 0) {
    return null;
  }

  const normalizedPrediction = normalizeLabel(predictedLabel);
  const direct = categories.find(
    (category) => normalizeLabel(category.name) === normalizedPrediction,
  );
  if (direct) {
    return direct;
  }

  const predictionCanonical = toCanonical(predictedLabel);
  const canonicalMatch = categories.find(
    (category) => toCanonical(category.name) === predictionCanonical,
  );
  if (canonicalMatch) {
    return canonicalMatch;
  }

  return null;
}
