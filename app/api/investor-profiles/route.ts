import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import InvestorProfile from '@/lib/models/InvestorProfile';

function getUserId(req: Request) {
  let token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    const cookie = req.headers.get('cookie') || '';
    token = cookie.split('token=')[1];
  }
  if (!token) throw new Error('No token');
  const payload: any = verifyToken(token);
  return payload.user.id;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = getUserId(req);
    const profile = await InvestorProfile.findOne({ user_id: new mongoose.Types.ObjectId(userId) });
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = getUserId(req);
    const data = await req.json();
    let profile = await InvestorProfile.findOne({ user_id: new mongoose.Types.ObjectId(userId) });
    if (profile) {
      Object.assign(profile, data);
      await profile.save();
    } else {
      profile = await InvestorProfile.create({ user_id: new mongoose.Types.ObjectId(userId), ...data });
    }

    // Sync with Investor directory search entry
    const Investor = mongoose.models.Investor || (await import('@/lib/models/Investor')).default;
    let investor = await Investor.findOne({ platform_user_id: new mongoose.Types.ObjectId(userId) });
    if (!investor) {
      await Investor.create({
        name: data.company_name || data.full_name || profile.full_name || "New Investor",
        type: data.company_type || "VC",
        focus: data.stage_focus ? [data.stage_focus] : ["Fintech"],
        location: data.geography || "Lagos, Nigeria",
        logoInitial: (data.company_name || data.full_name || profile.full_name || "N").charAt(0).toUpperCase(),
        logoColor: "from-blue-500 to-indigo-600",
        description: data.thesis || "Investor platform account profile.",
        website: data.website_url,
        linkedin: data.linkedin_url,
        email: data.official_email,
        isApproved: false,
        submittedBy: userId,
        platform_user_id: new mongoose.Types.ObjectId(userId)
      });
    } else {
      investor.name = data.company_name || data.full_name || profile.full_name || investor.name;
      investor.type = data.company_type || investor.type;
      if (data.stage_focus) investor.focus = [data.stage_focus];
      investor.location = data.geography || investor.location;
      investor.description = data.thesis || investor.description;
      investor.website = data.website_url || investor.website;
      investor.linkedin = data.linkedin_url || investor.linkedin;
      investor.email = data.official_email || investor.email;
      await investor.save();
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Error updating investor profile:", err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}