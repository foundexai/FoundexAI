"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string;
  // Add any other user properties you expect from your /api/auth/me endpoint
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch user data
  const fetchUser = useCallback(async (authToken: string | null) => {
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        console.error('Failed to fetch user data. Token might be invalid or expired.');
        // If fetching user fails, clear the token and user state
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);

      // Show user-friendly toast message for network errors
      toast.error('Network connection failed. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load token from localStorage on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    fetchUser(newToken); // Fetch user immediately after login
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/'; // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser: () => fetchUser(token) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};