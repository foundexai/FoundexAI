import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Note from '@/lib/models/Note';
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
    if (!startup) return NextResponse.json({ notes: [] });
    const notes = await Note.find({ startup_id: startup._id });
    return NextResponse.json({ notes });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = getUserId(req);
    const startup = await Startup.findOne({ user_id: new mongoose.Types.ObjectId(userId) });
    if (!startup) return NextResponse.json({ error: 'No startup' }, { status: 400 });
    const data = await req.json();
    const note = await Note.create({ startup_id: startup._id, ...data });
    return NextResponse.json({ note });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}