"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CaretLeft,
  DownloadSimple,
  ArrowSquareOut,
  CircleNotch,
  FileText,
} from "@phosphor-icons/react";

function DocumentViewerContent() {
  const searchParams = useSearchParams();

  const url = searchParams.get("url");
  const name = searchParams.get("name");
  // const type = searchParams.get("type"); // Unused

  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;

    // Check if it's strictly a text file extension (Cloudinary URLs usually end with extension)
    // If it's a raw resource, it might be text, but let's be safe.
    // If the user created it via "Write New", we saved it as .txt.
    const isTextFile =
      url.toLowerCase().endsWith(".txt") || url.toLowerCase().endsWith(".md");

    if (isTextFile) {
      setLoading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load");
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch text content", err);
          // Fallback to iframe if text fetch fails? No, just show error or let iframe try.
          setTextContent(null);
          setLoading(false);
        });
    } else {
      // It's a PDF, Image, or DOC.
      setLoading(false);
    }
  }, [url]);

  if (!url) return <div>Invalid Document URL</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/documents"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-zinc-800"
          >
            <CaretLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" weight="bold" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 dark:text-white">
              <FileText className="w-4 h-4 text-gray-400" weight="bold" />
              {name || "Document Viewer"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download
            target="_blank"
            className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            <DownloadSimple className="w-4 h-4" weight="bold" />
            Download
          </a>
          <a
            href={url}
            target="_blank"
            className="hidden sm:flex px-4 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800 items-center gap-2 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <ArrowSquareOut className="w-4 h-4" weight="bold" />
            Open Original
          </a>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="grow overflow-hidden relative flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <CircleNotch className="w-8 h-8 text-gray-400 animate-spin" weight="bold" />
          </div>
        ) : textContent !== null ? (
          // Text Viewer (In-House Experience for Memos/Drafts)
          <div className="h-full overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
            <div className="bg-white p-6 md:p-12 min-h-full shadow-lg rounded-xl dark:bg-zinc-900 dark:text-gray-200">
              <pre className="whitespace-pre-wrap wrap-break-word font-sans text-sm md:text-base leading-relaxed text-gray-800 dark:text-gray-300 max-w-full">
                {textContent}
              </pre>
            </div>
          </div>
        ) : (
          // PDF/File Viewer via Iframe -> Using Google Docs Viewer for better compatibility with widespread formats if browser fails,
          // BUT for PDFs native viewer is best.
          // If it's a PDF, Cloudinary URL usually works in iframe.
          // Let's try native iframe first.
          <iframe
            src={url}
            className="w-full h-full border-none bg-gray-200 dark:bg-zinc-800"
            title="Document Viewer"
          />
        )}
      </div>
    </div>
  );
}

export default function DocumentViewerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><CircleNotch className="w-8 h-8 animate-spin text-gray-400" weight="bold" /></div>}>
      <DocumentViewerContent />
    </Suspense>
  );
}
