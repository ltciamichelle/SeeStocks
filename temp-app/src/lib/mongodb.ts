import dns from "dns";
import mongoose from "mongoose";

// Optional local DNS workaround for development on restricted local networks
if (process.env.NODE_ENV === "development" && process.env.LOCAL_DNS_SERVERS) {
  try {
    const servers = process.env.LOCAL_DNS_SERVERS.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length > 0) {
      dns.setServers(servers);
    }
  } catch {
    // Ignore in environments where setServers is restricted
  }
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB Atlas with Mongoose.
 * Reuses the existing connection across serverless / route handler requests.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing in environment variables");

  if (cached.conn) {
    return cached.conn;
  }

  const directReplicaUri = process.env.MONGODB_URI_DIRECT?.trim();

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = (async () => {
      try {
        const mongooseInstance = await mongoose.connect(uri, opts);
        console.log("Mongoose successfully connected to MongoDB Atlas!");
        return mongooseInstance;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("querySrv") && directReplicaUri) {
          console.warn("SRV resolution failed; falling back to MONGODB_URI_DIRECT...");
          const mongooseInstance = await mongoose.connect(directReplicaUri, opts);
          console.log("Mongoose successfully connected via MONGODB_URI_DIRECT!");
          return mongooseInstance;
        }
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
