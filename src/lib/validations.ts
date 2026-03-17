import { EntryType } from "@prisma/client";
import { z } from "zod";

const amountSchema = z.coerce.number().positive("Amount must be greater than 0");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(40),
  type: z.nativeEnum(EntryType),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const transactionCreateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  type: z.nativeEnum(EntryType),
  amount: amountSchema,
  description: z.string().trim().max(160).optional(),
  date: z.coerce.date(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const budgetCreateSchema = z.object({
  categoryId: z.string().min(1).nullable().optional(),
  amountLimit: amountSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const budgetUpdateSchema = budgetCreateSchema.partial();

export const savingsCreateSchema = z.object({
  title: z.string().trim().min(2).max(80),
  targetAmount: amountSchema,
  currentAmount: z.coerce.number().min(0).optional(),
  deadline: z.coerce.date().nullable().optional(),
});

export const savingsUpdateSchema = savingsCreateSchema.partial();
