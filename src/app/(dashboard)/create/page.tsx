"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASPECT_RATIOS, type AspectRatio } from "@/types";
import { Loader2, Download, RefreshCw, Sparkles, Wand2 } from "lucide-react";

interface GenerationResult {
  id: string;
  outputUrl: string;
  status: string;
  generationTimeMs: number;
}

interface BrandKitOption {
  id: string;
  name: string;
}

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [brandKitId, setBrandKitId] = useState<string>("");
  const [brandKits, setBrandKits] = useState<BrandKitOption[]>([]);
  const [brandKitsLoaded, setBrandKitsLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lazy-load brand kits on first interaction
  const loadBrandKits = useCallback(async () => {
    if (brandKitsLoaded) return;
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("brand_kits")
        .select("id, name")
        .order("is_default", { ascending: false });
      setBrandKits(data ?? []);
      setBrandKitsLoaded(true);
    } catch {
      // Non-critical — brand kits are optional
    }
  }, [brandKitsLoaded]);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
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
        return;
      }

      setResult(data as GenerationResult);
    } catch {
      setError("Network error — please try again");
    } finally {
      setGenerating(false);
    }
  }

  function handleRegenerate() {
    setResult(null);
    handleGenerate();
  }

  function handleDownload() {
    if (!result?.outputUrl) return;
    const a = document.createElement("a");
    a.href = result.outputUrl;
    a.download = `forged-${result.id}.png`;
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Controls */}
        <div>
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
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Template-based generation coming soon. Use Freeform mode to
                    get started.
                  </p>
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
                <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                <Select
                  value={aspectRatio}
                  onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                  disabled={generating}
                >
                  <SelectTrigger id="aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Kit */}
              <div className="space-y-2">
                <Label htmlFor="brand-kit">Brand Kit (optional)</Label>
                <Select
                  value={brandKitId}
                  onValueChange={(v) => setBrandKitId(v ?? "")}
                  disabled={generating}
                  onOpenChange={(open) => {
                    if (open) loadBrandKits();
                  }}
                >
                  <SelectTrigger id="brand-kit">
                    <SelectValue placeholder="No brand kit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No brand kit</SelectItem>
                    {brandKits.map((kit) => (
                      <SelectItem key={kit.id} value={kit.id}>
                        {kit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        </div>

        {/* Right: Preview */}
        <div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {generating && (
                <div className="flex flex-col items-center justify-center gap-3 p-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Generating your image...
                  </p>
                </div>
              )}

              {!generating && result && (
                <div className="space-y-0">
                  <div className="relative aspect-square w-full bg-muted">
                    <Image
                      src={result.outputUrl}
                      alt="Generated ad creative"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
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
                  <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Your generated image will appear here
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
