import { getCurrentUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { Separator } from "@/components/ui/separator";
import type { Profile } from "@/types";
import { ProfileForm } from "@/components/settings/profile-form";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { PasswordForm } from "@/components/settings/password-form";
import { DeleteAccount } from "@/components/settings/delete-account";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const p = await queryOne<Pick<Profile, "display_name" | "avatar_url" | "email">>(
    `SELECT display_name, avatar_url, email FROM profiles WHERE id = $1`,
    [user.id]
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <AvatarUpload
        avatarUrl={p?.avatar_url ?? null}
        displayName={p?.display_name ?? null}
        email={p?.email ?? user.email ?? ""}
      />

      <Separator />

      <ProfileForm
        displayName={p?.display_name ?? ""}
        email={p?.email ?? user.email ?? ""}
      />

      <Separator />

      <PasswordForm />

      <Separator />

      <DeleteAccount />
    </div>
  );
}
