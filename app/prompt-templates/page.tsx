"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PromptTemplate } from "@/lib/types/prompt-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function PromptTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PromptTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/prompt-templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load prompt templates");
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((template) =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredTemplates(filtered);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddNew = async () => {
    try {
      setCreating(true);
      const response = await fetch("/api/prompt-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Untitled Template",
          description: "Add a description when ready",
        }),
      });

      if (!response.ok) throw new Error("Failed to create template");

      const data = await response.json();
      toast.success("Template created successfully");
      router.push(`/prompt-templates/${data.promptId}`);
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  const handlePublishToggle = async (promptId: string, checked: boolean) => {
    try {
      const response = await fetch(`/api/prompt-templates/${promptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: checked }),
      });

      if (!response.ok) throw new Error("Failed to update");

      // Update local state
      setTemplates(
        templates.map((t) =>
          t.promptId === promptId ? { ...t, published: checked } : t
        )
      );

      toast.success(checked ? "Template published" : "Template unpublished");
    } catch (error) {
      console.error("Error updating published status:", error);
      toast.error("Failed to update published status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading prompt templates...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Templates</h1>
          <p className="text-muted-foreground">
            Manage AI prompt templates for image generation
          </p>
        </div>
        <Button onClick={handleAddNew} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Creating..." : "Add New Template"}
        </Button>
      </div>

      {/* Search Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchQuery
                    ? "No templates found matching your search"
                    : "No templates yet. Create your first template!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.promptId}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {template.description}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={template.published}
                      onCheckedChange={(checked) =>
                        handlePublishToggle(template.promptId, checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(template.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" asChild>
                      <Link href={`/prompt-templates/${template.promptId}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>
    </div>
  );
}
