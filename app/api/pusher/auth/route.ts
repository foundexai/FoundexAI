import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Startup from "@/lib/models/Startup";
import DocumentShare from "@/lib/models/DocumentShare";

export async function POST(request: Request) {
  try {
    const { socket_id, channel_name, signing_token } = await request.json();

    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let userId: string | null = null;

    // Handle user's personal notification channel: private-esign-{userId}
    if (channel_name.startsWith("private-esign-")) {
      // Extract user ID from channel name
      const channelUserId = channel_name.replace("private-esign-", "");
      
      // Get authorization header
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const token = authHeader.replace("Bearer ", "");
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        userId = decoded.id;

        // Verify the user is authorized to subscribe to their own channel
        if (userId !== channelUserId) {
          return NextResponse.json({ error: "Forbidden: Cannot access this channel" }, { status: 403 });
        }
      } catch (err) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }
    // Handle document collaboration channel: private-document-{documentId}
    else if (channel_name.startsWith("private-document-")) {
      const documentId = channel_name.replace("private-document-", "");
      
      // Either logged in user with access OR external signer with valid signing token
      const authHeader = request.headers.get("authorization");
      
      await connectDB();
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        // Logged in user - verify they have access to this document
        const token = authHeader.replace("Bearer ", "");
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
          userId = decoded.id;
          
          // Check if user has access to this startup/document
          const startup = await Startup.findById(documentId);
          const documentShare = await DocumentShare.findOne({ 
            documentId,
            sharedWith: userId 
          });
          
          if (!startup && !documentShare) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
          }
          
          // Check access: if user is the startup owner OR the document has been shared with them
          const hasAccess = (startup && startup.founderId === userId) || !!documentShare;
            
          if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden: No access to this document" }, { status: 403 });
          }
        } catch (err) {
          console.error("Token verification error:", err);
          return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
      } else if (signing_token) {
        // External signer - verify signing token is valid for this document
        try {
          const documentShare = await DocumentShare.findOne({ shareToken: signing_token });
          
          if (!documentShare || documentShare.documentId !== documentId) {
            return NextResponse.json({ error: "Invalid signing token" }, { status: 403 });
          }
        } catch (err) {
          console.error("Signing token verification error:", err);
          return NextResponse.json({ error: "Invalid signing token" }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    // Handle any other channel types you might need
    else {
      return NextResponse.json({ error: "Invalid channel name" }, { status: 400 });
    }

    // Authorize the channel
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}