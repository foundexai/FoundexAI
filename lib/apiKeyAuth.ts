import crypto from "crypto";
import { connectDB } from "@/lib/db";
import ApiKey, { ApiKeyScope } from "@/lib/models/ApiKey";
import Startup from "@/lib/models/Startup";
import User from "@/lib/models/User";

export interface ApiAuthResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  apiKey?: any;
  user?: any;
  startup?: any;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateNewApiKey({
  name,
  userId,
  startupId,
  scopes,
  rateLimitPerMin = 120,
  expiresInDays,
}: {
  name: string;
  userId: string;
  startupId?: string;
  scopes: ApiKeyScope[];
  rateLimitPerMin?: number;
  expiresInDays?: number;
}): Promise<{ rawKey: string; keyRecord: any }> {
  await connectDB();

  let validatedStartupId = startupId;
  if (startupId) {
    const ownedStartup = await Startup.findOne({ _id: startupId, user_id: userId }).lean();
    if (!ownedStartup) {
      const error: any = new Error("Forbidden: You do not own or administer the specified startup.");
      error.statusCode = 403;
      throw error;
    }
    validatedStartupId = ownedStartup._id.toString();
  }

  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawKey = `fdx_live_${randomBytes}`;
  const keyPrefix = rawKey.substring(0, 16);
  const hashedSecret = hashToken(rawKey);

  let expiresAt: Date | undefined;
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  }

  const keyRecord = await ApiKey.create({
    user_id: userId,
    startup_id: validatedStartupId,
    name,
    key_prefix: keyPrefix,
    hashed_secret: hashedSecret,
    scopes,
    rate_limit_per_min: rateLimitPerMin,
    status: "active",
    expires_at: expiresAt,
  });

  return { rawKey, keyRecord };
}

export async function verifyApiKeyRequest(
  req: Request,
  requiredScope?: ApiKeyScope
): Promise<ApiAuthResult> {
  try {
    const authHeader = req.headers.get("Authorization");
    const customKeyHeader = req.headers.get("X-API-Key");
    
    let rawToken: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      rawToken = authHeader.substring(7).trim();
    } else if (customKeyHeader) {
      rawToken = customKeyHeader.trim();
    }

    if (!rawToken || !rawToken.startsWith("fdx_live_")) {
      return {
        success: false,
        error: "Missing or invalid API Key. Include 'Authorization: Bearer fdx_live_...' or 'X-API-Key'.",
        statusCode: 401,
      };
    }

    await connectDB();
    const hashedSecret = hashToken(rawToken);

    const apiKey = await ApiKey.findOne({
      hashed_secret: hashedSecret,
      status: "active",
    });

    if (!apiKey) {
      return {
        success: false,
        error: "Invalid or revoked API Key.",
        statusCode: 401,
      };
    }

    if (apiKey.expires_at && new Date() > new Date(apiKey.expires_at)) {
      return {
        success: false,
        error: "API Key has expired.",
        statusCode: 401,
      };
    }

    if (requiredScope && (!apiKey.scopes || !apiKey.scopes.includes(requiredScope))) {
      return {
        success: false,
        error: `Forbidden: API Key lacks required scope '${requiredScope}'. Granted scopes: [${apiKey.scopes.join(", ")}].`,
        statusCode: 403,
      };
    }

    // Asynchronously update last used
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    ApiKey.findByIdAndUpdate(apiKey._id, {
      last_used_at: new Date(),
      last_used_ip: clientIp,
    }).exec().catch((e) => console.error("Failed to update API key last_used:", e));

    const user = await User.findById(apiKey.user_id).select("-password -password_hash").lean();
    if (!user) {
      return {
        success: false,
        error: "Forbidden: API Key user account no longer exists.",
        statusCode: 403,
      };
    }

    let startup = null;
    if (apiKey.startup_id) {
      startup = await Startup.findOne({ _id: apiKey.startup_id, user_id: apiKey.user_id }).lean();
      if (!startup) {
        return {
          success: false,
          error: "Forbidden: API Key is bound to a startup not owned by this account.",
          statusCode: 403,
        };
      }
    }

    return {
      success: true,
      apiKey,
      user,
      startup,
    };
  } catch (error: any) {
    console.error("API Key Verification Exception:", error);
    return {
      success: false,
      error: "Internal security authentication failure.",
      statusCode: 500,
    };
  }
}
