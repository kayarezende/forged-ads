"use client";

import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function ColorPicker({ value, onChange, id }: ColorPickerProps) {
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={isValidHex ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
      />
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          let v = e.target.value;
          if (!v.startsWith("#")) v = "#" + v;
          onChange(v.slice(0, 7));
        }}
        placeholder="#000000"
        className="font-mono"
      />
    </div>
  );
}
