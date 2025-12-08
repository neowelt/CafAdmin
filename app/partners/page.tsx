"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Partner } from "@/lib/types";
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
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, searchQuery]);

  const fetchPartners = async () => {
    try {
      const response = await fetch("/api/partners");
      if (!response.ok) throw new Error("Failed to fetch partners");
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  const filterPartners = () => {
    let filtered = [...partners];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (partner) =>
          partner.name.toLowerCase().includes(query) ||
          partner.partnerId.toLowerCase().includes(query)
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredPartners(filtered);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatRevenueShare = (share: number): string => {
    return `${(share * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading partners...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
          <p className="text-muted-foreground">
            Manage white-label partners and integrations
          </p>
        </div>
        <Button asChild>
          <Link href="/partners/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Partner
          </Link>
        </Button>
      </div>

      {/* Search Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Partners Table */}
      {filteredPartners.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No partners match your search criteria."
              : "No partners found."}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link href="/partners/add">
                <Plus className="mr-2 h-4 w-4" />
                Create your first partner
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Revenue Share</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow
                  key={partner.partnerId}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-sm">
                    {partner.partnerId}
                  </TableCell>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{formatRevenueShare(partner.revenueShare)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {partner.allowedDomains.length} domain(s)
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {partner.sandbox && (
                        <Badge variant="secondary">Sandbox</Badge>
                      )}
                      <Badge variant="default">Active</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(partner.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                      <Link href={`/partners/${partner.partnerId}`}>
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
