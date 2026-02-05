"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
  const [form, setForm] = useState({
    company_name: startup?.company_name || "",
    sector: startup?.sector || "",
    location: startup?.location || "",
    business_description: startup?.business_description || "",
    website_url: startup?.website_url || "",
    funding_stage: startup?.funding_stage || "Pre-seed",
    readiness_score: startup?.readiness_score || 0,
  });

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) return;
      const r = await fetch("/api/startups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (r.ok) {
        const data = await r.json();
        if (data.startups && data.startups.length > 0) {
          const startup = data.startups[0]; // Assuming first startup
          setStartupId(startup._id);
          setForm({
            company_name: startup.company_name || "",
            sector: startup.sector || "",
            location: startup.location || "",
            business_description: startup.business_description || "",
            website_url: startup.website_url || "",
            funding_stage: startup.funding_stage || "Pre-seed",
            readiness_score: startup.readiness_score || 0,
          });
        }
      }
    }
    load();
  }, []);

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
    }
  }

  return (
    <div className="glass-card p-8 rounded-3xl border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        Startup Profile
      </h2>
      <form onSubmit={save} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
              Company Name
            </label>
            <input
              className="border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder:text-gray-400 text-gray-800 w-full transition-all dark:bg-black/50 dark:border-zinc-700 dark:text-white"
              placeholder="Company Name"
              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
              Sector
            </label>
            <input
              className="border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder:text-gray-400 text-gray-800 w-full transition-all dark:bg-black/50 dark:border-zinc-700 dark:text-white"
              placeholder="e.g., FinTech, HealthTech"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
              Location
            </label>
            <input
              className="border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder:text-gray-400 text-gray-800 w-full transition-all dark:bg-black/50 dark:border-zinc-700 dark:text-white"
              placeholder="e.g., Lagos, Nigeria"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
              Funding Stage
            </label>
            <select
              className="border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-gray-800 w-full transition-all dark:bg-black/50 dark:border-zinc-700 dark:text-white"
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
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
              Website URL (Optional)
            </label>
            <input
              type="url"
              className="border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder:text-gray-400 text-gray-800 w-full transition-all dark:bg-black/50 dark:border-zinc-700 dark:text-white"
              placeholder="https://yourcompany.com"
              value={form.website_url}
              onChange={(e) =>
                setForm({ ...form, website_url: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
            Business Description
          </label>
          <textarea
            className="border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder:text-gray-400 text-gray-800 w-full transition-all dark:bg-black/50 dark:border-zinc-700 dark:text-white"
            placeholder="Detailed business description..."
            rows={4}
            value={form.business_description}
            onChange={(e) =>
              setForm({ ...form, business_description: e.target.value })
            }
            required
          />
        </div>


        <div className="flex justify-between items-center pt-4 border-t border-gray-100/50 dark:border-white/10">
          <div className="text-sm text-gray-600 font-medium dark:text-gray-400">
            Readiness Score:{" "}
            <span className="font-bold text-yellow-600 text-lg dark:text-yellow-500">
              {form.readiness_score}%
            </span>
          </div>
          <div className="flex space-x-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="bg-white/50 text-gray-600 font-bold py-3 px-6 rounded-xl hover:bg-white hover:text-gray-800 transition-all border border-gray-200 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/20 dark:hover:text-white"
              >
                Cancel
              </button>
            )}
            <button
              className="bg-yellow-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/40 dark:shadow-none"
              type="submit"
            >
              Save Profile
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
