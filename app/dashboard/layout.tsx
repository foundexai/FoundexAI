"use client";
import { useState, useEffect } from "react";
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
  CircleNotch,
  ChatCircleDots,
} from "@phosphor-icons/react";
import Image from "next/image";
import Header from "@/components/Header";

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

const FOUNDER_NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: SquaresFour, exact: true },
      { name: "Deal Pipeline", href: "/dashboard/pipeline", icon: ChatCircleDots },
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

const INVESTOR_NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: SquaresFour, exact: true },
      { name: "Deal Pipeline", href: "/dashboard/pipeline", icon: ChatCircleDots },
    ],
  },
  {
    title: "Discover",
    items: [
      { name: "Startups", href: "/dashboard/startups", icon: RocketLaunch },
      { name: "Reports", href: "/dashboard/reports", icon: ChartLineUp },
    ],
  },
  {
    title: "Network",
    items: [
      { name: "Investors", href: "/dashboard/investors", icon: Compass },
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
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [isDragging, setIsDragging] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setClickedItem(null);
  }, [pathname]);

  /*
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX;
      if (newWidth < 220) newWidth = 220;
      if (newWidth > 450) newWidth = 450;
      setSidebarWidth(newWidth);
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isCollapsed]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);
  */

  const getLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);

    return cn(
      "flex items-center rounded-xl transition-all duration-300 group relative",
      isCollapsed
        ? "justify-center p-3"
        : "space-x-3 px-4 py-3 overflow-hidden",
      isActive
        ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 font-bold"
        : "text-gray-500 font-medium hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5",
    );
  };

  const NavContent = () => {
    const isInvestor = user?.user_type === "investor";
    const groups = [...(isInvestor ? INVESTOR_NAV_GROUPS : FOUNDER_NAV_GROUPS)];
    if (user?.isAdmin) {
      groups.push({
        title: "Management",
        items: [
          { name: "Admin", href: "/dashboard/admin", icon: ShieldCheck },
          {
            name: "Subscriptions",
            href: "/dashboard/admin/subscriptions",
            icon: Lightning,
          },
        ],
      });
    }

    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-6 flex items-center gap-3 mt-2">
          <Link
            href="/dashboard"
            className="relative w-8 h-8 md:w-10 md:h-10 shrink-0"
          >
            <Image
              src="/foundex.png"
              alt="FoundexAI Logo"
              fill
              className="object-contain drop-shadow-lg"
            />
          </Link>
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter hover:opacity-80 transition-opacity dark:text-white truncate"
            >
              FoundexAI
            </Link>
          )}
        </div>
        <div
          className={cn(
            "flex-1 px-4 space-y-8 pt-4",
            isCollapsed ? "overflow-visible" : "overflow-y-auto thin-scrollbar",
          )}
        >
          {groups.map((group, index) => (
            <div
              key={group.title}
              className={cn(
                "space-y-3",
                index === 0 ? "lg:mt-4" : "lg:mt-12",
                isCollapsed && "items-center flex flex-col",
              )}
            >
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
                    onClick={() => {
                      setClickedItem(item.href);
                      closeSidebar();
                    }}
                    className={getLinkClass(item.href, item.exact)}
                  >
                    <item.icon
                      weight="bold"
                      className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110 shrink-0",
                        pathname === item.href ||
                          (!item.exact && pathname.startsWith(item.href))
                          ? "text-black"
                          : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white",
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                    {clickedItem === item.href && pathname !== item.href && (
                      <CircleNotch className="w-4 h-4 ml-auto animate-spin" />
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-200 z-[99] bg-gray-900 dark:bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-gray-850 dark:border-zinc-800 flex items-center gap-1.5">
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-zinc-900" />
                        <span>{item.name}</span>
                      </div>
                    )}
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
                <p className="font-black text-sm tracking-tight mb-1">
                  Foundex Pro
                </p>
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

        <div
          className={cn(
            "mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800",
            isCollapsed ? "px-2" : "px-4",
          )}
        >
          <Link
            href="/dashboard/profile"
            onClick={() => setClickedItem("/dashboard/profile")}
            className={cn(
              "flex items-center mb-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors group relative",
              isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2",
            )}
          >
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.full_name}
                className="w-10.5 h-11 rounded-full object-cover border border-gray-200 dark:border-white/10 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 shrink-0">
                <UserCircle
                  className="w-6 h-6 text-gray-400 dark:text-gray-500"
                  weight="fill"
                />
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                  {user?.full_name || "User"}
                </p>
                <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">
                  {user?.user_type || "Account"}
                </p>
              </div>
            )}
            {clickedItem === "/dashboard/profile" &&
              pathname !== "/dashboard/profile" && (
                <CircleNotch className="w-4 h-4 ml-auto animate-spin text-gray-400" />
              )}
            {isCollapsed && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-200 z-[99] bg-gray-900 dark:bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-gray-850 dark:border-zinc-800 flex items-center gap-1.5">
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-zinc-900" />
                <span>Profile ({user?.full_name || "User"})</span>
              </div>
            )}
          </Link>
          <button
            onClick={async () => {
              setClickedItem("logout");
              await logout();
              window.location.href = "/";
            }}
            disabled={clickedItem === "logout"}
            className={cn(
              "flex items-center text-gray-500 hover:text-red-500 w-full transition-colors cursor-pointer dark:text-gray-400 relative disabled:opacity-50",
              isCollapsed ? "justify-center py-4" : "space-x-3 px-4 py-3",
            )}
          >
            {clickedItem === "logout" && isCollapsed ? (
              <CircleNotch className="h-5 w-5 animate-spin" weight="bold" />
            ) : (
              <SignOut className="h-5 w-5 shrink-0" weight="bold" />
            )}
            {!isCollapsed && <span className="font-bold">Sign Out</span>}
            {clickedItem === "logout" && !isCollapsed && (
              <CircleNotch className="w-4 h-4 ml-auto animate-spin" />
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-200 z-[99] bg-gray-900 dark:bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-gray-850 dark:border-zinc-800 flex items-center gap-1.5">
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-zinc-900" />
                <span>Sign Out</span>
              </div>
            )}
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
            "fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-500 ease-spring lg:hidden dark:bg-zinc-950",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <NavContent />
        </aside>

        {/* Desktop Sidebar */}
        <aside
          /* style={{
            width: isCollapsed ? '80px' : `${sidebarWidth}px`,
            transition: isDragging ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms, background-color 300ms',
          }} */
          className={cn(
            "hidden lg:flex bg-white dark:bg-zinc-950 border-r border-gray-100 dark:border-zinc-900 flex-col h-screen fixed top-0 left-0 z-50 transition-all duration-300",
            isCollapsed ? "w-20" : "w-72",
          )}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-24 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-full p-1.5 shadow-md z-50 transition-all hover:scale-110 active:scale-95 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            {isCollapsed ? (
              <CaretRight weight="bold" size={14} />
            ) : (
              <CaretLeft weight="bold" size={14} />
            )}
          </button>
          <NavContent />
          {/* Drag Handle */}
          {/* {!isCollapsed && (
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize z-30 hover:bg-yellow-500/50 active:bg-yellow-500 transition-colors",
                isDragging && "bg-yellow-500"
              )}
            />
          )} */}
        </aside>

        <main
          /* style={{
            marginLeft: isCollapsed ? '80px' : `${sidebarWidth}px`,
            transition: isDragging ? 'none' : 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms, background-color 300ms',
          }} */
          className={cn(
            "min-w-0 flex-1 min-h-screen bg-gray-50/50 dark:bg-black transition-all duration-300 relative",
            isCollapsed ? "lg:ml-20" : "lg:ml-72",
          )}
        >
          <Header variant="dashboard" />
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
