"use client";

import { useState } from "react";
import { 
  Building, 
  TrendUp, 
  Users, 
  Handshake, 
  GlobeSimple, 
  ChartBar,
  MagnifyingGlass,
  Bell,
  CaretDown,
  ArrowRight,
  ChartLineUp,
  CircleNotch,
  DownloadSimple,
  Lock,
  ChartPieSlice,
  NavigationArrow,
  Sparkle
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportStats {
  startupsCount: number;
  investorsCount: number;
  topSectors: Array<{ name: string; value: string }>;
  dealVolume: Array<{ country: string; value: number }>;
  transactions: Array<{ month: string; value: number }>;
  recentStartups: Array<{ name: string; location: string; color?: string }>;
  recentInvestors: Array<{ name: string; category: string; location: string; color?: string }>;
}

const E_REPORTS = [
  { id: "fintech-2025", title: "Fintech Report 2025", sector: "FinTech", size: "4.2 MB", date: "Q1 2025", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800" },
  { id: "agritech-trends", title: "AgriTech Trends & Opportunities", sector: "AgriTech", size: "3.8 MB", date: "Q1 2025", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800" },
  { id: "clean-energy", title: "Clean Energy Investment Map", sector: "Energy", size: "5.1 MB", date: "Dec 2024", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800" },
  { id: "edtech-landscape", title: "EdTech Growth Landscape", sector: "Education", size: "2.9 MB", date: "Jan 2025", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800" },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: stats, isLoading } = useQuery<ReportStats>({
    queryKey: ["reports", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/reports/stats");
      if (!res.ok) throw new Error("Failed to load ecosystem stats");
      return res.json();
    },
    staleTime: 60000,
  });

  const FINTECH_DATA = [
    { year: '2020', funding: 0.439 },
    { year: '2021', funding: 1.37 },
    { year: '2022', funding: 1.20 },
    { year: '2023', funding: 0.96 },
    { year: '2024', funding: 2.00 },
  ];

  const handleDownloadReport = (reportTitle: string) => {
    if (user?.plan_type !== "license") {
      toast.error("Institutional License Required", {
        description: "Please upgrade to the License plan to download e-reports.",
        action: {
          label: "Upgrade",
          onClick: () => router.push("/dashboard/pricing"),
        },
      });
      return;
    }
    toast.success(`Downloading ${reportTitle}...`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <CircleNotch className="w-12 h-12 text-yellow-500 animate-spin" weight="bold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white space-y-12 animate-in fade-in duration-700 pb-20 px-4 md:px-8">
      
      {/* Search & Identity Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pt-4">
        <div className="relative w-full max-w-2xl">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 h-5 w-5" weight="bold" />
          <input 
            type="text" 
            placeholder="Search reports, companies, or insights..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-full py-3.5 pl-12 pr-6 text-sm focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 outline-none transition-all placeholder:text-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-1.5 pr-4 rounded-2xl hover:bg-zinc-800 transition-colors"
          >
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-black">
              {user?.full_name?.[0].toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-black tracking-tight leading-none text-zinc-100">{user?.full_name || "User"}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{user?.plan_type || "Starter"}</p>
            </div>
            <CaretDown className={cn("h-4 w-4 text-zinc-500 ml-2 transition-transform", isDropdownOpen && "rotate-180")} weight="bold" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
               <div className="p-4 border-b border-zinc-800">
                  <p className="text-xs font-bold text-zinc-100">{user?.full_name}</p>
                  <p className="text-[10px] text-zinc-500">{user?.email}</p>
               </div>
               <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all">
                  <Users size={14} /> Profile Settings
               </Link>
            </div>
          )}
        </div>
      </div>

      {/* 1. SECTOR INTELLIGENCE DASHBOARD (Rectangle Based Layout) */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-yellow-400 rounded-full"></div>
          <h2 className="text-3xl font-black tracking-tighter">Market Intelligence Overview</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Executive Summary & Insights */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-3xl h-full">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black mb-2">Fintech Report 2025</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Nigeria Executive Summary</span>
                </div>
                <ChartBar className="w-10 h-10 text-yellow-500" weight="duotone" />
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-4xl">
                Fintech in Africa has entered a new maturity phase in 2025. Nigeria Fintech Funding has seen significant shifts, with 2024 showing a massive resurgence to $2.0B. Venture debt now makes up ~41% of total funding in 2025, a dramatic increase from just 17% in 2019. This evolution marks a transition to more sustainable, long-term capital structures within the ecosystem.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Nigeria Fintech Funding</p>
                       <p className="text-[9px] text-zinc-600">Last 5 Years (USD Billions)</p>
                    </div>
                    <ChartLineUp className="w-5 h-5 text-[#B45F47]" />
                  </div>
                  <div className="h-64 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={FINTECH_DATA} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#27272a" />
                          <XAxis 
                            dataKey="year" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                            dy={10}
                            label={{ value: 'Year', position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                            domain={[0, 2.0]}
                            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0]}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                            itemStyle={{ color: '#B45F47', fontWeight: 'bold' }}
                            formatter={(value: any) => [`$${value}B`, "Funding"]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="funding" 
                            stroke="#B45F47" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#B45F47', strokeWidth: 2, stroke: '#18181b' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Key Ecosystem Shifts</p>
                    <TrendUp className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="space-y-4">
                    <div>
                       <div className="flex justify-between text-[10px] font-bold mb-2">
                          <span className="text-zinc-500 uppercase tracking-widest">Venture Debt Share</span>
                          <span className="text-yellow-500">41%</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: '41%' }}></div>
                       </div>
                       <p className="text-[9px] text-zinc-600 mt-2">Up from 17% in 2019</p>
                    </div>
                    <div>
                       <div className="flex justify-between text-[10px] font-bold mb-2">
                          <span className="text-zinc-500 uppercase tracking-widest">African Investor Base</span>
                          <span className="text-zinc-300">31%</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-400 transition-all duration-1000" style={{ width: '31%' }}></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Visual & Secondary Reports */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] overflow-hidden group aspect-square lg:aspect-auto flex-1 relative">
              <img 
                src="https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?q=80&w=1200" 
                alt="Fintech Featured" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                 <p className="text-2xl font-black leading-tight mb-2">The Venture Debt Revolution</p>
                 <p className="text-xs text-zinc-400">How alternative financing is scaling Africa's tech hubs.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {E_REPORTS.slice(1, 3).map(rep => (
                <div key={rep.id} className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-500 flex flex-col h-full shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <div className="aspect-3/4 relative overflow-hidden">
                    <img 
                      src={rep.image} 
                      alt={rep.title} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-zinc-100 line-clamp-2 leading-tight uppercase tracking-tighter">{rep.title}</p>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2">{rep.sector}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTELLIGENCE REPORTS HUB (Downloadable E-Reports) */}
      <section className="space-y-8 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-zinc-700 rounded-full"></div>
              <h2 className="text-3xl font-black tracking-tighter uppercase text-zinc-400">Reports Hub</h2>
            </div>
            <p className="text-zinc-500 text-sm">Download deep-dive institutional analytics on emerging sectors.</p>
          </div>
          
          <div className="flex gap-2">
             <span className={cn(
               "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
               user?.plan_type === "license" ? "bg-yellow-400 text-black border-yellow-500" : "bg-zinc-900 text-zinc-500 border-zinc-800"
             )}>
                {user?.plan_type === "license" ? "Institutional Access" : "Standard Access"}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {E_REPORTS.map((report) => (
            <div key={report.id} className="group bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-6 hover:shadow-2xl transition-all relative overflow-hidden">
               <div className="absolute top-4 right-4 z-20">
                 {user?.plan_type !== "license" && (
                   <div className="w-8 h-8 bg-black/40 backdrop-blur-md border border-white/5 rounded-full flex items-center justify-center">
                     <Lock className="w-4 h-4 text-zinc-600" weight="bold" />
                   </div>
                 )}
               </div>

               <div className="aspect-3/4 rounded-2xl bg-zinc-900 overflow-hidden relative border border-white/5">
                 <img 
                    src={report.image} 
                    alt={report.title} 
                    className={cn(
                      "w-full h-full object-cover transition-all duration-700",
                      user?.plan_type !== "license" ? "grayscale opacity-30 group-hover:opacity-50" : "opacity-80 group-hover:opacity-100"
                    )}
                 />
                 <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60"></div>
                 <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-500/20">{report.sector}</span>
                 </div>
               </div>

               <div className="space-y-4">
                 <div>
                    <h3 className="font-bold text-base leading-tight group-hover:text-yellow-400 transition-colors">{report.title}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">{report.date} • {report.size}</p>
                 </div>
                 
                 <button 
                   onClick={() => handleDownloadReport(report.title)}
                   className={cn(
                     "w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer",
                     user?.plan_type === "license" 
                        ? "bg-white text-black hover:bg-yellow-400" 
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
                   )}
                 >
                   <DownloadSimple className="w-4 h-4" weight="bold" />
                   {user?.plan_type === "license" ? "Download PDF" : "Get Access"}
                 </button>
               </div>
            </div>
          ))}
        </div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
           {[
             { label: "Institutional Capital", value: "$4.1B", icon: Handshake },
             { label: "Active Investors", value: "614", icon: Sparkle },
             { label: "Venture Deals (2024)", value: "487", icon: NavigationArrow },
             { label: "Sectors Covered", value: "4", icon: GlobeSimple },
           ].map((stat, i) => (
             <div key={i} className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 flex flex-col items-center text-center gap-2">
                <stat.icon className="w-5 h-5 text-zinc-600" />
                <p className="text-xl font-black">{stat.value}</p>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">{stat.label}</p>
             </div>
           ))}
        </div>
      </section>

    </div>
  );
}


