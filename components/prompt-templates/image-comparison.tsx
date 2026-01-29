"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImageComparisonProps {
  beforeImageSrc: string;
  afterImageSrc: string;
}

export function ImageComparison({ beforeImageSrc, afterImageSrc }: ImageComparisonProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Before</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
            <Image
              src={beforeImageSrc}
              alt="Before"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">After (Generated)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
            <Image
              src={afterImageSrc}
              alt="After"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
