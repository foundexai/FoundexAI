"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Onboarding Steps Components
const IdeaStep = ({ setIdea, nextStep }: { setIdea: (idea: string) => void, nextStep: () => void }) => {
  const [text, setText] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIdea(text);
    nextStep();
  };

  return (
    <div className="w-full max-w-lg text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">What's Your Idea?</h1>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-800 placeholder:text-gray-700"
          placeholder="Describe your idea in a few words."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button
          className="mt-6 bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-yellow-600 transition-colors"
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

const NameStep = ({ idea, setStartupName, nextStep }: { idea: string, setStartupName: (name: string) => void, nextStep: () => void }) => {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/startups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: name, business_description: idea })
    });

    if (res.ok) {
      setStartupName(name);
      nextStep();
    } else {
      alert("Failed to save startup info.");
    }
  };

  return (
    <div className="w-full max-w-lg text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Give Your Idea a Name</h1>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-800 placeholder:text-gray-700"
          placeholder="Give your business idea a name?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button
          className="mt-6 bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-yellow-600 transition-colors"
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default function Dashboard() {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [idea, setIdea] = useState('');
  const [startupName, setStartupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        if (data.user.user_type === 'investor') {
          // Investors go directly to their profile/dashboard
          window.location.href = '/profile';
          return;
        }

        // Founders: Check if user has a startup
        const startupRes = await fetch('/api/startups');
        if (startupRes.ok) {
          const startupData = await startupRes.json();
          if (startupData.startup) {
            setOnboardingStep(3); // Skip onboarding
            setStartupName(startupData.startup.company_name || 'Your Startup');
            setIdea(startupData.startup.business_description || '');
          } else {
            setOnboardingStep(1); // Start onboarding
          }
        } else {
          setOnboardingStep(1); // Start onboarding if check fails
        }
      } else {
        window.location.href = '/';
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const nextStep = () => setOnboardingStep((prev: number) => prev + 1);

  const renderOnboarding = () => {
    switch (onboardingStep) {
      case 1:
        return <IdeaStep setIdea={setIdea} nextStep={nextStep} />;
      case 2:
        return <NameStep idea={idea} setStartupName={setStartupName} nextStep={nextStep} />;
      case 3:
        return renderDashboard();
      default:
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
              <p className="text-gray-600">loading.</p>
            </div>
          </div>
        );
    }
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-white flex flex-col font-sans">
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
              <li className="mb-4"><a href="#" className="flex items-center p-3 bg-yellow-400 rounded-lg text-gray-800 font-bold"><span className="mr-3">🏠</span>Dashboard</a></li>
              <li className="mb-4"><a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span className="mr-3">👥</span>Team</a></li>
              <li className="mb-4"><a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span className="mr-3">📄</span>Documents</a></li>
              <li className="mb-4"><a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span className="mr-3">⚙️</span>Settings</a></li>
              <li className="mt-8"><button onClick={() => { document.cookie = 'token=; Path=/; Max-Age=0'; window.location.href = '/'; }} className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg w-full text-left"><span className="mr-3">🚪</span>Sign Out</button></li>
            </ul>
          </nav>
        </aside>
        <main className="grow p-8 bg-gray-50">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Top row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
                  <Image src="https://images.unsplash.com/photo-1599493343424-c317a5b7a152?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Eco-Delivery" width={300} height={200} className="w-full h-full object-cover" />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm text-gray-500">Business Name</p>
                      <p className="font-bold text-lg text-gray-800">{startupName}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm text-gray-500">Sector</p>
                      <p className="font-bold text-lg text-gray-800">Logistics</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm text-gray-500">Foundex Readiness Score</p>
                      <p className="font-bold text-2xl text-gray-800">60%</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              {/* Mission and Vision */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 mb-2">Mission</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                  <p className="text-gray-600">To make urban logistics cleaner, smarter, and more efficient for businesses.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 mb-2">Vision</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                  <p className="text-gray-600">To create a world where every delivery moves us closer to a cleaner, greener planet</p>
                </div>
              </div>

              {/* Business Description and Notes */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 mb-2">Business Description</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <p className="text-gray-600">Eco-Delivery is a sustainable logistics company revolutionizing last-mile delivery through eco-friendly transportation and technology. We provide fast, reliable, and carbon-neutral delivery solutions using electric vehicles, bicycles, and optimized route algorithms to minimize emissions and traffic congestion.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 mb-4">Notes</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Note 1 */}
                  <div className="border-l-4 border-yellow-400 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Marketing Stand Up</p>
                        <p className="text-xs text-gray-500">Weekly, Product</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Mar 5 04:25</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">This monthly progress agenda is following this items:</p>
                    <ul className="list-disc list-inside text-sm text-gray-500">
                      <li>Introduction to Newest Marketinf Plan</li>
                      <li>Monthly Revenue updates for each</li>
                    </ul>
                  </div>
                  {/* Note 2 */}
                  <div className="border-l-4 border-purple-400 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Product Team Meeting</p>
                        <p className="text-xs text-gray-500">Monthly, Business</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Apr 11 18:30</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">This monthly progress agenda is following this items:</p>
                    <ul className="list-disc list-inside text-sm text-gray-500">
                      <li>Introduction to Newest Product Plan</li>
                      <li>Monthly Revenue updates for each</li>
                    </ul>
                  </div>
                  {/* Note 3 */}
                  <div className="border-l-4 border-red-400 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">HR Interview</p>
                        <p className="text-xs text-gray-500">Personal, Business</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Jun 23 14:31</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">This monthly progress agenda is following this items:</p>
                    <ul className="list-disc list-inside text-sm text-gray-500">
                      <li>Introduction to Newest Product Plan</li>
                      <li>Monthly Revenue updates for each</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Business Model */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 mb-4">Business Model</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">B2B (Business-to-Business)</span>
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">Circular Economy</span>
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">Service-Based Model</span>
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">On-Demand Delivery Model</span>
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">Subscription Delivery Model</span>
                </div>
              </div>

              {/* Legal Structure */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 mb-2">Legal Structure</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <p className="text-gray-600">For Eco-Delivery, we have decided to establish the company as a Private Limited Company (Ltd) under UK law. This structure provides a strong legal foundation for growth, ensuring limited liability protection for all shareholders while maintaining flexibility in management and operations.</p>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 mb-4">Tasks</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="tasks-1" name="tasks-1" type="checkbox" className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="tasks-1" className="font-medium text-gray-700">Finance</label>
                      <p className="text-gray-500">Determine variable costs</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="tasks-2" name="tasks-2" type="checkbox" className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="tasks-2" className="font-medium text-gray-700">Market</label>
                      <p className="text-gray-500">Do competitor analysis</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="tasks-3" name="tasks-3" type="checkbox" className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="tasks-3" className="font-medium text-gray-700">Legal</label>
                      <p className="text-gray-500">Register the trademark</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="tasks-4" name="tasks-4" type="checkbox" className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="tasks-4" className="font-medium text-gray-700">Operations</label>
                      <p className="text-gray-500">Find a COO</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16">
                <svg className="animate-spin text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">FoundexAI</h1>
            <p className="text-gray-600">Investor-Ready Starts Here.</p>
        </div>
    </div>
  );
  if (!user) return <div className="min-h-screen bg-white flex items-center justify-center">Please login</div>;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {renderOnboarding()}
    </div>
  );
}