import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import ChatMessage from "@/lib/models/ChatMessage";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get("investorId");
    const threadId = searchParams.get("threadId");
    const listThreads = searchParams.get("listThreads") === "true";

    if (!investorId) {
      return NextResponse.json({ error: "Investor ID is required" }, { status: 400 });
    }

    if (listThreads) {
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

    const query: any = { investor_id: investorId };
    if (threadId) {
      query.$or = [
        { _id: new mongoose.Types.ObjectId(threadId) },
        { thread_id: new mongoose.Types.ObjectId(threadId) }
      ];
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

    // If sent by founder, auto-generate investor reply stamped 3 seconds later
    if (sender === "founder") {
      await ChatMessage.create({
        investor_id: investorId,
        sender: "investor",
        text: `Thank you for the message. Our committee will review it and get back to you.`,
        thread_id: threadId ? new mongoose.Types.ObjectId(threadId) : msg._id,
        context: context || undefined,
        created_at: new Date(Date.now() + 3000)
      });
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
