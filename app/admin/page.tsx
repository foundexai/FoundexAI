"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, ShieldAlert } from "lucide-react";
import { InvestorCard, Investor } from "@/components/InvestorCard";
import { toast } from "sonner";

const ADMIN_EMAIL = "almussanplanner12@gmail.com";

export default function AdminPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingInvestors, setPendingInvestors] = useState<Investor[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/dashboard");
      return;
    }

    if (user && user.email !== ADMIN_EMAIL) {
      toast.error("Unauthorized access");
      router.push("/dashboard");
      return;
    }
  }, [user, isLoading, router]);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/investors/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingInvestors(data.investors);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pending requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.email === ADMIN_EMAIL) {
      fetchPending();
    } else if (!user) {
      // Wait for auth to load
    }
  }, [token, user]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/investors/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("Investor Approved!");
      setPendingInvestors((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e) {
      toast.error("Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject and delete this submission?"))
      return;
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/investors/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("Submission Rejected");
      setPendingInvestors((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e) {
      toast.error("Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900/20">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage pending investor submissions.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
          </div>
        ) : pendingInvestors.length === 0 ? (
          <div className="glass-card p-20 text-center rounded-3xl border border-white/60 dark:border-white/10">
            <p className="text-xl font-bold text-gray-500 dark:text-gray-400">
              No pending submissions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingInvestors.map((inv) => (
              <div key={inv.id} className="relative group">
                <InvestorCard
                  investor={inv}
                  isSaved={false}
                  onToggleSave={() => {}}
                />

                {/* Admin Controls Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 rounded-b-3xl flex gap-2 dark:bg-zinc-900/90 dark:border-white/10">
                  <button
                    onClick={() => handleApprove(inv.id)}
                    disabled={!!processingId}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {processingId === inv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(inv.id)}
                    disabled={!!processingId}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {processingId === inv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
