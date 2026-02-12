"use client";

import { useState, useEffect } from "react";
import { MagicWand, CircleNotch, Plus, X, FloppyDiskBack } from "@phosphor-icons/react";
import { toast } from "sonner";

interface BusinessModelCardProps {
  startupId: string;
  sector?: string;
  selectedModels?: string[];
  onUpdate: () => void;
}

const COMMON_MODELS = [
  "Revenue Model",
  "Customer Segments",
  "B2B (Business-to-Business)",
  "Unique Value",
  "On-Demand Delivery Model",
  "Subscription",
  "Freemium",
  "Marketplace",
  "SaaS",
  "Direct to Consumer",
];

export default function BusinessModelCard({
  startupId,
  sector,
  selectedModels = [],
  onUpdate,
}: BusinessModelCardProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentModels, setCurrentModels] = useState<string[]>(selectedModels);

  useEffect(() => {
    setCurrentModels(selectedModels);
  }, [selectedModels]);

  const saveModels = async (models: string[]) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/startups/${startupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ business_models: models }),
    });
    if (res.ok) {
      onUpdate();
      toast.success("Business model updated");
    } else {
      throw new Error("Failed to save");
    }
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    // Simulate AI suggestion
    setTimeout(async () => {
      // Just pick random relevant models for now as a "suggestion"
      const suggestions = [
        "Revenue Model",
        "Customer Segments",
        "B2B (Business-to-Business)",
        "Unique Value",
      ];

      try {
        await saveModels(suggestions);
      } catch (e) {
        toast.error("Failed to apply suggestions");
      } finally {
        setIsSuggesting(false);
      }
    }, 1500);
  };

  const handleManualSave = async () => {
    try {
      await saveModels(currentModels);
      setIsEditing(false);
    } catch (e) {
      toast.error("Error saving models");
    }
  };

  const toggleModel = (model: string) => {
    if (currentModels.includes(model)) {
      setCurrentModels(currentModels.filter((m) => m !== model));
    } else {
      setCurrentModels([...currentModels, model]);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/50 flex flex-col h-full dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Business Model
        </h3>

        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentModels(selectedModels);
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-500 dark:hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleManualSave}
              className="p-1 hover:bg-green-100 rounded text-green-600 dark:hover:bg-green-900/20"
            >
              <FloppyDiskBack className="w-4 h-4" weight="bold" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="text-xs font-bold text-yellow-600 bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50 dark:bg-yellow-900/30 dark:text-yellow-400"
          >
            {isSuggesting ? (
              <CircleNotch className="w-3 h-3 animate-spin" weight="bold" />
            ) : (
              <MagicWand className="w-3 h-3" weight="bold" />
            )}
            AI Suggestion
          </button>
        )}
      </div>

      <div className="grow">
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          {isEditing
            ? "Select applicable models:"
            : `${selectedModels.length} models selected`}
        </p>

        {isEditing ? (
          <div className="flex flex-wrap gap-2">
            {COMMON_MODELS.map((model) => (
              <button
                key={model}
                onClick={() => toggleModel(model)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  currentModels.includes(model)
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50"
                    : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:border-zinc-800 dark:hover:bg-white/10"
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedModels.length > 0 ? (
              selectedModels.map((model, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-200/50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30"
                >
                  {model}
                </span>
              ))
            ) : (
              <div className="w-full text-center py-8 text-sm text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl dark:border-zinc-800">
                No models selected.
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-500 text-xs font-bold border border-gray-100 hover:bg-gray-100 transition-colors dark:bg-white/5 dark:text-gray-400 dark:border-zinc-800 dark:hover:bg-white/10"
            >
              <Plus className="w-3 h-3" weight="bold" />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
