"use client";

import { use, useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ShareNetwork, 
  BookmarkSimple, 
  MagnifyingGlass,
  ArrowRight,
  ChartPie,
  CaretRight
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const RELATED_REPORTS = [
  { title: "AgriTech Report 2025", summary: "A snapshot of AgriTech innovation, productivity solutions, and the fastest-growing opportunities in the sector.", date: "Oct 2024" },
  { title: "AgriTech Report 2025", summary: "A snapshot of AgriTech innovation, productivity solutions, and the fastest-growing opportunities in the sector.", date: "Oct 2024" },
  { title: "AgriTech Report 2025", summary: "A snapshot of AgriTech innovation, productivity solutions, and the fastest-growing opportunities in the sector.", date: "Nov 2024" },
  { title: "AgriTech Report 2025", summary: "A snapshot of AgriTech innovation, productivity solutions, and the fastest-growing opportunities in the sector.", date: "Dec 2024" },
];

export default function DetailedReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fallback / Mock for the design reference (Fintech Report 2025)
  const isMock = slug === "fintech-report-2025";

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
        }
      } catch (e) {
        console.error("Failed to load report API");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [slug]);

  if (loading && !isMock) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 bg-yellow-500 rounded-2xl animate-spin"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white font-inter selection:bg-yellow-500/30">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-12 animate-in slide-in-from-top-4 duration-500">
        <Link href="/dashboard/reports" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group">
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:scale-110 transition-transform">
            <ArrowLeft weight="bold" />
          </div>
          <span className="font-bold text-sm">Back to Reports</span>
        </Link>
        
        <div className="flex items-center gap-4">
             <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors">
                 <BookmarkSimple className="h-5 w-5 text-zinc-400" weight="bold" />
             </button>
             <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors">
                 <ShareNetwork className="h-5 w-5 text-zinc-400" weight="bold" />
             </button>
        </div>
      </div>

      {/* Main Report Title Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 px-2">
        <div>
            <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">Market Insight</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">12 min read</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">Fintech Report 2025</h1>
        </div>
        <div className="relative group w-full md:w-auto">
            <input 
                type="text" 
                placeholder="Find in report..."
                className="w-full md:w-64 bg-zinc-950 border border-zinc-900 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 outline-none transition-all placeholder:text-zinc-700"
            />
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700 h-4 w-4" weight="bold" />
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 px-2 pb-32">
        
        {/* Left Content Column */}
        <div className="xl:col-span-8 space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* Executive Summary */}
            <section className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-300">Executive summary</h2>
                <div className="text-zinc-400 text-lg leading-relaxed font-inter space-y-6">
                    <p>
                        Fintech in Africa has entered a new maturational phase in 2025. The exuberant funding cycle of 2020 to 2022 has tapered into a more disciplined, fundamentals-driven environment. However, Africa continues to outperform global averages in fintech adoption, digital payments penetration, and mobile money activity. In 2025, the sector is characterized by improved regulatory harmonisation, stronger unit economics, and a shift from pure-play digital payments toward full-stack financial services and infrastructure layers.
                    </p>
                    <p>
                        This report provides a forward-looking assessment of the African fintech landscape, drawing on macro indicators, investor behaviour, ecosystem development, and the evolving competitive landscape across regions.
                    </p>
                </div>
            </section>

            {/* Section 1: Macroeconomic */}
            <section className="space-y-8">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-300">1. Macroeconomic environment</h2>
                <p className="text-zinc-400 text-lg leading-relaxed">
                    Despite persistent currency volatility, 2025 marks a stabilisation period driven by rising intra-African trade under the African Continental Free Trade Area, investments in digital public infrastructure, gradual inflation recovery across major markets, and strong demographic tailwinds with a young, urbanising population. The result is a structural demand for digital financial services that reduce frictions in payments, credit access, remittances, and cross-border commerce.
                </p>

                {/* Sub-charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-zinc-950/50 border border-zinc-900 rounded-3xl p-8 space-y-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Monthly Processed Volume</h3>
                        <div className="flex items-end justify-between h-40 pt-4 gap-1.5 overflow-hidden">
                            {[10, 15, 25, 20, 35, 45, 30, 50, 65, 55, 75, 80].map((v, i) => (
                                <div 
                                    key={i} 
                                    className="grow bg-yellow-500/80 rounded-t-lg transition-all hover:bg-yellow-400"
                                    style={{ height: `${v}%` }}
                                ></div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-700">
                            <span>Jan</span>
                            <span>Mar</span>
                            <span>May</span>
                            <span>Jul</span>
                            <span>Sep</span>
                            <span>Nov</span>
                        </div>
                    </div>
                    
                    <div className="bg-zinc-950/50 border border-zinc-900 rounded-3xl p-8 space-y-8 flex flex-col items-center">
                        <div className="w-full flex justify-between items-start">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Segments</h3>
                        </div>
                        <div className="relative w-48 h-48 rounded-full border-[1.5rem] border-zinc-900 flex items-center justify-center p-2">
                             {/* Mock Pie with Conic Gradient */}
                             <div className="absolute inset-0 rounded-full bg-[conic-gradient(#EAB308_0%_35%,#FDE047_35%_60%,#A16207_60%_80%,#713F12_80%_100%)]"></div>
                             <div className="absolute inset-[3.5rem] bg-black rounded-full shadow-inner flex items-center justify-center">
                                <ChartPie className="w-8 h-8 text-zinc-800" />
                             </div>
                        </div>
                        <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500 pt-4">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Payments</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-300"></span> Credit</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-800"></span> Savings</div>
                        </div>
                    </div>
                </div>
            </section>

             {/* Section 2: Funding */}
             <section className="space-y-8">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-300">2. Funding and investor sentiment</h2>
                <div className="text-zinc-400 text-lg leading-relaxed space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">2.1 Venture capital trends</h3>
                    <p>
                        African fintech funding contracted from the highs of 2021 but has rebounded modestly in 2024 and 2025. Key trends include a shift toward early-stage deals with strict capital efficiency requirements, a preference for infrastructure, compliance, and B2B models, increased participation from local institutional capital, and fewer mega-rounds balanced by more robust due diligence.
                    </p>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">2.2 M&A activities</h3>
                    <p>
                         Consolidation is accelerating in 2025 as scale becomes essential. Leading payments and lending players are acquiring KYC and AML platforms, agent network operators, and vertically integrated credit analytics firms. This wave of acquisitions is positioning Africa for a more stable and interoperable fintech ecosystem.
                    </p>
                </div>
            </section>

            {/* Section 3: Regional Insights */}
            <section className="space-y-8">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-300">3. Regional insights</h2>
                <div className="text-zinc-400 text-lg leading-relaxed space-y-6">
                    <h3 className="font-black text-zinc-200 uppercase tracking-widest text-sm italic">3.1 Nigeria</h3>
                    <p>Nigeria remains the continent's largest fintech hub, driven by deep mobile penetration, a thriving developer ecosystem, and expanding digital public infrastructure. The most active categories in 2025 are embedded finance, SME credit, consumer savings products, and cross-border payments.</p>
                    <h3 className="font-black text-zinc-200 uppercase tracking-widest text-sm italic">3.2 Kenya and East Africa</h3>
                    <p>Kenya continues to be a global benchmark for mobile money innovation. In 2025, the region is experiencing rapid advancement in merchant digitisation, green financing solutions, and agricultural fintech tailored to smallholder farmers.</p>
                </div>
            </section>

        </div>

        {/* Right Desktop Visual Column */}
        <div className="xl:col-span-4 space-y-12 h-fit xl:sticky xl:top-24">
            <div className="relative group rounded-[3rem] overflow-hidden border-2 border-zinc-900/50 p-2 bg-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2670&auto=format&fit=crop" 
                    alt="Fintech Concept" 
                    className="w-full h-auto rounded-[2.5rem] object-cover filter contrast-[1.1] grayscale hover:grayscale-0 transition-all duration-700" 
                />
            </div>

            <div className="bg-zinc-950/60 border border-zinc-900 rounded-[2.5rem] p-10 space-y-6 backdrop-blur-3xl shadow-2xl">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 border-b border-zinc-900 pb-4">Key Takeaways</h3>
                 <ul className="space-y-6">
                    {[
                        "Sector-wide shift to capital efficiency and profitability.",
                        "Increased consolidation through strategic M&A activities.",
                        "Dominance of local institutional capital in early-stage rounds.",
                        "Regulatory harmonisation easing cross-border operations."
                    ].map((item, i) => (
                        <li key={i} className="flex gap-4 group">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 group-hover:scale-125 transition-transform shrink-0"></div>
                            <p className="text-sm font-bold text-zinc-400 leading-relaxed group-hover:text-zinc-200 transition-colors uppercase tracking-tight">{item}</p>
                        </li>
                    ))}
                 </ul>
            </div>
            
            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-[1.5rem] transition-all transform active:scale-95 shadow-[0_15px_30px_rgba(234,179,8,0.15)] flex items-center justify-center gap-2 group">
                <span className="uppercase tracking-widest text-[11px]">Download Full PDF</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" weight="bold" />
            </button>
        </div>

      </div>

      {/* Recommended Content Footer */}
      <div className="bg-zinc-950 border-t border-zinc-900 py-32 px-4 overflow-hidden relative">
        <div className="absolute -left-1/4 -top-1/4 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="max-w-7xl mx-auto relative z-10">
            <h2 className="text-4xl font-black tracking-tighter mb-16 px-4">Continue Exploring</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {RELATED_REPORTS.map((rel, i) => (
                    <div key={i} className="group cursor-pointer">
                        <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-6 group-hover:border-yellow-500/40 group-hover:bg-zinc-900/80 transition-all">
                            <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center">
                                <img src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2670&auto=format&fit=crop" className="w-8 h-8 rounded-lg object-cover grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all"/>
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-zinc-300 group-hover:text-white transition-colors">{rel.title}</h4>
                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">{rel.date}</p>
                            </div>
                            <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3 font-medium">{rel.summary}</p>
                            <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-yellow-500 transition-colors">
                                Read More <CaretRight weight="bold" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

    </div>
  );
}
