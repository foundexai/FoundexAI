import React, { useRef, useState, useEffect } from "react";
import { X, CircleNotch, Signature, Pen, TextT, Trash } from "@phosphor-icons/react";

interface ESignModalProps {
  isOpen: boolean;
  onClose: () => void;
  signerEmail: string;
  signerName: string;
  onSignSubmit: (signatureType: "drawn" | "typed", signatureData: string) => Promise<void>;
}

export default function ESignModal({
  isOpen,
  onClose,
  signerEmail,
  signerName,
  onSignSubmit,
}: ESignModalProps) {
  const [activeTab, setActiveTab] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(signerName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Canvas drawing state references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas details (color, line width, etc)
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1e3a8a"; // Navy blue cursive ink look
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  // Draw event handlers for Mouse
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Draw event handlers for Touch Devices (Mobile)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === "draw") {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Check if canvas is empty
        const ctx = canvas.getContext("2d");
        const blank = document.createElement("canvas");
        blank.width = canvas.width;
        blank.height = canvas.height;
        if (canvas.toDataURL() === blank.toDataURL()) {
          alert("Please draw your signature before submitting.");
          setIsSubmitting(false);
          return;
        }

        const dataUrl = canvas.toDataURL("image/png");
        await onSignSubmit("drawn", dataUrl);
      } else {
        if (!typedName.trim()) {
          alert("Please type your name before submitting.");
          setIsSubmitting(false);
          return;
        }
        await onSignSubmit("typed", typedName);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to submit signature. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in font-sans">
      {/* Import beautiful cursive handwriting font for typed preview */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .font-cursive-signature {
          font-family: 'Great Vibes', cursive;
        }
      `}} />

      <div className="bg-white/95 dark:bg-zinc-900/95 border border-black/10 dark:border-white/10 rounded-3xl p-7 max-w-lg w-full shadow-2xl space-y-6 text-left relative overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <Signature className="w-5 h-5" weight="bold" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              Legal E-Sign Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Sign document for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{signerEmail}</span>. Your digital signature and cryptographically verifiable timestamp will be stamped on the completed PDF certificate.
        </p>

        {/* Apple Segmented Tab Control */}
        <div className="flex p-1 bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-xl border border-black/[0.04] dark:border-white/[0.04]">
          <button
            onClick={() => setActiveTab("draw")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "draw"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            Draw Signature
          </button>
          <button
            onClick={() => setActiveTab("type")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "type"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <TextT className="w-3.5 h-3.5" />
            Type Signature
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === "draw" ? (
          <div className="space-y-3">
            <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-zinc-50/50 dark:bg-black/30 shadow-inner">
              <canvas
                ref={canvasRef}
                width={460}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawingTouch}
                onTouchMove={drawTouch}
                onTouchEnd={stopDrawing}
                className="w-full h-[200px] cursor-crosshair touch-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-zinc-400">Draw above using mouse or touch trackpad.</span>
              <button
                onClick={clearCanvas}
                className="px-3 py-1 bg-zinc-100 hover:bg-rose-500 hover:text-white dark:bg-zinc-800 dark:hover:bg-rose-600 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Trash className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-black/10 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-yellow-500/30 outline-none dark:text-white font-medium"
                placeholder="Enter full legal name"
              />
            </div>

            <div className="border border-black/10 dark:border-white/10 rounded-2xl p-6 bg-zinc-50/40 dark:bg-black/20 flex flex-col items-center justify-center min-h-[140px] text-center shadow-inner">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Digital Signature Preview</span>
              {typedName ? (
                <span className="text-3xl text-indigo-950 dark:text-indigo-300 font-cursive-signature leading-none py-3 select-none tracking-wide">
                  {typedName}
                </span>
              ) : (
                <span className="text-xs text-zinc-400 italic">Signature preview will appear here</span>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-black/10 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-450 text-black rounded-xl text-xs font-semibold shadow-sm shadow-yellow-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <CircleNotch className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Confirm & Sign Document"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
