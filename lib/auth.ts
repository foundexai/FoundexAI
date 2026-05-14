import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;
export const hashPassword = (pwd:string) => bcrypt.hash(pwd, 10);
export const comparePassword = (pwd:string, hash:string) => bcrypt.compare(pwd, hash);
export const signToken = (payload:{id:string, email:string, full_name?:string, is_admin?:boolean}) => 
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

const ADMIN_EMAILS = [
  "almussanplanner12@gmail.com",
  "sophzine@gmail.com",
  "Demo@foundex.ai",
  "Interndemo1@foundex.ai",
  "Interndemo2@foundex.ai",
];

// In-memory cache for verifyToken results to prevent DB thundering herd
const verifyCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

export const isAdmin = (email: string) => ADMIN_EMAILS.includes(email);

export const verifyToken = async (token: string, requireFullUser: boolean = false) => {
  const start = Date.now();
  const cacheKey = `${token}_${requireFullUser}`;

  // Check cache
  const cached = verifyCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, email: string };
    
    // FAST PATH: Return minimal user from token without DB connection
    // NOTE: Callers using this path MUST call connectDB() themselves if they need DB access.
    if (!requireFullUser) {
        const result = { 
            user: { 
                _id: (decoded as any).id, 
                id: (decoded as any).id, 
                email: (decoded as any).email,
                full_name: (decoded as any).full_name || "",
                isAdmin: isAdmin((decoded as any).email) || (decoded as any).is_admin,
                is_admin: isAdmin((decoded as any).email) || (decoded as any).is_admin
            } as any 
        };
        verifyCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    }

    // FULL PATH: Connect to DB and fetch fresh user record
    await connectDB();
    const dbConnectTime = Date.now() - start;

    const user = await User.findById(decoded.id).select('-password -password_hash').lean();
    
    const totalTime = Date.now() - start;
    if (totalTime > 1000) {
      console.warn(`[verifyToken] Warning: Slow fetch for ${decoded.id}: ${totalTime}ms (Connect: ${dbConnectTime}ms)`);
    }

    if (!user) {
      const result = { 
          user: { 
              _id: (decoded as any).id, 
              id: (decoded as any).id, 
              email: (decoded as any).email,
              full_name: (decoded as any).full_name || "",
              isAdmin: isAdmin((decoded as any).email) || (decoded as any).is_admin,
              is_admin: isAdmin((decoded as any).email) || (decoded as any).is_admin
          } as any 
      };
      verifyCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
    const finalUser = { 
        ...user, 
        _id: user._id.toString(), 
        isAdmin: isAdmin(user.email) || user.is_admin,
        is_admin: isAdmin(user.email) || user.is_admin
    };
    const finalResult = { user: finalUser as any };
    verifyCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
    return finalResult;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        console.log("Token invalid or expired");
        return null;
    }
    
    console.error("Critical error in verifyToken:", error);
    throw error;
  }
};