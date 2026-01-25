"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Wand2 } from "lucide-react";
import {
  PostAction,
  ACTION_NAME_PRESETS,
  LAYER_NAME_PRESETS,
} from "@/lib/types/render-asset";

interface PostActionsEditorProps {
  /** The PSD file key (S3 path) this editor manages */
  psdKey: string;
  /** Whether the component should be disabled */
  disabled?: boolean;
}

// Convert preset arrays to ComboboxOption format
const actionNameOptions: ComboboxOption[] = ACTION_NAME_PRESETS.map((name) => ({
  value: name,
  label: name,
}));

const layerNameOptions: ComboboxOption[] = LAYER_NAME_PRESETS.map((name) => ({
  value: name,
  label: name,
}));

export function PostActionsEditor({ psdKey, disabled = false }: PostActionsEditorProps) {
  const [postActions, setPostActions] = useState<PostAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing post actions for this PSD key
  const fetchPostActions = useCallback(async () => {
    if (!psdKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/render-assets/${encodeURIComponent(psdKey)}`);

      if (response.status === 404) {
        // No render asset exists yet for this PSD
        setPostActions([]);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch post actions");
      }

      const data = await response.json();
      setPostActions(data.postActions || []);
    } catch (error) {
      console.error("Error fetching post actions:", error);
      // Don't show error toast - it's normal for new PSDs to not have render assets
    } finally {
      setLoading(false);
    }
  }, [psdKey]);

  useEffect(() => {
    fetchPostActions();
  }, [fetchPostActions]);

  // Save post actions to the API
  const savePostActions = async () => {
    if (!psdKey) {
      toast.error("Cannot save: No PSD file key specified");
      return;
    }

    try {
      setSaving(true);

      // Filter out empty actions
      const validActions = postActions.filter(
        (action) => action.layerName.trim() && action.actionName.trim()
      );

      const response = await fetch(`/api/render-assets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: psdKey,
          postActions: validActions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save post actions");
      }

      setPostActions(validActions);
      setHasChanges(false);
      toast.success("Post actions saved successfully");
    } catch (error) {
      console.error("Error saving post actions:", error);
      toast.error("Failed to save post actions");
    } finally {
      setSaving(false);
    }
  };

  // Add a new empty action
  const handleAddAction = () => {
    setPostActions([...postActions, { layerName: "", actionName: "" }]);
    setHasChanges(true);
  };

  // Remove an action by index
  const handleRemoveAction = (index: number) => {
    const newActions = postActions.filter((_, i) => i !== index);
    setPostActions(newActions);
    setHasChanges(true);
  };

  // Update a specific action field
  const handleActionChange = (
    index: number,
    field: keyof PostAction,
    value: string
  ) => {
    const newActions = [...postActions];
    newActions[index] = { ...newActions[index], [field]: value };
    setPostActions(newActions);
    setHasChanges(true);
  };

  if (!psdKey) {
    return (
      <Card className="border-dashed border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10">
        <CardContent className="py-4">
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
            Upload a PSD file first to configure post actions
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading post actions...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-400">
            Photoshop Post Actions
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Define Photoshop actions to run after rendering this template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {postActions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No post actions configured
          </p>
        ) : (
          <div className="space-y-2">
            {postActions.map((action, index) => (
              <div
                key={index}
                className="flex items-end gap-2 p-2 rounded-md bg-background/50"
              >
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Layer Name</Label>
                  <Combobox
                    options={layerNameOptions}
                    value={action.layerName}
                    onChange={(value) =>
                      handleActionChange(index, "layerName", value)
                    }
                    placeholder="Select or type layer..."
                    disabled={disabled}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Action Name</Label>
                  <Combobox
                    options={actionNameOptions}
                    value={action.actionName}
                    onChange={(value) =>
                      handleActionChange(index, "actionName", value)
                    }
                    placeholder="Select or type action..."
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveAction(index)}
                  disabled={disabled}
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAction}
            disabled={disabled}
            className="flex-1"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Action
          </Button>
          {hasChanges && (
            <Button
              type="button"
              size="sm"
              onClick={savePostActions}
              disabled={disabled || saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Actions"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
