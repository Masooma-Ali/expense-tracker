export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import AuditLog from "@/models/AuditLog";

async function requireAdmin(session: any) {
  if (!session || (session.user as any)?.role !== "admin") return false;
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await requireAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const adminId = (session!.user as any).id;

    const [users, totalTx] = await Promise.all([
      // Exclude the admin account itself from the list
      User.find({ role: { $ne: "admin" } })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean(),
      Transaction.countDocuments(),
    ]);

    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
    const activeUsers = await User.countDocuments({ role: { $ne: "admin" }, isActive: true });

    return NextResponse.json({
      users,
      totalUsers,
      activeUsers,
      totalTransactions: totalTx,
    });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await requireAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, isActive } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Only allow toggling active status — role change removed
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Only isActive can be updated" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Log the action in audit trail
    await AuditLog.create({
      userId: (session!.user as any).id,
      action: isActive ? "ACTIVATE_USER" : "SUSPEND_USER",
      resourceType: "User",
      resourceId: userId,
      details: { targetEmail: user.email, newStatus: isActive ? "active" : "suspended" },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Admin PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await requireAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await connectDB();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Delete user and all their data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Transaction.deleteMany({ userId }),
    ]);

    // Log deletion
    await AuditLog.create({
      userId: (session!.user as any).id,
      action: "DELETE_USER",
      resourceType: "User",
      resourceId: userId,
      details: { deletedEmail: user.email },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
