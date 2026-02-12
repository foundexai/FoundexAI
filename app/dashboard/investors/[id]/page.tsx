"use client";

import { MOCK_INVESTORS } from "@/lib/data";
import {
  CaretLeft,
  MapPin,
  GlobeSimple,
  Buildings,
  CheckCircle,
  TrendUp,
  EnvelopeSimple,
  CircleNotch,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Investor {
  id: string;
  name: string;
  type: string;
  focus: string[];
  location: string;
  logoInitial: string;
  logoColor: string;
  description: string;
  investmentRange?: string;
  website?: string;
}

export default function InvestorDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuth();

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchInvestor() {
      setLoading(true);
      setError(false);

      // 1. Try finding in Mock Data first
      const mockInvestor = MOCK_INVESTORS.find((inv) => inv.id === id);
      if (mockInvestor) {
        setInvestor(mockInvestor);
        setLoading(false);
        return;
      }

      // 2. If not in mock, try fetching from API
      try {
        const res = await fetch(`/api/investors/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.investor) {
            setInvestor(data.investor);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchInvestor();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch className="w-8 h-8 animate-spin text-yellow-500" weight="bold" />
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Investor Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          The investor profile you are looking for does not exist.
        </p>
        <Link
          href="/dashboard/investors"
          className="text-yellow-600 font-semibold hover:underline"
        >
          Back to Database
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button */}
      <Link
        href="/dashboard/investors"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors group dark:text-gray-400 dark:hover:text-gray-200"
      >
        <CaretLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" weight="bold" />
        Back to Investors
      </Link>

      {/* Header Card */}
      <div className="glass-card rounded-3xl p-8 mb-8 border border-white/50 relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-gray-100 to-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 dark:from-zinc-800 dark:to-zinc-900 dark:opacity-30"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div
            className="w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center bg-yellow-400 shadow-xl shrink-0 border-4 border-white/50 dark:border-white/10"
          >
          </div>

          <div className="grow">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight dark:text-white">
                {investor.name}
              </h1>
              <span className="px-3 py-1 rounded-full bg-white/60 border border-white/50 text-xs font-bold uppercase tracking-wider text-gray-700 backdrop-blur-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
                {investor.type}
              </span>
            </div>

            <div className="flex items-center text-gray-500 mb-6 font-medium dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-1.5" weight="bold" />
              {investor.location}
            </div>

            <div className="flex flex-wrap gap-4">
              {investor.website && (
                <a
                  href={`https://${investor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  <GlobeSimple className="w-4 h-4 mr-2 text-gray-400" weight="bold" />
                  Visit Website
                </a>
              )}
              <button className="inline-flex items-center px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                <EnvelopeSimple className="w-4 h-4 mr-2" weight="bold" />
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* About Section */}
          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
              About
            </h3>
            <p className="text-gray-600 leading-relaxed text-md dark:text-gray-300">
              {investor.description}
            </p>
          </section>

          {/* Focus Areas */}
          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 dark:text-white">
              Investment Focus
            </h3>
            <div className="flex flex-wrap gap-3">
              {investor.focus.map((tag) => (
                <div
                  key={tag}
                  className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-semibold flex items-center gap-2 dark:bg-white/5 dark:border-white/10 dark:text-gray-300"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" weight="bold" />
                  {tag}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <div className="bg-linear-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 border border-yellow-100 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-900/30">
            <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-4 dark:text-yellow-500">
              Investment Range
            </h4>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {investor.investmentRange}
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium dark:text-gray-400">
              Typical check size per deal
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm dark:bg-zinc-900/60 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Portfolio Highlights
            </h4>
            <div className="space-y-3">
              {["Paystack", "Flutterwave", "Andela"].map((company) => (
                <div
                  key={company}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group dark:hover:bg-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all shrink-0">
                  </div>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {company}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
