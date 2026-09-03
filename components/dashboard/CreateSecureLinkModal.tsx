"use client";

import { useState } from "react";
import {
  X,
  LockKey,
  ShieldCheck,
  EnvelopeSimple,
  Globe,
  Clock,
  Eye,
  DownloadSimple,
  FileText,
  Copy,
  Check,
  CircleNotch,
  Sparkle,
  GlobeHemisphereWest,
  MapPin,
  HardDrives,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface DocumentItem {
  name: string;
  url: string;
  type?: string;
}

interface CreateSecureLinkModalProps {
  document: DocumentItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateSecureLinkModal({
  document,
  onClose,
  onSuccess,
}: CreateSecureLinkModalProps) {
  const { token } = useAuth();
  const [accessType, setAccessType] = useState<"public" | "passcode" | "email_otp">("email_otp");
  const [passcode, setPasscode] = useState("");
  const [allowedEmails, setAllowedEmails] = useState("");
  const [expirationOption, setExpirationOption] = useState("7d");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  
  // Watermark Settings
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL • {email} • {date}");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.18);
  const [watermarkStyle, setWatermarkStyle] = useState<"diagonal" | "center" | "banner">("diagonal");

  // Enterprise Network & Geo-Fencing Settings
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
  const [allowedIps, setAllowedIps] = useState("");
  const [geofencingEnabled, setGeofencingEnabled] = useState(false);
  const [allowedCountries, setAllowedCountries] = useState("US, GB, DE, CA, NG");
  const [soc2RetentionDays, setSoc2RetentionDays] = useState(90);

  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = async () => {
    if (!document) return;
    setLoading(true);

    try {
      // Calculate expiration date
      let expiresAt: string | undefined = undefined;
      const now = new Date();
      if (expirationOption === "24h") {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationOption === "7d") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationOption === "30d") {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationOption === "custom" && customExpiryDate) {
        expiresAt = new Date(customExpiryDate).toISOString();
      }

      const emailsArray = allowedEmails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes("@"));

      const ipsArray = allowedIps
        .split(",")
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0);

      const countriesArray = allowedCountries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length === 2);

      const res = await fetch("/api/documents/secure-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          docName: document.name,
          docUrl: document.url,
          docType: document.type || "deck",
          accessType,
          passcode: accessType === "passcode" ? passcode : undefined,
          allowedEmails: accessType === "email_otp" ? emailsArray : undefined,
          ipRestrictionEnabled,
          allowedIps: ipRestrictionEnabled ? ipsArray : undefined,
          geofencingEnabled,
          allowedCountries: geofencingEnabled ? countriesArray : undefined,
          soc2RetentionDays,
          expiresAt,
          allowDownload,
          watermarkEnabled,
          watermarkText,
          watermarkOpacity,
          watermarkStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create secure link");

      const fullUrl = `${window.location.origin}${data.link.shareUrl}`;
      setGeneratedLink(fullUrl);
      toast.success("Secure Link Generated!", {
        description: "Your document is protected with access gates and dynamic watermarking.",
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate link.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 max-w-xl w-full shadow-2xl space-y-4 text-left my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5.5 h-5.5 text-yellow-500" weight="bold" />
              Create Secure Link
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Protect your pitch deck with access gates, view limits, and dynamic watermarks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {generatedLink ? (
          /* Generated Link Display Screen */
          <div className="space-y-4 py-1">
            {document && (
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold shrink-0">
                    <FileText className="w-5 h-5" weight="bold" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[280px]">
                      {document.name}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {document.type || "Document"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold shadow-lg shadow-green-500/25">
                ✓
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Your Link is Ready!</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Share this link with investors. Viewer verification and dynamic watermarks are active.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Shareable Protected Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copy" : "Copy"}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Configuration with Max Height Scroll Wrapping */
          <div className="space-y-4">
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1.5 custom-scrollbar">
              
              {/* Selected Document Info (Moved inside scroll container to prevent overlapping) */}
              {document && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold shrink-0">
                      <FileText className="w-5 h-5" weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[280px]">
                        {document.name}
                      </p>
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {document.type || "Document"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Access Type Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  1. Access Verification Gate
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "email_otp", label: "Email OTP Gate", icon: EnvelopeSimple, desc: "Restricted to authorized emails" },
                    { id: "passcode", label: "Passcode PIN", icon: LockKey, desc: "PIN / Passcode required" },
                    { id: "public", label: "Public Link", icon: Eye, desc: "Anyone with link can view" },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = accessType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setAccessType(type.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-md"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-yellow-400 dark:text-yellow-600" : "text-gray-400"}`} weight="bold" />
                          <span className="text-xs font-bold">{type.label}</span>
                        </div>
                        <span className={`text-[10px] leading-snug ${isSelected ? "opacity-80" : "text-gray-400"}`}>
                          {type.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Passcode input field */}
                {accessType === "passcode" && (
                  <div className="mt-3.5 space-y-1.5">
                    <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      Set Security Passcode / PIN
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 9842 or VC2026"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-black focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                )}

                {/* Pre-authorized emails list field */}
                {accessType === "email_otp" && (
                  <div className="mt-3.5 space-y-1.5">
                    <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      Pre-Authorized Viewer Emails (Comma-separated)
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. partner@sequoiacap.com, analyst@partech.vc"
                      value={allowedEmails}
                      onChange={(e) => setAllowedEmails(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-black focus:outline-none dark:text-white"
                    />
                    <p className="text-[9px] text-gray-400 leading-snug">
                      Only the exact email addresses specified here will be allowed to request and verify OTP access codes.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Expiry Option */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 2. Link Expiration
                </label>
                <select
                  value={expirationOption}
                  onChange={(e) => setExpirationOption(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-black focus:outline-none dark:text-white font-bold"
                >
                  <option value="never">Never Expire</option>
                  <option value="24h">Expires in 24 Hours</option>
                  <option value="7d">Expires in 7 Days (Default)</option>
                  <option value="30d">Expires in 30 Days</option>
                  <option value="custom">Custom Date</option>
                </select>
                {expirationOption === "custom" && (
                  <input
                    type="datetime-local"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white"
                  />
                )}
              </div>

              {/* 3. Watermarking Settings */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-yellow-500" weight="bold" /> Dynamic Viewer Watermark
                  </label>
                  <input
                    type="checkbox"
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>

                {watermarkEnabled && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                        Watermark Pattern Template
                      </span>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="CONFIDENTIAL • {email} • {date}"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono focus:outline-none dark:text-white"
                      />
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {["{email}", "{date}"].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (!watermarkText.includes(tag)) {
                                setWatermarkText((prev) => `${prev} • ${tag}`);
                              }
                            }}
                            className="px-2 py-0.5 bg-gray-200/60 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 text-[9px] font-mono font-bold rounded-md hover:bg-gray-300 dark:hover:bg-zinc-700 cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                          Style Preset
                        </span>
                        <select
                          value={watermarkStyle}
                          onChange={(e) => setWatermarkStyle(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs dark:text-white font-bold"
                        >
                          <option value="diagonal">45° Tiled Grid</option>
                          <option value="center">Center Watermark Stamp</option>
                          <option value="banner">Header & Footer Banner</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                          Opacity: {Math.round(watermarkOpacity * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0.08"
                          max="0.45"
                          step="0.02"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Enterprise Compliance: IP & Geo-Fencing */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <GlobeHemisphereWest className="w-4 h-4 text-blue-500" weight="bold" /> IP Whitelisting & Geo-Fencing
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    SOC2 Enterprise
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* IP Restriction Toggle & Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Restrict by Client IP / Subnet
                      </span>
                      <input
                        type="checkbox"
                        checked={ipRestrictionEnabled}
                        onChange={(e) => setIpRestrictionEnabled(e.target.checked)}
                        className="w-4 h-4 accent-black cursor-pointer"
                      />
                    </div>
                    {ipRestrictionEnabled && (
                      <input
                        type="text"
                        placeholder="e.g. 192.168.1.1, 10.0.0.0/16, 203.0.113.50"
                        value={allowedIps}
                        onChange={(e) => setAllowedIps(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono focus:outline-none dark:text-white"
                      />
                    )}
                  </div>

                  {/* Geo-Fencing Toggle & Input */}
                  <div className="space-y-1.5 pt-1 border-t border-gray-200/60 dark:border-zinc-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> Geo-Fence Allowed Countries
                      </span>
                      <input
                        type="checkbox"
                        checked={geofencingEnabled}
                        onChange={(e) => setGeofencingEnabled(e.target.checked)}
                        className="w-4 h-4 accent-black cursor-pointer"
                      />
                    </div>
                    {geofencingEnabled && (
                      <input
                        type="text"
                        placeholder="e.g. US, GB, DE, CA, NG, FR (ISO Alpha-2)"
                        value={allowedCountries}
                        onChange={(e) => setAllowedCountries(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono uppercase focus:outline-none dark:text-white"
                      />
                    )}
                  </div>

                  {/* SOC2 Retention Sizing */}
                  <div className="pt-1 border-t border-gray-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <HardDrives className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        SOC2 Data Retention
                      </span>
                    </div>
                    <select
                      value={soc2RetentionDays}
                      onChange={(e) => setSoc2RetentionDays(Number(e.target.value))}
                      className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold dark:text-white cursor-pointer"
                    >
                      <option value={30}>30 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days (Standard)</option>
                      <option value={180}>180 Days</option>
                      <option value={365}>365 Days (1 Year)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Download Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <DownloadSimple className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Allow Direct File Download</p>
                    <p className="text-[10px] text-gray-400">If disabled, viewers can only view in-app without downloading the PDF.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons (Stacked vertically on mobile, row on tablet/desktop) */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gray-150 hover:bg-gray-200 text-gray-755 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full py-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Generate Secure Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
