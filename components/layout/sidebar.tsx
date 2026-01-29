"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Palette, FolderOpen, ShoppingCart, Users, FileText } from "lucide-react";

const navigation = [
  {
    name: "Designs",
    href: "/designs",
    icon: Palette,
  },
  // Collections hidden - to be worked on later
  // {
  //   name: "Collections",
  //   href: "/collections",
  //   icon: FolderOpen,
  // },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    name: "Partners",
    href: "/partners",
    icon: Users,
  },
  {
    name: "Prompt Templates",
    href: "/prompt-templates",
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card p-4 flex flex-col h-full">
      <div className="mb-8 flex items-center justify-center">
        <img
          src="/caf_app.png"
          alt="Cover Art Factory"
          width={80}
          height={80}
          className="object-contain"
        />
      </div>
      <nav className="space-y-2 flex-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
