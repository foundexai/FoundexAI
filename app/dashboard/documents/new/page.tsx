"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CaretLeft,
  UploadSimple,
  FileText,
  CircleNotch,
  NotePencil,
  FloppyDiskBack,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NewDocumentPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<"upload" | "write">("upload");

  // Upload State
  const [file, setFile] = useState<File | null>(null);

  // Write State
  const [content, setContent] = useState("");

  // Shared State
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("deck");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDocName(e.target.files[0].name.split(".")[0]);
    }
  };

  const uploadFileToCloudinary = async (fileToUpload: File) => {
    const formData = new FormData();
    formData.append("file", fileToUpload);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const saveDocumentMetadata = async (url: string) => {
    // Fetch Startup ID first
    const startupsRes = await fetch("/api/startups", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const startupsData = await startupsRes.json();
    const startup = startupsData.startups?.[0];

    if (!startup) throw new Error("No startup profile found");

    const newDoc = {
      name: docName || "Untitled Document",
      type: docType,
      url: url,
      date: new Date(),
    };

    const currentDocs = startup.documents || [];
    const updatedDocs = [...currentDocs, newDoc];

    await fetch(`/api/startups/${startup._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documents: updatedDocs }),
    });
  };

  const handleProcess = async () => {
    if (activeTab === "upload" && !file) return;
    if (activeTab === "write" && !content) return;

    setUploading(true);

    try {
      let finalFile = file;

      // If writing, convert text to file
      if (activeTab === "write") {
        const blob = new Blob([content], { type: "text/plain" });
        finalFile = new File([blob], `${docName || "draft"}.txt`, {
          type: "text/plain",
        });
      }

      if (!finalFile) throw new Error("No file to upload");

      // 1. Upload to Cloudinary
      const secureUrl = await uploadFileToCloudinary(finalFile);

      // 2. Save Metadata
      await saveDocumentMetadata(secureUrl);

      toast.success("Document saved successfully!");
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      toast.error(
        "Failed to save document. Check your connection or API keys.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-black">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center sticky top-0 z-10 dark:bg-zinc-900 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors dark:text-gray-400 dark:hover:text-white"
        >
          <CaretLeft className="w-5 h-5" weight="bold" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 py-8 lg:p-8 grow flex flex-col">
        <h1 className="text-3xl font-black text-gray-900 mb-6 dark:text-white">
          Add Document
        </h1>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-200 rounded-xl mb-8 w-fit dark:bg-zinc-800">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "upload" ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
          >
            <UploadSimple className="w-4 h-4" weight="bold" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab("write")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "write" ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
          >
            <NotePencil className="w-4 h-4" weight="bold" />
            Write New
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100/50 dark:bg-zinc-900 dark:border-zinc-800 grow flex flex-col">
          <div className="space-y-6 grow flex flex-col">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
                Document Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {["deck", "financials", "legal", "memo", "other"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDocType(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all ${
                      docType === t
                        ? "bg-black text-white border-black dark:bg-white dark:text-black"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-black dark:border-zinc-700 dark:text-gray-400 dark:hover:bg-white/5"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
                Document Name
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder={
                  activeTab === "upload"
                    ? "e.g. Pitch Deck Q1 2026"
                    : "e.g. Investment Memo Draft"
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-black focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            {activeTab === "upload" ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative grow dark:border-zinc-700 dark:hover:bg-zinc-800/50 min-h-[150px]">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                />
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 dark:bg-zinc-800">
                  {file ? (
                    <FileText className="w-8 h-8 text-blue-600" weight="bold" />
                  ) : (
                    <UploadSimple className="w-8 h-8 text-gray-400" weight="bold" />
                  )}
                </div>
                {file ? (
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, PPT, DOC up to 10MB
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grow flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2 dark:text-gray-300">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your document here..."
                  className="w-full grow p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-black focus:outline-none resize-none min-h-[300px] leading-relaxed dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                />
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={
                uploading || (activeTab === "upload" ? !file : !content)
              }
              className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {uploading ? (
                <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
              ) : activeTab === "upload" ? (
                <UploadSimple className="w-5 h-5" weight="bold" />
              ) : (
                <FloppyDiskBack className="w-5 h-5" weight="bold" />
              )}
              {uploading
                ? "Processing..."
                : activeTab === "upload"
                  ? "Upload Document"
                  : "Save Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
