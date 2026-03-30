export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const BOT_TOKEN = requiredEnv("BOT_TOKEN");
export const DATABASE_URL = requiredEnv("DATABASE_URL");
