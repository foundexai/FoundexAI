import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  await connectDB();
  const { email, password } = await req.json();
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'Invalid' }, { status: 401 });
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Invalid' }, { status: 401 });
  const token = signToken({ id: user._id.toString(), email });
  const res = NextResponse.json({ user: { id: user._id, full_name: user.full_name, email } });
  res.headers.set('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7*24*60*60}`);
  return res;
}