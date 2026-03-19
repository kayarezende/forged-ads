"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrandKitSelector } from "@/components/BrandKitSelector";
import { Loader2, Download, RefreshCw, Sparkles, ArrowLeft, Clock } from "lucide-react";
import type { Template, TemplateVariable } from "@/types";

interface GenerationResult {
  id: string;
  outputUrl: string;
  status: string;
  generationTimeMs: number;
}

export function GuidedFlow({ template }: { template: Template }) {
  const router = useRouter();

  // Initialize variable values from defaults
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of template.variables) {
      initial[v.name] = v.default ?? "";
    }
    return initial;
  });

  const [brandKitId, setBrandKitId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setRateLimitCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  function setVariable(name: string, value: string) {
    setVariables((prev) => ({ ...prev, [name]: value }));
  }

  // Check all required fields (no default and no options) have values
  const allFilled = template.variables.every((v) => {
    const val = variables[v.name];
    // Fields with options always have a value (from default or selection)
    if (v.type === "select" && v.options?.length) return true;
    return val !== undefined && val.trim().length > 0;
  });

  async function handleGenerate() {
    if (!allFilled || rateLimitCountdown > 0) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          variables,
          aspectRatio: template.aspect_ratio,
          brandKitId: brandKitId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = data.retryAfter ?? parseInt(res.headers.get("Retry-After") ?? "60", 10);
          startCountdown(retryAfter);
          toast.error("Rate limit exceeded", {
            description: `Please wait ${retryAfter} seconds before generating again.`,
          });
        } else if (res.status === 402) {
          toast.error("Insufficient credits", {
            description: "Top up your credits to continue generating.",
          });
        } else {
          toast.error(data.error ?? "Generation failed");
        }
        setError(data.error ?? "Generation failed");
        return;
      }

      setResult(data as GenerationResult);
      toast.success("Image generated successfully");
    } catch {
      setError("Network error — please try again");
      toast.error("Network error", {
        description: "Please check your connection and try again.",
      });
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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/templates")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Templates
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {template.name}
          </h1>
          <Badge variant="secondary">{template.aspect_ratio}</Badge>
        </div>
        {template.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {template.description}
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Variable form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.variables.map((v) => (
                <VariableField
                  key={v.name}
                  variable={v}
                  value={variables[v.name] ?? ""}
                  onChange={(val) => setVariable(v.name, val)}
                  disabled={generating}
                />
              ))}
            </CardContent>
          </Card>

          {/* Brand Kit selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Kit (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <BrandKitSelector
                value={brandKitId}
                onValueChange={setBrandKitId}
                disabled={generating}
              />
            </CardContent>
          </Card>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!allFilled || generating || rateLimitCountdown > 0}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating...
              </>
            ) : rateLimitCountdown > 0 ? (
              <>
                <Clock className="mr-2 size-4" />
                Wait {rateLimitCountdown}s
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Generate Image
              </>
            )}
          </Button>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Right: Preview */}
        <div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {generating && (
                <div className="flex flex-col items-center justify-center gap-3 p-16">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
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
                      alt={`Generated ${template.name}`}
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
                        <RefreshCw className="mr-1.5 size-3.5" />
                        Regenerate
                      </Button>
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="mr-1.5 size-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!generating && !result && (
                <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
                  <Sparkles className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Fill in the template variables and click Generate
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

function VariableField({
  variable,
  value,
  onChange,
  disabled,
}: {
  variable: TemplateVariable;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  if (variable.type === "select" && variable.options?.length) {
    return (
      <div className="space-y-2">
        <Label htmlFor={variable.name}>{variable.label}</Label>
        <Select
          value={value || variable.options[0]}
          onValueChange={(v) => onChange(v ?? variable.options![0])}
          disabled={disabled}
        >
          <SelectTrigger id={variable.name}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variable.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={variable.name}>{variable.label}</Label>
      <Input
        id={variable.name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={variable.default || `Enter ${variable.label.toLowerCase()}`}
        disabled={disabled}
      />
    </div>
  );
}
