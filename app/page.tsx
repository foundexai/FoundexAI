"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
          <svg
            className="w-6 h-6 text-yellow-600 dark:text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight dark:text-white">
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-400 dark:text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639l4.43-7.086a1 1 0 011.558 0l4.43 7.086a1.012 1.012 0 010 .639l-4.43 7.086a1 1 0 01-1.558 0l-4.43-7.086z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>

        <button
          className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/40 active:scale-[0.98] dark:shadow-none"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
    </div>
  );
}
