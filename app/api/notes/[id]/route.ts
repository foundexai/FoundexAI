import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Note from '@/lib/models/Note';

async function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token');
  const token = authHeader.split(' ')[1];
  const payload: any = await verifyToken(token);
  return payload.user._id;
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    const { id } = await params;
    const note = await Note.findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Optional: Check if the note belongs to the user

    await Note.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}