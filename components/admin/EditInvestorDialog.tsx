import { useState, useEffect } from "react";
import {
  X,
  Check,
  CircleNotch,
  CurrencyCircleDollar,
  GlobeSimple,
  MapPin,
  Briefcase,
  EnvelopeSimple,
  LinkedinLogo,
  FileText,
  CloudArrowUp,
  Buildings,
  Star,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Investor } from "@/components/InvestorCard";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface EditInvestorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  investor: Investor | null;
}

export default function EditInvestorDialog({
  isOpen,
  onClose,
  onSuccess,
  investor,
}: EditInvestorDialogProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    type: "VC",
    focus: "",
    location: "",
    description: "",
    investmentRange: "",
    website: "",
    logoInitial: "",
    logoColor: "from-blue-500 to-indigo-600",
    logo_url: "",
    isFeatured: false,
  });

  useEffect(() => {
    if (investor) {
      setFormData({
        name: investor.name || "",
        type: investor.type || "VC",
        focus: Array.isArray(investor.focus) ? investor.focus.join(", ") : investor.focus || "",
        location: investor.location || "",
        description: investor.description || "",
        investmentRange: investor.investmentRange || "",
        website: investor.website || "",
        logoInitial: investor.logoInitial || "",
        logoColor: investor.logoColor || "from-blue-500 to-indigo-600",
        logo_url: investor.logo_url || "",
        isFeatured: (investor as any).isFeatured || false,
      });
    }
  }, [investor]);

  if (!isOpen || !investor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const focusArray = formData.focus
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      const payload = {
        ...formData,
        focus: focusArray,
      };

      const res = await fetch(`/api/admin/investors/${investor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update investor");
      }

      toast.success("Investor updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update investor. Please try again.");
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
              Edit Investor Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update investor details in the global database.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-8 custom-scrollbar">
          <form
            id="edit-investor-form"
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
                  <Briefcase className="w-3.5 h-3.5" weight="bold" /> Focus (Comma separated)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <GlobeSimple className="w-3.5 h-3.5" weight="bold" /> Website
                </label>
                <input
                  type="text"
                  placeholder="www.sequoia.com"
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:font-normal"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" weight="bold" /> Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0 group">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-white/10"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500">
                        <Buildings className="w-8 h-8" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <CircleNotch className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                     <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20">
                      <CloudArrowUp className="w-4 h-4" weight="bold" />
                      Upload New Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Validate file type
                          if (!file.type.startsWith("image/")) {
                            toast.error("Please select an image file");
                            return;
                          }

                          // Validate file size (2MB limit)
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error("File size must be less than 2MB");
                            return;
                          }

                          setUploading(true);
                          try {
                            const imageUrl = await uploadImage(file);
                            setFormData({ ...formData, logo_url: imageUrl });
                            toast.success("Image uploaded!");
                          } catch (error) {
                            console.error(error);
                            toast.error("Failed to upload image");
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-2">
                       Supported formats: JPG, PNG, GIF. Max size: 2MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Visuals */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Logo Style (Admin Only)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Initial</label>
                  <input
                    type="text"
                    maxLength={2}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 font-bold text-center focus:ring-2 focus:ring-yellow-500 outline-none dark:text-white"
                    value={formData.logoInitial}
                    onChange={(e) => setFormData({ ...formData, logoInitial: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Color Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, logoColor: opt.class })
                        }
                        className={`w-8 h-8 rounded-lg transition-all transform hover:scale-110 bg-linear-to-br ${opt.class} ${formData.logoColor === opt.class ? "ring-2 ring-offset-2 ring-yellow-500 scale-110 shadow-md" : "opacity-60"}`}
                        title={opt.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all w-full md:w-auto",
                  formData.isFeatured 
                    ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30" 
                    : "bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/10"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  formData.isFeatured 
                    ? "bg-yellow-400 text-white" 
                    : "bg-gray-200 text-gray-400 dark:bg-white/10 dark:text-gray-500"
                )}>
                  <Star weight={formData.isFeatured ? "fill" : "bold"} className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={cn(
                    "font-bold text-sm",
                    formData.isFeatured ? "text-yellow-700 dark:text-yellow-500" : "text-gray-700 dark:text-gray-300"
                  )}>
                    Featured Investor
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showcase this investor at the top of the database
                  </p>
                </div>
                <div className={cn(
                  "ml-auto w-12 h-6 rounded-full relative transition-colors",
                  formData.isFeatured ? "bg-yellow-400" : "bg-gray-300 dark:bg-zinc-700"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    formData.isFeatured ? "left-7" : "left-1"
                  )} />
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all font-inter"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-investor-form"
            disabled={loading}
            className="px-10 py-3 rounded-xl bg-gray-900 border border-black text-white hover:bg-black text-sm font-black shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:border-white"
          >
            {loading && <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
