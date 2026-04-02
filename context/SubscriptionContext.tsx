"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";

export interface SubscriptionState {
  is_subscribed: boolean;
  plan: string;
  status: string;
  plan_level: number;
  is_admin: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  connect_requests_used: number;
  connect_requests_limit: number;
  loading: boolean;
  error: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  hasAccess: (minimumPlan?: string) => boolean;
  canUseFeature: (feature: string) => boolean;
}

const PLAN_HIERARCHY: Record<string, number> = {
  starter: 0,
  founder: 1,
  pro: 2,
  license: 3,
};

const defaultState: SubscriptionState = {
  is_subscribed: false,
  plan: "starter",
  status: "none",
  plan_level: 0,
  is_admin: false,
  current_period_end: null,
  cancel_at_period_end: false,
  connect_requests_used: 0,
  connect_requests_limit: 0,
  loading: true,
  error: null,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, token } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultState);

  const fetchSubscription = useCallback(async () => {
    if (!token) {
      setState({ ...defaultState, loading: false });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      
      const res = await fetch("/api/subscriptions/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setState({
          ...data.subscription,
          loading: false,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch subscription status",
        }));
      }
    } catch (err) {
      console.error("[SubscriptionProvider] Error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Network error",
      }));
    }
  }, [token]);

  useEffect(() => {
    if (token && user) {
      fetchSubscription();
    } else {
      setState({ ...defaultState, loading: false });
    }
  }, [token, user, fetchSubscription]);

  const hasAccess = useCallback(
    (minimumPlan: string = "founder") => {
      if (state.is_admin) return true;
      const required = PLAN_HIERARCHY[minimumPlan] || 1;
      return state.plan_level >= required;
    },
    [state.is_admin, state.plan_level]
  );

  const canUseFeature = useCallback(
    (feature: string) => {
      if (state.is_admin) return true;

      switch (feature) {
        case "connect_requests":
          if (state.connect_requests_limit === -1) return true; // unlimited
          return state.connect_requests_used < state.connect_requests_limit;
        case "unlimited_saves":
          return state.plan_level >= PLAN_HIERARCHY.founder;
        case "advanced_search":
          return state.plan_level >= PLAN_HIERARCHY.pro;
        case "sector_reports":
          return state.plan_level >= PLAN_HIERARCHY.license;
        default:
          return state.plan_level >= PLAN_HIERARCHY.founder;
      }
    },
    [state]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        refreshSubscription: fetchSubscription,
        hasAccess,
        canUseFeature,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};
