"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateDisplayName } from "@/app/actions/settings";

export function ProfileForm({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await updateDisplayName(name);
    setSaving(false);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Display name updated." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your public display information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-muted-foreground">
            Email is managed by your authentication provider and cannot be changed here.
          </p>
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
          <Button onClick={handleSave} disabled={saving || name === displayName}>
            {saving ? "Saving\u2026" : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
