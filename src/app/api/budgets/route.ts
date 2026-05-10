import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import { budgetSchema } from "@/lib/validations";
import { getMonthRange } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userId = (session.user as any).id;

    const budgets = await Budget.find({ userId }).lean();

    // Get current month spending per category
    const { start, end } = getMonthRange();
    const spending = await Transaction.aggregate([
      { $match: { userId: new (require("mongoose").Types.ObjectId)(userId), type: "expense", date: { $gte: start, $lte: end } } },
      { $group: { _id: "$category", spent: { $sum: "$amount" } } },
    ]);

    const spendingMap: Record<string, number> = {};
    spending.forEach((s) => { spendingMap[s._id] = s.spent; });

    const budgetsWithSpending = budgets.map((b) => ({
      ...b,
      spent: spendingMap[b.category] || 0,
      percentage: Math.round(((spendingMap[b.category] || 0) / b.limit) * 100),
    }));

    return NextResponse.json(budgetsWithSpending);
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = budgetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    await connectDB();
    const userId = (session.user as any).id;

    // Upsert: update if same category exists, else create
    const budget = await Budget.findOneAndUpdate(
      { userId, category: result.data.category },
      { ...result.data, userId, startDate: new Date(result.data.startDate) },
      { new: true, upsert: true }
    );

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
