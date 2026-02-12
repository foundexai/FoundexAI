"use client";

import { ShieldCheck, Lock, Eye, Database, Globe, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function PrivacyPage() {
  const lastUpdated = "February 12, 2026";

  const sections = [
    {
      title: "1. Data Collection",
      icon: Database,
      content: "We collect information that you contribute to the platform to facilitate investor matching. This includes name, email, company details, investment history, and startup business plans. We also collect technical data such as IP addresses and device identifiers to ensure platform security and performance.",
    },
    {
      title: "2. How We Use Data",
      icon: Eye,
      content: "Your data is primarily used to provide our AI-driven matching services. Investors use startup data to evaluate potential deals, and founders use investor data to identify funding opportunities. We do not sell your personal data to third-party advertisers.",
    },
    {
      title: "3. Data Protection",
      icon: Lock,
      iconColor: "text-green-500",
      content: "FoundexAI employs industry-standard encryption (AES-256) for data at rest and TLS for data in transit. We conduct regular security audits and maintain strict access controls to prevent unauthorized access to sensitive financial and personal information.",
    },
    {
      title: "4. Cookies & Tracking",
      icon: Globe,
      content: "We use essential cookies to manage authentication and user sessions. Analytical cookies help us understand how users interact with our features, enabling us to refine our AI models and user interface for a better fundraising experience.",
    },
    {
      title: "5. Your Rights",
      icon: ShieldCheck,
      iconColor: "text-blue-500",
      content: "Under GDPR and other international standards, you have the right to access, rectify, or delete your data. You can export your profile data at any time via the settings panel. For data deletion requests, please contact our privacy compliance team.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 bg-white/40 dark:bg-zinc-900/40 p-6 md:p-8 rounded-3xl border border-white/60 dark:border-zinc-800 backdrop-blur-xl">
        <Link 
            href="/dashboard/settings"
            className="w-fit p-3 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
            <ArrowLeft className="w-6 h-6" weight="bold" />
        </Link>
        <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                Privacy & Data Policy
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                Last Updated: {lastUpdated}
            </p>
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-12 font-medium">
            At FoundexAI, we recognize the sensitivity of the data you share. Our platform is built on trust, 
            and we are committed to being transparent about how your data is handled, stored, and protected.
        </p>

        <div className="space-y-8">
            {sections.map((section) => (
                <div key={section.title} className="p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                            <section.icon className={`w-5 h-5 ${section.iconColor || 'text-yellow-500'}`} weight="bold" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white m-0">
                            {section.title}
                        </h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed m-0">
                        {section.content}
                    </p>
                </div>
            ))}
        </div>

        <div className="mt-16 p-10 rounded-3xl bg-zinc-900 text-white dark:bg-white dark:text-black">
            <h3 className="text-2xl font-black mb-4">Questions or Concerns?</h3>
            <p className="text-zinc-400 dark:text-zinc-500 mb-8 font-medium">
                Our privacy team is here to help you understand our data practices. Contact us at 
                <span className="text-white dark:text-black font-bold mx-1 underline underline-offset-4">privacy@foundex.ai</span> 
                for any specific inquiries.
            </p>
            <div className="flex flex-wrap gap-4">
                <Link href="/dashboard/settings" className="px-6 py-3 rounded-xl bg-white/10 dark:bg-black/5 font-black text-sm hover:bg-white/20 dark:hover:bg-black/10 transition-colors">
                    Back to Settings
                </Link>
                <Link href="/dashboard/pricing" className="px-6 py-3 rounded-xl bg-yellow-400 text-black font-black text-sm hover:bg-yellow-500 transition-colors">
                    View Pricing
                </Link>
            </div>
        </div>
      </div>

      <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              FoundexAI &copy; {new Date().getFullYear()} &bull; Professional Data Protection
          </p>
      </div>
    </div>
  );
}
