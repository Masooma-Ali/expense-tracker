import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import AuditLog from "@/models/AuditLog";

async function requireAdmin(session: any) {
  return !!(session && (session.user as any)?.role === "admin");
}

// POST /api/admin/notifications — broadcast to all users
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await requireAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { message, type = "info" } = await req.json();

    if (!message || message.trim().length < 3) {
      return NextResponse.json({ error: "Message is required (min 3 characters)" }, { status: 400 });
    }

    if (!["info", "warning", "budget_alert"].includes(type)) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    await connectDB();

    // Get all active regular users
    const users = await User.find({ role: "user", isActive: true }).select("_id").lean();

    if (users.length === 0) {
      return NextResponse.json({ message: "No active users to notify", sent: 0 });
    }

    // Create one notification per user
    const notifications = users.map((u) => ({
      userId: u._id,
      message: message.trim(),
      type,
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    // Log in audit trail
    await AuditLog.create({
      userId: (session!.user as any).id,
      action: "BROADCAST_NOTIFICATION",
      resourceType: "Notification",
      details: { message, type, sentTo: users.length },
    });

    return NextResponse.json({
      message: `Notification sent to ${users.length} users`,
      sent: users.length,
    });
  } catch (error) {
    console.error("Broadcast notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/notifications — list recent broadcasts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await requireAdmin(session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // Get recent broadcast logs
    const logs = await AuditLog.find({ action: "BROADCAST_NOTIFICATION" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
