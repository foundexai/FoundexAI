"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/upload";
import ProfileForm from "@/components/ProfileForm";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  NotePencil,
  Trash,
  Plus,
  FloppyDiskBack,
  CloudArrowUp,
  MapPin,
  GlobeSimple,
  CircleNotch,
  RocketLaunch,
  Star,
} from "@phosphor-icons/react";
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
  const { user: authUser, token, refreshUser } = useAuth();
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
  const [basicInfo, setBasicInfo] = useState({
    full_name: "",
    user_type: "",
    linkedin_url: "",
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

  const handleSaveMetadata = async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(basicInfo),
      });

      if (res.ok) {
        toast.success("Basic info updated!");
        if (refreshUser) refreshUser();
      } else {
        toast.error("Failed to update basic info");
      }
    } catch (e) {
      toast.error("Error saving basic info");
    }
  };

  const handleSave = async () => {
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
      if (!authUser && !loading) {
        router.push("/");
        return;
      }
      if (!token) return;

      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStartups(data.startups || []);

        if (data.user) {
          setBasicInfo({
            full_name: data.user.full_name || "",
            user_type: data.user.user_type || "",
            linkedin_url: data.user.linkedin_url || "",
          });
        }

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
          // Founders: Fetch Saved Investors
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
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [router, token, authUser]);

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
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              My Profile
            </h1>
          </div>

          {/* General Identity Section */}
          <div className="glass-card p-10 rounded-3xl border border-white/60 bg-white/40 shadow-xl backdrop-blur-xl dark:bg-white/5 dark:border-white/10 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              {/* Profile Image Column */}
              <div className="flex flex-col items-center text-center space-y-4 shrink-0">
                <div className="relative w-32 h-32 group">
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl transition-transform group-hover:scale-105 dark:border-white/10"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 dark:bg-white/10 rounded-3xl flex items-center justify-center border-4 border-white dark:border-white/10 shadow-xl">
                      <User className="w-12 h-12 text-gray-300 dark:text-white/20" weight="bold" />
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 cursor-pointer bg-white text-gray-800 p-2 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-all dark:bg-zinc-800 dark:text-white dark:border-zinc-700">
                    <CloudArrowUp className="h-5 w-5 text-yellow-500" weight="bold" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                      <CircleNotch className="animate-spin h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Fields Column */}
              <div className="grow w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Display Name</label>
                    <input
                      type="text"
                      className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-yellow-400 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
                      value={basicInfo.full_name}
                      onChange={(e) => setBasicInfo({...basicInfo, full_name: e.target.value})}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">I am a...</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white/50 border border-white/60 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-yellow-400 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
                        value={basicInfo.user_type}
                        onChange={(e) => setBasicInfo({...basicInfo, user_type: e.target.value})}
                      >
                        <option value="founder">Founder / Startup</option>
                        <option value="investor">Investor / VC</option>
                      </select>
                      <Plus className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">LinkedIn URL</label>
                    <input
                      type="url"
                      className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-yellow-400 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
                      value={basicInfo.linkedin_url}
                      onChange={(e) => setBasicInfo({...basicInfo, linkedin_url: e.target.value})}
                      placeholder="linkedin.com/in/..."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSaveMetadata}
                        className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:-translate-y-1 active:scale-95 text-sm dark:bg-white dark:text-black flex items-center gap-2"
                    >
                        <FloppyDiskBack className="h-4 w-4" weight="bold" />
                        Update Identity
                    </button>
                </div>
              </div>
            </div>
          </div>

          {user?.user_type === "investor" ? (
            // Investor Profile Form
            <div className="glass-card p-10 rounded-3xl border border-white/60 bg-white/40 shadow-xl backdrop-blur-xl dark:bg-white/5 dark:border-white/10 dark:shadow-2xl mb-12">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-white/10 pb-4">
                Investor Thesis & Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* ... existing investor fields but inside this unified card ... */}
                {/* Re-using the fields from original but without the image upload part which is now at top */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">Company Name</label>
                  <input
                    type="text"
                    className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all dark:bg-black/20 dark:border-white/10 dark:text-white"
                    placeholder="Enter company name"
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">Website</label>
                  <div className="relative">
                    <GlobeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" weight="bold" />
                    <input
                      type="text"
                      className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 pl-10 px-4 focus:ring-2 focus:ring-yellow-400 transition-all dark:bg-black/20 dark:border-white/10 dark:text-white"
                      placeholder="https://example.com"
                      value={profile.website_url}
                      onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">Stage Focus</label>
                  <select
                    className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-yellow-400 transition-all text-gray-900 font-medium dark:bg-black/20 dark:border-white/10 dark:text-white"
                    value={profile.stage_focus}
                    onChange={(e) => setProfile({ ...profile, stage_focus: e.target.value })}
                  >
                    <option value="Pre-seed">Pre-seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B+">Series B+</option>
                    <option value="Growth">Growth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">Type of Organization</label>
                  <select
                    className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-yellow-400 transition-all dark:bg-black/20 dark:border-white/10 dark:text-white"
                    value={profile.company_type}
                    onChange={(e) => setProfile({ ...profile, company_type: e.target.value })}
                  >
                    <option value="">Select type</option>
                    <option value="VC">VC</option>
                    <option value="Angel">Angel</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">Investment Thesis</label>
                  <textarea
                    className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-yellow-400 min-h-[120px] transition-all dark:bg-black/20 dark:border-white/10 dark:text-white"
                    placeholder="Briefly describe your investment thesis..."
                    value={profile.thesis}
                    onChange={(e) => setProfile({ ...profile, thesis: e.target.value })}
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">Geography</label>
                   <input
                     type="text"
                     className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-yellow-400 transition-all dark:bg-black/20 dark:border-white/10 dark:text-white"
                     placeholder="e.g. Africa, Global"
                     value={profile.geography}
                     onChange={(e) => setProfile({ ...profile, geography: e.target.value })}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">Contact Email</label>
                   <input
                     type="email"
                     className="block w-full border border-white/60 bg-white/50 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-yellow-400 transition-all dark:bg-black/20 dark:border-white/10 dark:text-white"
                     placeholder="invest@example.com"
                     value={profile.official_email}
                     onChange={(e) => setProfile({ ...profile, official_email: e.target.value })}
                   />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-yellow-400 text-gray-900 font-black py-3 px-8 rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20 flex items-center gap-2"
                >
                  <FloppyDiskBack className="h-5 w-5" weight="bold" />
                  Save Thesis
                </button>
              </div>
            </div>
          ) : (
            // Founder Startups Management
            <>
              {startups.length === 0 && !showAddForm ? (
                <div className="glass-card text-center p-20 rounded-3xl border border-white/50 bg-white/40 dark:bg-white/5 dark:border-white/10">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-yellow-500/20">
                    <Plus className="h-8 w-8 text-yellow-600 dark:text-yellow-500" weight="bold" />
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
                    <Plus className="h-6 w-6" weight="bold" />
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
                          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-md shrink-0">
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingStartup(startup)}
                              className="text-gray-400 hover:text-yellow-600 p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:hover:bg-yellow-500/10 dark:hover:text-yellow-500"
                              title="Edit Startup"
                            >
                              <NotePencil className="h-5 w-5" weight="bold" />
                            </button>
                            <button
                              onClick={() => handleDeleteStartup(startup._id)}
                              className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors dark:hover:bg-red-500/10 dark:hover:text-red-500"
                              title="Delete Startup"
                            >
                              <Trash className="h-5 w-5" weight="bold" />
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
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
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

              {/* Startups Section at the Bottom */}
              <div className="mt-20 border-t border-gray-200 dark:border-white/10 pt-10">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <RocketLaunch className="h-6 w-6 text-yellow-500" weight="bold" />
                        My Startups
                    </h2>
                    {!showAddForm && !editingStartup && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="text-yellow-500 font-black flex items-center gap-2 hover:gap-3 transition-all text-sm uppercase tracking-wider"
                        >
                            <Plus className="h-4 w-4" weight="bold" />
                            Add Startup
                        </button>
                    )}
                </div>

                {startups.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                        <p className="text-gray-400 font-bold italic">No startups registered yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {startups.map((startup) => (
                            <div
                                key={startup._id}
                                className="glass-card border border-white/60 rounded-2xl p-4 flex flex-col hover:border-yellow-500/50 transition-all duration-300 group bg-white shadow-sm dark:bg-white/5 dark:border-white/10 relative overflow-hidden"
                            >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => setEditingStartup(startup)} className="p-1.5 bg-white shadow-md rounded-lg text-gray-400 hover:text-yellow-500 dark:bg-zinc-900"><NotePencil className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => handleDeleteStartup(startup._id)} className="p-1.5 bg-white shadow-md rounded-lg text-gray-400 hover:text-red-500 dark:bg-zinc-900"><Trash className="h-3.5 w-3.5" /></button>
                                </div>
                                <div className="aspect-square w-10 h-10 bg-yellow-400 rounded-lg mb-3 flex items-center justify-center font-black text-xs text-gray-900 shadow-sm shrink-0">
                                    {startup.company_name.charAt(0)}
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate pr-8">
                                    {startup.company_name}
                                </h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                                    {startup.business_description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
              </div>

              <div className="mt-20 border-t border-gray-200 dark:border-white/10 pt-10 pb-20">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" weight="bold" />
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
