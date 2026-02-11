"use client";
import { useState } from "react";
import { X, CircleNotch } from "@phosphor-icons/react";

export default function Onboarding({
  onComplete,
  onClose,
}: {
  onComplete: (name: string, idea: string) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState("");

  const handleNameSubmit = (name: string) => {
    onComplete(name, idea);
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all relative dark:bg-zinc-900 dark:border dark:border-zinc-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" weight="bold" />
        </button>
        {step === 1 && (
          <IdeaStep setIdea={setIdea} nextStep={() => setStep(2)} />
        )}
        {step === 2 && <NameStep idea={idea} onComplete={handleNameSubmit} />}
      </div>
    </div>
  );
}

const IdeaStep = ({
  setIdea,
  nextStep,
}: {
  setIdea: (idea: string) => void;
  nextStep: () => void;
}) => {
  const [text, setText] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIdea(text);
    nextStep();
  };

  return (
    <div className="w-full max-w-lg text-center mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
        What's Your Startup Idea?
      </h1>
      <p className="text-gray-500 mb-8 dark:text-gray-400">
        Let's start with the big picture. Describe your idea below.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-800 placeholder:text-gray-400 dark:bg-black/50 dark:border-zinc-700 dark:text-white dark:focus:ring-yellow-500/20"
          placeholder="e.g., A platform for connecting local artists with buyers."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button
          className="mt-6 bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors dark:text-black dark:bg-yellow-400 dark:hover:bg-yellow-500"
          type="submit"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

const NameStep = ({
  idea,
  onComplete,
}: {
  idea: string;
  onComplete: (name: string) => void;
}) => {
  const [name, setName] = useState("");
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
    <div className="w-full max-w-lg text-center mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
        Give Your Idea a Name
      </h1>
      <p className="text-gray-500 mb-8 dark:text-gray-400">
        Every great idea needs a name. What should we call it?
      </p>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-800 placeholder:text-gray-400 dark:bg-black/50 dark:border-zinc-700 dark:text-white dark:focus:ring-yellow-500/20"
          placeholder="e.g., ArtConnect"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button
          className="mt-6 bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto dark:text-black dark:bg-yellow-400 dark:hover:bg-yellow-500"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircleNotch className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-black" weight="bold" />
              Creating...
            </>
          ) : (
            "Create Startup"
          )}
        </button>
      </form>
    </div>
  );
};
