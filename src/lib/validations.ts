import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const transactionSchema = z.object({
  description: z.string().min(1, "Description is required").max(100),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["expense", "income"]),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  isRecurring: z.boolean().optional().default(false),
  recurringFrequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
  notes: z.string().max(500).optional(),
});

export const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  limit: z.number().positive("Limit must be positive"),
  period: z.enum(["monthly", "weekly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(50),
  currency: z.string().min(3).max(3),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
