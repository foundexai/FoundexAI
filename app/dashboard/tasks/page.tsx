"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Task {
  _id: string;
  title: string;
  category: string;
  status: string;
}

export default function TasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: "", category: "Operations" });
  const [isLoading, setIsLoading] = useState(true);

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
    const token = localStorage.getItem("token");
    if (!token) return;
    const r = await fetch("/api/tasks", {
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

  async function addTask(e: any) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newTask),
    });
    setNewTask({ title: "", category: "Operations" });
    loadTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    loadTasks();
  }

  async function toggleTask(id: string, status: string) {
    const newStatus = status === "completed" ? "pending" : "completed";
    const token = localStorage.getItem("token");
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    loadTasks();
  }

  if (loading || isLoading) {
    return (
      <main className="w-full flex-1 p-8 bg-gray-50 dark:bg-transparent">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-zinc-800" />
          <div className="glass-card p-6 rounded-2xl border border-white/50 h-40 dark:border-zinc-800"></div>
          <div className="glass-card p-6 rounded-2xl border border-white/50 h-96 dark:border-zinc-800"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-1 p-8 bg-gray-50 dark:bg-transparent">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight dark:text-white">
          Tasks
        </h1>

        <div className="glass-card p-8 rounded-3xl border border-white/50 mb-8 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 mb-6 dark:text-white">
            Add New Task
          </h2>
          <form onSubmit={addTask}>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                className="grow border border-gray-200 bg-white/50 p-4 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all placeholder:text-gray-400 text-gray-800 dark:bg-zinc-900/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-gray-500"
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                required
              />
              <select
                className="border border-gray-200 bg-white/50 p-4 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-gray-800 dark:bg-zinc-900/50 dark:border-zinc-700 dark:text-white"
                value={newTask.category}
                onChange={(e) =>
                  setNewTask({ ...newTask, category: e.target.value })
                }
              >
                <option>Finance</option>
                <option>Market</option>
                <option>Legal</option>
                <option>Operations</option>
              </select>
            </div>
            <button
              className="w-full bg-yellow-500 text-white p-4 rounded-xl hover:bg-yellow-600 transition-all font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/40 dark:text-black"
              type="submit"
            >
              Add Task
            </button>
          </form>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/50 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 mb-6 dark:text-white">
            All Tasks
          </h2>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task._id}
                className="flex justify-between items-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60 hover:border-yellow-500/30 transition-all group dark:bg-zinc-900/40 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <button
                    className={`mt-0.5 transition-colors ${
                      task.status === "completed"
                        ? "text-green-500"
                        : "text-gray-300 hover:text-green-500 dark:text-zinc-600"
                    }`}
                    onClick={() => toggleTask(task._id, task.status)}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <div>
                    <span
                      className={`font-medium block ${
                        task.status === "completed"
                          ? "line-through text-gray-400 dark:text-gray-600"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {task.category}
                    </span>
                  </div>
                </div>

                <button
                  className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-red-900/20"
                  onClick={() => deleteTask(task._id)}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                No tasks found.
              </div>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
