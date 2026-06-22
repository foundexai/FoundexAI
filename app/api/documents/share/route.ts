import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import DocumentShare from "@/lib/models/DocumentShare";
import InvestorProfile from "@/lib/models/InvestorProfile";

export async function GET(req: Request) {
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
    const Startup = mongoose.models.Startup || (await import("@/lib/models/Startup")).default;

    if (user.user_type === "founder") {
      const shares = await DocumentShare.find({ founder_id: user._id })
        .populate("startup_id", "company_name")
        .sort({ created_at: -1 });

      const mappedShares = shares.map((s: any) => {
        const obj = s.toObject();
        return {
          ...obj,
          id: s._id.toString(),
          startupId: obj.startup_id?._id || obj.startup_id,
          startupName: obj.startup_id?.company_name || "Foundex Startup",
          docName: obj.doc_name,
          docUrl: obj.doc_url,
          investorName: obj.investor_name,
          date: obj.created_at,
        };
      });
      return NextResponse.json({ shares: mappedShares });
    } else {
      // Find the investor profile to match company name
      const profile = await InvestorProfile.findOne({ user_id: user._id });
      const companyName = profile?.company_name || user.full_name;
      
      const shares = await DocumentShare.find({
        $or: [
          { investor_id: user._id },
          { investor_name: { $regex: new RegExp(`^${companyName}$`, "i") } }
        ]
      })
      .populate("startup_id", "company_name")
      .sort({ created_at: -1 });
      
      const mappedShares = shares.map((s: any) => {
        const obj = s.toObject();
        return {
          ...obj,
          id: s._id.toString(),
          startupId: obj.startup_id?._id || obj.startup_id,
          startupName: obj.startup_id?.company_name || "Foundex Startup",
          docName: obj.doc_name,
          docUrl: obj.doc_url,
          investorName: obj.investor_name,
          date: obj.created_at,
        };
      });
      return NextResponse.json({ shares: mappedShares });
    }
  } catch (err) {
    console.error("Error fetching shares:", err);
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
    const { docName, docUrl, investorName, investorId, message, startupId } = await req.json();

    if (!docName || !docUrl || !investorName || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Automatically resolve the startup ID if not passed from frontend
    let finalStartupId = startupId;
    let companyName = "A startup";
    const Startup = mongoose.models.Startup || (await import("@/lib/models/Startup")).default;
    if (!finalStartupId) {
      const startup = await Startup.findOne({ user_id: user._id });
      if (startup) {
        finalStartupId = startup._id;
        companyName = startup.company_name;
      }
    } else {
      const startup = await Startup.findById(finalStartupId);
      if (startup) {
        companyName = startup.company_name;
      }
    }

    // Save share log in database
    const newShare = await DocumentShare.create({
      startup_id: finalStartupId ? new mongoose.Types.ObjectId(finalStartupId) : undefined,
      founder_id: user._id,
      investor_id: investorId,
      investor_name: investorName,
      doc_name: docName,
      doc_url: docUrl,
      message,
    });

    // Notify the investor if they are a platform user
    if (investorId) {
      const { notifyUser } = await import("@/lib/notifications");
      try {
        await notifyUser(
          investorId,
          "📄 Document Shared",
          `The founder of "${companyName}" has shared "${docName}" with you.`,
          "system",
          "/dashboard/documents"
        );
      } catch (err) {
        console.error("Failed to notify investor of shared document:", err);
      }
    }

    // Also sync and add to pipeline chat message
    const ChatMessage = mongoose.models.ChatMessage || (await import("@/lib/models/ChatMessage")).default;
    
    // Add founder message with document attachment
    await ChatMessage.create({
      investor_id: investorId || investorName,
      sender: "founder",
      text: message,
      sharedDoc: {
        name: docName,
        url: docUrl
      },
      created_at: new Date()
    });

    // Create automatic reply in database immediately (stamped 3 seconds later)
    await ChatMessage.create({
      investor_id: investorId || investorName,
      sender: "investor",
      text: `Thank you for sharing ${docName}. Our investment committee will review these details and follow up on the next steps.`,
      created_at: new Date(Date.now() + 3000)
    });

    return NextResponse.json({ success: true, share: newShare });
  } catch (err) {
    console.error("Error creating share:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing share ID" }, { status: 400 });
    }

    await DocumentShare.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting share:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
