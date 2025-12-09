'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, ArrowRight } from 'lucide-react';

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

const tagColors: { [key: string]: string } = {
  Weekly: 'bg-green-100 text-green-800',
  Monthly: 'bg-blue-100 text-blue-800',
  Product: 'bg-purple-100 text-purple-800',
  Business: 'bg-yellow-100 text-yellow-800',
  Personal: 'bg-pink-100 text-pink-800',
};

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const r = await fetch('/api/notes', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (r.ok) {
      const data = await r.json();
      setNotes(data.notes.slice(0, 3)); // Show only 3 notes
    }
  }

  async function handleDelete(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (confirm('Are you sure you want to delete this note?')) {
      const r = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (r.ok) {
        loadNotes();
      }
    }
  }

  return (
    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Notes</h2>
        <Link href="/dashboard/notes">
          <span className="text-yellow-600 hover:text-yellow-800 flex items-center gap-1">
            View All
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex flex-wrap gap-2 mb-2">
              {note.tags.map((tag) => (
                <span key={tag} className={`px-2 py-0.5 text-xs font-medium rounded-md ${tagColors[tag] || 'bg-gray-100 text-gray-800'}`}>
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{note.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2 flex-grow">{note.content}</p>
            <div className="flex justify-between items-center mt-auto">
              <p className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              <button onClick={() => handleDelete(note._id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}