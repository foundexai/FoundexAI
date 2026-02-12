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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;
    
    // Find note and populate startup to verify ownership
    const note = await Note.findOne({ _id: new mongoose.Types.ObjectId(id) }).populate('startup_id');

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify ownership via the associated startup
    if (note.startup_id.user_id.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ note });
  } catch (err) {
    console.error("GET /api/notes/[id] error:", err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;
    const data = await req.json();

    // Find note to verify ownership
    const note = await Note.findOne({ _id: new mongoose.Types.ObjectId(id) }).populate('startup_id');

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify ownership
    if (note.startup_id.user_id.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update note fields
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { 
        ...data,
        updated_at: new Date()
      },
      { new: true }
    );

    return NextResponse.json({ note: updatedNote });
  } catch (err) {
    console.error("PUT /api/notes/[id] error:", err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;

    // Find note to verify ownership
    const note = await Note.findOne({ _id: new mongoose.Types.ObjectId(id) }).populate('startup_id');

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify ownership
    if (note.startup_id.user_id.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await Note.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}