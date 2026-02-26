import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;
export const hashPassword = (pwd:string) => bcrypt.hash(pwd, 10);
export const comparePassword = (pwd:string, hash:string) => bcrypt.compare(pwd, hash);
export const signToken = (payload:{id:string,email:string}) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

const ADMIN_EMAILS = [
  "almussanplanner12@gmail.com",
  "sophzine@gmail.com"
];

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);

export const verifyToken = async (token: string) => {
  const start = Date.now();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    // Check if we already connected to DB
    await connectDB();
    const dbConnectTime = Date.now() - start;

    const user = await User.findById(decoded.id).select('-password -password_hash').lean();
    
    const totalTime = Date.now() - start;
    if (totalTime > 2000) {
      console.warn(`[verifyToken] Warning: Slow fetch for ${decoded.id}: ${totalTime}ms (Connect: ${dbConnectTime}ms)`);
    }

    if (!user) return null;
    return { user: { ...user, _id: user._id.toString() } as any };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        console.log("Token expired");
    } else {
        console.error("Error in verifyToken:", error);
    }
    return null;
  }
};