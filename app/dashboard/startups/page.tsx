"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlass,
  Funnel,
  FadersHorizontal,
  CircleNotch,
  RocketLaunch,
} from "@phosphor-icons/react";
import { StartupCard, Startup } from "@/components/StartupCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { MOCK_STARTUPS } from "@/lib/data";
import { X, Plus, CaretDown } from "@phosphor-icons/react";

export default function StartupsPage() {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Submission Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitData, setSubmitData] = useState({
    name: "",
    sector: "Technology",
    description: "",
    location: "Lagos, Nigeria",
    website: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Saved Startups Logic (Maybe later)

      // 2. Real Startups
      let allStartups = [...MOCK_STARTUPS];
      try {
        const res = await fetch("/api/startups/directory");
        if (res.ok) {
          const data = await res.json();
          const realStartups = data.startups || [];
          allStartups = [...realStartups, ...MOCK_STARTUPS];
        }
      } catch (e) {
        console.log("Failed to fetch real startups", e);
      }

      setStartups(allStartups);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load startups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  async function handleSubmit() {
    if (!submitData.name || !submitData.description) {
      toast.error("Name and description are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/startups/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        toast.success("Startup submitted to waitlist! We will notify you once approved.");
        setShowSubmitModal(false);
        setSubmitData({
          name: "",
          sector: "Technology",
          description: "",
          location: "Lagos, Nigeria",
          website: "",
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to submit startup");
      }
    } catch (e) {
      toast.error("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch =
      startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Simple sector matching - if sector includes the selected tags or exact match
    const matchesSector = selectedSector
      ? startup.sector.includes(selectedSector)
      : true;

    return matchesSearch && matchesSector;
  });

  const sectors = [
    "All",
    "Fintech",
    "Healthtech",
    "Edtech",
    "Logistics",
    "SaaS",
    "E-commerce",
    "Agritech",
    "AI/ML",
    "Cleantech",
    "Mobility",
    "Retail",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 px-4 sm:px-8 lg:px-0">
      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 dark:text-white">
              Startup Directory
            </h1>
            <p className="text-gray-500 max-w-xl text-lg dark:text-gray-400">
              Discover the most innovative companies building the future of Africa.
            </p>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl font-bold transition-all shadow-lg hover:shadow-yellow-400/20 active:scale-95 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" weight="bold" />
            Add New Startup
          </button>
        </div>

        <div className="bg-white/50 backdrop-blur-md border border-white/60 p-1.5 rounded-2xl shadow-sm dark:bg-white/5 dark:border-white/10 overflow-hidden w-full">
          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 px-1">
            {sectors.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setSelectedSector(type === "All" ? null : type)
                }
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  (type === "All" && !selectedSector) ||
                  selectedSector === type
                    ? "bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-20 z-30">
        <div className="glass-card p-2 rounded-2xl border border-white/60 shadow-lg flex items-center bg-white/70 backdrop-blur-xl dark:bg-black/40 dark:border-white/10 gap-2 outline-none">
          <div className="pl-4 text-gray-400">
            <MagnifyingGlass className="w-5 h-5" weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Search startups by name, sector, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium h-12 dark:text-white outline-none"
          />
          <button 
            onClick={() => toast.info("Advanced filters coming soon!")}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition-colors dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
          >
            <FadersHorizontal className="w-4 h-4" weight="bold" />
            Filters
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <CircleNotch className="w-10 h-10 animate-spin text-yellow-500" weight="bold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStartups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredStartups.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:bg-white/5 dark:text-gray-500">
            <RocketLaunch className="w-8 h-8" weight="bold" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            No startups found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Submit Startup</h2>
                <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block dark:text-gray-400">Startup Name</label>
                  <input
                    type="text"
                    value={submitData.name}
                    onChange={(e) => setSubmitData({...submitData, name: e.target.value})}
                    placeholder="e.g. Acme Africa"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block dark:text-gray-400">Sector</label>
                    <div className="relative">
                      <select
                        value={submitData.sector}
                        onChange={(e) => setSubmitData({...submitData, sector: e.target.value})}
                        className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:bg-white/5 dark:border-white/10 dark:text-white"
                      >
                        {[
                          "Adtech",
                          "Agriculture",
                          "Agritech",
                          "AI/ML",
                          "Automotive",
                          "Aviation",
                          "Biotech",
                          "Blockchain",
                          "Circular Economy",
                          "Cleantech",
                          "Construction",
                          "Consumer Electronics",
                          "Cybersecurity",
                          "Data & Analytics",
                          "Deeptech",
                          "Defense",
                          "Design",
                          "Direct-to-Consumer (DTC)",
                          "E-commerce",
                          "Edtech",
                          "Energy",
                          "Enterprise",
                          "Entertainment",
                          "Environment",
                          "Events",
                          "Fashion",
                          "Fintech",
                          "Foodtech",
                          "Gaming",
                          "Govtech",
                          "Hardware",
                          "Healthtech",
                          "HRtech",
                          "IoT",
                          "Insurtech",
                          "Legaltech",
                          "Logistics",
                          "Manufacturing",
                          "Marine",
                          "Marketplace",
                          "Marketing",
                          "Media",
                          "Mining",
                          "Mobility",
                          "Nanotechnology",
                          "Network Security",
                          "Non-profit",
                          "Other",
                          "Proptech",
                          "Real Estate",
                          "Retail",
                          "Robotics",
                          "SaaS",
                          "Security",
                          "Smart City",
                          "Smart Home",
                          "Social Media",
                          "Social Impact",
                          "Software",
                          "Space",
                          "Sports",
                          "Supply Chain",
                          "Sustainability",
                          "Technology",
                          "Telecommunications",
                          "Transportation",
                          "Travel",
                          "Virtual Reality (VR)",
                          "Wearables",
                          "Wellness",
                        ].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <CaretDown className="w-4 h-4" weight="bold" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block dark:text-gray-400">Location</label>
                    <input
                      type="text"
                      value={submitData.location}
                      onChange={(e) => setSubmitData({...submitData, location: e.target.value})}
                      placeholder="e.g. Nairobi, Kenia"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:bg-white/5 dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block dark:text-gray-400">Elevator Pitch</label>
                  <textarea
                    rows={3}
                    value={submitData.description}
                    onChange={(e) => setSubmitData({...submitData, description: e.target.value})}
                    placeholder="Briefly describe what you're building..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block dark:text-gray-400">Website (Optional)</label>
                  <input
                    type="url"
                    value={submitData.website}
                    onChange={(e) => setSubmitData({...submitData, website: e.target.value})}
                    placeholder="https://acme.africa"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-8 py-4 bg-yellow-400 text-gray-900 font-black rounded-xl hover:bg-yellow-500 transition-all shadow-xl shadow-yellow-400/20 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Join Waitlist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
