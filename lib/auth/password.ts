import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const keyLength = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, keyLength)) as Buffer;

  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const key = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const storedKey = Buffer.from(hash, "hex");

  if (key.length !== storedKey.length) {
    return false;
  }

  return timingSafeEqual(key, storedKey);
}
