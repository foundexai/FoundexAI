import SecureLink from "@/lib/models/SecureLink";
import AuditLog from "@/lib/models/AuditLog";

export interface SOC2CleanupResult {
  purgedLinksCount: number;
  anonymizedLogsCount: number;
  details: Array<{
    linkId: string;
    docName: string;
    expiredAt?: Date;
    retentionDays: number;
  }>;
}

/**
 * SOC2 Data Retention & Automated Purge Engine
 * Identifies expired or revoked secure links that have exceeded their data retention lifecycle.
 */
export async function runSOC2RetentionCleanup(): Promise<SOC2CleanupResult> {
  const now = new Date();

  // Find links with auto_delete_expired enabled and not already purged (deleted_at is null)
  const links = await SecureLink.find({
    auto_delete_expired: { $ne: false },
    deleted_at: { $exists: false },
  });

  const details: SOC2CleanupResult["details"] = [];
  let purgedCount = 0;
  let anonymizedCount = 0;

  for (const link of links) {
    const retentionDays = link.soc2_retention_days || 90;
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    let isEligibleForPurge = false;

    // Check if expired past retention window
    if (link.expires_at) {
      const expirationAgeMs = now.getTime() - new Date(link.expires_at).getTime();
      if (expirationAgeMs > retentionMs) {
        isEligibleForPurge = true;
      }
    } else if (link.is_revoked) {
      // If revoked without explicit expiry, check creation date + retention window
      const ageMs = now.getTime() - new Date(link.created_at).getTime();
      if (ageMs > retentionMs) {
        isEligibleForPurge = true;
      }
    }

    if (isEligibleForPurge) {
      // Perform cryptographic purge of sensitive data
      anonymizedCount += link.access_logs?.length || 0;

      link.deleted_at = now;
      link.doc_url = "[PURGED_SOC2_RETENTION]";
      link.passcode = undefined;
      link.allowed_emails = [];
      link.allowed_ips = [];
      link.otp_requests = [];
      link.is_revoked = true;

      // Anonymize viewer IPs in historical access logs
      if (link.access_logs && link.access_logs.length > 0) {
        link.access_logs.forEach((log: any) => {
          log.viewer_ip = "0.0.0.0";
          log.user_agent = "ANONYMIZED_SOC2";
        });
      }

      await link.save();
      purgedCount++;

      details.push({
        linkId: link._id.toString(),
        docName: link.doc_name,
        expiredAt: link.expires_at,
        retentionDays,
      });

      // Record Compliance Audit Entry
      if (link.startup_id && link.founder_id) {
        await AuditLog.create({
          startup_id: link.startup_id,
          user_id: link.founder_id,
          action: "delete",
          entity: "SecureLinkRetention",
          entity_id: link._id,
          details: {
            reason: "SOC2 Automated Expiration Purge",
            retention_days: retentionDays,
            doc_name: link.doc_name,
            purged_at: now.toISOString(),
          },
        });
      }
    }
  }

  return {
    purgedLinksCount: purgedCount,
    anonymizedLogsCount: anonymizedCount,
    details,
  };
}
