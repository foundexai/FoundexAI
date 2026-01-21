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

    const user = await User.findById(decoded.user._id);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Toggle logic
    const isSaved = user.saved_investors.includes(investorId);
    if (isSaved) {
      user.saved_investors = user.saved_investors.filter(
        (id: string) => id !== investorId,
      );
    } else {
      user.saved_investors.push(investorId);
    }

    await user.save();

    return NextResponse.json({
      saved_investors: user.saved_investors,
      isSaved: !isSaved,
    });
  } catch (error) {
    console.error("Error saving investor:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
