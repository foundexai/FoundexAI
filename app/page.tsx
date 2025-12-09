"use client";
import { useState } from "react";

import { toast } from "sonner";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", user_type: "founder" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? JSON.stringify({ email: form.email, password: form.password })
      : JSON.stringify(form);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      toast.success(isLogin ? 'Login successful!' : 'Registration successful!');
      window.location.href = '/dashboard';
    } else {
      const data = await res.json();
      if (res.status === 500) {
        toast.error('Server error occurred. Please try again later.');
      } else {
        toast.error(data.error || 'An error occurred.');
      }
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">{isLogin ? 'Sign In' : 'Sign Up'}</h1>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                <input 
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-800" 
                    placeholder="Full Name" 
                    value={form.full_name} 
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                    required 
                />
              </div>
            )}

            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center text-gray-700">
                    <input
                      type="radio"
                      name="user_type"
                      value="founder"
                      checked={form.user_type === 'founder'}
                      onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                      className="mr-2"
                    />
                    Founder
                  </label>
                  <label className="flex items-center text-gray-700">
                    <input
                      type="radio"
                      name="user_type"
                      value="investor"
                      checked={form.user_type === 'investor'}
                      onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                      className="mr-2 text-gray-900"
                    />
                    Investor
                  </label>
                </div>
              </div>
            )}

            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
              <input 
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-800" 
                  type="email" 
                  placeholder="Email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  required 
              />
            </div>

            <div className="relative mb-6">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input 
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-800" 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  required 
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button type="button" onClick={togglePasswordVisibility} className="focus:outline-none">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.43-7.086a1 1 0 011.558 0l4.43 7.086a1.012 1.012 0 010 .639l-4.43 7.086a1 1 0 01-1.558 0l-4.43-7.086z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </span>
            </div>

            <button
                className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                type="submit"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isLogin ? 'Signing In...' : 'Signing Up...'}
                    </>
                ) : (
                    isLogin ? 'Sign In' : 'Sign Up'
                )}
            </button>
          </form>

          <div className="mt-4 text-center">
              <a href="#" className="text-sm text-yellow-500 hover:underline">Forgot your password?</a>
          </div>

          <div className="my-8 flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-4 text-sm text-gray-500">Or continue with social account</span>
              <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="flex justify-center space-x-4">
              <button className="border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2 hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.356-11.303-8H6.306C9.656,35.663,16.318,40,24,40z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.846,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                  <span className="font-medium text-gray-700">Google</span>
              </button>
              <button className="border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2 hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                      <path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5z"/>
                      <path fill="#fff" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v12.022C24.58,42.902,26.572,29.036,26.572,29.036z"/>
                  </svg>
                  <span className="font-medium text-gray-700">Facebook</span>
              </button>
          </div>

          <div className="mt-8 text-center">
              <p className="text-gray-600">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-yellow-500 hover:underline">
                      {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
              </p>
          </div>
        </div>
      </main>
    </div>
  );
}