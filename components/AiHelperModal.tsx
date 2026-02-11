"use client";
import { useState } from "react";
import { Sparkle, X } from "@phosphor-icons/react";

export default function AiHelperModal({
  field,
  onClose,
  onSave,
}: {
  field: string;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState("");

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md dark:bg-zinc-900 dark:border dark:border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">
            Mission Statement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>
        <p className="text-gray-600 mb-4 dark:text-gray-300">
          A mission statement is a short, clear summary that explains what an
          organisation does, who it serves, and why it exists.
        </p>
        <textarea
          className="w-full h-40 border border-gray-300 rounded-lg p-2 mb-4 dark:bg-black/50 dark:border-zinc-700 dark:text-white"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="To make urban logistics cleaner, smarter, and more efficient for businesses."
        />
        <div className="flex justify-between items-center">
          <button className="flex items-center space-x-2 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300">
            <Sparkle className="h-5 w-5" weight="bold" />
            <span>Ask Sophia</span>
          </button>
          <button
            onClick={handleSave}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
