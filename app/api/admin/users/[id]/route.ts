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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admins can update user privileges/roles
    const hasSuperAdminPrivilege = isSuperAdmin(decoded.user.email) || !!decoded.user.isSuperAdmin;
    if (!hasSuperAdminPrivilege) {
      return NextResponse.json({ error: "Only super admins can manage user permissions" }, { status: 403 });
    }

    const { id } = await params;
    const { is_admin } = await req.json();

    if (is_admin === undefined) {
      return NextResponse.json({ error: "is_admin field is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wasAdmin = !!user.is_admin;
    const makeAdmin = !!is_admin;

    if (wasAdmin !== makeAdmin) {
      user.is_admin = makeAdmin;
      await user.save();

      // If user is granted admin privileges, trigger push notification
      if (makeAdmin) {
        const { notifyUser } = await import("@/lib/notifications");
        try {
          await notifyUser(
            id,
            "🛡️ Admin Privileges Granted",
            `An administrator has granted you admin privileges. Please reload the application to access the admin dashboard.`,
            "approval",
            "/dashboard"
          );
        } catch (notifyErr) {
          console.error("Failed to notify user of admin privilege grant:", notifyErr);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        is_admin: user.is_admin
      } 
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
