import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Startup from '@/lib/models/Startup';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const { id: startupId } = await params;
    const startup = await Startup.findById(startupId);

    if (!startup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    if (startup.user_id.toString() !== decoded.user.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(startup, { status: 200 });
  } catch (error) {
    console.error('Error fetching startup:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const { id: startupId } = await params;
    const deletedStartup = await Startup.findOneAndDelete({
      _id: startupId,
      user_id: decoded.user.id
    });

    if (!deletedStartup) {
      return NextResponse.json({ message: 'Startup not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Startup deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting startup:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const { id: startupId } = await params;
    const body = await req.json();

    const updatedStartup = await Startup.findOneAndUpdate(
      { _id: startupId, user_id: decoded.user.id },
      body,
      { new: true }
    );

    if (!updatedStartup) {
      return NextResponse.json({ message: 'Startup not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updatedStartup, { status: 200 });
  } catch (error) {
    console.error('Error updating startup:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}