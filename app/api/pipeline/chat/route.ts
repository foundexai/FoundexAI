import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import ChatMessage from "@/lib/models/ChatMessage";
import { eventBus } from "@/lib/eventBus";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get("investorId");
    const threadId = searchParams.get("threadId");
    const refId = searchParams.get("refId"); // Optional context reference filter
    const listThreads = searchParams.get("listThreads") === "true";

    const query: any = {};

    if (investorId) {
      query.investor_id = investorId;
    }

    if (listThreads) {
      if (!investorId) {
        return NextResponse.json({ error: "Investor ID is required for listing threads" }, { status: 400 });
      }
      // Find all parent thread messages (where thread_id is null/undefined or equals its own _id)
      const threads = await ChatMessage.find({
        investor_id: investorId,
        $or: [
          { thread_id: { $exists: false } },
          { thread_id: null }
        ]
      }).sort({ created_at: -1 });

      return NextResponse.json({ threads });
    }

    if (threadId) {
      query.$or = [
        { _id: new mongoose.Types.ObjectId(threadId) },
        { thread_id: new mongoose.Types.ObjectId(threadId) }
      ];
    } else if (refId) {
      // Filter comments linked to a specific context resource (e.g. Document URL)
      query["context.ref_id"] = refId;
    } else if (!investorId) {
      return NextResponse.json({ error: "Investor ID, Thread ID or Ref ID is required" }, { status: 400 });
    }

    const messages = await ChatMessage.find(query).sort({ created_at: 1 });
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Error fetching chat:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    const { investorId, text, sender = "founder", threadId, subject, context } = await req.json();

    if (!investorId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Save the new message
    const msg = await ChatMessage.create({
      investor_id: investorId,
      sender,
      text,
      thread_id: threadId ? new mongoose.Types.ObjectId(threadId) : undefined,
      subject,
      context,
      created_at: new Date()
    });

    // Delegate investor response asynchronously via the Event-Driven Event Bus
    eventBus.emit("message:created", { message: msg });

    return NextResponse.json({ success: true, message: msg });
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
