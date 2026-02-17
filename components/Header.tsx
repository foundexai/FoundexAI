"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Bell, CaretDown, List } from "@phosphor-icons/react";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header() {
  const { user, logout } = useAuth();
  const { toggle } = useMobileMenu();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
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
    <header className="w-full sticky top-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-xl dark:bg-black/60 dark:border-white/10 transition-all duration-300">
      <div className="mx-auto p-4 lg:px-6 py-3 flex justify-between items-center bg-transparent">
        {/* Logo Section - Visible on all screens now */}
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
            className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter hover:opacity-80 transition-opacity dark:text-white"
          >
            FoundexAI
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-8 ml-auto">
          <Link
            href="/dashboard/investors"
            className="text-sm font-bold text-gray-700 uppercase tracking-widest cursor-pointer opacity-60 hover:opacity-80 transition-opacity dark:text-gray-300"
          >
            Investors
          </Link>

          <div className="flex items-center space-x-6">
            <button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="p-2.5 rounded-full bg-gray-100/50 hover:bg-white border border-white/50 transition-all shadow-sm hover:shadow-md group dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
              aria-label="Toggle theme"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 text-gray-600 group-hover:text-yellow-500 transition-colors dark:text-gray-400 dark:group-hover:text-yellow-400" weight="bold" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors dark:text-gray-400" weight="bold" />
              )}
            </button>

            {user ? (
              <>
                <button className="p-2.5 rounded-full bg-gray-100/50 hover:bg-white border border-white/50 transition-all shadow-sm hover:shadow-md group dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20">
                  <Bell className="h-5 w-5 text-gray-600 group-hover:text-yellow-600 transition-colors dark:text-gray-400 dark:group-hover:text-yellow-400" weight="bold" />
                </button>
                <div className="relative" ref={desktopDropdownRef}>
                  <button
                    onClick={toggleDesktopDropdown}
                    className="flex items-center space-x-3 bg-white/40 hover:bg-white/80 border border-white/50 rounded-full pl-1 pr-4 py-1 transition-all shadow-sm hover:shadow-md dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
                  >
                    {user.profile_image_url ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                        <img
                          src={user.profile_image_url}
                          alt={user.full_name || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                        {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="hidden lg:block text-sm font-bold text-gray-800 dark:text-gray-200">
                      {user.full_name}
                    </span>
                    <CaretDown className="h-4 w-4 text-gray-500 dark:text-gray-400" weight="bold" />
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-56 glass-card border border-white/50 rounded-2xl shadow-xl py-2 z-50 transform origin-top-right transition-all duration-200 dark:bg-zinc-900/90 dark:border-zinc-800 ${
                      isDesktopDropdownOpen
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 mb-1 dark:border-zinc-800">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider dark:text-gray-400">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 truncate dark:text-white">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors mx-2 rounded-xl dark:text-gray-300 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors mx-2 rounded-xl dark:text-gray-300 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mx-2 rounded-xl mt-1 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link
                href="/"
                className="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
        <div className="md:hidden flex items-center space-x-3">
          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="p-2.5 rounded-xl bg-white/50 text-gray-700 hover:text-gray-900 hover:bg-white transition-colors border border-white/50 dark:bg-white/10 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/20"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </button>
          {user && (
            <div className="relative" ref={mobileDropdownRef}>
              <button
                onClick={toggleMobileDropdown}
                className="flex items-center space-x-2"
              >
                  {user.profile_image_url ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-md border border-gray-200 dark:border-white/10">
                      <img
                        src={user.profile_image_url}
                        alt={user.full_name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0">
                      {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
              </button>
              <div
                className={`absolute right-0 mt-3 w-56 glass-card border border-white/50 rounded-2xl shadow-xl py-2 z-50 transform origin-top-right transition-all duration-200 dark:bg-zinc-900/90 dark:border-zinc-800 ${
                  isMobileDropdownOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <Link
                  href="/dashboard"
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mx-2 rounded-lg dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mx-2 rounded-lg dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mx-2 rounded-lg dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1 dark:border-zinc-800"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 mx-2 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
          {!user && (
            <Link
              href="/"
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg dark:bg-white dark:text-black"
            >
              Sign In
            </Link>
          )}
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl bg-white/50 text-gray-700 hover:text-gray-900 hover:bg-white transition-colors border border-white/50 dark:bg-white/10 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/20"
          >
            <List className="h-6 w-6" weight="bold" />
          </button>
        </div>
      </div>
    </header>
  );
}
