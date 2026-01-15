import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import { config } from "dotenv";

config({ path: ".env" });

// Configure WebSocket for serverless environments (Node.js)
// eslint-disable-next-line @typescript-eslint/no-require-imports
neonConfig.webSocketConstructor = require("ws");

// Create pool with longer connection timeout for cold starts
const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    connectionTimeoutMillis: 10000, // 10 seconds - helps with cold starts
    max: 10, // max connections in pool
});

export const db = drizzle(pool, { schema });