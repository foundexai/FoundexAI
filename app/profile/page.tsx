
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/upload";
import ProfileForm from "@/components/ProfileForm";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSave = async () => {
    try {
      const res = await fetch('/api/investor-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        if (data.user.user_type === 'investor') {
          // Load investor profile
          const profileRes = await fetch('/api/investor-profiles');
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
          // Founders: stay on profile page (they can view/edit their startup profile here)
          // No redirect needed - founders can access their profile
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.user_type === 'investor' ? 'My Investor Profile' : 'My Startup Profile'}
          </h1>
          <div className="flex items-center">
            <span className="mr-4">{user?.full_name || 'User'}</span>
            <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {user?.user_type === 'investor' ? (
            // Investor Profile Form
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-4">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="Profile"
                        className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.437 4h3.126a2 2 0 011.92.89l.812 1.22a2 2 0 001.664.89H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                      {profile.profile_image_url ? 'Change photo' : 'Upload photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Allowed formats: JPG, JPEG, PNG<br />
                    Max file size: 2MB
                  </p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="Enter full name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="Enter company name"
                      value={profile.company_name}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="Enter website"
                      value={profile.website_url}
                      onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stage Focus</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
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
                    <label className="block text-sm font-medium text-gray-700">Thesis</label>
                    <textarea
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="Enter investment thesis"
                      rows={3}
                      value={profile.thesis}
                      onChange={(e) => setProfile({ ...profile, thesis: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Geography</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="e.g., North America, Europe, Global"
                      value={profile.geography}
                      onChange={(e) => setProfile({ ...profile, geography: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone number</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="Enter phone number"
                      value={profile.phone_number}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type of Company</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
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
                    <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                    <input
                      type="url"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profile.linkedin_url}
                      onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Official email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm placeholder:text-gray-500 text-gray-700"
                      placeholder="Enter official email"
                      value={profile.official_email}
                      onChange={(e) => setProfile({ ...profile, official_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 text-right">
                <button
                  onClick={handleSave}
                  className="bg-yellow-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </div>
          ) : (
            // Founder Profile Form (using ProfileForm component)
            <ProfileForm />
          )}
       </div>
     </main>
   </div>
 );
}