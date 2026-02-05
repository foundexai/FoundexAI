"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import AiHelperModal from "@/components/AiHelperModal";

function StartupProfileContent() {
  const searchParams = useSearchParams();
  const startupId = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [modalField, setModalField] = useState<string | null>(null);

  // State for all fields
  const [startupName, setStartupName] = useState("");
  const [sector, setSector] = useState("");
  const [readinessScore, setReadinessScore] = useState(0);
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [businessModel, setBusinessModel] = useState<string[]>([]);
  const [legalStructure, setLegalStructure] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        if (data.user.user_type === "investor") {
          window.location.href = "/profile";
          return;
        }

        if (startupId) {
          const startupRes = await fetch(`/api/startups/${startupId}`);
          if (startupRes.ok) {
            const startupData = await startupRes.json();
            if (startupData.startup) {
              const { startup } = startupData;
              setStartupName(startup.company_name || "");
              setSector(startup.sector || "");
              setReadinessScore(startup.readiness_score || 0);
              setMission(startup.mission || "");
              setVision(startup.vision || "");
              setBusinessDescription(startup.business_description || "");
              setLegalStructure(startup.legal_structure || "");
            } else {
              window.location.href = "/dashboard";
            }
          } else {
            window.location.href = "/dashboard";
          }
        }
      } else {
        window.location.href = "/";
      }
      setLoading(false);
    };
    checkAuth();
  }, [startupId]);

  const handleSave = async (field: string, content: any) => {
    if (!startupId) return;

    const fieldMapping: { [key: string]: string } = {
      "Business Name": "company_name",
      Sector: "sector",
      Mission: "mission",
      Vision: "vision",
      "Business Description": "business_description",
      "Legal Structure": "legal_structure",
    };

    const apiField = fieldMapping[field];
    if (!apiField) return;

    const res = await fetch(`/api/startups/${startupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [apiField]: content }),
    });

    if (res.ok) {
      const updatedData = await res.json();
      const { startup } = updatedData;
      // Update local state
      const stateMapping: { [key: string]: (value: any) => void } = {
        "Business Name": setStartupName,
        Sector: setSector,
        Mission: setMission,
        Vision: setVision,
        "Business Description": setBusinessDescription,
        "Legal Structure": setLegalStructure,
      };
      stateMapping[field]?.(content);
      setModalField(null);
    } else {
      alert("Failed to save. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8 animate-pulse">
          <div className="bg-gray-200 h-10 w-48 rounded-lg mb-8"></div>
          <div className="glass-card p-8 rounded-3xl h-96"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className={`bg-gray-50 min-h-screen ${isSidebarOpen ? "lg:pl-64" : ""}`}
    >
      <div className="flex-1 flex">
        <aside
          className={`bg-white/50 backdrop-blur-xl border-r border-gray-100 w-64 p-6 shrink-0 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="flex justify-between items-center mb-8 lg:hidden">
            <span className="text-2xl font-bold text-gray-800">Menu</span>
            <button onClick={() => setSidebarOpen(false)}>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mb-10 hidden lg:block">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              FoundexAI
            </h1>
          </div>
          <nav>
            <ul className="space-y-2">
              <li>
                <a
                  href="/dashboard"
                  className="flex items-center p-3 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                >
                  <span className="mr-3">🏠</span>Dashboard
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center p-3 text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                  <span className="mr-3">👥</span>Team
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center p-3 text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                  <span className="mr-3">📄</span>Documents
                </a>
              </li>
              <li>
                <a
                  href="/profile"
                  className="flex items-center p-3 text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                  <span className="mr-3">⚙️</span>Settings
                </a>
              </li>
              <li className="mt-8">
                <button
                  onClick={() => {
                    document.cookie = "token=; Path=/; Max-Age=0";
                    window.location.href = "/";
                  }}
                  className="flex items-center p-3 text-red-500 hover:bg-red-50 rounded-xl w-full text-left transition-all"
                >
                  <span className="mr-3">🚪</span>Sign Out
                </button>
              </li>
            </ul>
          </nav>
        </aside>
        <div className="flex-1 min-h-screen lg:ml-64">
          <header className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-100">
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="text-2xl font-bold text-gray-800 lg:hidden">
                FoundexAI
              </div>
            </div>
            <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-lg w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-4 pr-3 py-2 border border-white/60 bg-white/50 rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 sm:text-sm transition-all shadow-sm"
                    placeholder="Search"
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center ml-4">
              <Link href="/profile">
                <button className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 cursor-pointer shadow-sm p-1">
                  <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
                    {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </button>
              </Link>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
              {startupName || "Startup Profile"}
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 glass-card border border-white/50 rounded-3xl overflow-hidden shadow-sm aspect-square bg-yellow-400 flex items-center justify-center">
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 gap-4">
                    <div
                      className="glass-card hover:bg-white/80 p-6 rounded-3xl shadow-sm border border-white/50 flex items-center justify-between cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => setModalField("Business Name")}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Business Name
                        </p>
                        <p className="font-bold text-xl text-gray-900">
                          {startupName || "Click to add"}
                        </p>
                      </div>
                      <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <div
                      className="glass-card hover:bg-white/80 p-6 rounded-3xl shadow-sm border border-white/50 flex items-center justify-between cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => setModalField("Sector")}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Sector
                        </p>
                        <p className="font-bold text-xl text-gray-900">
                          {sector || "Click to add"}
                        </p>
                      </div>
                      <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <div
                      className="glass-card hover:bg-white/80 p-6 rounded-3xl shadow-sm border border-white/50 flex items-center justify-between cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => setModalField("Foundex Readiness Score")}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Readiness Score
                        </p>
                        <p className="font-bold text-3xl text-gray-900">
                          {readinessScore}%
                        </p>
                      </div>
                      <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                    className="glass-card hover:bg-white/80 p-8 rounded-3xl shadow-sm border border-white/50 cursor-pointer transition-all hover:shadow-md group"
                    onClick={() => setModalField("Mission")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 text-lg">
                        Mission
                      </h3>
                      <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {mission || "Click to add mission"}
                    </p>
                  </div>
                  <div
                    className="glass-card hover:bg-white/80 p-8 rounded-3xl shadow-sm border border-white/50 cursor-pointer transition-all hover:shadow-md group"
                    onClick={() => setModalField("Vision")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 text-lg">
                        Vision
                      </h3>
                      <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {vision || "Click to add vision"}
                    </p>
                  </div>
                </div>

                <div
                  className="glass-card hover:bg-white/80 p-8 rounded-3xl shadow-sm border border-white/50 cursor-pointer transition-all hover:shadow-md group"
                  onClick={() => setModalField("Business Description")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">
                      Business Description
                    </h3>
                    <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {businessDescription || "Click to add business description"}
                  </p>
                </div>

                <div
                  className="glass-card hover:bg-white/80 p-8 rounded-3xl shadow-sm border border-white/50 cursor-pointer transition-all hover:shadow-md group"
                  onClick={() => setModalField("Legal Structure")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">
                      Legal Structure
                    </h3>
                    <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {legalStructure || "Click to add legal structure"}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8">
                <div
                  className="glass-card hover:bg-white/80 p-8 rounded-3xl shadow-sm border border-white/50 cursor-pointer transition-all hover:shadow-md group"
                  onClick={() => setModalField("Tasks")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">Tasks</h3>
                    <div className="p-2 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-500 italic">
                      No tasks yet. Click to add.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      {modalField && (
        <AiHelperModal
          field={modalField}
          onClose={() => setModalField(null)}
          onSave={(content) => handleSave(modalField, content)}
        />
      )}
    </div>
  );
}

export default function StartupProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StartupProfileContent />
    </Suspense>
  );
}
