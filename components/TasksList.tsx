"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

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

const categoryOrder = ['Finance', 'Market', 'Legal', 'Operations'];

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const r = await fetch('/api/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (r.ok) {
      const data = await r.json();
      setTasks(data.tasks);
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

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <Link href="/dashboard/tasks">
          <span className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category}>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-md ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
              {category}
            </span>
            <ul className="mt-3 space-y-2">
              {tasksByCategory[category].map((task) => (
                <li key={task._id} className="text-sm text-gray-800 font-medium">
                  {task.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}