
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/upload";
import ProfileForm from "@/components/ProfileForm";
import { toast } from "sonner";
import { User, Pencil, Trash2, Plus, Save, UploadCloud } from 'lucide-react';

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
    profile_image_url: ""
  });
  const [uploading, setUploading] = useState(false);

  const fetchStartups = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const startupsRes = await fetch('/api/startups', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (startupsRes.ok) {
      const startupsData = await startupsRes.json();
      setStartups(startupsData.startups || []);
    }
  };

  const handleDeleteStartup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this startup?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`/api/startups/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      toast.success('Startup deleted successfully!');
      fetchStartups();
    } else {
      toast.error('Failed to delete startup');
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    try {
      const res = await fetch('/api/investor-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        toast.success('Profile saved successfully!');
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      toast.error('Error saving profile');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadImage(file);
      setProfile(prev => ({ ...prev, profile_image_url: imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        if (data.user.user_type === 'investor') {
          // Load investor profile
          const profileRes = await fetch('/api/investor-profiles', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.profile) {
              setProfile(profileData.profile);
            } else {
              // Initialize with user name
              setProfile(prev => ({ ...prev, full_name: data.user.full_name || "" }));
            }
          }
        } else {
          // Founders: fetch startups
          const startupsRes = await fetch('/api/startups', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (startupsRes.ok) {
            const startupsData = await startupsRes.json();
            setStartups(startupsData.startups || []);
          }
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    }
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16">
            <svg className="animate-spin text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">FoundexAI</h1>
          <p className="text-gray-600">loading profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.user_type === 'investor' ? 'My Investor Profile' : 'My Startups'}
            </h1>
            {user?.user_type === 'founder' && !showAddForm && !editingStartup && startups.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add New Startup
              </button>
            )}
          </div>

          {user?.user_type === 'investor' ? (
            // Investor Profile Form
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1 flex flex-col items-center text-center">
                  <div className="relative w-48 h-48 mb-6">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="Profile"
                        className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-24 h-24 text-gray-400" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md">
                    <div className="flex items-center gap-2">
                      <UploadCloud className="h-6 w-6" />
                      <span>{profile.profile_image_url ? 'Change Photo' : 'Upload Photo'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    JPG, PNG up to 2MB
                  </p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="Enter full name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="Enter company name"
                      value={profile.company_name}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="https://example.com"
                      value={profile.website_url}
                      onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage Focus</label>
                    <select
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thesis</label>
                    <textarea
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="Enter investment thesis"
                      rows={4}
                      value={profile.thesis}
                      onChange={(e) => setProfile({ ...profile, thesis: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Geography</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="e.g., North America"
                      value={profile.geography}
                      onChange={(e) => setProfile({ ...profile, geography: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="Enter phone number"
                      value={profile.phone_number}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type of Company</label>
                    <select
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      value={profile.company_type}
                      onChange={(e) => setProfile({ ...profile, company_type: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profile.linkedin_url}
                      onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Official email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent sm:text-sm"
                      placeholder="Enter official email"
                      value={profile.official_email}
                      onChange={(e) => setProfile({ ...profile, official_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-yellow-600 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center gap-2"
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
                <div className="text-center bg-white p-16 rounded-lg shadow-lg">
                  <h3 className="text-2xl font-semibold text-gray-800">No Startups Yet</h3>
                  <p className="text-gray-500 mt-4 mb-8">Click "Add New Startup" to get started on your journey.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 flex items-center gap-2 mx-auto transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="h-6 w-6" />
                    Add New Startup
                  </button>
                </div>
              ) : !editingStartup && !showAddForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {startups.map((startup) => (
                    <div key={startup._id} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col hover:shadow-xl transition-shadow duration-300">
                      <h3 className="font-bold text-xl mb-3 text-gray-900">{startup.company_name}</h3>
                      <p className="text-gray-600 mb-6 grow">{startup.business_description}</p>
                      <div className="flex justify-end gap-3 mt-auto">
                        <button
                          onClick={() => setEditingStartup(startup)}
                          className="text-gray-500 hover:text-yellow-600 p-2 rounded-full transition-colors duration-300"
                          title="Edit Startup"
                        >
                          <Pencil className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => handleDeleteStartup(startup._id)}
                          className="text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors duration-300"
                          title="Delete Startup"
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(editingStartup || showAddForm) && (
                <div className="bg-white p-8 rounded-lg shadow-lg">
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}