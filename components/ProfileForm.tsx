"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ProfileFormProps {
  startup?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function ProfileForm({ startup, onSave, onCancel }: ProfileFormProps) {
  const [startupId, setStartupId] = useState<string | null>(startup?._id || null);
  const [form, setForm] = useState({
    company_name: startup?.company_name || "",
    sector: startup?.sector || "",
    mission: startup?.mission || "",
    vision: startup?.vision || "",
    business_description: startup?.business_description || "",
    business_model: startup?.business_model || "",
    legal_structure: startup?.legal_structure || "",
    website_url: startup?.website_url || "",
    funding_stage: startup?.funding_stage || "Pre-seed",
    funding_amount: startup?.funding_amount || 0,
    monthly_burn: startup?.monthly_burn || 0,
    cac: startup?.cac || 0,
    ltv: startup?.ltv || 0,
    readiness_score: startup?.readiness_score || 0
  });

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('token');
      if (!token) return;
      const r = await fetch('/api/startups', {
        headers: {
          'Authorization': `Bearer ${token}`,
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
            mission: startup.mission || "",
            vision: startup.vision || "",
            business_description: startup.business_description || "",
            business_model: startup.business_model || "",
            legal_structure: startup.legal_structure || "",
            website_url: startup.website_url || "",
            funding_stage: startup.funding_stage || "Pre-seed",
            funding_amount: startup.funding_amount || 0,
            monthly_burn: startup.monthly_burn || 0,
            cac: startup.cac || 0,
            ltv: startup.ltv || 0,
            readiness_score: startup.readiness_score || 0
          });
        }
      }
    }
    load();
  }, []);

  async function save(e: any) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    try {
      let url = '/api/startups';
      let method = 'POST';
      if (startupId) {
        url = `/api/startups/${startupId}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success('Profile saved successfully!');
        onSave?.();
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      toast.error('Error saving profile');
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Startup Profile</h2>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              placeholder="Company Name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
            <input
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              placeholder="e.g., FinTech, HealthTech"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Model</label>
            <select
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              value={form.business_model}
              onChange={(e) => setForm({ ...form, business_model: e.target.value })}
            >
              <option value="">Select business model</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
              <option value="B2B2C">B2B2C</option>
              <option value="C2C">C2C</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Legal Structure</label>
            <select
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              value={form.legal_structure}
              onChange={(e) => setForm({ ...form, legal_structure: e.target.value })}
            >
              <option value="">Select legal structure</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="Partnership">Partnership</option>
              <option value="LLC">LLC</option>
              <option value="C-Corp">C-Corp</option>
              <option value="S-Corp">S-Corp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input
              type="url"
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              placeholder="https://yourcompany.com"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funding Stage</label>
            <select
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              value={form.funding_stage}
              onChange={(e) => setForm({ ...form, funding_stage: e.target.value })}
            >
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B+">Series B+</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mission</label>
          <textarea
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
            placeholder="Company mission"
            rows={3}
            value={form.mission}
            onChange={(e) => setForm({ ...form, mission: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vision</label>
          <textarea
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
            placeholder="Company vision"
            rows={3}
            value={form.vision}
            onChange={(e) => setForm({ ...form, vision: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
          <textarea
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
            placeholder="Detailed business description"
            rows={4}
            value={form.business_description}
            onChange={(e) => setForm({ ...form, business_description: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funding Amount ($)</label>
            <input
              type="number"
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              placeholder="0"
              value={form.funding_amount || ''}
              onChange={(e) => setForm({ ...form, funding_amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Burn ($)</label>
            <input
              type="number"
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              placeholder="0"
              value={form.monthly_burn || ''}
              onChange={(e) => setForm({ ...form, monthly_burn: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CAC ($)</label>
            <input
              type="number"
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              placeholder="0"
              value={form.cac || ''}
              onChange={(e) => setForm({ ...form, cac: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LTV ($)</label>
            <input
              type="number"
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-500 text-gray-700 w-full"
              placeholder="0"
              value={form.ltv || ''}
              onChange={(e) => setForm({ ...form, ltv: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Readiness Score: <span className="font-bold text-yellow-600">{form.readiness_score}%</span>
          </div>
          <div className="flex space-x-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              className="bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
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