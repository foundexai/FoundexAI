import dns from "dns";
import { promisify } from "util";

const lookupAsync = promisify(dns.lookup);

/**
 * Checks whether an IPv4 address belongs to a private, loopback, or reserved range.
 */
function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b] = parts;

  // Loopback (127.0.0.0/8)
  if (a === 127) return true;

  // Unspecified (0.0.0.0/8)
  if (a === 0) return true;

  // RFC1918 Private ranges:
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  // Link-Local / Cloud Metadata (169.254.0.0/16) - AWS, GCP, Azure, DigitalOcean
  if (a === 169 && b === 254) return true;

  // Carrier-grade NAT (100.64.0.0/10)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // Broadcast
  if (parts[0] === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is loopback, unique local, or link-local.
 */
function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
  // Unspecified
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;
  // IPv4 mapped (e.g. ::ffff:127.0.0.1)
  if (normalized.startsWith("::ffff:")) {
    const ipv4Part = normalized.substring(7);
    return isPrivateOrReservedIPv4(ipv4Part);
  }
  // Unique Local Address (fc00::/7 -> fc.. or fd..)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  // Link-Local (fe80::/10)
  if (normalized.startsWith("fe80") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;

  return false;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Validates a webhook URL against SSRF threats:
 * 1. Must use https: protocol (http: allowed strictly in development if explicit).
 * 2. Hostname must resolve to a valid non-private, non-loopback, non-metadata IP.
 */
export async function validateWebhookUrl(rawUrl: string): Promise<WebhookValidationResult> {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "Invalid URL string provided" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { isValid: false, error: "Malformed URL format" };
  }

  // 1. Protocol verification - must be HTTPS in production
  const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const allowHttp = isDev && process.env.FOUNDEX_ALLOW_HTTP_WEBHOOKS === "true";

  if (parsed.protocol !== "https:") {
    if (!allowHttp || parsed.protocol !== "http:") {
      return { isValid: false, error: "Webhook URL must use secure HTTPS protocol." };
    }
  }

  const hostname = parsed.hostname;

  // 2. Reject obvious localhost / loopback aliases directly
  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost === "localhost" ||
    lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local") ||
    lowerHost.endsWith(".internal") ||
    lowerHost === "127.0.0.1" ||
    lowerHost === "::1" ||
    lowerHost === "0.0.0.0" ||
    lowerHost === "169.254.169.254"
  ) {
    return { isValid: false, error: "Access to loopback, local, or cloud metadata hosts is strictly prohibited." };
  }

  // 3. Resolve DNS to verify the actual destination IPs
  try {
    const addresses = await lookupAsync(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isValid: false, error: "Unable to resolve target host DNS." };
    }

    for (const entry of addresses) {
      const isForbidden = entry.family === 6
        ? isPrivateOrReservedIPv6(entry.address)
        : isPrivateOrReservedIPv4(entry.address);

      if (isForbidden) {
        return {
          isValid: false,
          error: `Security exception: Target hostname resolves to a restricted internal or private IP address (${entry.address}).`,
        };
      }
    }
  } catch (err: any) {
    return { isValid: false, error: `DNS resolution failed: ${err.message}` };
  }

  return { isValid: true, sanitizedUrl: parsed.toString() };
}
