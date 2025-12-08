"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Collection, Design } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp, Search } from "lucide-react";
import Image from "next/image";

interface CollectionWithDesigns extends Omit<Collection, 'designIds'> {
  designs: Design[];
}

function SortableCollectionItem({ collection, onToggle, onDelete, onToggleActive, onUpdateDesigns, availableDesigns }: {
  collection: CollectionWithDesigns;
  onToggle: (slug: string) => void;
  onDelete: (slug: string) => void;
  onToggleActive: (slug: string, isActive: boolean) => void;
  onUpdateDesigns: (slug: string, designIds: string[]) => void;
  availableDesigns: Design[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: collection.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddDesign = (design: Design) => {
    const newDesignIds = [...collection.designs.map(d => String(d._id)), String(design._id)];
    onUpdateDesigns(collection.slug, newDesignIds);
  };

  const handleRemoveDesign = (designId: string) => {
    const newDesignIds = collection.designs
      .filter(d => String(d._id) !== designId)
      .map(d => String(d._id));
    onUpdateDesigns(collection.slug, newDesignIds);
  };

  const filteredAvailableDesigns = availableDesigns.filter(design => {
    const isNotInCollection = !collection.designs.some(d => String(d._id) === String(design._id));
    const matchesSearch = searchQuery === "" ||
      design.templateName.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotInCollection && matchesSearch;
  });

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{collection.name}</CardTitle>
                  <Badge variant={collection.isActive ? "default" : "secondary"}>
                    {collection.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">Position: {collection.position}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{collection.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {collection.designs.length} design{collection.designs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleActive(collection.slug, !collection.isActive)}
              >
                {collection.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(collection.slug)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Current Designs */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Current Designs</h4>
                {collection.designs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No designs in this collection</p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {collection.designs.map((design) => (
                      <div key={String(design._id)} className="flex items-center gap-2 p-2 border rounded">
                        {design.preview && (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={design.preview}
                              alt={design.templateName}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                        )}
                        <span className="text-sm flex-1">{design.templateName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDesign(String(design._id))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Designs */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Add Designs</h4>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search designs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {filteredAvailableDesigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No designs found" : "All designs are already in this collection"}
                  </p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto">
                    {filteredAvailableDesigns.map((design) => (
                      <div key={String(design._id)} className="flex items-center gap-2 p-2 border rounded hover:bg-accent cursor-pointer" onClick={() => handleAddDesign(design)}>
                        {design.preview && (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={design.preview}
                              alt={design.templateName}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                        )}
                        <span className="text-sm flex-1">{design.templateName}</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionWithDesigns[]>([]);
  const [availableDesigns, setAvailableDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({ slug: "", name: "", description: "" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [collectionsRes, designsRes] = await Promise.all([
        fetch("/api/collections?includeInactive=true"),
        fetch("/api/designs"),
      ]);

      if (!collectionsRes.ok || !designsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const collectionsData = await collectionsRes.json();
      const designsData = await designsRes.json();

      // Fetch designs for each collection
      const collectionsWithDesigns = await Promise.all(
        collectionsData.map(async (collection: Collection) => {
          const designs = await Promise.all(
            collection.designIds.map(async (id) => {
              const design = designsData.find((d: Design) => String(d._id) === id);
              return design;
            })
          );
          return {
            ...collection,
            designs: designs.filter(Boolean),
          };
        })
      );

      setCollections(collectionsWithDesigns);
      setAvailableDesigns(designsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = collections.findIndex((c) => c.slug === active.id);
      const newIndex = collections.findIndex((c) => c.slug === over.id);

      const newCollections = arrayMove(collections, oldIndex, newIndex);
      setCollections(newCollections);

      // Update positions in the backend
      const updates = newCollections.map((c, index) => ({
        slug: c.slug,
        position: index,
      }));

      try {
        const response = await fetch("/api/collections", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });

        if (!response.ok) throw new Error("Failed to update positions");
        toast.success("Collection order updated");
      } catch (error) {
        console.error("Error updating positions:", error);
        toast.error("Failed to update order");
        fetchData(); // Refresh to get correct order
      }
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.slug || !newCollection.name) {
      toast.error("Slug and name are required");
      return;
    }

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCollection, position: collections.length }),
      });

      if (!response.ok) throw new Error("Failed to create collection");

      toast.success("Collection created");
      setDialogOpen(false);
      setNewCollection({ slug: "", name: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    }
  };

  const handleDeleteCollection = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const response = await fetch(`/api/collections/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete collection");

      toast.success("Collection deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  const handleToggleActive = async (slug: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/collections/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(`Collection ${isActive ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleUpdateDesigns = async (slug: string, designIds: string[]) => {
    try {
      const response = await fetch(`/api/collections/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designIds }),
      });

      if (!response.ok) throw new Error("Failed to update designs");

      toast.success("Collection updated");
      fetchData();
    } catch (error) {
      console.error("Error updating designs:", error);
      toast.error("Failed to update collection");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading collections...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize design templates into collections
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Add a new collection to organize your designs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL-friendly ID)</Label>
                <Input
                  id="slug"
                  value={newCollection.slug}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, slug: e.target.value })
                  }
                  placeholder="e.g., trending-designs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCollection.name}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, name: e.target.value })
                  }
                  placeholder="e.g., Trending Designs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newCollection.description}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, description: e.target.value })
                  }
                  placeholder="Collection description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCollection}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No collections yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={collections.map(c => c.slug)} strategy={verticalListSortingStrategy}>
            {collections.map((collection) => (
              <SortableCollectionItem
                key={collection.slug}
                collection={collection}
                onToggle={(slug) => {
                  const col = collections.find(c => c.slug === slug);
                  if (col) handleToggleActive(slug, !col.isActive);
                }}
                onDelete={handleDeleteCollection}
                onToggleActive={handleToggleActive}
                onUpdateDesigns={handleUpdateDesigns}
                availableDesigns={availableDesigns}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
