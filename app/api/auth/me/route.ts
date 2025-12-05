import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication token not provided.' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }
    
    return NextResponse.json({ user: decoded.user });

  } catch (error) {
    console.error('Error verifying token or fetching user:', error);
    return NextResponse.json({ error: 'Session expired or token is invalid.' }, { status: 401 });
  }
}