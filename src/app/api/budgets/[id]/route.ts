export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Budget from "@/models/Budget";
import { budgetSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = budgetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    await connectDB();
    const budget = await Budget.findOneAndUpdate(
      { _id: params.id, userId: (session.user as any).id },
      { ...result.data, startDate: new Date(result.data.startDate) },
      { new: true }
    );

    if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(budget);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const budget = await Budget.findOneAndDelete({
      _id: params.id,
      userId: (session.user as any).id,
    });

    if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Budget deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
