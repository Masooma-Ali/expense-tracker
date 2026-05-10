import { type ClassValue, clsx } from "clsx";

// Simple class merge utility (no dependency needed)
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export const CATEGORY_ICONS: Record<string, string> = {
  Groceries: "🛒",
  Shopping: "🛍️",
  Dining: "🍽️",
  Entertainment: "🎬",
  Transport: "🚗",
  Health: "🏥",
  Utilities: "💡",
  Income: "💵",
  Other: "💳",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "#A2CB8B",
  Shopping: "#FB9B8F",
  Dining: "#FDC3A1",
  Entertainment: "#7bb8f5",
  Transport: "#c3b5f5",
  Health: "#f5d67b",
  Utilities: "#84B179",
  Income: "#5dc887",
  Other: "#b0b0b0",
};

export const DEFAULT_CATEGORIES = [
  "Groceries",
  "Shopping",
  "Dining",
  "Entertainment",
  "Transport",
  "Health",
  "Utilities",
  "Other",
];
