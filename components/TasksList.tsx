"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Circle, ArrowUpRight } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Task {
  _id: string;
  title: string;
  category: string;
  status: string;
}

const categoryColors: { [key: string]: string } = {
  Finance: "bg-yellow-100 text-yellow-800",
  Market: "bg-blue-100 text-blue-800",
  Legal: "bg-purple-100 text-purple-800",
  Operations: "bg-pink-100 text-pink-800",
};

const categoryOrder = ["Finance", "Market", "Legal", "Operations"];

export default function TasksList({ startupId }: { startupId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [startupId]);

  async function loadTasks() {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    const r = await fetch(`/api/tasks?startup_id=${startupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (r.ok) {
      const data = await r.json();
      setTasks(data.tasks);
    }
    setIsLoading(false);
  }

  async function toggleTask(id: string, currentStatus: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    // Optimistic update
    setTasks(
      tasks.map((t) => (t._id === id ? { ...t, status: newStatus } : t))
    );

    const r = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!r.ok) {
      // Revert on failure
      loadTasks();
    }
  }

  const tasksByCategory = tasks.reduce((acc, task) => {
    const { category } = task;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedCategories = Object.keys(tasksByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-white/50">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-16 mb-3 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      id="tasks"
      className="glass-card p-6 rounded-2xl border border-white/50 relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800"
    >
      {/* <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
        <CheckCircle className="w-48 h-48 text-gray-900 dark:text-white" weight="bold" />
      </div> */}

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight dark:text-white">
          Tasks
        </h2>
        <Link href="/dashboard/tasks">
          <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl dark:hover:bg-white/10 dark:hover:text-gray-300 flex items-center gap-1">
            <span className="text-xs font-bold uppercase tracking-wider">Details</span>
            <ArrowUpRight className="h-4 w-4" weight="bold" />
          </button>
        </Link>
      </div>

      <div className="space-y-8 relative z-10">
        {sortedCategories.map((category) => (
          <div key={category}>
            <span
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                categoryColors[category] || "bg-gray-100 text-gray-800"
              } dark:opacity-90`}
            >
              {category}
            </span>
            <ul className="mt-4 space-y-3">
              {tasksByCategory[category].map((task) => (
                <li key={task._id} className="flex items-start gap-3 group">
                  <button
                    onClick={() => toggleTask(task._id, task.status)}
                    className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors shrink-0 dark:text-gray-600 dark:hover:text-green-400"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" weight="bold" />
                    ) : (
                      <Circle className="h-5 w-5" weight="bold" />
                    )}
                  </button>
                  <span
                    className={`text-sm font-medium transition-all ${
                      task.status === "completed"
                        ? "line-through text-gray-400 dark:text-gray-600"
                        : "text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white"
                    }`}
                  >
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm dark:text-gray-500">
              No tasks yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
