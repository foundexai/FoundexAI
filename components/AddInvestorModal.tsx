import { useState } from "react";
import {
  X,
  Check,
  CircleNotch,
  CurrencyCircleDollar,
  GlobeSimple,
  MapPin,
  Briefcase,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface AddInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddInvestorModal({
  isOpen,
  onClose,
  onSuccess,
}: AddInvestorModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "VC",
    focus: "", // comma separated string for input
    location: "",
    description: "",
    investmentRange: "",
    website: "",
    logoInitial: "",
    logoColor: "from-blue-500 to-indigo-600",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Process focus tags
      const focusArray = formData.focus
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const payload = {
        ...formData,
        focus: focusArray,
        logoInitial:
          formData.logoInitial || formData.name.charAt(0).toUpperCase(),
      };

      const res = await fetch("/api/investors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create investor");
      }

      toast.success("Investor profile submitted for review!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { name: "Blue", class: "from-blue-500 to-indigo-600" },
    { name: "Purple", class: "from-purple-500 to-pink-600" },
    { name: "Green", class: "from-green-500 to-emerald-600" },
    { name: "Orange", class: "from-orange-500 to-red-600" },
    { name: "Dark", class: "from-gray-700 to-black" },
    { name: "Gold", class: "from-yellow-400 to-orange-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 dark:border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Suggest New Investor
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Suggest a new investor for our database. All submissions are
              reviewed.
            </p>
          </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5" weight="bold" />
            </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-8 custom-scrollbar">
          <form
            id="add-investor-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Firm Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sequoia Capital"
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:font-normal"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Type
                </label>
                <select
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="VC">Venture Capital</option>
                  <option value="Angel">Angel Investor</option>
                  <option value="Grant">Grant / Non-dilutive</option>
                  <option value="Accelerator">Accelerator</option>
                  <option value="PE">Private Equity</option>
                  <option value="Family Office">Family Office</option>
                  <option value="Corporate">Corporate VC</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Description
              </label>
              <textarea
                required
                rows={3}
                placeholder="Brief description of their investment thesis..."
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:font-normal"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" weight="bold" /> Industries (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Fintech, SaaS, AI..."
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:font-normal"
                  value={formData.focus}
                  onChange={(e) =>
                    setFormData({ ...formData, focus: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" weight="bold" /> Location
                </label>
                <input
                  required
                  type="text"
                  placeholder="Lagos, Nigeria"
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:font-normal"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <CurrencyCircleDollar className="w-3.5 h-3.5" weight="bold" /> Range
                </label>
                <input
                  type="text"
                  placeholder="$50k - $500k"
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:font-normal"
                  value={formData.investmentRange}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      investmentRange: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <GlobeSimple className="w-3.5 h-3.5" weight="bold" /> Website
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:font-normal"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Visuals */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Brand Color Style
              </label>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, logoColor: opt.class })
                    }
                    className={`h-10 px-4 rounded-xl text-xs font-bold text-white transition-all transform hover:scale-105 flex items-center gap-2 bg-linear-to-br ${opt.class} ${formData.logoColor === opt.class ? "ring-4 ring-offset-2 ring-yellow-500/50 scale-105 shadow-lg" : "opacity-70 hover:opacity-100"}`}
                  >
                    {formData.logoColor === opt.class && (
                      <Check className="w-3 h-3" weight="bold" />
                    )}
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-investor-form"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold shadow-lg shadow-yellow-500/30 transition-all transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}
