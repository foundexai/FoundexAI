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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Import beautiful cursive handwriting font for typed preview */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .font-cursive-signature {
          font-family: 'Great Vibes', cursive;
        }
      `}} />

      <div className="bg-white dark:bg-zinc-900 border border-gray-250/80 dark:border-zinc-800 rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-6 text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Signature className="w-5 h-5 text-yellow-500" weight="bold" />
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Legal E-Sign Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-gray-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Sign document for <span className="font-bold text-gray-700 dark:text-zinc-300">{signerEmail}</span>. Your digital signature and audit trails (IP and timestamp) will be embedded securely.
        </p>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-150 dark:border-zinc-800 gap-1.5">
          <button
            onClick={() => setActiveTab("draw")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "draw"
                ? "border-black text-black dark:border-white dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Pen className="w-4 h-4" />
            Draw Signature
          </button>
          <button
            onClick={() => setActiveTab("type")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "type"
                ? "border-black text-black dark:border-white dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <TextT className="w-4 h-4" />
            Type Signature
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === "draw" ? (
          <div className="space-y-3">
            <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-black/20">
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
              <span className="text-[10px] text-gray-400 italic">Draw your signature inside the grey box above.</span>
              <button
                onClick={clearCanvas}
                className="px-3 py-1.5 bg-gray-100 hover:bg-red-500 hover:text-white dark:bg-zinc-800 dark:hover:bg-red-600 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Trash className="w-3.5 h-3.5" />
                Clear Pad
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Type Legal Name
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-750 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 dark:text-white font-medium"
                placeholder="Enter legal name"
              />
            </div>

            <div className="border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 bg-gray-50/30 dark:bg-black/10 flex flex-col items-center justify-center min-h-[140px] text-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Signature Preview</span>
              {typedName ? (
                <span className="text-3xl text-blue-900 dark:text-blue-400 font-cursive-signature leading-none py-4 select-none">
                  {typedName}
                </span>
              ) : (
                <span className="text-xs text-gray-400 italic">Signature preview will appear here</span>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 dark:border-zinc-800 text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <CircleNotch className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Confirm & Sign"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
