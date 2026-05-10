import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    // Get last 30 transactions
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    // Get budgets
    const budgets = await Budget.find({ userId }).lean();

    // No transactions fallback
    if (transactions.length === 0) {
      return NextResponse.json({
        insights: [
          {
            type: "info",
            title: "No data yet",
            message:
              "Add some transactions to get personalized AI insights about your spending habits.",
            emoji: "💡",
          },
        ],
      });
    }

    // Total spent
    const totalSpent = transactions
      .filter((t) => t.type === "expense")
      .reduce((a, t) => a + t.amount, 0);

    // Total income
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((a, t) => a + t.amount, 0);

    // Category totals
    const categoryTotals: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + t.amount;
      });

    // Budget summary
    const budgetSummary = budgets.map((b) => ({
      category: b.category,
      limit: b.limit,
      spent: categoryTotals[b.category] || 0,
      overBudget:
        (categoryTotals[b.category] || 0) > b.limit,
    }));

    // Top category
    const topCategory = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // Prompt for AI
    const prompt = `
You are a smart personal finance advisor.

Analyze this user's spending data and generate exactly 4 short, friendly, actionable insights.

User Financial Summary:
- Total spent: $${totalSpent.toFixed(2)}
- Total income: $${totalIncome.toFixed(2)}
- Savings rate: ${
      totalIncome > 0
        ? (
            ((totalIncome - totalSpent) / totalIncome) *
            100
          ).toFixed(1)
        : 0
    }%
- Top spending category: ${
      topCategory
        ? `${topCategory[0]} ($${topCategory[1].toFixed(2)})`
        : "None"
    }

Category breakdown:
${JSON.stringify(categoryTotals)}

Budget status:
${JSON.stringify(budgetSummary)}

Return ONLY a valid JSON array with exactly 4 objects.

Each object must contain:
- "type": one of "warning", "success", "tip", "alert"
- "title": short title (max 5 words)
- "message": actionable insight (max 25 words)
- "emoji": one relevant emoji

Example:
[
  {
    "type":"warning",
    "title":"Dining Overspent",
    "message":"You spent more on dining this month. Try cooking at home twice weekly.",
    "emoji":"🍽️"
  }
]

Return ONLY the JSON array.
`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY as string
    );

    // Model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Generate content
    const result = await model.generateContent(prompt);

    const response = await result.response;

    const rawText = response.text().trim();

    console.log("Gemini Raw Response:", rawText);

    // Extract JSON safely
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);

    const insights = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : [];

    // Return AI insights
    return NextResponse.json({ insights });

  } catch (error) {
    console.error("AI insights error:", error);

    // Fallback insights
    return NextResponse.json({
      insights: [
        {
          type: "tip",
          title: "Track Daily",
          message:
            "Log expenses daily to stay aware of your spending habits.",
          emoji: "📝",
        },
        {
          type: "tip",
          title: "50/30/20 Rule",
          message:
            "Try following the 50/30/20 budgeting strategy each month.",
          emoji: "📊",
        },
        {
          type: "tip",
          title: "Set Budgets",
          message:
            "Budgets help prevent overspending before it becomes a problem.",
          emoji: "🎯",
        },
        {
          type: "tip",
          title: "Review Weekly",
          message:
            "Spend 5 minutes weekly reviewing your transactions and savings.",
          emoji: "📅",
        },
      ],
    });
  }
}