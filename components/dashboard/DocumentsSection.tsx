"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Plus, DotsThree, Clock } from "@phosphor-icons/react";
import { format } from "date-fns";

interface UploadedDoc {
  name: string;
  type: string;
  url: string;
  date: Date;
}

interface DocumentsSectionProps {
  documents?: UploadedDoc[];
}

export default function DocumentsSection({
  documents = [],
}: DocumentsSectionProps) {
  // Mock data if empty
  // Show only the 1 most recent document on the dashboard
  const displayDocs = (documents.length > 0 ? documents : [
    { name: "Pitch Deck v2.3", type: "deck", date: new Date(), url: "#" }
  ]).slice(0, 1);

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/50 h-full dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Documents
        </h3>
        <Link
          href="/dashboard/documents"
          className="text-gray-400 hover:text-gray-600 text-sm font-medium dark:text-gray-500 dark:hover:text-gray-300"
        >
          See all
        </Link>
      </div>

      <div className="space-y-4">
        {displayDocs.map((doc, i) => (
          <Link
            key={i}
            href={doc.url}
            target="_blank"
            className="group relative bg-black rounded-xl overflow-hidden aspect-2/1 flex items-center justify-center cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            {/* Placeholder Gradient Background mimicking a deck slide */}
            <div className="absolute inset-0 bg-linear-to-br from-gray-900 to-black opacity-80"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>

            <div className="relative z-10 text-center">
              <FileText className="w-8 h-8 text-white/80 mx-auto mb-2" weight="bold" />
              <h4 className="text-white font-bold text-lg tracking-tight">
                {doc.name}
              </h4>
              <div className="flex flex-col items-center gap-0.5 mt-1">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  {format(new Date(doc.date), "MMM d, yyyy")}
                </p>
                <div className="flex items-center gap-1 text-white/40 text-[9px] font-medium">
                  <Clock className="w-2.5 h-2.5" weight="bold" />
                  {format(new Date(doc.date), "h:mm a")}
                </div>
              </div>
            </div>

            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 rounded-full bg-black/50 text-white hover:bg-black">
                <DotsThree className="w-4 h-4" weight="bold" />
              </button>
            </div>
          </Link>
        ))}

        <Link href="/dashboard/documents/new">
          <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center justify-center gap-1 dark:border-zinc-700 dark:hover:bg-white/5 dark:text-gray-500 cursor-pointer">
            <Plus className="w-6 h-6" weight="bold" />
            <span>Add New Document</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
