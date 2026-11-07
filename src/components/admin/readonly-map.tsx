"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/misc";

const LocationMap = dynamic(() => import("@/components/donate/location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

export function ReadonlyMap({ lat, lng }: { lat: number; lng: number }) {
  return <LocationMap center={[lat, lng]} zoom={15} position={[lat, lng]} readOnly className="h-64 w-full" />;
}
