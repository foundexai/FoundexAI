import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token not provided." },
        { status: 401 },
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const { investorId } = await req.json();

    if (!investorId) {
      return NextResponse.json(
        { error: "Investor ID is required." },
        { status: 400 },
      );
    }

    // Toggle logic using atomic findOneAndUpdate for better consistency and speed
    const isSavedAlready = decoded.user.saved_investors.includes(investorId);
    
    const updatedUser = await User.findOneAndUpdate(
      { _id: decoded.user._id },
      isSavedAlready 
        ? { $pull: { saved_investors: investorId } }
        : { $addToSet: { saved_investors: investorId } },
      { new: true, lean: true }
    );

    if (!updatedUser) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({
      saved_investors: updatedUser.saved_investors,
      isSaved: !isSavedAlready,
    });
  } catch (error) {
    console.error("Error saving investor:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
