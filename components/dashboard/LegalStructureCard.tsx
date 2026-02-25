"use client";

import { useState, useEffect } from "react";
import { MagicWand, CircleNotch, Check, NotePencil, X, FloppyDiskBack } from "@phosphor-icons/react";
import { toast } from "sonner";

interface LegalStructureCardProps {
  startupId: string;
  location?: string;
  currentStructure?: string;
  details?: string;
  onUpdate: () => void;
}

export default function LegalStructureCard({
  startupId,
  location,
  currentStructure,
  details,
  onUpdate,
}: LegalStructureCardProps) {
  const [isDrafting, setIsDrafting] = useState(false);
  const [draft, setDraft] = useState(details || "");
  const [isEditing, setIsEditing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    setDraft(details || "");
  }, [details]);

  const saveStructure = async (content: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/startups/${startupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ legal_structure_details: content }),
    });
    if (res.ok) {
      onUpdate();
      toast.success("Legal structure saved");
    } else {
      throw new Error("Failed to save");
    }
  };

  const handleDraft = async () => {
    setIsDrafting(true);
    setAiSuggestion(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const newDraft = `For a startup based in ${location || "your region"}, we recommend establishing a ${currentStructure || "Private Limited Company"} structure. This provides liability protection and is standard for raising venture capital. Key steps include registration with local authorities and drafting a shareholder agreement.`;

      setAiSuggestion(newDraft);
      toast.success("Sophia generated a recommendation!");
    } catch (e) {
      toast.error("Failed to draft structure");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopySuggestion = () => {
    if (aiSuggestion) {
      setDraft(aiSuggestion);
      toast.success("Recommendation copied to editor");
    }
  };

  const handleManualSave = async () => {
    try {
      await saveStructure(draft);
      setIsEditing(false);
    } catch (e) {
      toast.error("Failed to save changes");
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/50 flex flex-col h-full dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Legal Structure
        </h3>

        {!isEditing && (
          <div className="flex gap-2">
            {draft && !isEditing && (
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1 dark:bg-green-900/30 dark:text-green-400">
                <Check className="w-3 h-3" weight="bold" />
                Saved
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grow">
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          {currentStructure ||
            (draft ? "Drafted Recommendation" : "Not defined yet")}
        </p>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-32 p-3 text-sm border rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none dark:bg-black/20 dark:border-zinc-700 dark:text-gray-200"
              placeholder="Detail your legal structure here..."
            />

            {/* Sophia AI Card */}
            <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 dark:bg-black/80 dark:border-zinc-800 relative overflow-hidden group">
              {aiSuggestion && (
                <div className="flex justify-end items-center mb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopySuggestion}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <NotePencil className="w-3.5 h-3.5" weight="bold" />
                      Apply
                    </button>
                    <button
                      onClick={handleDraft}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <div className={`w-3.5 h-3.5 ${isDrafting ? "animate-spin" : ""}`}>
                        <MagicWand weight="bold" />
                      </div>
                      Regenerate
                    </button>
                  </div>
                </div>
              )}

              {aiSuggestion ? (
                <div className="text-sm text-gray-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {aiSuggestion}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-xs mb-3">
                    Need help drafting your legal structure? Sophia can generate a professional recommendation for you.
                  </p>
                  <button
                    onClick={handleDraft}
                    disabled={isDrafting}
                    className="bg-yellow-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-yellow-600 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-yellow-500/20"
                  >
                    {isDrafting && <CircleNotch className="w-4 h-4 animate-spin" />}
                    {isDrafting ? "Consulting Sophia..." : "Generate Suggestion"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : draft ? (
          <div className="text-sm text-gray-700 leading-relaxed bg-white/50 p-3 rounded-xl border border-white/50 dark:bg-black/20 dark:text-gray-300 dark:border-white/5 whitespace-pre-wrap">
            {draft}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">
            No legal structure drafted. Click "AI Draft" to generate a
            recommendation.
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
        {!isEditing ? (
            <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors dark:bg-white/5 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-white/10"
            >
            Edit Legal Structure
            </button>
        ) : (
            <div className="flex gap-2">
                <button
                onClick={() => {
                  setIsEditing(false);
                  setDraft(details || "");
                  setAiSuggestion(null);
                }}
                className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold dark:bg-transparent dark:border-zinc-700 dark:text-gray-400"
                >
                Cancel
                </button>
                <button
                onClick={handleManualSave}
                className="flex-1 py-2 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-500/30"
                >
                Save Changes
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
