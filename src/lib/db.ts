'use server';

import mongoose from "mongoose"

const MONGO_URL = process.env.MONGO_URL as string

if (!MONGO_URL) {
  console.warn("MONGO_URL env var is not set. Database features will be disabled.")
}

let cached = (global as any)._mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }

if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null }
}

export async function dbConnect() {
  if (!MONGO_URL) return null
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URL, { dbName: "sendgrid_mailer" })
  }
  cached.conn = await cached.promise
  return cached.conn
}
