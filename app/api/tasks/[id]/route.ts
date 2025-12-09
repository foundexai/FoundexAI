import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Task from '@/lib/models/Task';
import Startup from '@/lib/models/Startup';

async function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token');
  const token = authHeader.split(' ')[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;
    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Check ownership
    const startup = await Startup.findOne({ user_id: new mongoose.Types.ObjectId(userId), _id: task.startup_id });
    if (!startup) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await Task.deleteOne({ _id: id });
    // Update readiness score
    const allTasks = await Task.find({ startup_id: startup._id });
    const completed = allTasks.filter(t => t.status === 'completed').length;
    startup.readiness_score = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
    await startup.save();
    return NextResponse.json({ message: 'Task deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}