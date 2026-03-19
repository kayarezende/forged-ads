import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function publicUrl(filePath: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/${filePath}`;
}

export async function uploadFile(
  bucket: string,
  key: string,
  data: Buffer | Uint8Array,
  _opts?: { upsert?: boolean }
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, bucket, path.dirname(key));
  await ensureDir(dir);
  const filePath = path.join(UPLOAD_DIR, bucket, key);
  await fs.writeFile(filePath, data);
  return publicUrl(path.join(UPLOAD_DIR, bucket, key));
}

export async function removeFile(
  bucket: string,
  key: string
): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, bucket, key);
  try {
    await fs.unlink(filePath);
  } catch {
    // Best-effort — file may not exist
  }
}

export function generateKey(prefix: string, ext: string): string {
  const id = crypto.randomUUID();
  return `${prefix}/${id}.${ext}`;
}
