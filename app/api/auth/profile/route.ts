import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

export async function PATCH(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication token not provided.' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }

    const userId = (decoded.user as any).id || (decoded.user as any)._id;
    const { full_name, user_type, linkedin_url, profile_image_url } = await req.json();

    await connectDB();
    
    // Only update fields that are provided
    const updateData: any = {};
    if (full_name) updateData.full_name = full_name;
    if (user_type) updateData.user_type = user_type;
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
