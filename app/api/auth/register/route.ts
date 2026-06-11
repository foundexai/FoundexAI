import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

  if (user_type === 'investor') {
    const Investor = mongoose.models.Investor || (await import('@/lib/models/Investor')).default;
    await Investor.create({
      name: full_name,
      type: "VC", // default type
      focus: ["Fintech"], // default focus
      location: "Lagos, Nigeria", // default location
      logoInitial: full_name.charAt(0).toUpperCase(),
      logoColor: "from-blue-500 to-indigo-600",
      description: "Onboarded platform investor account awaiting approval.",
      isApproved: false,
      submittedBy: user._id.toString(),
      platform_user_id: user._id
    });

    const { notifyAdmins } = await import('@/lib/notifications');
    await notifyAdmins(
      "💎 New Investor Signup",
      `${full_name} has registered as an investor and is awaiting approval.`,
      "submission",
      "/dashboard/admin"
    );
  }

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