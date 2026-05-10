import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";
import { sendWeeklySummaryEmail } from "@/lib/email";

// This route is called automatically every Monday at 8AM by Vercel Cron
// Configured in vercel.json
// Can also be triggered manually: GET /api/cron/weekly-summary?secret=YOUR_CRON_SECRET

export async function GET(req: NextRequest) {
  try {
    // Security: require secret header or query param to prevent unauthorized calls
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret") || req.headers.get("x-cron-secret");

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Date range: last 7 days
    const now = new Date();
    const weekEnd = new Date(now);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekStartStr = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekEndStr = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Get all active users
    const users = await User.find({ isActive: true, role: "user" }).lean();
    console.log(`Sending weekly emails to ${users.length} users...`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const userId = user._id;

        // Get this user's transactions for the week
        const [transactions, budgets] = await Promise.all([
          Transaction.find({
            userId,
            date: { $gte: weekStart, $lte: weekEnd },
          }).lean(),
          Budget.find({ userId }).lean(),
        ]);

        // Calculate stats
        const totalSpent = transactions
          .filter((t) => t.type === "expense")
          .reduce((a, t) => a + t.amount, 0);

        const totalIncome = transactions
          .filter((t) => t.type === "income")
          .reduce((a, t) => a + t.amount, 0);

        // Top categories
        const categoryTotals: Record<string, number> = {};
        transactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
          });

        const topCategories = Object.entries(categoryTotals)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);

        // Budget alerts (over 80%)
        const budgetAlerts = budgets
          .map((b) => ({
            category: b.category,
            limit: b.limit,
            spent: categoryTotals[b.category] || 0,
            percentage: Math.round(((categoryTotals[b.category] || 0) / b.limit) * 100),
          }))
          .filter((b) => b.percentage > 80);

        // Skip email if user had zero activity this week
        if (totalSpent === 0 && totalIncome === 0) {
          console.log(`Skipping ${user.email} — no activity this week`);
          continue;
        }

        const success = await sendWeeklySummaryEmail({
          userName: user.name,
          userEmail: user.email,
          totalSpent,
          totalIncome,
          topCategories,
          budgetAlerts,
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          currency: (user as any).currency || "USD",
        });

        if (success) {
          sent++;
          console.log(`✅ Email sent to ${user.email}`);
        } else {
          failed++;
          console.error(`❌ Failed to send to ${user.email}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
      } catch (userError) {
        failed++;
        console.error(`Error processing user ${user.email}:`, userError);
      }
    }

    return NextResponse.json({
      message: "Weekly summary cron complete",
      sent,
      failed,
      total: users.length,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
