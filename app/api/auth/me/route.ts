import { NextResponse } from 'next/server';
import { verifyToken, isAdmin } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Startup from '@/lib/models/Startup';

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

    const userId = (decoded.user as any).id || (decoded.user as any)._id;
    const startups = await Startup.find({ user_id: userId });
    
    const userObj = {
      ...((decoded.user as any).toObject ? (decoded.user as any).toObject() : decoded.user),
      isAdmin: isAdmin(decoded.user.email)
    };
        
    return NextResponse.json({ 
      user: userObj,
      startups 
    });

  } catch (error) {
    console.error('Error verifying token or fetching user:', error);
    return NextResponse.json({ error: 'Session expired or token is invalid.' }, { status: 401 });
  }
}