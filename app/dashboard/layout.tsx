"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { LayoutDashboard, CheckCheck, FileText, Settings, LogOut, MessageSquare } from 'lucide-react';

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
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between`}>
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">FoundexAI</h1>
            </div>
            <nav className="space-y-6">
              <a href="#" className="flex items-center space-x-3 text-gray-700 font-semibold hover:text-gray-900">
                <LayoutDashboard className="h-5 w-5" />
                <span>Action Items</span>
              </a>
              <Link href="/dashboard/tasks" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
                <CheckCheck className="h-5 w-5" />
                <span>Tasks</span>
              </Link>
              <Link href="/dashboard/notes" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
                <FileText className="h-5 w-5" />
                <span>Notes</span>
              </Link>
              <div className="p-4 bg-yellow-400 rounded-lg text-center">
                <p className="font-bold">FoundexAI</p>
                <p className="text-sm mb-4">Get access to all features and functions</p>
                <button className="bg-white text-yellow-500 px-4 py-2 rounded-full font-semibold hover:bg-yellow-600 transition-colors">Get Pro</button>
              </div>
              <a href="#" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </a>
              <Link href="/profile" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
                <Settings className="h-5 w-5" />
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
              <LogOut className="h-5 w-5" />
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
              <LayoutDashboard className="h-5 w-5" />
              <span>Action Items</span>
            </a>
            <Link href="/dashboard/tasks" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
              <CheckCheck className="h-5 w-5" />
              <span>Tasks</span>
            </Link>
            <Link href="/dashboard/notes" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
              <FileText className="h-5 w-5" />
              <span>Notes</span>
            </Link>
            <div className="p-4 bg-yellow-400 rounded-lg text-center">
              <p className="font-bold">FoundexAI</p>
              <p className="text-sm mb-4">Get access to all features and functions</p>
              <button className="bg-white text-yellow-500 px-4 py-2 rounded-full font-semibold hover:bg-yellow-600 transition-colors">Get Pro</button>
            </div>
            <a href="#" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </a>
            <Link href="/profile" className="flex items-center space-x-3 text-gray-500 hover:text-gray-700">
              <Settings className="h-5 w-5" />
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
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
        <main className="w-full flex-1 p-8 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}