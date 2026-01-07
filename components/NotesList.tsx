"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

const tagColors: { [key: string]: string } = {
  Weekly: "bg-green-100 text-green-800",
  Monthly: "bg-blue-100 text-blue-800",
  Product: "bg-purple-100 text-purple-800",
  Business: "bg-yellow-100 text-yellow-800",
  Personal: "bg-pink-100 text-pink-800",
};

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    const r = await fetch("/api/notes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (r.ok) {
      const data = await r.json();
      setNotes(data.notes.slice(0, 3)); // Show only 3 notes
    }
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (confirm("Are you sure you want to delete this note?")) {
      const r = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (r.ok) {
        loadNotes();
      }
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card bg-yellow-50/50 border-yellow-100 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32 bg-yellow-200/50" />
          <Skeleton className="h-4 w-20 bg-yellow-200/50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-32 w-full rounded-xl bg-yellow-200/30"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      id="notes"
      className="glass-card bg-yellow-50/40 border-yellow-100/50 p-6 rounded-2xl relative overflow-hidden backdrop-blur-sm"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ArrowRight className="w-32 h-32 text-yellow-900" />
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Recent Notes
        </h2>
        <Link href="/dashboard/notes">
          <span className="text-yellow-600 hover:text-yellow-800 flex items-center gap-1 text-sm font-semibold transition-colors px-3 py-1.5 rounded-full hover:bg-yellow-100/50">
            View All
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {notes.length === 0 ? (
          <div className="col-span-3 text-center py-10">
            <p className="text-gray-400 text-sm">No notes yet.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="bg-white/60 hover:bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-yellow-100/50 flex flex-col hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                      tagColors[tag] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="font-bold text-gray-800 mb-2 truncate">
                {note.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4 grow leading-relaxed">
                {note.content}
              </p>
              <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100/50">
                <p className="text-xs text-gray-400 font-medium">
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <button
                  onClick={() => handleDelete(note._id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
