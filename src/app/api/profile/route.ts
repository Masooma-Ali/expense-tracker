export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { profileSchema, passwordSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById((session.user as any).id).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { password: _, ...safeUser } = user as any;
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Handle password change
    if (body.currentPassword) {
      const result = passwordSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
      }

      await connectDB();
      const user = await User.findById((session.user as any).id);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const isValid = await bcrypt.compare(result.data.currentPassword, user.password);
      if (!isValid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

      user.password = await bcrypt.hash(result.data.newPassword, 12);
      await user.save();
      return NextResponse.json({ message: "Password updated" });
    }

    // Handle profile update
    const result = profileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      (session.user as any).id,
      { name: result.data.name, currency: result.data.currency },
      { new: true }
    );

    const { password: _, ...safeUser } = (user as any).toObject();
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
