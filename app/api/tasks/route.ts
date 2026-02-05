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

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startup_id");
    
    if (!startupId) {
      return NextResponse.json({ error: "No startup_id" }, { status: 400 });
    }

    // Verify ownership
    const startup = await Startup.findOne({ 
      _id: startupId, 
      user_id: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!startup) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const tasks = await Task.find({ startup_id: startup._id });
    return NextResponse.json({ tasks });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const startup = await Startup.findOne({ user_id: new mongoose.Types.ObjectId(userId) });
    if (!startup) return NextResponse.json({ error: 'No startup' }, { status: 400 });
    const data = await req.json();
    const task = await Task.create({ startup_id: startup._id, ...data });
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