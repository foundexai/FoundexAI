"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Microphone,
  MicrophoneSlash,
  PaperPlaneTilt,
  Sparkle,
  CircleNotch,
  ArrowCounterClockwise,
  CheckCircle,
  WarningCircle,
  TrendUp,
  Target,
  ShieldCheck,
  Lightbulb,
  Copy,
  ChatCircleDots,
  UsersThree,
  CaretRight,
  Waveform,
  FileText,
  CaretDown,
  SpeakerHigh,
  SpeakerSlash,
  Play,
  Stop,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface VCPersona {
  name: string;
  firm: string;
  title: string;
  style: string;
  avatarColor: string;
  badge: string;
}

interface Scorecard {
  clarityScore: number;
  defensibilityScore: number;
  convictionScore: number;
  overallScore: number;
  verdict: string;
  strengths: string[];
  redFlags: string[];
  improvedRebuttal: string;
  coFounderAdvice: string;
}

interface PitchTurn {
  id: string;
  question: string;
  category: string;
  vcContext?: string;
  suggestedTalkingPoints?: string[];
  founderAnswer?: string;
  scorecard?: Scorecard;
  timestamp: string;
}

const VC_PERSONAS_LIST = [
  {
    id: "tier1_vc",
    name: "Alex Vance",
    firm: "Benchmark Peak Capital",
    title: "General Partner",
    badge: "Tier-1 Hardball VC",
    description: "Skeptical, tests conviction, probes moats and CAC payback.",
    gradient: "from-amber-500 to-red-600",
  },
  {
    id: "quant_hawk",
    name: "Elena Rostova",
    firm: "Metric Horizon Ventures",
    title: "Growth Partner",
    badge: "Metrics Hawk VC",
    description: "Zeroes in on unit economics, churn rate, and net dollar retention.",
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    id: "angel_visionary",
    name: "Marcus Chen",
    firm: "First Spark Syndicate",
    title: "Super Angel",
    badge: "Founder-Friendly Angel",
    description: "Evaluates founder-market fit, 'earned secrets', and 10x differentiation.",
    gradient: "from-emerald-500 to-teal-700",
  },
  {
    id: "corporate_vc",
    name: "Sarah Jenkins",
    firm: "Apex Corporate Ventures",
    title: "Managing Director",
    badge: "Strategic Corporate VC",
    description: "Probes enterprise sales cycles, regulatory moats, and integration lock-in.",
    gradient: "from-purple-600 to-fuchsia-800",
  },
];

const TOPIC_CHIPS = [
  { id: "general", label: "Full VC Interrogation" },
  { id: "unit_economics", label: "Unit Economics & CAC" },
  { id: "defensibility", label: "Moats & Defensibility" },
  { id: "market_size", label: "Market Sizing & TAM" },
  { id: "gtm_growth", label: "GTM & Sales Pipeline" },
];

