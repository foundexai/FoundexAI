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
  try {
    await connectDB();
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      // If user not found, token is invalid
      return null;
    }
    return { user };
  } catch (error) {
    console.error("Error in verifyToken:", error);
    // If any error occurs (e.g., token expired, malformed), token is invalid
    return null;
  }
};