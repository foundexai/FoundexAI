"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Trash, NotePencil, Plus, CircleNotch, BookOpen } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";

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
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
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
        toast.success("Note saved");
        loadNotes();
    } catch (e) {
        toast.error("Failed to save note");
        console.error("Failed to add note", e);
    } finally {
        setSubmitting(false);
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
        toast.success("Note deleted");
        loadNotes();
    } catch (e) {
        toast.error("Failed to delete note");
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
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-zinc-800" />
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 h-64 dark:bg-zinc-900 dark:border-zinc-800"></div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 h-96 dark:bg-zinc-900 dark:border-zinc-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
          <BookOpen className="w-6 h-6" weight="bold" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight dark:text-white">
            Notes
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Capture investor meeting notes, weekly updates, and product ideas.
          </p>
        </div>
      </div>

      {/* Add New Note Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200/80 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
            <NotePencil className="w-4 h-4" weight="bold" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Add New Note
          </h2>
        </div>

        <form onSubmit={addNote} className="space-y-4">
          <input
            className="border border-gray-200 bg-gray-50/50 p-3.5 w-full rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-sm font-semibold text-gray-800 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-gray-500 outline-none"
            placeholder="Note title"
            value={newNote.title}
            onChange={(e) =>
              setNewNote({ ...newNote, title: e.target.value })
            }
            required
          />
          <textarea
            rows={4}
            className="border border-gray-200 bg-gray-50/50 p-3.5 w-full rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-sm text-gray-800 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-gray-500 outline-none resize-none"
            placeholder="Write your note content..."
            value={newNote.content}
            onChange={(e) =>
              setNewNote({ ...newNote, content: e.target.value })
            }
            required
          />

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
              Tags
            </h3>
            {/* Apple Segmented Tag Selector */}
            <div className="-mx-1 px-1 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
              <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl border border-black/5 dark:border-white/5 gap-1 w-fit shrink-0 flex-wrap sm:flex-nowrap">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTaggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      newNote.tags.includes(tag)
                        ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xs"
                        : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.98]"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
              ) : (
                <Plus className="w-4 h-4" weight="bold" />
              )}
              <span>{submitting ? "Saving..." : "Save Note"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200/80 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Note List
          </h2>
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
            {notes.length} {notes.length === 1 ? "Note" : "Notes"}
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <NotePencil className="w-6 h-6" weight="bold" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                No notes yet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
                Your saved notes will appear here. Use them to track investor
                conversations, weekly product reviews, and team updates.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note._id}
                className="p-5 bg-gray-50/50 dark:bg-zinc-800/40 rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 hover:border-yellow-500/40 dark:hover:border-yellow-500/40 transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-gray-900 mb-2 dark:text-white truncate">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                  </div>
                  <button
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:text-zinc-600 dark:hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                    onClick={() => deleteNote(note._id)}
                    aria-label="Delete note"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gray-200/80 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-2.5 uppercase tracking-wider">
                  {new Date(note.created_at).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
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
    </div>
  );
}
