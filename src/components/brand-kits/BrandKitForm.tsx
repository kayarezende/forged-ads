"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "./ColorPicker";
import { createBrandKit, updateBrandKit } from "@/app/actions/brand-kits";
import type { BrandKit } from "@/types";
import { Loader2, Upload, X, ArrowLeft } from "lucide-react";

const FONT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Oswald", label: "Oswald" },
  { value: "Raleway", label: "Raleway" },
  { value: "Merriweather", label: "Merriweather" },
];

interface BrandKitFormProps {
  brandKit?: BrandKit;
}

export function BrandKitForm({ brandKit }: BrandKitFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!brandKit;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(brandKit?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(brandKit?.logo_url ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(
    brandKit?.primary_color ?? "#000000"
  );
  const [secondaryColor, setSecondaryColor] = useState(
    brandKit?.secondary_color ?? "#666666"
  );
  const [accentColor, setAccentColor] = useState(
    brandKit?.accent_color ?? "#3b82f6"
  );
  const [backgroundColor, setBackgroundColor] = useState(
    brandKit?.background_color ?? "#ffffff"
  );
  const [fontHeading, setFontHeading] = useState(
    brandKit?.font_heading ?? "default"
  );
  const [fontBody, setFontBody] = useState(brandKit?.font_body ?? "default");
  const [brandVoice, setBrandVoice] = useState(brandKit?.brand_voice ?? "");
  const [isDefault, setIsDefault] = useState(brandKit?.is_default ?? false);

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be under 5MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    setLogoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadLogo(file: File): Promise<string> {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("brand-logos")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from("brand-logos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        finalLogoUrl = await uploadLogo(logoFile);
      }

      const input = {
        name: name.trim(),
        logo_url: finalLogoUrl || null,
        primary_color: primaryColor || null,
        secondary_color: secondaryColor || null,
        accent_color: accentColor || null,
        background_color: backgroundColor || null,
        font_heading:
          fontHeading === "default" ? null : fontHeading || null,
        font_body: fontBody === "default" ? null : fontBody || null,
        brand_voice: brandVoice.trim() || null,
        is_default: isDefault,
      };

      const result = isEditing
        ? await updateBrandKit(brandKit.id, input)
        : await createBrandKit(input);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      toast.success(isEditing ? "Brand kit updated" : "Brand kit created");
      router.push("/dashboard/brand-kits");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  }

  const currentLogo = logoPreview ?? logoUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/dashboard/brand-kits" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? "Edit Brand Kit" : "Create Brand Kit"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update your brand identity settings"
              : "Set up a new brand identity for your ad creatives"}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Brand"
          disabled={submitting}
          required
        />
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo</Label>
        {currentLogo ? (
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
              <Image
                src={currentLogo}
                alt="Brand logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={submitting}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center hover:border-primary/50 hover:bg-muted/50"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload logo (max 5MB)
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoSelect}
          disabled={submitting}
        />
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label>Brand Colors</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="primary-color"
              className="text-xs text-muted-foreground"
            >
              Primary
            </Label>
            <ColorPicker
              id="primary-color"
              value={primaryColor}
              onChange={setPrimaryColor}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="secondary-color"
              className="text-xs text-muted-foreground"
            >
              Secondary
            </Label>
            <ColorPicker
              id="secondary-color"
              value={secondaryColor}
              onChange={setSecondaryColor}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="accent-color"
              className="text-xs text-muted-foreground"
            >
              Accent
            </Label>
            <ColorPicker
              id="accent-color"
              value={accentColor}
              onChange={setAccentColor}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="background-color"
              className="text-xs text-muted-foreground"
            >
              Background
            </Label>
            <ColorPicker
              id="background-color"
              value={backgroundColor}
              onChange={setBackgroundColor}
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-3">
        <Label>Typography</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="font-heading"
              className="text-xs text-muted-foreground"
            >
              Heading Font
            </Label>
            <Select
              value={fontHeading}
              onValueChange={(v) => setFontHeading(v ?? "default")}
              disabled={submitting}
            >
              <SelectTrigger id="font-heading">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="font-body"
              className="text-xs text-muted-foreground"
            >
              Body Font
            </Label>
            <Select
              value={fontBody}
              onValueChange={(v) => setFontBody(v ?? "default")}
              disabled={submitting}
            >
              <SelectTrigger id="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Brand Voice */}
      <div className="space-y-2">
        <Label htmlFor="brand-voice">Brand Voice</Label>
        <textarea
          id="brand-voice"
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          placeholder="Describe your brand's tone and personality..."
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={1000}
          disabled={submitting}
        />
      </div>

      {/* Default Toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          disabled={submitting}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <div>
          <span className="text-sm font-medium">Set as default</span>
          <p className="text-xs text-muted-foreground">
            Use this brand kit by default when creating new ads
          </p>
        </div>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Brand Kit"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          render={<Link href="/dashboard/brand-kits" />}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
