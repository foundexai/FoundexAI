import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Note from '@/lib/models/Note';
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
    
    const notes = await Note.find({ startup_id: startup._id });
    return NextResponse.json({ notes });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const data = await req.json();
    const { startup_id, title, content, tags } = data;

    if (!startup_id) {
      return NextResponse.json({ error: 'No startup_id provided' }, { status: 400 });
    }

    // Verify startup ownership
    const startup = await Startup.findOne({ 
      _id: startup_id, 
      user_id: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!startup) {
      return NextResponse.json({ error: 'Startup not found or access denied' }, { status: 403 });
    }

    const note = await Note.create({ 
      startup_id: startup._id, 
      title, 
      content, 
      tags,
      type: "manual",
      is_system_generated: false
    });

    return NextResponse.json({ note });
  } catch (err) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}