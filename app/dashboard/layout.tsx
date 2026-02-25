"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SquaresFour,
  Gear,
  SignOut,
  RocketLaunch,
  Compass,
  UserCircle,
  Lightning,
  ShieldCheck,
  ChartLineUp,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: SquaresFour, exact: true },
    ],
  },
  {
    title: "Discover",
    items: [
      { name: "Investors", href: "/dashboard/investors", icon: Compass },
      { name: "Startups", href: "/dashboard/startups", icon: RocketLaunch },
      { name: "Reports", href: "/dashboard/reports", icon: ChartLineUp },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
      { name: "Settings", href: "/dashboard/settings", icon: Gear },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { isOpen: isSidebarOpen, close: closeSidebar } = useMobileMenu();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const getLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);

    return cn(
      "flex items-center rounded-xl transition-all duration-300 group overflow-hidden",
      isCollapsed ? "justify-center p-3" : "space-x-3 px-4 py-3",
      isActive
        ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 font-bold"
        : "text-gray-500 font-medium hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5"
    );
  };

  const NavContent = () => {
    const groups = [...NAVIGATION_GROUPS];
    if (user?.isAdmin) {
      groups.push({
        title: "Management",
        items: [
          { name: "Admin", href: "/admin", icon: ShieldCheck },
        ],
      });
    }

    return (
      <div className="flex flex-col h-full py-6">
        <div className="flex-1 px-4 space-y-8 overflow-y-auto no-scrollbar pt-20 md:pt-4">
          {groups.map((group) => (
          <div key={group.title} className={cn("space-y-3 lg:mt-[4rem]", isCollapsed && "items-center flex flex-col")}>
            {!isCollapsed && (
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                {group.title}
              </h3>
            )}
            <div className={cn("space-y-2", isCollapsed && "w-full")}>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={getLinkClass(item.href, item.exact)}
                  title={isCollapsed ? item.name : ""}
                >
                  <item.icon weight="bold" className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110 shrink-0",
                    pathname === item.href || (!item.exact && pathname.startsWith(item.href))
                      ? "text-black"
                      : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  )} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Pro Upgrade Card */}
        {!isCollapsed && (
          <div className="mx-2 p-5 rounded-2xl bg-linear-to-br from-zinc-900 to-black text-white relative overflow-hidden group border border-white/5 shadow-2xl dark:from-zinc-900/50 dark:to-black mt-8">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-colors"></div>
            <div className="relative z-10">
              {/* <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center mb-4">
                <Lightning className="w-5 h-5 text-black" weight="bold" />
              </div> */}
              <p className="font-black text-sm tracking-tight mb-1">Foundex Pro</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                Unlock investor insights and dedicated deal support.
              </p>
              <Link href="/dashboard/pricing">
                  <button className="w-full bg-white text-black py-2 rounded-xl text-xs font-black hover:bg-zinc-200 transition-colors cursor-pointer">
                  Upgrade Now
                  </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className={cn("mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800", isCollapsed ? "px-2" : "px-4")}>
        <Link href="/dashboard/profile" className={cn("flex items-center mb-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors group", isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2")}>
          {user?.profile_image_url ? (
            <img 
              src={user.profile_image_url} 
              alt={user.full_name} 
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10 shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 shrink-0">
              <UserCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" weight="fill" />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">
                {user?.user_type || 'Account'}
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={async () => {
            await logout();
            window.location.href = "/";
          }}
          className={cn(
            "flex items-center text-gray-500 hover:text-red-500 w-full transition-colors cursor-pointer dark:text-gray-400",
            isCollapsed ? "justify-center py-4" : "space-x-3 px-4 py-3"
          )}
          title={isCollapsed ? "Sign Out" : ""}
        >
          <SignOut className="h-5 w-5 shrink-0" weight="bold" />
          {!isCollapsed && <span className="font-bold">Sign Out</span>}
        </button>
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        />
      )}

      <div className="flex">
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-500 ease-spring md:hidden dark:bg-zinc-950",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <NavContent />
        </aside>

        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden md:flex bg-white dark:bg-zinc-950 border-r border-gray-100 dark:border-zinc-900 flex-col h-screen fixed top-0 left-0 z-40 transition-all duration-300",
          isCollapsed ? "w-20" : "w-72"
        )}>
          {/* Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-24 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-full p-1.5 shadow-md z-50 transition-all hover:scale-110 active:scale-95 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            {isCollapsed ? <CaretRight weight="bold" size={14} /> : <CaretLeft weight="bold" size={14} />}
          </button>
          <NavContent />
        </aside>

        <main className={cn(
          "w-full flex-1 min-h-screen bg-gray-50/50 dark:bg-black transition-all duration-300",
          isCollapsed ? "md:ml-20" : "md:ml-72"
        )}>
          <div className="max-w-7xl mx-auto p-4 py-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
