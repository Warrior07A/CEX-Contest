import "dotenv/config";

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  console.log(value);
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

export const env = {
  redisUrl: "redis://localhost:6379",
  incomingQueue: process.env.INCOMING_QUEUE ?? "backend-to-engine-broker",
};
