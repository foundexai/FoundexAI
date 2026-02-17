"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash, ArrowRight, Note, Calendar, ArrowUpRight, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

const tagColors: { [key: string]: string } = {
  Weekly:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  Monthly: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Product:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  Business:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  Personal: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
};

export default function NotesList({ startupId }: { startupId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [startupId]);

  async function loadNotes() {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    const r = await fetch(`/api/notes?startup_id=${startupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (r.ok) {
      const data = await r.json();
      setNotes(data.notes.slice(0, 2)); // Show only 2 notes
    }
    setIsLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const r = await fetch(`/api/notes/${deleteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (r.ok) {
      loadNotes();
    }
    setDeleteId(null);
  }

  async function handleAddNote() {
    if (!newNoteContent.trim()) return;
    setIsAdding(true);
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                startup_id: startupId,
                title: "Quick Note", // Default title for inline add
                content: newNoteContent,
                tags: ["Quick"], // Default tag
            }),
        });
        if (res.ok) {
            setNewNoteContent("");
            loadNotes();
            toast.success("Note added successfully");
        }
    } catch (e) {
        toast.error("Failed to add note");
    } finally {
        setIsAdding(false);
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-6 rounded-3xl border border-white/50 flex flex-col h-full dark:bg-zinc-900/60 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Notes
          </h2>
          <Link href="/dashboard/notes">
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl dark:hover:bg-white/10 dark:hover:text-gray-300 flex items-center gap-1">
                <ArrowUpRight className="h-5 w-5" weight="bold" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grow">
          {notes.length === 0 ? (
            <div className="col-span-2 text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl dark:border-zinc-800">
              <p className="text-gray-400 text-sm dark:text-gray-500">
                No notes found. Create your first note!
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <Link
                key={note._id}
                href={`/dashboard/notes/${note._id}`}
                className="group relative"
              >
                <div className="bg-gray-50 hover:bg-white p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col group-hover:-translate-y-1 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:border-zinc-700/50 dark:hover:border-zinc-700">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${
                          tagColors[tag] ||
                          "bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-300"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
                    {note.title}
                  </h3>

                  <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed dark:text-gray-400 grow">
                    {note.content}
                  </p>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200/50 dark:border-white/5">
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" weight="bold" />
                      {note.created_at
                        ? new Date(note.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "Unknown"}
                    </p>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(note._id);
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                    >
                      <Trash weight="bold" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="relative">
                <input
                    type="text"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Type a quick note..."
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-yellow-300 outline-none transition-all dark:bg-white/5 dark:border-zinc-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-white/10"
                    disabled={isAdding}
                />
                <button 
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim() || isAdding}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-500/20 cursor-pointer"
                >
                    {isAdding ? <CircleNotch className="w-4 h-4 animate-spin" weight="bold" /> : <ArrowRight className="w-4 h-4" weight="bold" />}
                </button>
            </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
    </>
  );
}
