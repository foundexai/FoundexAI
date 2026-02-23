import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing");

declare global {
  // allow global caching in dev
  var mongoose: any;
}
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // 10s for initial selection
      socketTimeoutMS: 45000,
      family: 4,
    };

    console.log("=> MongoDB: Attempting to connect...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("=> MongoDB: Connected successfully");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("=> MongoDB: Connection failed", e);
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}