import { useState } from "react";
import { X, CircleNotch, EnvelopeSimple, Key, ShieldCheck, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"request" | "verify" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setStep("verify");
      } else {
        toast.error(data.error || "Failed to send reset code");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setStep("reset");
      } else {
        toast.error(data.error || "Invalid or expired code");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setStep("success");
      } else {
        toast.error(data.error || "Reset failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 dark:border-white/10 p-8">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400"
        >
          <X className="w-5 h-5" weight="bold" />
        </button>

        {step === "request" && (
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <EnvelopeSimple className="w-7 h-7 text-yellow-600" weight="bold" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Forgot Password?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            <div className="space-y-2">
              <input
                required
                type="email"
                placeholder="name@company.com"
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all dark:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              disabled={isLoading}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />}
              Send Code
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-7 h-7 text-blue-600" weight="bold" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Check Your Email</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                We've sent a 6-digit verification code to <b>{email}</b>.
              </p>
            </div>

            <div className="space-y-2 text-center">
              <input
                required
                maxLength={6}
                type="text"
                placeholder="0 0 0 0 0 0"
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-black text-2xl text-center tracking-[0.5em] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-xs text-gray-400 mt-2 hover:text-gray-600 cursor-pointer" onClick={() => setStep("request")}>
                Didn't get the code? <span className="text-yellow-600 font-bold">Send again.</span>
              </p>
            </div>

            <button
              disabled={isLoading || code.length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />}
              Verify Code
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-emerald-600" weight="bold" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">New Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Create a strong new password for your account.
              </p>
            </div>

            <div className="space-y-2">
              <input
                required
                type="password"
                placeholder="Enter new password"
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              disabled={isLoading || newPassword.length < 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />}
              Reset Password
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
              <CheckCircle className="w-10 h-10 text-emerald-600" weight="bold" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">All Set!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl font-bold shadow-xl transition-all"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
