"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { getUserId, verifyPassword, updatePassword, destroySession } from "@/lib/auth";
import { uploadFile, removeFile } from "@/lib/storage";

export async function updateDisplayName(
  displayName: string
): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  const trimmed = displayName.trim();
  if (!trimmed) return { error: "Display name cannot be empty" };
  if (trimmed.length > 100) return { error: "Display name is too long" };

  await query("UPDATE profiles SET display_name = $1 WHERE id = $2", [
    trimmed,
    userId,
  ]);

  revalidatePath("/dashboard", "layout");
  return {};
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ error?: string; url?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "Image must be under 2 MB" };
  }

  const ext = file.name.split(".").pop() ?? "png";
  const key = `${userId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const publicUrl = await uploadFile("avatars", key, buffer, { upsert: true });

  await query(
    "UPDATE profiles SET avatar_url = $1 WHERE id = $2",
    [`${publicUrl}?t=${Date.now()}`, userId]
  );

  revalidatePath("/dashboard", "layout");
  return { url: publicUrl };
}

export async function removeAvatar(): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  const profile = await queryOne<{ avatar_url: string | null }>(
    "SELECT avatar_url FROM profiles WHERE id = $1",
    [userId]
  );

  if (profile?.avatar_url) {
    try {
      const url = new URL(profile.avatar_url.split("?")[0]);
      const pathParts = url.pathname.split("/avatars/");
      if (pathParts[1]) {
        await removeFile("avatars", decodeURIComponent(pathParts[1]));
      }
    } catch {
      // Best-effort cleanup
    }
  }

  await query("UPDATE profiles SET avatar_url = NULL WHERE id = $1", [userId]);

  revalidatePath("/dashboard", "layout");
  return {};
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  const user = await queryOne<{ email: string }>(
    "SELECT email FROM users WHERE id = $1",
    [userId]
  );
  if (!user) return { error: "Not authenticated" };

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const verified = await verifyPassword(user.email, currentPassword);
  if (!verified) return { error: "Current password is incorrect" };

  await updatePassword(userId, newPassword);
  return {};
}

export async function deleteAccount(): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  await query(
    "UPDATE profiles SET deleted_at = NOW() WHERE id = $1",
    [userId]
  );

  await destroySession();
  redirect("/");
}
