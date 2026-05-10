import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "csv";

    await connectDB();

    const query: any = { userId: (session.user as any).id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).lean();

    if (format === "csv") {
      // Build CSV
      const rows = [
        ["Date", "Description", "Category", "Type", "Amount", "Notes"],
        ...transactions.map((t) => [
          new Date(t.date).toLocaleDateString(),
          t.description,
          t.category,
          t.type,
          t.type === "expense" ? `-${t.amount}` : `${t.amount}`,
          t.notes || "",
        ]),
      ];

      const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="sprout-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
