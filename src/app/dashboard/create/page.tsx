"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandKitSelector } from "@/components/BrandKitSelector";
import { AspectRatioSelector } from "@/components/AspectRatioSelector";
import type { AspectRatio } from "@/types";
import {
  Loader2,
  Download,
  RefreshCw,
  Sparkles,
  Wand2,
  ImageIcon,
  Video,
} from "lucide-react";

type ContentMode = "image" | "video";
type VideoAspectRatio = "16:9" | "9:16";

interface GenerationResult {
  id: string;
  outputUrl: string;
  status: string;
  generationTimeMs: number;
}

const VIDEO_ASPECT_RATIOS: { value: VideoAspectRatio; label: string }[] = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
];

const VIDEO_RATIO_DIMS: Record<VideoAspectRatio, { w: number; h: number }> = {
  "16:9": { w: 28, h: 16 },
  "9:16": { w: 16, h: 28 },
};

export default function CreatePage() {
  const [contentMode, setContentMode] = useState<ContentMode>("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [videoAspectRatio, setVideoAspectRatio] =
    useState<VideoAspectRatio>("16:9");
  const [brandKitId, setBrandKitId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollMessage, setPollMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Clean up polling on unmount
  useEffect(() => stopPolling, [stopPolling]);

  function pollVideoStatus(generationId: string) {
    setPollMessage("Video is being generated (this may take 30–120s)...");
    let elapsed = 0;

    pollRef.current = setInterval(async () => {
      elapsed += 3;
      try {
        const res = await fetch(
          `/api/generate/video/${generationId}/status`
        );
        const data = await res.json();

        if (data.status === "completed") {
          stopPolling();
          setGenerating(false);
          setPollMessage(null);
          setResult({
            id: generationId,
            outputUrl: data.outputUrl,
            status: "completed",
            generationTimeMs: data.generationTimeMs,
          });
        } else if (data.status === "failed") {
          stopPolling();
          setGenerating(false);
          setPollMessage(null);
          setError(data.error ?? "Video generation failed");
        } else {
          // Still generating — update message with elapsed time
          setPollMessage(
            `Video is being generated... ${elapsed}s elapsed`
          );
        }
      } catch {
        // Network error during poll — keep trying
        setPollMessage(
          `Video is being generated... ${elapsed}s (reconnecting)`
        );
      }
    }, 3000);
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError(null);
    setResult(null);
    setPollMessage(null);
    stopPolling();

    try {
      if (contentMode === "video") {
        const res = await fetch("/api/generate/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            aspectRatio: videoAspectRatio,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Video generation failed");
          setGenerating(false);
          return;
        }

        // Start polling for video completion
        pollVideoStatus(data.id);
      } else {
        const res = await fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            aspectRatio,
            brandKitId: brandKitId || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Generation failed");
          setGenerating(false);
          return;
        }

        setResult(data as GenerationResult);
        setGenerating(false);
      }
    } catch {
      setError("Network error — please try again");
      setGenerating(false);
    }
  }

  function handleRegenerate() {
    setResult(null);
    handleGenerate();
  }

  function handleDownload() {
    if (!result?.outputUrl) return;
    const ext = contentMode === "video" ? "mp4" : "png";
    const a = document.createElement("a");
    a.href = result.outputUrl;
    a.download = `forged-${result.id}.${ext}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  const canGenerate = prompt.trim().length > 0 && !generating;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate ad creatives with AI
        </p>
      </div>

      {/* Mode Toggle: Image / Video */}
      <div className="mb-6 flex gap-2" role="radiogroup" aria-label="Content type">
        <button
          type="button"
          role="radio"
          aria-checked={contentMode === "image"}
          onClick={() => {
            setContentMode("image");
            setResult(null);
            setError(null);
            stopPolling();
            setGenerating(false);
          }}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            contentMode === "image"
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={contentMode === "video"}
          onClick={() => {
            setContentMode("video");
            setResult(null);
            setError(null);
            stopPolling();
            setGenerating(false);
          }}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            contentMode === "video"
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          <Video className="h-4 w-4" />
          Video
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
            5 credits
          </span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Controls */}
        <div>
          {contentMode === "image" ? (
            <Tabs defaultValue="freeform" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="guided" className="flex-1 gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" />
                  Guided
                </TabsTrigger>
                <TabsTrigger value="freeform" className="flex-1 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Freeform
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guided">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Guided Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Choose a template to generate with guided variable inputs.
                    </p>
                    <Link
                      href="/dashboard/templates"
                      className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Browse Templates
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="freeform" className="space-y-4">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the ad creative you want to generate..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    maxLength={2000}
                    disabled={generating}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {prompt.length}/2000
                  </p>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <AspectRatioSelector
                    value={aspectRatio}
                    onValueChange={setAspectRatio}
                    disabled={generating}
                  />
                </div>

                {/* Brand Kit */}
                <div className="space-y-2">
                  <Label>Brand Kit (optional)</Label>
                  <BrandKitSelector
                    value={brandKitId}
                    onValueChange={setBrandKitId}
                    disabled={generating}
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>

                {/* Error */}
                {error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            /* Video Mode Controls */
            <div className="space-y-4">
              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="video-prompt">Prompt</Label>
                <textarea
                  id="video-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video ad you want to generate..."
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  maxLength={2000}
                  disabled={generating}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {prompt.length}/2000
                </p>
              </div>

              {/* Video Aspect Ratio (16:9 or 9:16 only) */}
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <div
                  className="flex gap-2"
                  role="radiogroup"
                  aria-label="Video aspect ratio"
                >
                  {VIDEO_ASPECT_RATIOS.map((r) => {
                    const dims = VIDEO_RATIO_DIMS[r.value];
                    const selected = r.value === videoAspectRatio;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={r.label}
                        onClick={() => setVideoAspectRatio(r.value)}
                        disabled={generating}
                        className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                          selected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        } ${generating ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <span
                          className={`rounded-sm border ${
                            selected
                              ? "border-primary bg-primary/20"
                              : "border-muted-foreground/30 bg-muted"
                          }`}
                          style={{ width: dims.w, height: dims.h }}
                        />
                        <span className="font-medium">{r.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Generate Video (5 credits)
                  </>
                )}
              </Button>

              {/* Error */}
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Video generation requires a Pro or Business plan. Videos take 30–120 seconds to generate.
              </p>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {generating && (
                <div className="flex flex-col items-center justify-center gap-3 p-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {pollMessage ??
                      (contentMode === "video"
                        ? "Submitting video generation..."
                        : "Generating your image...")}
                  </p>
                </div>
              )}

              {!generating && result && (
                <div className="space-y-0">
                  {contentMode === "video" ? (
                    <div className="relative aspect-video w-full bg-muted">
                      <video
                        src={result.outputUrl}
                        controls
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-square w-full bg-muted">
                      <Image
                        src={result.outputUrl}
                        alt="Generated ad creative"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Generated in{" "}
                      {(result.generationTimeMs / 1000).toFixed(1)}s
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!generating && !result && (
                <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
                  {contentMode === "video" ? (
                    <Video className="h-8 w-8 text-muted-foreground/50" />
                  ) : (
                    <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    Your generated {contentMode} will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
