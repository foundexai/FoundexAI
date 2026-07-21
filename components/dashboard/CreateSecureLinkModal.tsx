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
  const [accessType, setAccessType] = useState<"public" | "passcode" | "email_otp" | "domain_restricted">("email_otp");
  const [passcode, setPasscode] = useState("");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [expirationOption, setExpirationOption] = useState("7d");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  
  // Watermark Settings
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL • {email} • {date}");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.18);
  const [watermarkStyle, setWatermarkStyle] = useState<"diagonal" | "center" | "banner">("diagonal");

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

      const domainsArray = allowedDomains
        .split(",")
        .map((d) => d.trim().replace("@", ""))
        .filter(Boolean);

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
          allowedDomains: accessType === "domain_restricted" ? domainsArray : undefined,
          expiresAt,
          maxViews: maxViews ? Number(maxViews) : undefined,
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
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 text-left my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-yellow-500" weight="bold" />
              Create Secure Link
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Protect your pitch deck with access gates, view limits, and dynamic watermarks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Document Info */}
        {document && (
          <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold shrink-0">
                <FileText className="w-5 h-5" weight="bold" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[280px]">
                  {document.name}
                </p>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {document.type || "Document"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Generated Link Display Screen */}
        {generatedLink ? (
          <div className="space-y-6 py-2">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-lg shadow-green-500/20">
                ✓
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">Your Link is Ready!</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Share this link with investors. Viewer verification and dynamic watermarks are active.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Shareable Protected Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-5 py-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Configuration */
          <div className="space-y-5">
            {/* 1. Access Type Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                1. Access Verification Gate
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "email_otp", label: "Email OTP Gate", icon: EnvelopeSimple, desc: "Viewer verifies 6-digit email code" },
                  { id: "passcode", label: "Passcode Protected", icon: LockKey, desc: "Viewer enters PIN / Passcode" },
                  { id: "domain_restricted", label: "Domain Restricted", icon: Globe, desc: "Only specific VC domains (e.g. sequoiacap.com)" },
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
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-850 dark:text-gray-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
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

              {/* Passcode Input Field */}
              {accessType === "passcode" && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Enter Passcode / PIN (e.g. 9842 or VC2026)"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-black focus:outline-none dark:text-white"
                  />
                </div>
              )}

              {/* Allowed Domains Input Field */}
              {accessType === "domain_restricted" && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Enter allowed domains comma-separated (e.g. sequoiacap.com, partech.vc)"
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-black focus:outline-none dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* 2. Expiry & View Count Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Link Expiration
                </label>
                <select
                  value={expirationOption}
                  onChange={(e) => setExpirationOption(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-black focus:outline-none dark:text-white font-bold"
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

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Max View Limit
                </label>
                <input
                  type="number"
                  placeholder="Unlimited (or e.g. 5)"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-black focus:outline-none dark:text-white font-bold"
                />
              </div>
            </div>

            {/* 3. Watermarking Settings */}
            <div className="bg-yellow-50/60 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-yellow-900 dark:text-yellow-300 flex items-center gap-1.5">
                  <Sparkle className="w-4 h-4 text-yellow-500" weight="bold" /> Dynamic Viewer Watermark
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
                    <span className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Watermark Pattern Template
                    </span>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="CONFIDENTIAL • {email} • {date}"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-yellow-300 dark:border-yellow-800/60 rounded-xl text-xs font-mono focus:outline-none dark:text-white"
                    />
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {["{email}", "{date}", "{ip}"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!watermarkText.includes(tag)) {
                              setWatermarkText((prev) => `${prev} • ${tag}`);
                            }
                          }}
                          className="px-2 py-0.5 bg-yellow-200/60 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-300 text-[10px] font-mono font-bold rounded-md hover:bg-yellow-200 cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                        Style Preset
                      </span>
                      <select
                        value={watermarkStyle}
                        onChange={(e) => setWatermarkStyle(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-yellow-300 dark:border-yellow-800/60 rounded-lg text-xs dark:text-white font-bold"
                      >
                        <option value="diagonal">45° Tiled Grid</option>
                        <option value="center">Center Watermark Stamp</option>
                        <option value="banner">Header & Footer Banner</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
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

            {/* 4. Download Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-800">
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

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
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
