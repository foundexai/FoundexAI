"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";
import { CloudArrowUp, CircleNotch, Image as ImageIcon, Trash } from "@phosphor-icons/react";

interface ProfileFormProps {
  startup?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function ProfileForm({
  startup,
  onSave,
  onCancel,
}: ProfileFormProps) {
  const [startupId, setStartupId] = useState<string | null>(
    startup?._id || null
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: startup?.company_name || "",
    sector: startup?.sector || "",
    location: startup?.location || "",
    business_description: startup?.business_description || "",
    website_url: startup?.website_url || "",
    funding_stage: startup?.funding_stage || "Pre-seed",
    readiness_score: startup?.readiness_score || 0,
    logo_url: startup?.logo_url || "",
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, logo_url: url }));
      toast.success("Logo uploaded!");
    } catch (error) {
      toast.error("Logo upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: any) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    if (!form.company_name || !form.business_description || !form.sector || !form.location) {
      toast.error("Please fill in all required fields (Name, Sector, Location, Description)");
      return;
    }

    if (form.website_url && !form.website_url.startsWith("http")) {
      toast.error("Website URL must start with http:// or https://");
      return;
    }

    setSubmitting(true);
    try {
      let url = "/api/startups";
      let method = "POST";
      if (startupId) {
        url = `/api/startups/${startupId}`;
        method = "PUT";
      }
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Profile saved successfully!");
        onSave?.();
      } else {
        toast.error("Failed to save profile");
      }
    } catch (error) {
      toast.error("Error saving profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card p-5 sm:p-10 rounded-3xl border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">

      <div className="flex justify-between items-center mb-10">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {startupId ? "Edit Startup Profile" : "Register New Startup"}
        </h2>
      </div>

      <form onSubmit={save} className="space-y-10 sm:space-y-12">
        {/* Logo Upload Section */}
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 group">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Logo"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-xl transition-transform group-hover:scale-105 dark:border-white/10"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center border-4 border-white dark:border-white/10 shadow-xl">
                  <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-white/20" weight="bold" />
                </div>
              )}
              
              <label className="absolute -bottom-2 -right-2 cursor-pointer bg-white text-gray-800 p-2 sm:p-2.5 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-all dark:bg-zinc-800 dark:text-white dark:border-zinc-700">
                <CloudArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" weight="bold" />
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                    disabled={uploading || submitting} 
                />
              </label>

              {form.logo_url && !submitting && (
                <button
                    type="button"
                    onClick={() => setForm({...form, logo_url: ""})}
                    className="absolute -top-2 -right-2 bg-red-50 text-red-500 p-1.5 sm:p-2 rounded-xl border border-red-100 opacity-0 group-hover:opacity-100 transition-all dark:bg-red-500/10 dark:border-red-500/20"
                >
                    <Trash size={14} weight="bold" className="sm:hidden" />
                    <Trash size={16} weight="bold" className="hidden sm:block" />
                </button>
              )}

              {(uploading || submitting) && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                  <CircleNotch className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Startup Logo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">
              Company Name
            </label>
            <input
              className="border border-white/60 bg-white/50 dark:bg-black/40 dark:border-zinc-800/80 rounded-xl shadow-sm py-2.5 sm:py-3.5 px-4 sm:px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500 font-bold text-gray-800 dark:text-white w-full transition-all placeholder:text-gray-400"

              placeholder="e.g. Acme Corp"

              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">
              Sector
            </label>
            <input
              className="border border-white/60 bg-white/50 dark:bg-black/50 dark:border-zinc-800 rounded-xl shadow-sm py-3.5 sm:py-4 px-4 sm:px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 font-bold text-gray-800 dark:text-white w-full transition-all"
              placeholder="e.g. FinTech, AgriTech"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">
              Location
            </label>
            <input
              className="border border-white/60 bg-white/50 dark:bg-black/50 dark:border-zinc-800 rounded-xl shadow-sm py-3.5 sm:py-4 px-4 sm:px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 font-bold text-gray-800 dark:text-white w-full transition-all"
              placeholder="e.g. Nairobi, Kenya"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">
              Funding Stage
            </label>
            <select
              className="border border-white/60 bg-white/50 dark:bg-black/50 dark:border-zinc-800 rounded-xl shadow-sm py-2.5 sm:py-3.5 px-4 sm:px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 font-bold text-gray-800 dark:text-white w-full transition-all cursor-pointer"

              value={form.funding_stage}
              onChange={(e) =>
                setForm({ ...form, funding_stage: e.target.value })
              }
            >
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B+">Series B+</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">
              Website URL (Optional)
            </label>
            <input
              type="url"
              className="border border-white/60 bg-white/50 dark:bg-black/50 dark:border-zinc-800 rounded-xl shadow-sm py-3.5 sm:py-4 px-4 sm:px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 font-bold text-gray-800 dark:text-white w-full transition-all"
              placeholder="https://yourcompany.com"
              value={form.website_url}
              onChange={(e) =>
                setForm({ ...form, website_url: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">
            Business Description
          </label>
          <textarea
            className="border border-white/60 bg-white/50 dark:bg-black/50 dark:border-zinc-800 rounded-xl shadow-sm py-2.5 sm:py-3.5 px-4 sm:px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 font-bold text-gray-800 dark:text-white w-full transition-all min-h-[140px] resize-none"

            placeholder="Tell us about your startup..."
            rows={4}
            value={form.business_description}
            onChange={(e) =>
              setForm({ ...form, business_description: e.target.value })
            }
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-gray-100 dark:border-white/10 gap-8">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Readiness Score</span>
            <span className="font-black text-4xl text-yellow-500 leading-none">
              {form.readiness_score}%
            </span>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1 sm:flex-none bg-gray-50 text-gray-600 font-bold py-3 sm:py-3.5 px-6 sm:px-8 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10 disabled:opacity-50 text-sm sm:text-base"
              >
                Cancel
              </button>
            )}
            <button
              className="flex-1 sm:flex-none bg-zinc-900 text-white font-black py-3 sm:py-3.5 px-8 sm:px-12 rounded-2xl hover:bg-black transition-all shadow-xl shadow-black/10 dark:bg-white dark:text-black dark:hover:text-white dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group text-sm sm:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <CircleNotch className="animate-spin h-5 w-5" weight="bold" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{startupId ? "Save Changes" : "Create Profile"}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
