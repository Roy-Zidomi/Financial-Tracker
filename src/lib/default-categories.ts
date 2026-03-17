import { EntryType } from "@prisma/client";

export const DEFAULT_CATEGORIES = [
  { id: "default-food", name: "Makanan", type: EntryType.EXPENSE },
  { id: "default-transport", name: "Transportasi", type: EntryType.EXPENSE },
  { id: "default-fun", name: "Hiburan", type: EntryType.EXPENSE },
  { id: "default-salary", name: "Gaji", type: EntryType.INCOME },
  { id: "default-other", name: "Lainnya", type: EntryType.EXPENSE },
] as const;
