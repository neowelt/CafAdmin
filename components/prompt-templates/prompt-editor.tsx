"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  promptType: 'text' | 'json';
  onPromptTypeChange: (type: 'text' | 'json') => void;
  rows?: number;
}

export function PromptEditor({ value, onChange, promptType, onPromptTypeChange, rows = 10 }: PromptEditorProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleTextChange = (newValue: string) => {
    onChange(newValue);
    setJsonError(null);
  };

  const handleJsonChange = (newValue: string) => {
    onChange(newValue);

    // Validate JSON
    if (newValue.trim()) {
      try {
        JSON.parse(newValue);
        setJsonError(null);
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      }
    } else {
      setJsonError(null);
    }
  };

  const handleTabChange = (tab: string) => {
    onPromptTypeChange(tab as 'text' | 'json');
  };

  const formatJson = () => {
    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        onChange(JSON.stringify(parsed, null, 2));
        setJsonError(null);
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label>Prompt</Label>
      <Tabs value={promptType} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="text">Text Mode</TabsTrigger>
          <TabsTrigger value="json">JSON Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={rows}
            className="font-mono"
          />
          <p className="text-sm text-muted-foreground">
            Enter your AI prompt as plain text
          </p>
        </TabsContent>

        <TabsContent value="json" className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{"prompt": "Your prompt here", "style": "vintage", "parameters": {}}'
            rows={rows + 5}
            className="font-mono text-sm"
          />
          {jsonError && (
            <p className="text-sm text-destructive">JSON Error: {jsonError}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Enter your prompt as structured JSON
            </p>
            <button
              type="button"
              onClick={formatJson}
              className="text-sm text-primary hover:underline"
            >
              Format JSON
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
