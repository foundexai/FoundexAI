import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Investor from "@/lib/models/Investor";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    
    // Auth check for subscription status
    const token = req.headers.get("Authorization")?.split(" ")[1];
    let isSubscribed = false;
    if (token) {
      const { verifyToken } = await import("@/lib/auth");
      const { getSubscriptionStatus } = await import("@/lib/subscription");
      const decoded = await verifyToken(token);
      if (decoded) {
        const { is_subscribed, is_admin } = await getSubscriptionStatus(decoded.user.id || decoded.user._id, decoded.user.email);
        isSubscribed = is_subscribed || is_admin;
      }
    }

    await connectDB();

    // Limit non-subscribers to 1.5 pages (18 items total)
    const MAX_FREE_ITEMS = 18;
    const effectiveLimit = !isSubscribed ? Math.min(limit, Math.max(0, MAX_FREE_ITEMS - (page - 1) * limit)) : limit;

    if (!isSubscribed && (page - 1) * limit >= MAX_FREE_ITEMS) {
      return NextResponse.json({
        investors: [],
        pagination: { total: MAX_FREE_ITEMS, page, limit, pages: 2, restricted: true }
      });
    }

    // Build Query
    const query: any = { isApproved: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { focus: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (type) {
      if (type === "Featured") {
        query.isFeatured = true;
      } else {
        query.type = type;
      }
    }

    const skip = (page - 1) * limit;

    const [investors, totalCount] = await Promise.all([
      Investor.find(query)
        .sort({ isFeatured: -1, created_at: -1 })
        .skip(skip)
        .limit(effectiveLimit),
      Investor.countDocuments(query),
    ]);

    const total = isSubscribed ? totalCount : Math.min(totalCount, MAX_FREE_ITEMS);

    // Transform _id to id to match frontend interface
    const formattedInvestors = investors.map((inv) => ({
      id: inv._id.toString(),
      name: inv.name,
      type: inv.type,
      stage: inv.stage,
      focus: inv.focus,
      location: inv.location,
      hq_country: inv.hq_country,
      logoInitial: inv.logoInitial,
      logoColor: inv.logoColor,
      description: inv.description,
      thesis: inv.thesis,
      investmentRange: inv.investmentRange,
      website: inv.website,
      linkedin: inv.linkedin,
      email: inv.email,
      active_status: inv.active_status,
      logo_url: inv.logo_url,
      notes: inv.notes,
      isFeatured: inv.isFeatured,
    }));

    return NextResponse.json({
      investors: formattedInvestors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        restricted: !isSubscribed && totalCount > MAX_FREE_ITEMS,
      },
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    // Auth check
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();

    // Basic validation
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: "Name and Type are required" },
        { status: 400 },
      );
    }

    const newInvestor = await Investor.create({
      ...body,
      submittedBy: decoded.user._id,
      // Ensure defaults/fallbacks if needed
      focus: body.focus || [],
      logoColor: body.logoColor || "from-blue-500 to-indigo-600",
      logoInitial: body.logoInitial || body.name.charAt(0),
    });

    // Explicitly cast to any or correct type to avoid TS errors with toObject/_id
    const createdInv = newInvestor as any;

    // Notify Admins
    const { notifyAdmins } = await import("@/lib/notifications");
    await notifyAdmins(
      "💎 New Investor Submission",
      `${body.name} (${body.type}) has been submitted for approval.`,
      "submission",
      "/dashboard/admin"
    );

    return NextResponse.json(
      {
        message: "Investor created successfully",
        investor: {
          ...createdInv.toObject(),
          id: createdInv._id.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating investor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
