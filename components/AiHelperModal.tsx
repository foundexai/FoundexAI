"use client";
import { useState } from 'react';

export default function AiHelperModal({ field, onClose, onSave }: { field: string, onClose: () => void, onSave: (content: string) => void }) {
  const [content, setContent] = useState('');

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Mission Statement</h2>
          <button onClick={onClose} className="text-gray-500">&times;</button>
        </div>
        <p className="text-gray-600 mb-4">A mission statement is a short, clear summary that explains what an organisation does, who it serves, and why it exists.</p>
        <textarea 
          className="w-full h-40 border border-gray-300 rounded-lg p-2 mb-4"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="To make urban logistics cleaner, smarter, and more efficient for businesses."
        />
        <div className="flex justify-between items-center">
          <button className="flex items-center space-x-2 text-yellow-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 9.586 7.707 7.293a1 1 0 00-1.414 1.414L8.586 11l-2.293 2.293a1 1 0 001.414 1.414L10 12.414l2.293 2.293a1 1 0 001.414-1.414L11.414 11l2.293-2.293z" clipRule="evenodd" /></svg>
            <span>Ask Sophia</span>
          </button>
          <button onClick={handleSave} className="bg-black text-white px-4 py-2 rounded-lg">Save</button>
        </div>
      </div>
    </div>
  );
}