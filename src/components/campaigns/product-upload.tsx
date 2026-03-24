"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2 } from "lucide-react";

interface ProductUploadProps {
  imageUrl: string | null;
  onUploaded: (url: string | null) => void;
  disabled?: boolean;
}

export function ProductUpload({
  imageUrl,
  onUploaded,
  disabled,
}: ProductUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5 MB");
        return;
      }

      setError(null);
      setUploading(true);

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("directory", "campaign-products");

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Upload failed");
          return;
        }

        onUploaded(data.url);
      } catch {
        setError("Upload failed — please try again");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  function handleRemove() {
    onUploaded(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Product Image (optional)</span>

      {imageUrl ? (
        <div className="relative inline-block">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
            <Image
              src={imageUrl}
              alt="Product"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute -right-2 -top-2 rounded-full border bg-background p-1 text-muted-foreground shadow-sm hover:text-foreground"
            aria-label="Remove product image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm transition-colors",
            "text-muted-foreground hover:border-primary/50 hover:text-foreground",
            (disabled || uploading) && "cursor-not-allowed opacity-50"
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span>{uploading ? "Uploading..." : "Drop image or click to upload"}</span>
          <span className="text-xs text-muted-foreground">PNG, JPG up to 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
