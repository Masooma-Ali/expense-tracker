export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: string;
  userId: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  date: Date;
  isRecurring: boolean;
  recurringFrequency?: "weekly" | "monthly" | "yearly";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudget {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  period: "monthly" | "weekly" | "yearly";
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income" | "both";
}

export interface INotification {
  _id: string;
  userId: string;
  message: string;
  type: "budget_alert" | "info" | "warning";
  isRead: boolean;
  createdAt: Date;
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export interface TransactionFilters {
  category?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
