"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="38" height="48" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 6px rgba(98,69,51,.35))">
    <path d="M19 47s17-15.6 17-28A17 17 0 0 0 2 19c0 12.4 17 28 17 28Z" fill="#624533"/>
    <path d="M19 27c-4.6-3-7-5.4-7-8.2 0-2.2 1.6-3.8 3.7-3.8 1.4 0 2.6.7 3.3 1.8.7-1.1 1.9-1.8 3.3-1.8 2.1 0 3.7 1.6 3.7 3.8 0 2.8-2.4 5.2-7 8.2Z" fill="#E2BFB0"/>
  </svg>`,
  iconSize: [38, 48],
  iconAnchor: [19, 46],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function LocationMap({
  center,
  zoom,
  position,
  onPick,
  readOnly,
  className,
}: {
  center: [number, number];
  zoom: number;
  position: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <MapContainer
      center={position ?? center}
      zoom={position ? 15 : zoom}
      scrollWheelZoom={false}
      className={className ?? "h-72 w-full"}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {!readOnly && onPick && <ClickHandler onPick={onPick} />}
      <Recenter center={position ?? center} zoom={position ? 16 : zoom} />
      {position && (
        <Marker
          position={position}
          icon={pinIcon}
          draggable={!readOnly}
          eventHandlers={
            readOnly || !onPick
              ? undefined
              : {
                  dragend(e) {
                    const ll = (e.target as L.Marker).getLatLng();
                    onPick(ll.lat, ll.lng);
                  },
                }
          }
        />
      )}
    </MapContainer>
  );
}
