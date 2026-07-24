"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle,
  Circle,
  Trash,
  Plus,
  Sparkle,
  CheckSquare,
  ShieldCheck,
  CircleNotch,
  ListChecks,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";

interface Task {
  _id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority?: string;
}

export default function TasksPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: "", category: "Operations", description: "" });
  const [selectedStage, setSelectedStage] = useState("Seed");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      loadTasks();
    }
  }, [user, loading, router]);

  async function loadTasks() {
    setIsLoading(true);
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const r = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (r.ok) {
        const data = await r.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title) return;
    const authToken = token || localStorage.getItem("token");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        toast.success("Task created!");
        setNewTask({ title: "", category: "Operations", description: "" });
        loadTasks();
      }
    } catch (err) {
      toast.error("Failed to create task");
    }
  }

  async function handleGenerateDueDiligence() {
    setIsGenerating(true);
    const authToken = token || localStorage.getItem("token");

    try {
      const res = await fetch("/api/tasks/due-diligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ stage: selectedStage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate checklist");

      toast.success("Due Diligence Checklist Generated!", {
        description: data.message || `Loaded ${selectedStage} stage due diligence checklist.`,
      });

      loadTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate checklist.");
    } finally {
      setIsGenerating(false);
    }
  }

  function deleteTask(id: string) {
    setDeleteTaskId(id);
  }

  async function confirmDeleteTask() {
    if (!deleteTaskId) return;
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      await fetch(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success("Task deleted");
      loadTasks();
    } catch (err) {
      toast.error("Failed to delete task");
    } finally {
      setDeleteTaskId(null);
    }
  }

  async function toggleTask(id: string, status: string) {
    const newStatus = status === "completed" ? "pending" : "completed";
    const authToken = token || localStorage.getItem("token");

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      loadTasks();
    } catch (err) {
      toast.error("Failed to update status");
    }
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === "All") return true;
    return t.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  if (loading || isLoading) {
    return (
      <main className="w-full flex-1 p-6 md:p-8 bg-gray-50 dark:bg-transparent">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          <Skeleton className="h-44 bg-gray-200 dark:bg-zinc-800 rounded-3xl" />
          <Skeleton className="h-96 bg-gray-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-1 p-6 md:p-8 bg-gray-50 dark:bg-transparent">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <CheckSquare className="w-7 h-7 text-yellow-500" weight="bold" />
              Tasks & Due Diligence Checklists
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track operational tasks and generate automated due diligence checklists for investors.
            </p>
          </div>
        </div>

        {/* Automatic Due Diligence Checklist Generator Banner */}
        <div className="bg-white dark:bg-zinc-900/60 border border-gray-200/80 dark:border-zinc-800 p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold shrink-0">
                <ListChecks className="w-5 h-5" weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  Automatic Due Diligence Checklist
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono font-bold rounded-md">
                    AI Checklist Engine
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Generate structured financial, legal, IP, and corporate governance audit lists based on your fundraising stage.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white"
              >
                <option value="Pre-Seed">Pre-Seed Stage</option>
                <option value="Seed">Seed Stage</option>
                <option value="Series A">Series A Stage</option>
              </select>

              <button
                onClick={handleGenerateDueDiligence}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" weight="bold" />}
                Generate Checklist
              </button>
            </div>
          </div>

          {/* Due Diligence Readiness Progress Bar */}
          {totalCount > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Due Diligence Readiness Progress
                </span>
                <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">
                  {completedCount} / {totalCount} Completed ({progressPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Add Custom Task Form */}
        <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">
            Add Custom Task
          </h2>
          <form onSubmit={addTask} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="grow px-4 py-2.5 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="Task title (e.g. Upload Audited P&L Statement)"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <select
                className="px-3.5 py-2.5 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-white"
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              >
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="Market">Market</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" weight="bold" />
                Add Task
              </button>
            </div>
          </form>
        </div>

        {/* Task List Section */}
        <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Checklist Tasks ({filteredTasks.length})
            </h2>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["All", "Finance", "Legal", "Operations", "Market"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <ul className="space-y-3">
            {filteredTasks.map((task) => (
              <li
                key={task._id}
                className="flex items-start justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/40 rounded-2xl border border-gray-200/60 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <button
                    className={`mt-0.5 transition-colors cursor-pointer ${
                      task.status === "completed"
                        ? "text-green-500"
                        : "text-gray-300 hover:text-green-500 dark:text-zinc-600"
                    }`}
                    onClick={() => toggleTask(task._id, task.status)}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle size={22} weight="fill" />
                    ) : (
                      <Circle size={22} weight="bold" />
                    )}
                  </button>

                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        task.status === "completed"
                          ? "line-through text-gray-400 dark:text-gray-500"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {task.title}
                    </span>

                    {task.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-gray-200/70 dark:bg-zinc-700/60 text-gray-700 dark:text-gray-300 text-[9px] font-black uppercase tracking-wider rounded-md">
                        {task.category}
                      </span>
                      {task.priority && (
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            task.priority === "high"
                              ? "text-red-500"
                              : task.priority === "medium"
                              ? "text-amber-500"
                              : "text-gray-400"
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  onClick={() => deleteTask(task._id)}
                  title="Delete Task"
                >
                  <Trash size={16} weight="bold" />
                </button>
              </li>
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
                No tasks found for category &ldquo;{selectedCategory}&rdquo;. Click <strong>Generate Checklist</strong> above to load due diligence items.
              </div>
            )}
          </ul>
        </div>

      </div>

      <ConfirmationModal
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={confirmDeleteTask}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
    </main>
  );
}
