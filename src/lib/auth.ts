import { cookies } from "next/headers";
import { query, queryOne } from "./db";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "session_token";

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("Not authenticated");

  const session = await queryOne<{ user_id: string; expires_at: Date }>(
    "SELECT user_id, expires_at FROM sessions WHERE token = $1",
    [token]
  );

  if (!session || new Date(session.expires_at) < new Date()) {
    throw new Error("Not authenticated");
  }

  return session.user_id;
}

export async function getUserIdOrNull(): Promise<string | null> {
  try {
    return await getUserId();
  } catch {
    return null;
  }
}

export async function verifyPassword(
  email: string,
  password: string
): Promise<string | null> {
  const user = await queryOne<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email]
  );
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  return valid ? user.id : null;
}

export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    hash,
    userId,
  ]);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token = $1", [token]);
    cookieStore.delete(SESSION_COOKIE);
  }
}
