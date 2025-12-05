"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import AiHelperModal from "@/components/AiHelperModal";

function StartupProfileContent() {
  const searchParams = useSearchParams();
  const startupId = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [modalField, setModalField] = useState<string | null>(null);

  // State for all fields
  const [startupName, setStartupName] = useState('');
  const [sector, setSector] = useState('');
  const [readinessScore, setReadinessScore] = useState(0);
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [businessModel, setBusinessModel] = useState<string[]>([]);
  const [legalStructure, setLegalStructure] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        if (data.user.user_type === 'investor') {
          window.location.href = '/profile';
          return;
        }

        if (startupId) {
          const startupRes = await fetch(`/api/startups/${startupId}`);
          if (startupRes.ok) {
            const startupData = await startupRes.json();
            if (startupData.startup) {
              const { startup } = startupData;
              setStartupName(startup.company_name || '');
              setSector(startup.sector || '');
              setReadinessScore(startup.readiness_score || 0);
              setMission(startup.mission || '');
              setVision(startup.vision || '');
              setBusinessDescription(startup.business_description || '');
              setLegalStructure(startup.legal_structure || '');
            } else {
              window.location.href = '/dashboard';
            }
          } else {
            window.location.href = '/dashboard';
          }
        }
      } else {
        window.location.href = '/';
      }
      setLoading(false);
    };
    checkAuth();
  }, [startupId]);

  const handleSave = async (field: string, content: any) => {
    if (!startupId) return;

    const fieldMapping: { [key: string]: string } = {
      'Business Name': 'company_name',
      'Sector': 'sector',
      'Mission': 'mission',
      'Vision': 'vision',
      'Business Description': 'business_description',
      'Legal Structure': 'legal_structure',
    };

    const apiField = fieldMapping[field];
    if (!apiField) return;

    const res = await fetch(`/api/startups/${startupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [apiField]: content }),
    });

    if (res.ok) {
      const updatedData = await res.json();
      const { startup } = updatedData;
      // Update local state
      const stateMapping: { [key: string]: (value: any) => void } = {
        'Business Name': setStartupName,
        'Sector': setSector,
        'Mission': setMission,
        'Vision': setVision,
        'Business Description': setBusinessDescription,
        'Legal Structure': setLegalStructure,
      };
      stateMapping[field]?.(content);
      setModalField(null);
    } else {
      alert('Failed to save. Please try again.');
    }
  };

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
          <p className="text-gray-600">Loading Startup Profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className={`bg-gray-50 min-h-screen ${isSidebarOpen ? 'lg:pl-64' : ''}`}>
      <div className="flex-1 flex">
        <aside className={`bg-gray-50 w-64 p-6 shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="flex justify-between items-center lg:hidden">
            <span className="text-2xl font-bold text-gray-800">Menu</span>
            <button onClick={() => setSidebarOpen(false)}>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="mt-8">
            <ul>
              <li className="mb-4"><a href="/dashboard" className="flex items-center p-3 bg-yellow-400 rounded-lg text-gray-800 font-bold"><span className="mr-3">🏠</span>Dashboard</a></li>
              <li className="mb-4"><a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span className="mr-3">👥</span>Team</a></li>
              <li className="mb-4"><a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span className="mr-3">📄</span>Documents</a></li>
              <li className="mb-4"><a href="/profile" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span className="mr-3">⚙️</span>Settings</a></li>
              <li className="mt-8"><button onClick={() => { document.cookie = 'token=; Path=/; Max-Age=0'; window.location.href = '/'; }} className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg w-full text-left"><span className="mr-3">🚪</span>Sign Out</button></li>
            </ul>
          </nav>
        </aside>
        <div className="flex-1">
          <header className="p-6 flex justify-between items-center">
            <div className="flex items-center">
              <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="text-2xl font-bold text-gray-800">FoundexAI</div>
            </div>
            <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                <div className="max-w-lg w-full lg:max-w-xs">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input id="search" name="search" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" placeholder="Search" type="search" />
                    </div>
                </div>
            </div>
            <div className="flex items-center">
                <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                    <span className="sr-only">View notifications</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                <div className="ml-3 relative">
                    <div>
                    <Link href="/profile">
                        <button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 cursor-pointer">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        </button>
                    </Link>
                    </div>
                </div>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{startupName || 'Startup Profile'}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
                    <Image src="https://images.unsplash.com/photo-1599493343424-c317a5b7a152?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Eco-Delivery" width={300} height={200} className="w-full h-full object-cover" />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer" onClick={() => setModalField('Business Name')}>
                      <div>
                        <p className="text-sm text-gray-500">Business Name</p>
                        <p className="font-bold text-lg text-gray-800">{startupName || 'Click to add'}</p>
                      </div>
                      <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer" onClick={() => setModalField('Sector')}>
                      <div>
                        <p className="text-sm text-gray-500">Sector</p>
                        <p className="font-bold text-lg text-gray-800">{sector || 'Click to add'}</p>
                      </div>
                      <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer" onClick={() => setModalField('Foundex Readiness Score')}>
                      <div>
                        <p className="text-sm text-gray-500">Foundex Readiness Score</p>
                        <p className="font-bold text-2xl text-gray-800">{readinessScore}%</p>
                      </div>
                      <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow" onClick={() => setModalField('Mission')}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 mb-2">Mission</h3>
                      <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                    </div>
                    <p className="text-gray-600">{mission || 'Click to add mission'}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow" onClick={() => setModalField('Vision')}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 mb-2">Vision</h3>
                      <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                    </div>
                    <p className="text-gray-600">{vision || 'Click to add vision'}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow" onClick={() => setModalField('Business Description')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 mb-2">Business Description</h3>
                    <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                  </div>
                  <p className="text-gray-600">{businessDescription || 'Click to add business description'}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow" onClick={() => setModalField('Legal Structure')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 mb-2">Legal Structure</h3>
                    <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                  </div>
                  <p className="text-gray-600">{legalStructure || 'Click to add legal structure'}</p>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8">
                <div className="bg-white p-6 rounded-lg shadow" onClick={() => setModalField('Tasks')}>
                    <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 mb-4">Tasks</h3>
                    <Image src="/sparkle.svg" alt="AI Sparkle" width={24} height={24} />
                    </div>
                    <div className="space-y-4">
                        <p className="text-gray-500">No tasks yet. Click to add.</p>
                    </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      {modalField && <AiHelperModal field={modalField} onClose={() => setModalField(null)} onSave={(content) => handleSave(modalField, content)} />}
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