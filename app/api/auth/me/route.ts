import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('token=')[1];
  if (!token) return NextResponse.json(null, { status: 401 });
  try {
    const payload:any = verifyToken(token);
    await connectDB();
    const user = await User.findById(payload.id).select('-password_hash');
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json(null, { status: 401 });
  }
}