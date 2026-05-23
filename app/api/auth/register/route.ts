import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword, signToken, isSuperAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  await connectDB();
  const { full_name, email, password, user_type } = await req.json();
  const existing = await User.findOne({ email });
  if (existing) return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });

  const password_hash = await hashPassword(password);
  const user = await User.create({ full_name, email, password_hash, user_type });
  const token = signToken({ 
    id: user._id.toString(), 
    email, 
    full_name: user.full_name, 
    is_admin: user.is_admin,
    is_super_admin: isSuperAdmin(email) || !!user.isSuperAdmin
  });
  const res = NextResponse.json({ 
    user: { 
      id: user._id, 
      full_name, 
      email, 
      user_type, 
      isAdmin: user.is_admin,
      isSuperAdmin: isSuperAdmin(email) || !!user.isSuperAdmin
    },
    token
  });
  // set httpOnly cookie
  res.headers.set('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7*24*60*60}`);
  return res;
}