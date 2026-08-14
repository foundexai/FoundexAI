import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SignatureRequest from "@/lib/models/SignatureRequest";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const request = await SignatureRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Signature request not found" }, { status: 404 });
    }

    return NextResponse.json({ signatureRequest: request });
  } catch (err) {
    console.error("GET /api/documents/signatures/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
