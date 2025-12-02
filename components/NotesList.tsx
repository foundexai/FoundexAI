"use client";
import { useState, useEffect } from "react";

export default function NotesList() {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    const r = await fetch('/api/notes');
    if (r.ok) {
      const data = await r.json();
      setNotes(data.notes);
    }
  }

  async function addNote(e: any) {
    e.preventDefault();
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNote) });
    setNewNote({ title: "", content: "" });
    loadNotes();
  }

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h2 className="text-xl font-bold mb-2">Notes</h2>
      <form onSubmit={addNote} className="mb-4">
        <input className="border p-2 w-full mb-2" placeholder="Note Title" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} />
        <textarea className="border p-2 w-full mb-2" placeholder="Content" value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} />
        <button className="bg-green-500 text-white p-2 rounded" type="submit">Add Note</button>
      </form>
      <ul>
        {notes.map((note) => (
          <li key={note._id} className="mb-4">
            <h3 className="font-bold">{note.title}</h3>
            <p>{note.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}