export default function PitchStudioPage() {
  const { token, activeStartupId } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState("tier1_vc");
  const [selectedTopic, setSelectedTopic] = useState("general");

  const [turns, setTurns] = useState<PitchTurn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PitchTurn | null>(null);
  const [founderAnswer, setFounderAnswer] = useState("");

  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setFounderAnswer(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const vocalizeQuestion = (text: string, personaId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.info("Speech synthesis is not supported on this browser.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter((v) => v.lang.startsWith("en"));

      // Configure timbre, rate, pitch per persona
      if (personaId === "tier1_vc") {
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        const v = englishVoices.find((v) => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("alex"));
        if (v) utterance.voice = v;
      } else if (personaId === "quant_hawk") {
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        const v = englishVoices.find((v) => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("victoria"));
        if (v) utterance.voice = v;
      } else if (personaId === "angel_visionary") {
        utterance.rate = 1.08;
        utterance.pitch = 1.1;
        const v = englishVoices.find((v) => v.name.toLowerCase().includes("daniel") || v.name.toLowerCase().includes("guy"));
        if (v) utterance.voice = v;
      } else if (personaId === "corporate_vc") {
        utterance.rate = 0.92;
        utterance.pitch = 0.95;
        const v = englishVoices.find((v) => v.name.toLowerCase().includes("karen") || v.name.toLowerCase().includes("serena"));
        if (v) utterance.voice = v;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Please type your response.");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info("Microphone stopped.");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening... Speak your pitch clearly.");
      } catch (err) {
        console.error("Speech start error:", err);
      }
    }
  };

  // Generate new simulated VC question
  const fetchNextQuestion = async (existingTurns: PitchTurn[] = turns) => {
    if (!token) return;
    setIsLoadingQuestion(true);
    try {
      const previousTurnsFormatted = existingTurns.map((t) => [
        { role: "vc", content: t.question },
        ...(t.founderAnswer ? [{ role: "founder", content: t.founderAnswer }] : []),
      ]).flat();

      const res = await fetch("/api/ai/pitch-simulator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-startup-id": activeStartupId || "",
        },
        body: JSON.stringify({
          persona: selectedPersona,
          topic: selectedTopic,
          previousTurns: previousTurnsFormatted,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate simulated question");
      const data = await res.json();

      const newTurn: PitchTurn = {
        id: `turn_${Date.now()}`,
        question: data.question,
        category: data.category,
        vcContext: data.vcContext,
        suggestedTalkingPoints: data.suggestedTalkingPoints,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setCurrentTurn(newTurn);
      setFounderAnswer("");

      if (autoVoice) {
        setTimeout(() => vocalizeQuestion(data.question, selectedPersona), 350);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to contact VC Pitch Simulator");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Submit founder's answer to the automated scoring engine
  const handleScoreAnswer = async () => {
    if (!founderAnswer.trim() || !currentTurn || !token) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsScoring(true);
    try {
      const res = await fetch("/api/ai/pitch-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-startup-id": activeStartupId || "",
        },
        body: JSON.stringify({
          question: currentTurn.question,
          founderAnswer,
          persona: selectedPersona,
          category: currentTurn.category,
        }),
      });

      if (!res.ok) throw new Error("Scoring engine returned an error");
      const data = await res.json();

      const completedTurn: PitchTurn = {
        ...currentTurn,
        founderAnswer,
        scorecard: data.scorecard,
      };

      const updatedHistory = [completedTurn, ...turns];
      setTurns(updatedHistory);
      setCurrentTurn(completedTurn);
      toast.success("Rebuttal evaluated! Scorecard generated.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to score pitch rebuttal");
    } finally {
      setIsScoring(false);
    }
  };

  // Start new practice session
  const handleStartSession = () => {
    setTurns([]);
    setCurrentTurn(null);
    fetchNextQuestion([]);
  };

  const activePersonaObj = VC_PERSONAS_LIST.find((p) => p.id === selectedPersona) || VC_PERSONAS_LIST[0];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200/50 dark:border-zinc-800/50 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-black">
              <Microphone className="w-6 h-6" weight="bold" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
                AI Pitch Practice Studio
                <span className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-xs font-mono font-bold rounded-lg border border-yellow-400/30">
                  AI Co-Founder
                </span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Stress-test your pitch against simulated Tier-1 VCs with real-time speech rebuttal scoring.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartSession}
          disabled={isLoadingQuestion}
          className="px-5 py-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 w-full sm:w-auto shrink-0"
        >
          {isLoadingQuestion ? (
            <CircleNotch className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkle className="w-4 h-4 text-yellow-400 dark:text-yellow-600" weight="fill" />
          )}
          <span>{turns.length > 0 || currentTurn ? "Restart Pitch Session" : "Start Pitch Session"}</span>
        </button>
      </div>

      {/* VC Persona & Topic Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {VC_PERSONAS_LIST.map((persona) => {
          const isSelected = selectedPersona === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => setSelectedPersona(persona.id)}
              className={cn(
                "p-4 rounded-3xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer",
                isSelected
                  ? "bg-white dark:bg-zinc-900 border-yellow-500 ring-2 ring-yellow-500/20 shadow-lg"
                  : "bg-white/60 dark:bg-zinc-900/50 border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-8 h-8 rounded-full bg-gradient-to-tr text-white flex items-center justify-center text-xs font-black shadow-xs", persona.gradient)}>
                    {persona.name.charAt(0)}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    {persona.badge}
                  </span>
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  {persona.name}
                </h3>
                <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500">
                  {persona.firm}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-snug">
                  {persona.description}
                </p>
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-yellow-600 dark:text-yellow-400">
                  <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                  <span>Active Interrogator</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Focus Topics Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 thin-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0 mr-1">
          Topic Focus:
        </span>
        {TOPIC_CHIPS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopic(topic.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              selectedTopic === topic.id
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            )}
          >
            {topic.label}
          </button>
        ))}
      </div>

      {/* Main Pitch Simulator Arena */}
      {!currentTurn && !isLoadingQuestion ? (
        <div className="bg-white/80 dark:bg-zinc-900/60 p-8 sm:p-12 rounded-[2.5rem] border border-gray-200/80 dark:border-zinc-800 text-center space-y-6 shadow-sm backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8" weight="bold" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Ready for the Hot Seat?
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Select your VC personality above and begin. You can speak your pitch using your microphone or type your response to receive instant scores and golden rebuttals.
            </p>
          </div>
          <button
            onClick={handleStartSession}
            className="px-8 py-3.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-black rounded-2xl transition-all inline-flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sparkle className="w-4 h-4 text-yellow-400 dark:text-yellow-600" weight="fill" />
            <span>Launch Pitch Drill</span>
          </button>
        </div>
      ) : isLoadingQuestion ? (
        <div className="bg-white dark:bg-zinc-900/60 p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-1.5 grow">
              <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-zinc-800 rounded-md" />
              <Skeleton className="h-3 w-64 bg-gray-200 dark:bg-zinc-800 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-20 w-full bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active VC Question Card */}
          <div className="bg-white dark:bg-zinc-900/80 p-6 sm:p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-zinc-800 shadow-md space-y-6 relative overflow-hidden backdrop-blur-xl">
            {/* Top VC Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full bg-gradient-to-tr text-white flex items-center justify-center text-sm font-black shadow-xs shrink-0", activePersonaObj.gradient)}>
                  {activePersonaObj.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      {activePersonaObj.name}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">
                      • {activePersonaObj.firm}
                    </span>
                  </div>
                  <p className="text-[11px] text-yellow-600 dark:text-yellow-400 font-mono font-bold">
                    Category: {currentTurn?.category}
                  </p>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else if (currentTurn?.question) {
                      vocalizeQuestion(currentTurn.question, selectedPersona);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
                    isSpeaking
                      ? "bg-yellow-500 text-black border-yellow-400 animate-pulse shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700"
                  )}
                >
                  {isSpeaking ? (
                    <>
                      <SpeakerHigh className="w-4 h-4" weight="fill" />
                      <span>Speaking VC...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" weight="fill" />
                      <span>Listen to Voice</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAutoVoice(!autoVoice)}
                  title={autoVoice ? "Auto-play voice is ON" : "Auto-play voice is OFF"}
                  className={cn(
                    "p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    autoVoice
                      ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-300/60 dark:border-yellow-900/50"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-400 border-gray-200 dark:border-zinc-700"
                  )}
                >
                  {autoVoice ? (
                    <SpeakerHigh className="w-4 h-4" />
                  ) : (
                    <SpeakerSlash className="w-4 h-4" />
                  )}
                </button>

                <span className="text-[10px] font-mono font-bold text-gray-400 ml-1">
                  {currentTurn?.timestamp}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <p className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-relaxed">
                "{currentTurn?.question}"
              </p>
              {currentTurn?.vcContext && (
                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200/40 dark:border-zinc-700/40 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" weight="fill" />
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                    <strong className="text-gray-900 dark:text-white font-bold">VC Subtext: </strong>
                    {currentTurn.vcContext}
                  </p>
                </div>
              )}
            </div>

            {/* Suggested Talking Points */}
            {currentTurn?.suggestedTalkingPoints && currentTurn.suggestedTalkingPoints.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Recommended Key Highlights:
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentTurn.suggestedTalkingPoints.map((point, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-900/50 rounded-xl text-xs font-semibold"
                    >
                      ✓ {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Founder Answer Input Area */}
            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span>Your Pitch Rebuttal</span>
                  {isListening && (
                    <span className="flex items-center gap-1 text-red-500 font-bold text-[11px] animate-pulse">
                      <Waveform className="w-3.5 h-3.5" weight="bold" />
                      Live Audio Recording...
                    </span>
                  )}
                </label>

                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {isListening ? (
                      <>
                        <MicrophoneSlash className="w-4 h-4" weight="bold" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Microphone className="w-4 h-4 text-yellow-500" weight="bold" />
                        Speak via Mic
                      </>
                    )}
                  </button>
                )}
              </div>

              <textarea
                value={founderAnswer}
                onChange={(e) => setFounderAnswer(e.target.value)}
                placeholder="Speak via microphone or type your pitch defense here... (e.g. 'We tackle this with our negative net churn of -5% and proprietary distribution moats...')"
                rows={4}
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-none"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-gray-400">
                  Tip: Use data points, payback periods, and concrete customer evidence.
                </p>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => fetchNextQuestion()}
                    disabled={isLoadingQuestion}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer w-full sm:w-auto"
                  >
                    Skip / New Question
                  </button>

                  <button
                    onClick={handleScoreAnswer}
                    disabled={isScoring || !founderAnswer.trim()}
                    className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isScoring ? (
                      <CircleNotch className="w-4 h-4 animate-spin" />
                    ) : (
                      <PaperPlaneTilt className="w-4 h-4" weight="bold" />
                    )}
                    <span>Score Rebuttal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Feedback Scorecard Result */}
          {currentTurn?.scorecard && (
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-zinc-800 shadow-xl space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
                    Pitch Scorecard Analysis
                  </span>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                    Verdict: {currentTurn.scorecard.verdict}
                  </h3>
                </div>

                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-2xl w-fit">
                  <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                    {currentTurn.scorecard.overallScore}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    / 100 Overall Score
                  </span>
                </div>
              </div>

              {/* 3 Core Metric Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50/70 dark:bg-zinc-800/40 rounded-2xl border border-gray-200/50 dark:border-zinc-700/50 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-gray-300">Clarity & Brevity</span>
                    <span className="font-mono text-gray-900 dark:text-white">{currentTurn.scorecard.clarityScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${currentTurn.scorecard.clarityScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50/70 dark:bg-zinc-800/40 rounded-2xl border border-gray-200/50 dark:border-zinc-700/50 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-gray-300">Defensibility & Data</span>
                    <span className="font-mono text-gray-900 dark:text-white">{currentTurn.scorecard.defensibilityScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${currentTurn.scorecard.defensibilityScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50/70 dark:bg-zinc-800/40 rounded-2xl border border-gray-200/50 dark:border-zinc-700/50 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600 dark:text-gray-300">Conviction & Presence</span>
                    <span className="font-mono text-gray-900 dark:text-white">{currentTurn.scorecard.convictionScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${currentTurn.scorecard.convictionScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Strengths and Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" weight="fill" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-1.5">
                    {currentTurn.scorecard.strengths?.map((str, i) => (
                      <li key={i} className="text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                        <span>•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                    <WarningCircle className="w-4 h-4" weight="fill" />
                    Red Flags / Missed Nuance
                  </h4>
                  <ul className="space-y-1.5">
                    {currentTurn.scorecard.redFlags?.map((flag, i) => (
                      <li key={i} className="text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
                        <span>•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Top 1% Founder Golden Rebuttal Script */}
              <div className="p-6 bg-yellow-50/40 dark:bg-yellow-950/20 border border-yellow-200/80 dark:border-yellow-900/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-yellow-900 dark:text-yellow-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-yellow-500" weight="fill" />
                    How a Top 1% Founder Would Answer:
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentTurn.scorecard?.improvedRebuttal || "");
                      toast.success("Golden script copied!");
                    }}
                    className="p-1.5 text-xs font-bold text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Script
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 italic leading-relaxed">
                  "{currentTurn.scorecard.improvedRebuttal}"
                </p>
                {currentTurn.scorecard.coFounderAdvice && (
                  <p className="text-xs text-yellow-800 dark:text-yellow-400 font-semibold pt-1 border-t border-yellow-200/40 dark:border-yellow-900/40">
                    💡 <strong>Co-Founder Advice:</strong> {currentTurn.scorecard.coFounderAdvice}
                  </p>
                )}
              </div>

              {/* Next Question Trigger */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => fetchNextQuestion()}
                  disabled={isLoadingQuestion}
                  className="px-6 py-3 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-black rounded-2xl transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
                >
                  <span>Next VC Challenge</span>
                  <CaretRight className="w-4 h-4" weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prior Practice Turns Timeline */}
      {turns.length > 1 && (
        <div className="bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ChatCircleDots className="w-5 h-5 text-yellow-500" weight="bold" />
              Practice Session History ({turns.length} Rounds)
            </h2>
          </div>

          <div className="space-y-4 divide-y divide-gray-100 dark:divide-zinc-800">
            {turns.slice(1).map((turn, index) => (
              <div key={turn.id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                      Round {turns.length - index - 1} • {turn.category}
                    </span>
                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                      Q: "{turn.question}"
                    </p>
                  </div>
                  {turn.scorecard && (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-mono font-black text-xs rounded-xl shrink-0">
                      {turn.scorecard.overallScore}/100
                    </span>
                  )}
                </div>
                {turn.founderAnswer && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                    Your response: "{turn.founderAnswer}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
