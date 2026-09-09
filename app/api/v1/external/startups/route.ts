import { NextResponse } from "next/server";
import { verifyApiKeyRequest } from "@/lib/apiKeyAuth";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rateLimiter";
import Startup from "@/lib/models/Startup";

export async function GET(req: Request) {
  const auth = await verifyApiKeyRequest(req, "read:startup");
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const rateLimit = checkRateLimit(auth.apiKey._id.toString(), auth.apiKey.rate_limit_per_min);
  const headers = createRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too Many Requests: Rate limit exceeded. Try again in a few seconds." },
      { status: 429, headers }
    );
  }

  try {
    const startupQuery: any = { user_id: auth.user._id };
    if (auth.apiKey.startup_id) {
      startupQuery._id = auth.apiKey.startup_id;
    }

    const startups = await Startup.find(startupQuery)
      .select("-__v")
      .lean();

    return NextResponse.json(
      {
        object: "list",
        data: startups,
        total: startups.length,
      },
      { headers }
    );
  } catch (error: any) {
    console.error("GET /api/v1/external/startups error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching startup records" },
      { status: 500, headers }
    );
  }
}
