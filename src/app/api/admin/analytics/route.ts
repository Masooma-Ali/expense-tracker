import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

async function requireAdmin(session: any) {
  return !!(session && (session.user as any)?.role === "admin");
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await requireAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const last6Months = new Date(now);
    last6Months.setMonth(last6Months.getMonth() - 5);

    const [
      totalUsers,
      newUsersThisWeek,
      totalTransactions,
      txThisMonth,
      topSpenders,
      monthlySignups,
      platformTotals,
    ] = await Promise.all([
      // Total non-admin users
      User.countDocuments({ role: "user" }),

      // New users this week
      User.countDocuments({ role: "user", createdAt: { $gte: startOfWeek } }),

      // All transactions ever
      Transaction.countDocuments(),

      // Transactions this month
      Transaction.countDocuments({ date: { $gte: startOfMonth } }),

      // Top 5 most active users by transaction count
      Transaction.aggregate([
        { $group: { _id: "$userId", txCount: { $sum: 1 }, totalSpent: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } } } },
        { $sort: { txCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $project: { name: "$user.name", email: "$user.email", txCount: 1, totalSpent: 1 } },
      ]),

      // Monthly signups for last 6 months
      User.aggregate([
        { $match: { role: "user", createdAt: { $gte: last6Months } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Platform-wide totals
      Transaction.aggregate([
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalExpense = platformTotals.find((t: any) => t._id === "expense")?.total || 0;
    const totalIncome = platformTotals.find((t: any) => t._id === "income")?.total || 0;

    const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const signupChart = monthlySignups.map((s: any) => ({
      name: `${MONTH_NAMES[s._id.month]}`,
      signups: s.count,
    }));

    return NextResponse.json({
      totalUsers,
      newUsersThisWeek,
      totalTransactions,
      txThisMonth,
      totalExpense,
      totalIncome,
      topSpenders,
      signupChart,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
