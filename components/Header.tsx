"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header() {
  const { user, logout } = useAuth();
  const { toggle } = useMobileMenu();
  const router = useRouter();
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const toggleDesktopDropdown = () => {
    setIsDesktopDropdownOpen(!isDesktopDropdownOpen);
  };

  const toggleMobileDropdown = () => {
    setIsMobileDropdownOpen(!isMobileDropdownOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        setIsDesktopDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="w-full bg-black/40 shadow-md">
      <div className="container mx-auto p-4 lg:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image src="/foundex.png" alt="FoundexAI Logo" width={32} height={32} />
          <Link href="/dashboard" className="text-2xl font-bold text-white">FoundexAI</Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <span className="text-gray-500 cursor-not-allowed opacity-50">Investors</span>
          <span className="text-gray-500 cursor-not-allowed opacity-50">Founders</span>
          {user ? (
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="relative" ref={desktopDropdownRef}>
                <button onClick={toggleDesktopDropdown} className="flex items-center space-x-2 text-white hover:text-gray-300">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:block">{user.full_name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ${isDesktopDropdownOpen ? 'block' : 'hidden'}`}>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/" className="text-gray-300 hover:text-white">Sign In</Link>
          )}
        </nav>
        {/* Mobile menu */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={toggle}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {user ? (
            <div className="relative" ref={mobileDropdownRef}>
              <button onClick={toggleMobileDropdown} className="flex items-center space-x-2 text-white">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>
              <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ${isMobileDropdownOpen ? 'block' : 'hidden'}`}>
                <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                <span className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-50">Investors</span>
                <span className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-50">Founders</span>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
              </div>
            </div>
          ) : (
            <Link href="/" className="text-gray-300 hover:text-white">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}