"use client";
import { useState } from 'react';

const IdeaStep = ({ setIdea, nextStep }: { setIdea: (idea: string) => void, nextStep: () => void }) => {
  const [text, setText] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIdea(text);
    nextStep();
  };

  return (
    <div className="w-full max-w-lg text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">What's Your Startup Idea?</h1>
      <p className="text-gray-500 mb-8">Let's start with the big picture. Describe your idea below.</p>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-800 placeholder:text-gray-400"
          placeholder="e.g., A platform for connecting local artists with buyers."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button
          className="mt-6 bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
          type="submit"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

const NameStep = ({ idea, onComplete }: { idea: string, onComplete: (name: string) => void }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      onComplete(name);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Give Your Idea a Name</h1>
      <p className="text-gray-500 mb-8">Every great idea needs a name. What should we call it?</p>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-800 placeholder:text-gray-400"
          placeholder="e.g., ArtConnect"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button
          className="mt-6 bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create Startup'
          )}
        </button>
      </form>
    </div>
  );
};

export default function Onboarding({ onComplete, onClose }: { onComplete: (name: string, idea: string) => void, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState('');

  const handleNameSubmit = (name: string) => {
    onComplete(name, idea);
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {step === 1 && <IdeaStep setIdea={setIdea} nextStep={() => setStep(2)} />}
        {step === 2 && <NameStep idea={idea} onComplete={handleNameSubmit} />}
      </div>
    </div>
  );
}