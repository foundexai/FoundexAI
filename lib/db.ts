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
      serverSelectionTimeoutMS: 20000, // 20 seconds
      socketTimeoutMS: 45000,        // 45 seconds
      connectTimeoutMS: 20000,       // 20 seconds
      heartbeatFrequencyMS: 10000,   // 10 seconds
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("=> MongoDB: New connection established");
      return mongoose;
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