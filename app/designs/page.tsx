"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Design } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"CreatedDate" | "TemplateName">("CreatedDate");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesigns();
  }, []);

  useEffect(() => {
    filterAndSortDesigns();
  }, [designs, searchQuery, sortBy]);

  const fetchDesigns = async () => {
    try {
      const response = await fetch("/api/designs");
      if (!response.ok) throw new Error("Failed to fetch designs");
      const data = await response.json();
      setDesigns(data);
    } catch (error) {
      console.error("Error fetching designs:", error);
      toast.error("Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDesigns = () => {
    let filtered = [...designs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((design) =>
        design.templateName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "TemplateName") {
        return a.templateName.localeCompare(b.templateName);
      } else {
        // Sort by creation date (newest first)
        const dateA = getCreatedDateFromId(String(a._id));
        const dateB = getCreatedDateFromId(String(b._id));
        return dateB.getTime() - dateA.getTime();
      }
    });

    setFilteredDesigns(filtered);
  };

  // Extract timestamp from MongoDB ObjectId
  const getCreatedDateFromId = (id: string): Date => {
    try {
      if (!id || id.length < 8) return new Date(0);
      const timestampHex = id.substring(0, 8);
      const timestamp = parseInt(timestampHex, 16);
      return new Date(timestamp * 1000);
    } catch {
      return new Date(0);
    }
  };

  const formatDate = (id: string): string => {
    const date = getCreatedDateFromId(id);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading designs...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Designs</h1>
          <p className="text-muted-foreground">
            Manage cover art design templates
          </p>
        </div>
        <Button asChild>
          <Link href="/designs/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Design
          </Link>
        </Button>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CreatedDate">Created Date (Newest)</SelectItem>
            <SelectItem value="TemplateName">Template Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Designs Table */}
      {filteredDesigns.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No designs match your search criteria."
              : "No designs found."}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link href="/designs/add">
                <Plus className="mr-2 h-4 w-4" />
                Create your first design
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Product Tier</TableHead>
                <TableHead>Styles Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesigns.map((design) => (
                <TableRow
                  key={String(design._id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    {design.templateName}
                  </TableCell>
                  <TableCell>
                    {design.preview ? (
                      <div className="relative w-24 h-24">
                        <Image
                          src={design.preview}
                          alt={design.templateName}
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          No preview
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={design.published ? "default" : "secondary"}
                    >
                      {design.published ? "Published" : "Unpublished"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(String(design._id))}</TableCell>
                  <TableCell>{design.productTier}</TableCell>
                  <TableCell>{design.styles.length}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                      <Link href={`/designs/${design._id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
