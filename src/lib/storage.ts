import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function publicUrl(filePath: string): string {
  return `${PUBLIC_URL}/${filePath}`;
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

/**
 * Save a file to local disk storage.
 * Returns the public URL to access it.
 */
export async function saveFile(
  buffer: Buffer,
  opts: {
    directory: string;
    filename?: string;
    extension?: string;
  }
): Promise<string> {
  const ext = opts.extension ?? "png";
  const filename = opts.filename ?? `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(UPLOAD_DIR, opts.directory);

  await ensureDir(dir);
  await fs.writeFile(path.join(dir, filename), buffer);

  return `${PUBLIC_URL}/uploads/${opts.directory}/${filename}`;
}

/**
 * Convert a public URL back to the local filesystem path.
 * E.g. "http://localhost:3000/uploads/campaigns/abc.png" → "uploads/campaigns/abc.png"
 */
export function urlToLocalPath(url: string): string {
  const prefix = `${PUBLIC_URL}/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  // Already a relative path
  if (!url.startsWith("http")) {
    return url;
  }
  // Fallback: extract path from URL
  const parsed = new URL(url);
  return parsed.pathname.replace(/^\//, "");
}

/**
 * Save a base64-encoded file to local disk.
 */
export async function saveBase64File(
  base64Data: string,
  opts: {
    directory: string;
    filename?: string;
    extension?: string;
  }
): Promise<string> {
  const raw = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(raw, "base64");
  return saveFile(buffer, opts);
}
