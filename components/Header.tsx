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
    router.push("/");
  };

  const toggleDesktopDropdown = () => {
    setIsDesktopDropdownOpen(!isDesktopDropdownOpen);
  };

  const toggleMobileDropdown = () => {
    setIsMobileDropdownOpen(!isMobileDropdownOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDesktopDropdownOpen(false);
      }
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMobileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="w-full glass-header sticky top-0 z-50">
      <div className="container mx-auto p-4 lg:px-6 py-3 flex justify-between items-center bg-transparent">
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 md:w-10 md:h-10">
            <Image
              src="/foundex.png"
              alt="FoundexAI Logo"
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>
          <Link
            href="/dashboard"
            className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter hover:opacity-80 transition-opacity"
          >
            FoundexAI
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity">
            Investors
          </span>
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity">
            Founders
          </span>
          {user ? (
            <div className="flex items-center space-x-6">
              <button className="p-2.5 rounded-full bg-gray-100/50 hover:bg-white border border-white/50 transition-all shadow-sm hover:shadow-md group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600 group-hover:text-yellow-600 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="relative" ref={desktopDropdownRef}>
                <button
                  onClick={toggleDesktopDropdown}
                  className="flex items-center space-x-3 bg-white/40 hover:bg-white/80 border border-white/50 rounded-full pl-1 pr-4 py-1 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden lg:block text-sm font-bold text-gray-800">
                    {user.full_name}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  className={`absolute right-0 mt-2 w-56 glass-card border border-white/50 rounded-2xl shadow-xl py-2 z-50 transform origin-top-right transition-all duration-200 ${
                    isDesktopDropdownOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors mx-2 rounded-xl"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mx-2 rounded-xl mt-1"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/"
              className="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          )}
        </nav>
        {/* Mobile menu */}
        <div className="md:hidden flex items-center space-x-3">
          {user && (
            <div className="relative" ref={mobileDropdownRef}>
              <button
                onClick={toggleMobileDropdown}
                className="flex items-center space-x-2"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </button>
              <div
                className={`absolute right-0 mt-3 w-56 glass-card border border-white/50 rounded-2xl shadow-xl py-2 z-50 transform origin-top-right transition-all duration-200 ${
                  isMobileDropdownOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <Link
                  href="/dashboard"
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mx-2 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mx-2 rounded-lg"
                >
                  Profile
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 mx-2 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
          {!user && (
            <Link
              href="/"
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg"
            >
              Sign In
            </Link>
          )}
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl bg-white/50 text-gray-700 hover:text-gray-900 hover:bg-white transition-colors border border-white/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
        </div>
      </div>
    </header>
  );
}
