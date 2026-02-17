"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Trash } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

const availableTags = ["Weekly", "Monthly", "Product", "Business", "Personal"];

export default function NotesPage() {
  const { user, loading, token, activeStartupId } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user && activeStartupId) {
      loadNotes();
    } else if (user && !loading && !activeStartupId) {
        setIsLoading(false);
    }
  }, [user, loading, router, activeStartupId]);

  async function loadNotes() {
    if (!activeStartupId || !token) return;
    setIsLoading(true);
    try {
        const r = await fetch(`/api/notes?startup_id=${activeStartupId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });
        if (r.ok) {
        const data = await r.json();
        setNotes(data.notes);
        }
    } catch (e) {
        console.error("Failed to load notes", e);
    }
    setIsLoading(false);
  }

  async function addNote(e: any) {
    e.preventDefault();
    if (!activeStartupId || !token) return;
    
    try {
        await fetch("/api/notes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            ...newNote,
            startup_id: activeStartupId
        }),
        });
        setNewNote({ title: "", content: "", tags: [] });
        loadNotes();
    } catch (e) {
        console.error("Failed to add note", e);
    }
  }

  function deleteNote(id: string) {
    setDeleteNoteId(id);
  }

  async function confirmDeleteNote() {
    if (!deleteNoteId || !token) return;
    
    try {
        await fetch(`/api/notes/${deleteNoteId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });
        loadNotes();
    } catch (e) {
        console.error("Failed to delete note", e);
    }
    setDeleteNoteId(null);
  }

  const handleTaggleTag = (tag: string) => {
    setNewNote((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  if (loading || isLoading) {
    return (
      <main className="w-full flex-1 p-8 bg-gray-50 dark:bg-transparent">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-zinc-800" />
          <div className="glass-card p-6 rounded-2xl border border-white/50 h-64 dark:border-zinc-800"></div>
          <div className="glass-card p-6 rounded-2xl border border-white/50 h-96 dark:border-zinc-800"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-1 p-8 bg-gray-50 dark:bg-transparent">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight dark:text-white">
          Notes
        </h1>

        <div className="glass-card p-8 rounded-3xl border border-white/50 mb-8 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 mb-6 dark:text-white">
            Add New Note
          </h2>
          <form onSubmit={addNote}>
            <input
              className="border border-gray-200 bg-white/50 p-4 w-full mb-4 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-800 dark:bg-zinc-900/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-gray-500"
              placeholder="Note Title"
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
              required
            />
            <textarea
              className="border border-gray-200 bg-white/50 p-4 w-full mb-4 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-800 dark:bg-zinc-900/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-gray-500"
              placeholder="Content"
              value={newNote.content}
              onChange={(e) =>
                setNewNote({ ...newNote, content: e.target.value })
              }
              required
            />
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 dark:text-gray-400">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTaggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      newNote.tags.includes(tag)
                        ? "bg-yellow-400 text-white shadow-md shadow-yellow-400/30 dark:text-black"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="w-full bg-yellow-500 text-white p-4 rounded-xl hover:bg-yellow-600 transition-all font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/40 dark:text-black"
              type="submit"
            >
              Add Note
            </button>
          </form>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/50 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 mb-6 dark:text-white">
            Note List
          </h2>
          <ul className="space-y-4">
            {notes.map((note) => (
              <li
                key={note._id}
                className="p-6 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 hover:border-yellow-500/30 transition-all group dark:bg-zinc-900/40 dark:border-zinc-800"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 dark:text-white">
                      {note.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed dark:text-gray-300">
                      {note.content}
                    </p>
                  </div>
                  <button
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-red-900/20"
                    onClick={() => deleteNote(note._id)}
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gray-100/80 text-gray-600 border border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-medium dark:text-gray-600">
                  {new Date(note.created_at).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </p>
              </li>
            ))}
            {notes.length === 0 && (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                No notes found.
              </div>
            )}
          </ul>
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={confirmDeleteNote}
        title="Delete Note?"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
    </main>
  );
}
