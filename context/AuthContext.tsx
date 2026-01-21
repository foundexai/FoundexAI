"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string;
  saved_investors: string[]; // Store IDs of saved investors
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
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Only clear token if we get an authentication error
        if (res.status === 401 || res.status === 403) {
          console.error(
            "Failed to fetch user data. Token might be invalid or expired.",
          );
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        } else {
          console.error(
            "Failed to fetch user data, but keeping session.",
            res.status,
          );
          // On other errors (500, etc), keep the token.
          // We might want to try again later or let the user refresh.
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      // Do NOT clear token on network error.
      // This prevents "logout" when user loses connection momentarily.

      // We can keep the user state if we had it, or just let it fail silently
      // The middleware will still protect routes if the cookie is invalid.

      toast.error("Checking session... please wait.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load token from localStorage on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = (newToken: string) => {
    setLoading(true);
    localStorage.setItem("token", newToken);
    setToken(newToken);
    fetchUser(newToken); // Fetch user immediately after login
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser: () => fetchUser(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
