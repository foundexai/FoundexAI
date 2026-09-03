/**
 * Network Security & Geo-Fencing Utility for Enterprise Document Viewing
 */

export function extractClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

export function extractClientCountry(req: Request): string {
  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") return cfCountry.toUpperCase();

  const vercelCountry = req.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();

  const cloudfrontCountry = req.headers.get("cloudfront-viewer-country");
  if (cloudfrontCountry) return cloudfrontCountry.toUpperCase();

  const customCountry = req.headers.get("x-country-code");
  if (customCountry) return customCountry.toUpperCase();

  return "US"; // Default fallback
}

/**
 * Checks if an IPv4 address is in a CIDR subnet (e.g., "192.168.1.0/24")
 */
function ipInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) {
    return ip === cidr;
  }

  try {
    const [range, bitsStr] = cidr.split("/");
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false;

    const ipParts = ip.split(".").map(Number);
    const rangeParts = range.split(".").map(Number);
    if (ipParts.length !== 4 || rangeParts.length !== 4) return false;

    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];

    const mask = bits === 0 ? 0 : (~0 << (32 - bits));
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

/**
 * Validates whether the client IP satisfies IP Whitelisting rules
 */
export function isIpAllowed(clientIp: string, allowedIps: string[]): boolean {
  if (!allowedIps || allowedIps.length === 0) return true;

  // Localhost aliases
  if ((clientIp === "::1" || clientIp === "127.0.0.1") && allowedIps.some(ip => ip === "127.0.0.1" || ip === "localhost" || ip === "::1")) {
    return true;
  }

  return allowedIps.some((allowed) => {
    const cleanAllowed = allowed.trim();
    if (!cleanAllowed) return false;
    if (cleanAllowed === clientIp) return true;
    if (cleanAllowed.includes("/")) {
      return ipInCidr(clientIp, cleanAllowed);
    }
    return false;
  });
}

/**
 * Validates whether the client country satisfies Geo-Fencing rules
 */
export function isCountryAllowed(clientCountry: string, allowedCountries: string[]): boolean {
  if (!allowedCountries || allowedCountries.length === 0) return true;

  const upperCountry = clientCountry.toUpperCase();
  return allowedCountries.some((c) => c.trim().toUpperCase() === upperCountry);
}
