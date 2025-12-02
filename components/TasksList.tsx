"use client";
import { useState, useEffect } from "react";

export default function TasksList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ title: "", category: "Operations" });

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const r = await fetch('/api/tasks');
    if (r.ok) {
      const data = await r.json();
      setTasks(data.tasks);
    }
  }

  async function addTask(e: any) {
    e.preventDefault();
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) });
    setNewTask({ title: "", category: "Operations" });
    loadTasks();
  }

  async function toggleTask(id: string, status: string) {
    const newStatus = status === 'completed' ? 'pending' : 'completed';
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    loadTasks();
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-2">Tasks</h2>
      <form onSubmit={addTask} className="mb-4">
        <input className="border p-2 w-full mb-2" placeholder="Task Title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
        <select className="border p-2 w-full mb-2" value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}>
          <option>Finance</option>
          <option>Market</option>
          <option>Legal</option>
          <option>Operations</option>
        </select>
        <button className="bg-green-500 text-white p-2 rounded" type="submit">Add Task</button>
      </form>
      <ul>
        {tasks.map((task) => (
          <li key={task._id} className="flex justify-between items-center mb-2">
            <span className={task.status === 'completed' ? 'line-through' : ''}>{task.title} ({task.category})</span>
            <button className="bg-blue-500 text-white p-1 rounded" onClick={() => toggleTask(task._id, task.status)}>
              {task.status === 'completed' ? 'Undo' : 'Complete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}