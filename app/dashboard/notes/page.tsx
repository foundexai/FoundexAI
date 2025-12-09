'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

const availableTags = ['Weekly', 'Monthly', 'Product', 'Business', 'Personal'];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: [] as string[] });

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
      setNotes(data.notes);
    }
  }

  async function addNote(e: any) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('/api/notes', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }, 
      body: JSON.stringify(newNote) 
    });
    setNewNote({ title: '', content: '', tags: [] });
    loadNotes();
  }

  async function deleteNote(id: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    loadNotes();
  }

  const handleTaggleTag = (tag: string) => {
    setNewNote(prev => ({...prev, tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]}));
  }

  return (
    <main className="w-full flex-1 p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notes</h1>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Note</h2>
          <form onSubmit={addNote}>
            <input 
              className="border border-gray-300 p-3 w-full mb-4 rounded-lg focus:ring-2 focus:ring-yellow-500 transition-shadow placeholder:text-gray-600 text-gray-800"
              placeholder="Note Title" 
              value={newNote.title} 
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} 
              required
            />
            <textarea 
              className="border border-gray-300 p-3 w-full mb-4 rounded-lg focus:ring-2 focus:ring-yellow-500 transition-shadow placeholder:text-gray-600 text-gray-800"
              placeholder="Content" 
              value={newNote.content} 
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} 
              required
            />
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTaggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      newNote.tags.includes(tag) 
                        ? 'bg-yellow-400 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <button 
              className="w-full bg-yellow-400 text-white p-3 rounded-lg hover:bg-yellow-500 transition-colors font-semibold"
              type="submit"
            >
              Add Note
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Note List</h2>
          <ul className="space-y-4">
            {notes.map((note) => (
              <li key={note._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{note.title}</h3>
                    <p className="text-gray-700 my-2">{note.content}</p>
                  </div>
                  <button 
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => deleteNote(note._id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-200 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}