"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Onboarding from '@/components/Onboarding';
import { useAuth } from '@/context/AuthContext';
import { useMobileMenu } from '@/context/MobileMenuContext';

interface Startup {
  _id: string;
  company_name: string;
  business_description: string;
  image?: string;
  authorImage?: string;
  tags?: string[];
  location?: string;
}

export default function Dashboard() {
  const { user, token, loading, logout, refreshUser } = useAuth();
  const { isOpen: isSidebarOpen, close: closeSidebar } = useMobileMenu();
  const [error, setError] = useState<string | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchStartups = useCallback(async () => {
    if (!token || token.trim() === '') {
      console.error('No valid token found in localStorage. Cannot fetch startups.');
      // If no token is found, it's likely the user is not logged in or session expired.
      // Redirecting to login is a good fallback.
      window.location.href = '/';
      setError('Authentication token is missing.');
      return; // Stop further execution
    }

    const res = await fetch('/api/startups', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      setStartups(data.startups || []);
    } else if (res.status === 401) {
      console.error('Authentication failed for /api/startups. Token might be invalid or expired. Clearing token and redirecting.');
        setError('Authentication failed. Redirecting to login.');
        logout(); // Use the logout function from context
    } else {
      console.error(`Failed to fetch startups with status: ${res.status}`);
      setError(`Failed to fetch startups: ${res.statusText}`);
      // Handle other errors if necessary
    }
  }, [token, logout]);

  // Fetch startups when the component mounts or when the user/token changes
  useEffect(() => {
    // If we are not in an initial loading state and a token exists,
    // we should attempt to fetch the startups.
    if (!loading && token) {
      fetchStartups();
    }
  }, [token, loading, fetchStartups]); // Depend on token and loading state

   useEffect(() => {
    }, [startups]);

  const handleOnboardingComplete = useCallback(async (name: string, idea: string) => {
    if (!token || token.trim() === '') {
      alert('You are not logged in or your session has expired. Please log in again.');
      logout(); // Use the logout function from context
      return;
    }
    
    const res = await fetch('/api/startups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ company_name: name, business_description: idea }),
    });

    if (res.ok) {
      setShowOnboarding(false);
      fetchStartups(); // Refresh the list of startups
    } else if (res.status === 401) {
      alert('Your session has expired. Please log in again.');
      logout(); // Use the logout function from context
    } else {
      alert('Failed to create startup. Please try again.');
    }
  }, [token, fetchStartups, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex">
          <aside className="w-full lg:w-64 bg-gray-50 p-2 lg:p-6 flex flex-col justify-between">
          <div>
            <nav className="space-y-4">
              <a href="#" className="flex items-center space-x-2 text-gray-700 font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V6h2v5H9zm1 3a1 1 0 110-2 1 1 0 010 2z" /></svg>
                <span>Action Items</span>
              </a>
              <div className="p-4 bg-yellow-400 rounded-lg text-center">
                <p className="font-bold">FoundexAI</p>
                <p className="text-sm mb-4">Get access to all features and functions</p>
                <button className="bg-white text-yellow-500 px-4 py-2 rounded-full font-semibold">Get Pro</button>
              </div>
              <a href="#" className="flex items-center space-x-2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v1h-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1H3V4zm0 3v9a2 2 0 002 2h10a2 2 0 002-2V7H3zm2-5h10v1H5V2z" /></svg>
                <span>Messages</span>
              </a>
              <Link href="/profile" className="flex items-center space-x-2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8 7.49l-4.75.69c-1.6.23-2.24 2.18-1.07 3.33l3.44 3.35-.81 4.73c-.27 1.58 1.39 2.79 2.81 2.08L10 18.39l4.25 2.23c1.42.71 3.08-.5 2.81-2.08l-.81-4.73 3.44-3.35c1.17-1.15.53-3.1-1.07-3.33L12 7.49l-.51-4.32z" clipRule="evenodd" /></svg>
                <span>Settings</span>
              </Link>
            </nav>
          </div>
          <a href="#" className="flex items-center space-x-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            <span>Sign Out</span>
          </a>
        </aside>
        <main className="w-full flex-1 p-8 bg-gray-100 animate-pulse">
          <header className="flex justify-between md:justify-end items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="hidden md:block w-24 h-10 bg-gray-300 rounded-lg"></div>
              <div className="hidden md:block w-24 h-10 bg-gray-300 rounded-lg"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
              </div>
            </div>
          </header>
          <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="bg-gray-300 rounded-lg mb-4 h-40"></div>
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
                <div className="h-3 bg-gray-300 rounded mb-1 w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-5/6"></div>
              </div>
            ))}
            <div className="bg-gray-200 rounded-lg shadow p-6 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-gray-300 rounded-md"></div>
                <div className="mt-2 h-4 w-24 bg-gray-300 rounded mx-auto"></div>
                <div className="mt-1 h-3 w-40 bg-gray-300 rounded mx-auto"></div>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className="flex">
        {/* Mobile Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between`}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">FoundexAI</h1>
          </div>
          <nav className="space-y-6">
            <a href="#" className="flex items-center space-x-3 text-gray-700 font-semibold hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V6h2v5H9zm1 3a1 1 0 110-2 1 1 0 010 2z" /></svg>
              <span>Action Items</span>
            </a>
            <div className="p-4 bg-yellow-400 rounded-lg text-center">
              <p className="font-bold">FoundexAI</p>
              <p className="text-sm mb-4">Get access to all features and functions</p>
              <button className="bg-white text-yellow-500 px-4 py-2 rounded-full font-semibold hover:bg-yellow-600 transition-colors">Get Pro</button>
            </div>
            <a href="#" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v1h-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1H3V4zm0 3v9a2 2 0 002 2h10a2 2 0 002-2V7H3zm2-5h10v1H5V2z" /></svg>
              <span>Messages</span>
            </a>
            <Link href="/profile" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8 7.49l-4.75.69c-1.6.23-2.24 2.18-1.07 3.33l3.44 3.35-.81 4.73c-.27 1.58 1.39 2.79 2.81 2.08L10 18.39l4.25 2.23c1.42.71 3.08-.5 2.81-2.08l-.81-4.73 3.44-3.35c1.17-1.15.53-3.1-1.07-3.33L12 7.49l-.51-4.32z" clipRule="evenodd" /></svg>
              <span>Settings</span>
            </Link>
          </nav>
        </div>
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-50 flex-col justify-between min-h-screen">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">FoundexAI</h1>
          </div>
        </div>
        <nav className="px-6 space-y-6 flex-1">
          <a href="#" className="flex items-center space-x-3 text-gray-700 font-semibold hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V6h2v5H9zm1 3a1 1 0 110-2 1 1 0 010 2z" /></svg>
            <span>Action Items</span>
          </a>
          <div className="p-4 bg-yellow-400 rounded-lg text-center">
            <p className="font-bold">FoundexAI</p>
            <p className="text-sm mb-4">Get access to all features and functions</p>
            <button className="bg-white text-yellow-500 px-4 py-2 rounded-full font-semibold hover:bg-yellow-600 transition-colors">Get Pro</button>
          </div>
          <a href="#" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v1h-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1H3V4zm0 3v9a2 2 0 002 2h10a2 2 0 002-2V7H3zm2-5h10v1H5V2z" /></svg>
            <span>Messages</span>
          </a>
          <Link href="/profile" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8 7.49l-4.75.69c-1.6.23-2.24 2.18-1.07 3.33l3.44 3.35-.81 4.73c-.27 1.58 1.39 2.79 2.81 2.08L10 18.39l4.25 2.23c1.42.71 3.08-.5 2.81-2.08l-.81-4.73 3.44-3.35c1.17-1.15.53-3.1-1.07-3.33L12 7.49l-.51-4.32z" clipRule="evenodd" /></svg>
            <span>Settings</span>
          </Link>
        </nav>
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
        <main className="w-full flex-1 p-8 bg-gray-100">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <h2 className="text-lg font-semibold text-gray-500 mb-4">My Startup Ideas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {startups.map((startup) => (
              <Link href={`/startup-profile?id=${startup._id}`} key={startup._id}>
                <div className="bg-white rounded-lg shadow p-4 cursor-pointer">
                  <Image src={startup.image || '/placeholder.svg'} alt={startup.company_name} width={300} height={200} className="rounded-lg mb-4" />
                  <div className="flex items-center mb-2">
                    <Image src={startup.authorImage || '/placeholder.svg'} alt="author" width={24} height={24} className="rounded-full mr-2" />
                    <h3 className="font-bold">{startup.company_name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{startup.business_description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="bg-gray-200 rounded-full px-2 py-1 text-xs">{startup.tags?.[0] || 'General'}</span>
                    <span>{startup.location || 'Remote'}</span>
                  </div>
                </div>
              </Link>
            ))}
            <button 
              onClick={() => setShowOnboarding(true)}
              className="bg-white rounded-lg shadow p-6 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Add New Idea</h3>
                <p className="mt-1 text-sm text-gray-500">Bring your next big thing to life.</p>
              </div>
            </button>
          </div>
        </main>
      </div>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
    </div>
  )
}