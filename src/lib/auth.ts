import { cookies } from "next/headers";
import { query, queryOne } from "./db";
import bcrypt from "bcryptjs";
import type { Profile } from "@/types";

const SESSION_COOKIE = "session_token";
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

interface SessionUser {
  id: string;
  email: string;
  display_name: string | null;
}

/**
 * Get the current user from session cookie.
 * Falls back to default admin user if no session (no auth wall).
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    const session = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM public.sessions
       WHERE token = $1 AND expires_at > now()`,
      [sessionToken]
    );

    if (session) {
      const user = await queryOne<SessionUser>(
        `SELECT id, email, display_name FROM public.users WHERE id = $1`,
        [session.user_id]
      );
      if (user) return user;
    }
  }

  // No auth wall — fall back to default user
  const user = await queryOne<SessionUser>(
    `SELECT id, email, display_name FROM public.users WHERE id = $1`,
    [DEFAULT_USER_ID]
  );

  return user ?? { id: DEFAULT_USER_ID, email: "admin@forgedads.local", display_name: "Admin" };
}

/**
 * Get the current user's profile with subscription/credit info.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  return queryOne<Profile>(
    `SELECT * FROM public.profiles WHERE id = $1`,
    [user.id]
  );
}

/**
 * Get just the user ID (lightweight — for API routes).
 */
export async function getUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.id;
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
