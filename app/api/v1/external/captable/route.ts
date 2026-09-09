import { NextResponse } from "next/server";
import { verifyApiKeyRequest } from "@/lib/apiKeyAuth";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rateLimiter";
import Startup from "@/lib/models/Startup";
import CapTable from "@/lib/models/CapTable";

export async function GET(req: Request) {
  const auth = await verifyApiKeyRequest(req, "read:captable");
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const rateLimit = checkRateLimit(auth.apiKey._id.toString(), auth.apiKey.rate_limit_per_min);
  const headers = createRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too Many Requests: Rate limit exceeded." },
      { status: 429, headers }
    );
  }

  try {
    let targetStartupId = auth.apiKey.startup_id;
    if (!targetStartupId) {
      const userStartup = await Startup.findOne({ user_id: auth.user._id }).sort({ created_at: 1 });
      targetStartupId = userStartup?._id;
    }

    if (!targetStartupId) {
      return NextResponse.json({ error: "No startup found for this account" }, { status: 404, headers });
    }

    const grants = await CapTable.find({ startup_id: targetStartupId })
      .select("-__v")
      .sort({ created_at: 1 })
      .lean();

    const totalShares = grants.reduce((sum, g) => sum + (g.share_count || 0), 0);
    const totalInvestedUsd = grants.reduce((sum, g) => sum + (g.investment_amount_usd || g.investment_amount || 0), 0);

    return NextResponse.json(
      {
        object: "captable_summary",
        startup_id: targetStartupId,
        metrics: {
          total_shares: totalShares,
          total_capital_raised_usd: totalInvestedUsd,
          shareholders_count: grants.length,
        },
        data: grants,
      },
      { headers }
    );
  } catch (error: any) {
    console.error("GET /api/v1/external/captable error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching cap table" },
      { status: 500, headers }
    );
  }
}
