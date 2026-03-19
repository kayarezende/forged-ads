"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/app/actions/settings";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setMessage(null);

    const result = await changePassword(currentPassword, newPassword);
    setSaving(false);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your account password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}
        </div>

        {message && (
          <p
            className={
              message.type === "error"
                ? "text-sm text-destructive"
                : "text-sm text-emerald-500"
            }
          >
            {message.text}
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? "Updating\u2026" : "Update Password"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
