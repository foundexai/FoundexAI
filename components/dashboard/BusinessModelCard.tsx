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
  "B2B (Business-to-Business)",
  "B2C (Business-to-Consumer)",
  "SaaS",
  "Subscription",
  "Marketplace",
  "Freemium",
  "Direct to Consumer",
  "On-Demand Delivery Model",
  "Revenue Model",
  "Customer Segments",
  "Unique Value",
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
  const [customModel, setCustomModel] = useState("");

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

  const handleAddCustomModel = () => {
    if (customModel.trim() && !currentModels.includes(customModel.trim())) {
      setCurrentModels([...currentModels, customModel.trim()]);
      setCustomModel("");
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/50 flex flex-col h-full dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Business Model
        </h3>
        
        {!isEditing && (
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
            ? "Custom models or select from tags:"
            : `${selectedModels.length} models selected`}
        </p>

        {isEditing ? (
          <div className="space-y-4">
            {/* Custom Model Input */}
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomModel())}
                    placeholder="Type a custom model..."
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-white/10 outline-none dark:bg-black/50 dark:border-zinc-800 dark:text-gray-200"
                />
                <button 
                    onClick={handleAddCustomModel}
                    disabled={!customModel.trim()}
                    className="p-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                >
                    <Plus className="w-4 h-4" weight="bold" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {/* Custom tags currently in currentModels but not in COMMON_MODELS */}
                {currentModels.filter(m => !COMMON_MODELS.includes(m)).map((model) => (
                    <button
                        key={model}
                        onClick={() => toggleModel(model)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-900/50"
                    >
                        {model}
                        <X className="w-3 h-3" weight="bold" />
                    </button>
                ))}
                
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
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
        {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors dark:bg-white/5 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Edit Business Model
            </button>
        ) : (
             <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentModels(selectedModels);
                setCustomModel("");
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
