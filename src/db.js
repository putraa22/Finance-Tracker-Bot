import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { DATABASE_URL } from "./config.js";

export const pool = new Pool({ connectionString: DATABASE_URL });
export const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
