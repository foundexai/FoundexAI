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
  "sophzine@gmail.com",
  "Demo@foundex.ai",
  "Interndemo1@foundex.ai",
  "Interndemo2@foundex.ai",
];

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);

export const verifyToken = async (token: string) => {
  const start = Date.now();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, email: string };
    
    // Fast path: if it's an admin, we might not even need the DB for simple checks
    // But we need the user object for the rest of the app.
    // However, let's at least log where the delay is.
    
    await connectDB();
    const dbConnectTime = Date.now() - start;

    const user = await User.findById(decoded.id).select('-password -password_hash').lean();
    
    const totalTime = Date.now() - start;
    if (totalTime > 1000) {
      console.warn(`[verifyToken] Warning: Slow fetch for ${decoded.id}: ${totalTime}ms (Connect: ${dbConnectTime}ms)`);
    }

    if (!user) {
      // If user not in DB but token is valid, maybe it's a deleted user or stale DB
      // Return the token info as a fallback if we really need to
      return { user: { id: decoded.id, email: decoded.email } as any };
    }
    return { user: { ...user, _id: user._id.toString() } as any };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        console.log("Token invalid or expired");
        return null;
    }
    
    // For other errors (database timeouts, etc), re-throw so the caller can return a 500
    console.error("Critical error in verifyToken:", error);
    throw error;
  }
};