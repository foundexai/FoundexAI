'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Check, Trash2, Undo } from 'lucide-react';

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
  const [newTask, setNewTask] = useState({ title: '', category: 'Operations' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadTasks();
    }
  }, [user, loading, router]);

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

  async function addTask(e: any) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('/api/tasks', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }, 
      body: JSON.stringify(newTask) 
    });
    setNewTask({ title: '', category: 'Operations' });
    loadTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    loadTasks();
  }

  async function toggleTask(id: string, status: string) {
    const newStatus = status === 'completed' ? 'pending' : 'completed';
    const token = localStorage.getItem('token');
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus })
    });
    loadTasks();
  }

  return (
    <main className="w-full flex-1 p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tasks</h1>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Task</h2>
          <form onSubmit={addTask}>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input 
                className="grow border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 transition-shadow placeholder:text-gray-600 text-gray-800"
                placeholder="Task Title" 
                value={newTask.title} 
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} 
                required 
              />
              <select 
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 transition-shadow placeholder:text-gray-600 text-gray-800 bg-white"
                value={newTask.category} 
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              >
                <option>Finance</option>
                <option>Market</option>
                <option>Legal</option>
                <option>Operations</option>
              </select>
            </div>
            <button 
              className="w-full bg-yellow-400 text-white p-3 rounded-lg hover:bg-yellow-500 transition-colors font-semibold"
              type="submit"
            >
              Add Task
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Task List</h2>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">({task.category})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className={`p-2 rounded-full transition-colors ${
                      task.status === 'completed' 
                        ? 'text-gray-500 bg-gray-200 hover:bg-gray-300'
                        : 'text-green-600 bg-green-100 hover:bg-green-200'
                    }`}
                    onClick={() => toggleTask(task._id, task.status)}
                  >
                    {task.status === 'completed' ? <Undo size={16} /> : <Check size={16} />}
                  </button>
                  <button 
                    className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                    onClick={() => deleteTask(task._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}