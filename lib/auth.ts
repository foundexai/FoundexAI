import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
export const hashPassword = (pwd:string) => bcrypt.hash(pwd, 10);
export const comparePassword = (pwd:string, hash:string) => bcrypt.compare(pwd, hash);
export const signToken = (payload:{id:string,email:string}) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
export const verifyToken = (token:string) => jwt.verify(token, JWT_SECRET) as any;