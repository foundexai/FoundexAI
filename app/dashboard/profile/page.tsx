"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/upload";
import ProfileForm from "@/components/ProfileForm";
import { toast } from "sonner";
import {
  User,
  Pencil,
  Trash2,
  Plus,
  Save,
  UploadCloud,
  MapPin,
  Globe,
} from "lucide-react";
import { InvestorCard } from "@/components/InvestorCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { MOCK_INVESTORS, Investor } from "@/lib/data";

interface Startup {
  _id: string;
  company_name: string;
  business_description: string;
  sector?: string;
  mission?: string;
  vision?: string;
  business_model?: string;
  legal_structure?: string;
  website_url?: string;
  funding_stage?: string;
  funding_amount?: number;
  monthly_burn?: number;
  cac?: number;
  ltv?: number;
  readiness_score?: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    company_name: "",
    website_url: "",
    stage_focus: "Seed",
    thesis: "",
    geography: "",
    phone_number: "",
    company_type: "",
    linkedin_url: "",
    official_email: "",
    profile_image_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [savedInvestors, setSavedInvestors] = useState<Investor[]>([]);

  const handleToggleSave = async (id: string) => {
    // Optimistic update
    setSavedInvestors((prev) => prev.filter((inv) => inv.id !== id));

    const token = localStorage.getItem("token");
    try {
      await fetch("/api/investors/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ investorId: id }),
      });
      toast.success("Removed from favorites");
    } catch (e) {
      toast.error("Failed to update favorites");
    }
  };

  const fetchStartups = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const startupsRes = await fetch("/api/startups", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (startupsRes.ok) {
      const startupsData = await startupsRes.json();
      setStartups(startupsData.startups || []);
    }
  };

  const handleDeleteStartup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this startup?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`/api/startups/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      toast.success("Startup deleted successfully!");
      fetchStartups();
    } else {
      toast.error("Failed to delete startup");
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      const res = await fetch("/api/investor-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast.success("Profile saved successfully!");
      } else {
        toast.error("Failed to save profile");
      }
    } catch (error) {
      toast.error("Error saving profile");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
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
      setProfile((prev) => ({ ...prev, profile_image_url: imageUrl }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        if (data.user.user_type === "investor") {
          // Load investor profile
          const profileRes = await fetch("/api/investor-profiles", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.profile) {
              setProfile(profileData.profile);
            } else {
              // Initialize with user name
              setProfile((prev) => ({
                ...prev,
                full_name: data.user.full_name || "",
              }));
            }
          }
        } else {
          // Founders: fetch startups
          const startupsRes = await fetch("/api/startups", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (startupsRes.ok) {
            const startupsData = await startupsRes.json();
            setStartups(startupsData.startups || []);
          }

          // Fetch Saved Investors
          try {
            const savedRes = await fetch("/api/investors/saved", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (savedRes.ok) {
              const savedData = await savedRes.json();
              setSavedInvestors(savedData.investors || []);
            }
          } catch (e) {
            console.error("Failed to load saved investors");
          }
        }
      } else {
        router.push("/");
      }
      setLoading(false);
    }
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8 animate-pulse">
          <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-white/10" />
          <div className="glass-card p-8 rounded-3xl h-96 border border-white/60 dark:border-white/10 dark:bg-white/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-500">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {user?.user_type === "investor"
                ? "My Investor Profile"
                : "My Startups"}
            </h1>
            {user?.user_type === "founder" &&
              !showAddForm &&
              !editingStartup &&
              startups.length > 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 flex items-center gap-2 transition-all font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/40 hover:-translate-y-1 cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  Add New Startup
                </button>
              )}
          </div>

          {user?.user_type === "investor" ? (
            // Investor Profile Form
            <div className="glass-card p-8 rounded-3xl border border-white/60 bg-white/40 shadow-xl backdrop-blur-xl dark:bg-white/5 dark:border-white/10 dark:shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1 flex flex-col items-center text-center">
                  <div className="relative w-48 h-48 mb-6 group">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="Profile"
                        className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl transition-transform group-hover:scale-105 dark:border-white/10"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center border-4 border-white dark:border-white/10 shadow-xl">
                        <User className="w-24 h-24 text-gray-300 dark:text-white/20" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-white/50 hover:bg-white text-gray-800 font-bold py-3 px-6 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 shadow-sm border border-gray-200 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <UploadCloud className="h-5 w-5 text-yellow-500" />
                      <span>
                        {profile.profile_image_url
                          ? "Change Photo"
                          : "Upload Photo"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-4 font-medium uppercase tracking-wide dark:text-gray-500">
                    JPG, PNG up to 2MB
                  </p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                      placeholder="Enter full name"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                      placeholder="Enter company name"
                      value={profile.company_name}
                      onChange={(e) =>
                        setProfile({ ...profile, company_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Website
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Globe className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 pl-10 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                        placeholder="https://example.com"
                        value={profile.website_url}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            website_url: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Stage Focus
                    </label>
                    <select
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white"
                      value={profile.stage_focus}
                      onChange={(e) =>
                        setProfile({ ...profile, stage_focus: e.target.value })
                      }
                    >
                      <option value="Pre-seed">Pre-seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                      <option value="Series B+">Series B+</option>
                      <option value="Growth">Growth</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Thesis
                    </label>
                    <textarea
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                      placeholder="Briefly describe your investment thesis..."
                      rows={4}
                      value={profile.thesis}
                      onChange={(e) =>
                        setProfile({ ...profile, thesis: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Geography
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 pl-10 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                        placeholder="e.g., Africa, Global"
                        value={profile.geography}
                        onChange={(e) =>
                          setProfile({ ...profile, geography: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                      placeholder="+1 (555) 000-0000"
                      value={profile.phone_number}
                      onChange={(e) =>
                        setProfile({ ...profile, phone_number: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Type of Company
                    </label>
                    <select
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white"
                      value={profile.company_type}
                      onChange={(e) =>
                        setProfile({ ...profile, company_type: e.target.value })
                      }
                    >
                      <option value="">Select type</option>
                      <option value="VC">VC</option>
                      <option value="Angel">Angel</option>
                      <option value="Family Office">Family Office</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                      placeholder="https://linkedin.com/in/..."
                      value={profile.linkedin_url}
                      onChange={(e) =>
                        setProfile({ ...profile, linkedin_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
                      Official email
                    </label>
                    <input
                      type="email"
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600"
                      placeholder="Enter official email"
                      value={profile.official_email}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          official_email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="mt-12 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-yellow-500 text-white font-bold py-4 px-10 rounded-xl hover:bg-yellow-600 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xl shadow-yellow-500/30 flex items-center gap-3"
                >
                  <Save className="h-5 w-5" />
                  Save Profile
                </button>
              </div>
            </div>
          ) : (
            // Founder Startups Management
            <>
              {startups.length === 0 && !showAddForm ? (
                <div className="glass-card text-center p-20 rounded-3xl border border-white/50 bg-white/40 dark:bg-white/5 dark:border-white/10">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-yellow-500/20">
                    <Plus className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
                    No Startups Yet
                  </h3>
                  <p className="text-gray-500 mb-10 text-lg dark:text-gray-400">
                    Create your first startup profile to begin the journey.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-yellow-500 text-white px-8 py-4 rounded-xl hover:bg-yellow-600 flex items-center gap-3 mx-auto transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xl shadow-yellow-500/30 font-bold"
                  >
                    <Plus className="h-6 w-6" />
                    Create Startup Profile
                  </button>
                </div>
              ) : (
                !editingStartup &&
                !showAddForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {startups.map((startup) => (
                      <div
                        key={startup._id}
                        className="glass-card border border-white/60 rounded-3xl p-8 flex flex-col hover:border-yellow-500/50 transition-all duration-300 group bg-white/40 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-yellow-500/50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-linear-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {startup.company_name.charAt(0)}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingStartup(startup)}
                              className="text-gray-400 hover:text-yellow-600 p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:hover:bg-yellow-500/10 dark:hover:text-yellow-500"
                              title="Edit Startup"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStartup(startup._id)}
                              className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors dark:hover:bg-red-500/10 dark:hover:text-red-500"
                              title="Delete Startup"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-bold text-2xl mb-2 text-gray-900 leading-tight dark:text-white">
                          {startup.company_name}
                        </h3>
                        <p className="text-gray-500 mb-6 grow line-clamp-3 leading-relaxed dark:text-gray-400">
                          {startup.business_description}
                        </p>

                        <div className="pt-4 border-t border-gray-100/50 flex justify-between items-center dark:border-white/10">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {startup.sector || "Uncategorized"}
                          </span>
                          {startup.readiness_score !== undefined && (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md dark:bg-green-500/20 dark:text-green-400">
                              Score: {startup.readiness_score}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              {(editingStartup || showAddForm) && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ProfileForm
                    startup={editingStartup}
                    onSave={() => {
                      setEditingStartup(null);
                      setShowAddForm(false);
                      fetchStartups();
                    }}
                    onCancel={() => {
                      setEditingStartup(null);
                      setShowAddForm(false);
                    }}
                  />
                </div>
              )}

              <div className="mt-20 border-t border-gray-200 dark:border-white/10 pt-10">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                  <Save className="w-6 h-6 text-yellow-500" />
                  Saved Investors
                </h2>
                {savedInvestors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedInvestors.map((inv) => (
                      <InvestorCard
                        key={inv.id}
                        investor={inv}
                        isSaved={true}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 italic">
                    No saved investors yet. Browse the database to add some!
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
