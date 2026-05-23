import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken, isSuperAdmin } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admins can perform destructive actions like removing users
    const hasSuperAdminPrivilege = isSuperAdmin(decoded.user.email) || !!decoded.user.isSuperAdmin;
    if (!hasSuperAdminPrivilege) {
      return NextResponse.json({ error: "Only super admins can delete users" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    // Prevent deleting oneself
    if (id === decoded.user.id || id === decoded.user._id?.toString()) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Do not allow deleting other super admins
    if (isSuperAdmin(userToDelete.email) || userToDelete.isSuperAdmin) {
      return NextResponse.json({ error: "Cannot delete another super admin" }, { status: 403 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
