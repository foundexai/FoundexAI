"use client";
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
  const pathname = usePathname();

  const getLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);

    return cn(
      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
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
          <div key={group.title} className="space-y-3 lg:mt-10">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={getLinkClass(item.href, item.exact)}
                >
                  <item.icon weight="bold" className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    pathname === item.href || (!item.exact && pathname.startsWith(item.href))
                      ? "text-black"
                      : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  )} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Pro Upgrade Card */}
        <div className="mx-2 p-5 rounded-2xl bg-linear-to-br from-zinc-900 to-black text-white relative overflow-hidden group border border-white/5 shadow-2xl dark:from-zinc-900/50 dark:to-black">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-colors"></div>
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center mb-4">
              <Lightning className="w-5 h-5 text-black" weight="bold" />
            </div>
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
      </div>

      <div className="px-4 mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
        <button
          onClick={async () => {
            await logout();
            window.location.href = "/";
          }}
          className="flex items-center space-x-3 text-gray-500 hover:text-red-500 w-full px-4 py-3 transition-colors cursor-pointer dark:text-gray-400"
        >
          <SignOut className="h-5 w-5" weight="bold" />
          <span className="font-bold">Sign Out</span>
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
        <aside className="hidden md:flex w-72 bg-white dark:bg-zinc-950 border-r border-gray-100 dark:border-zinc-900 flex-col h-screen fixed top-0 left-0 z-40 transition-all duration-300">
          <NavContent />
        </aside>

        <main className="w-full flex-1 min-h-screen bg-gray-50/50 dark:bg-black md:ml-72 transition-all duration-300">
          <div className="max-w-7xl mx-auto p-4 py-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
