"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CircleNotch, Lightning, User, EnvelopeSimple, Lock, Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans dark:bg-black">
      <main className="flex-grow flex items-center justify-center p-4">
        <Suspense
          fallback={
            <div className="text-yellow-600 animate-pulse font-semibold">
              Loading authentication...
            </div>
          }
        >
          <AuthForm />
        </Suspense>
      </main>
    </div>
  );
}

function AuthForm() {
  const { login } = useAuth();
  // ... other hooks
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    user_type: "founder",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function handleSubmit(e: any) {
    // ... logic same as before
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? JSON.stringify({ email: form.email, password: form.password })
        : JSON.stringify(form);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token);
        toast.success(
          isLogin ? "Welcome back!" : "Account created successfully!"
        );
        window.location.href = callbackUrl;
      } else {
        if (res.status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(data.error || "Authentication failed");
        }
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-500 dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-2xl">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4 dark:bg-yellow-900/20">
          <img src="/foundex.png" alt="" />
        </div>
        <h1 className="text-3xl font-bold text-gray-`900 tracking-tight dark:text-white">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-gray-500 mt-2 text-sm dark:text-gray-400">
          {isLogin
            ? "Enter your credentials to access your account"
            : "Start your journey with FoundexAI"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" weight="bold" />
              </span>
              <input
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black/50 dark:border-zinc-700 dark:text-white dark:focus:ring-yellow-500/20"
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="p-1 bg-gray-50 rounded-xl border border-gray-200 flex dark:bg-black/50 dark:border-zinc-800">
              <label
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                  form.user_type === "founder"
                    ? "bg-white shadow-sm text-gray-900 dark:bg-zinc-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="user_type"
                  value="founder"
                  checked={form.user_type === "founder"}
                  onChange={(e) =>
                    setForm({ ...form, user_type: e.target.value })
                  }
                  className="hidden"
                  disabled={isLoading}
                />
                Founder
              </label>
              <label
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                  form.user_type === "investor"
                    ? "bg-white shadow-sm text-gray-900 dark:bg-zinc-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="user_type"
                  value="investor"
                  checked={form.user_type === "investor"}
                  onChange={(e) =>
                    setForm({ ...form, user_type: e.target.value })
                  }
                  className="hidden"
                  disabled={isLoading}
                />
                Investor
              </label>
            </div>
          </div>
        )}

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <EnvelopeSimple className="w-5 h-5 text-gray-400 dark:text-gray-500" weight="bold" />
          </span>
          <input
            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black/50 dark:border-zinc-700 dark:text-white dark:focus:ring-yellow-500/20"
            type="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" weight="bold" />
          </span>
          <input
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black/50 dark:border-zinc-700 dark:text-white dark:focus:ring-yellow-500/20"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none disabled:opacity-50"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeSlash className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" weight="bold" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" weight="bold" />
            )}
          </button>
        </div>

        {isLogin && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsForgotOpen(true)}
              className="text-xs font-bold text-gray-500 hover:text-yellow-600 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <button
          className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/40 active:scale-[0.98] dark:shadow-none"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircleNotch className="mr-2 h-5 w-5 animate-spin" weight="bold" />
              {isLogin ? "Signing In..." : "Creating Account..."}
            </>
          ) : isLogin ? (
            "Sign In"
          ) : (
            "Sign Up"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-yellow-600 hover:text-yellow-700 hover:underline transition-colors dark:text-yellow-500"
            disabled={isLoading}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
}
