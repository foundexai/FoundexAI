import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Task from '@/lib/models/Task';
import Startup from '@/lib/models/Startup';

function getUserId(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('token=')[1];
  if (!token) throw new Error('No token');
  const payload: any = verifyToken(token);
  return payload.id;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = getUserId(req);
    const { id } = await params;
    const { status } = await req.json();
    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Check ownership
    const startup = await Startup.findOne({ user_id: new mongoose.Types.ObjectId(userId), _id: task.startup_id });
    if (!startup) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    task.status = status;
    await task.save();
    // Update readiness score
    const allTasks = await Task.find({ startup_id: startup._id });
    const completed = allTasks.filter(t => t.status === 'completed').length;
    startup.readiness_score = Math.round((completed / allTasks.length) * 100);
    await startup.save();
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}