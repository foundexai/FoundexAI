"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import {
  LayoutDashboard,
  CheckCheck,
  FileText,
  Settings,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { isOpen: isSidebarOpen, close: closeSidebar } = useMobileMenu();

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
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between dark:bg-zinc-900 dark:border-r dark:border-zinc-800`}
        >
          <div className="p-6 pt-24">
            <nav className="space-y-6">
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 text-gray-700 font-semibold hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Overview</span>
              </Link>

              <Link
                href="/dashboard/investors"
                className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Users className="h-5 w-5" />
                <span>Investors</span>
              </Link>
              <div className="p-4 bg-yellow-400 rounded-lg text-center dark:bg-yellow-500/90">
                <p className="font-bold text-gray-900">FoundexAI</p>
                <p className="text-sm mb-4 text-gray-800">
                  Get access to all features and functions
                </p>
                <button className="bg-white text-yellow-500 px-4 py-2 rounded-full font-semibold hover:bg-yellow-600 transition-colors">
                  Get Pro
                </button>
              </div>
              <a
                href="#"
                className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </a>
              <Link
                href="/profile"
                className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
          <div className="p-6 border-t border-gray-200 dark:border-zinc-800">
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/";
              }}
              className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 w-full dark:text-gray-400 dark:hover:text-gray-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white/50 backdrop-blur-md border-r border-gray-100 flex-col justify-between min-h-screen sticky top-0 dark:border-zinc-800 inset-y-0 left-0 z-50 transform translate-x-0 transition-transform duration-300 ease-in-out dark:bg-zinc-900 dark:border-r">
          <div className="flex items-center space-x-3 px-6 h-16 mt-2">
            <div className="relative w-8 h-8">
              <img
                src="/foundex.png"
                alt="FoundexAI Logo"
                className="object-contain drop-shadow-lg"
              />
            </div>
            <Link
              href="/dashboard"
              className="text-xl font-black text-gray-900 tracking-tighter hover:opacity-80 transition-opacity dark:text-white"
            >
              FoundexAI
            </Link>
          </div>
          <nav className="px-6 space-y-6 flex-1 mt-6">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 text-gray-700 font-semibold hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Overview</span>
            </Link>

            <Link
              href="/dashboard/investors"
              className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Users className="h-5 w-5" />
              <span>Investors</span>
            </Link>
            <div className="p-4 bg-yellow-400 rounded-lg text-center dark:bg-yellow-500/90">
              <p className="font-bold text-gray-900">FoundexAI</p>
              <p className="text-sm mb-4 text-gray-800">
                Get access to all features and functions
              </p>
              <button className="bg-white text-yellow-600 px-4 py-2 rounded-full font-semibold hover:bg-yellow-50 transition-colors">
                Get Pro
              </button>
            </div>
            <a
              href="#"
              className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </a>
            <Link
              href="/profile"
              className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
          <div className="p-6 border-t border-gray-200 dark:border-zinc-800">
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/";
              }}
              className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 w-full dark:text-gray-400 dark:hover:text-gray-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
        <main className="w-full flex-1 p-8 bg-gray-100 dark:bg-black/90">
          {children}
        </main>
      </div>
    </div>
  );
}
