import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";
import { getMonthRange } from "@/lib/utils";
import { buildForecast } from "@/lib/forecast";          // ← NEW

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const { start, end } = getMonthRange();

    const [
      monthlyStats,
      categoryBreakdown,
      monthlyTrend,
      budgets,
      recentTransactions,
      forecastRaw,             // ← NEW
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, date: { $gte: start, $lte: end } } },
        { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { userId, type: "expense", date: { $gte: start, $lte: end } } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: "expense",
            date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Budget.find({ userId: (session.user as any).id }).lean(),
      Transaction.find({ userId }).sort({ date: -1 }).limit(5).lean(),

      // Forecast: last 6 months per category
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: "expense",
            date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              category: "$category",
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const income = monthlyStats.find((s) => s._id === "income")?.total || 0;
    const expense = monthlyStats.find((s) => s._id === "expense")?.total || 0;
    const txCount = monthlyStats.reduce((a, s) => a + s.count, 0);

    const categoryMap: Record<string, number> = {};
    categoryBreakdown.forEach((c) => { categoryMap[c._id] = c.total; });

    const budgetsWithUsage = budgets.map((b) => ({
      ...b,
      spent: categoryMap[b.category] || 0,
      percentage: Math.round(((categoryMap[b.category] || 0) / b.limit) * 100),
    }));

    const totalBudget = budgets.reduce((a, b) => a + b.limit, 0);

    // Build forecast using linear regression
    const forecast = buildForecast(forecastRaw);

    return NextResponse.json({
      summary: { income, expense, balance: income - expense, txCount },
      totalBudget,
      totalSpent: expense,
      budgetPercentage: totalBudget > 0 ? Math.round((expense / totalBudget) * 100) : 0,
      categoryBreakdown,
      monthlyTrend,
      budgets: budgetsWithUsage,
      recentTransactions,
      forecast,               // ← NEW
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
