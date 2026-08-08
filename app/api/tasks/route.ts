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
    const requestedStartupId = searchParams.get("startup_id") || req.headers.get("x-startup-id");

    const userStartups = await Startup.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).sort({ created_at: 1 });

    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ tasks: [], userStartups: [], currentStartup: null });
    }

    const startup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    const tasks = await Task.find({ startup_id: startup._id }).sort({ created_at: -1 });

    return NextResponse.json({
      tasks,
      userStartups: userStartups.map((s) => ({
        _id: s._id.toString(),
        company_name: s.company_name,
      })),
      currentStartup: {
        _id: startup._id.toString(),
        company_name: startup.company_name,
      },
    });
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { searchParams } = new URL(req.url);
    const requestedStartupId = searchParams.get("startup_id") || req.headers.get("x-startup-id");

    const userStartups = await Startup.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).sort({ created_at: 1 });

    if (!userStartups || userStartups.length === 0) {
      return NextResponse.json({ error: 'No startup found' }, { status: 400 });
    }

    const startup =
      (requestedStartupId && userStartups.find((s) => s._id.toString() === requestedStartupId)) ||
      userStartups[0];

    const data = await req.json();
    const task = await Task.create({ startup_id: startup._id, ...data });

    // Update readiness score
    const allTasks = await Task.find({ startup_id: startup._id });
    const completed = allTasks.filter((t) => t.status === 'completed').length;
    startup.readiness_score = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
    await startup.save();

    return NextResponse.json({ task });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}