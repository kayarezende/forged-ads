"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(
  displayName: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = displayName.trim();
  if (!trimmed) return { error: "Display name cannot be empty" };
  if (trimmed.length > 100) return { error: "Display name is too long" };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return {};
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "Image must be under 2 MB" };
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard", "layout");
  return { url: publicUrl };
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    try {
      const url = new URL(profile.avatar_url.split("?")[0]);
      const pathParts = url.pathname.split("/avatars/");
      if (pathParts[1]) {
        await supabase.storage
          .from("avatars")
          .remove([decodeURIComponent(pathParts[1])]);
      }
    } catch {
      // Best-effort cleanup
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return {};
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Not authenticated" };

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) return { error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) return { error: error.message };
  return {};
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Soft delete — set deleted_at on profile
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/");
}
