import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Startup from '@/lib/models/Startup';

function getUserId(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('token=')[1];
  if (!token) throw new Error('No token');
  const payload: any = verifyToken(token);
  return payload.id;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = getUserId(req);
    const startup = await Startup.findOne({ user_id: new mongoose.Types.ObjectId(userId) });
    return NextResponse.json({ startup });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = getUserId(req);
    const data = await req.json();
    let startup = await Startup.findOne({ user_id: new mongoose.Types.ObjectId(userId) });
    if (startup) {
      Object.assign(startup, data);
      await startup.save();
    } else {
      startup = await Startup.create({ user_id: new mongoose.Types.ObjectId(userId), ...data });
    }
    return NextResponse.json({ startup });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}