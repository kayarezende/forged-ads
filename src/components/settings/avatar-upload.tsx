"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, Trash2 } from "lucide-react";
import { uploadAvatar, removeAvatar } from "@/app/actions/settings";

export function AvatarUpload({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl: string | null;
  displayName: string | null;
  email: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl);
  const [error, setError] = useState<string | null>(null);

  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? email[0]?.toUpperCase() ?? "?";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadAvatar(formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setPreviewUrl(`${result.url}?t=${Date.now()}`);
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);

    const result = await removeAvatar();
    setRemoving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setPreviewUrl(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Upload a profile picture. Max 2 MB.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="size-16" size="lg">
            {previewUrl && (
              <AvatarImage src={previewUrl} alt={displayName ?? email} />
            )}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload data-icon="inline-start" className="size-3.5" />
                {uploading ? "Uploading\u2026" : "Upload"}
              </Button>
              {previewUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removing}
                  onClick={handleRemove}
                >
                  <Trash2 data-icon="inline-start" className="size-3.5" />
                  {removing ? "Removing\u2026" : "Remove"}
                </Button>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </CardContent>
    </Card>
  );
}
