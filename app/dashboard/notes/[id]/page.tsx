"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NoteEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (token) {
      fetchNote();
    }
  }, [id, token]);

  const fetchNote = async () => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
      } else {
        toast.error("Note not found");
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(note),
      });
      if (res.ok) {
        toast.success("Note saved");
      } else {
        toast.error("Failed to save");
      }
    } catch (e) {
      toast.error("Error saving note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete note?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Note deleted");
        router.push("/dashboard");
      }
    } catch (e) {
      toast.error("Error deleting note");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-black">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 dark:bg-zinc-900 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Note
          </button>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto p-8 grow flex flex-col">
        <input
          type="text"
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
          placeholder="Note Title"
          className="text-4xl font-black text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-300 mb-6 dark:text-white dark:placeholder-zinc-700"
        />

        <textarea
          value={note.content}
          onChange={(e) => setNote({ ...note, content: e.target.value })}
          placeholder="Start typing..."
          className="w-full grow bg-transparent border-none focus:outline-none text-lg text-gray-600 leading-relaxed resize-none dark:text-gray-300 dark:placeholder-zinc-700"
        />
      </div>
    </div>
  );
}
