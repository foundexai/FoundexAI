import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { title, message, link } = await request.json();
    
    const userId = decoded.user._id.toString();
    
    const notification = await createNotification({
      userId,
      title: title || "Test Notification",
      message: message || "This is a test push notification from Foundex!",
      link: link || "/dashboard",
      type: "system",
    });

    return NextResponse.json({ 
      success: true, 
      notification: {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
      }
    });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}