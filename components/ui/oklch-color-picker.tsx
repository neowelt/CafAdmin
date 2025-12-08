"use client";

import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface OklchColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function OklchColorPicker({ label, value, onChange, id }: OklchColorPickerProps) {
  const [hexInput, setHexInput] = useState("#808080");

  useEffect(() => {
    // If the value is already a hex color, use it directly
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setHexInput(value);
    } else {
      // For OKLCH values, set a default
      setHexInput("#808080");
    }
  }, [value]);

  const handleHexChange = (newHex: string) => {
    setHexInput(newHex);
    onChange(newHex);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    setHexInput(input);

    // Only update if it's a valid hex color (with or without #)
    if (/^#?[0-9A-Fa-f]{6}$/.test(input)) {
      if (!input.startsWith("#")) {
        input = "#" + input;
      }
      onChange(input);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={hexInput}
          onChange={handleHexInputChange}
          placeholder="#808080"
          className="flex-1 font-mono uppercase"
          maxLength={7}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-12 h-10 p-0"
              style={{ backgroundColor: hexInput }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 space-y-3">
            <HexColorPicker color={hexInput} onChange={handleHexChange} />
            <div className="space-y-2">
              <Label className="text-xs">Hex Color</Label>
              <Input
                value={hexInput}
                onChange={handleHexInputChange}
                placeholder="#808080"
                className="font-mono text-xs uppercase"
                maxLength={7}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
