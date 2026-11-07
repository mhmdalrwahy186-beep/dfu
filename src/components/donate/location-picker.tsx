"use client";

import dynamic from "next/dynamic";
import { Crosshair, MapPinned, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { OMAN_CENTER, isInsideOman } from "@/lib/oman";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-2xl" />,
});

/** Approximate centre of each governorate's main city, to start the map near the donor. */
const GOVERNORATE_CENTERS: Record<string, [number, number]> = {
  مسقط: [23.588, 58.383],
  ظفار: [17.019, 54.089],
  مسندم: [26.18, 56.25],
  البريمي: [24.25, 55.79],
  الداخلية: [22.933, 57.533],
  "شمال الباطنة": [24.347, 56.709],
  "جنوب الباطنة": [23.39, 57.424],
  "جنوب الشرقية": [22.567, 59.529],
  "شمال الشرقية": [22.69, 58.533],
  الظاهرة: [23.226, 56.515],
  الوسطى: [19.957, 56.318],
};

export function LocationPicker({
  governorate,
  value,
  onChange,
}: {
  governorate?: string;
  value: [number, number] | null;
  onChange: (v: [number, number] | null) => void;
}) {
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const center = (governorate && GOVERNORATE_CENTERS[governorate]) || OMAN_CENTER;
  const zoom = governorate ? 11 : 6;

  function pick(lat: number, lng: number) {
    if (!isInsideOman(lat, lng)) {
      setMessage("الموقع المحدد خارج سلطنة عُمان. اختر موقعًا آخر.");
      return;
    }
    setMessage(null);
    onChange([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setMessage("المتصفح لا يدعم تحديد الموقع. يمكنك اختيار الموقع على الخريطة.");
      setShowMap(true);
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setShowMap(true);
        pick(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setShowMap(true);
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "لم يتم منح إذن الوصول إلى الموقع. يمكنك اختيار موقعك على الخريطة يدويًا."
            : "تعذّر تحديد موقعك الحالي. يمكنك اختيار الموقع على الخريطة.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  return (
    <div className="rounded-2xl border border-sand-300/80 bg-cream-100/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brown-800">
            تحديد الموقع على الخريطة <span className="text-xs font-normal text-brown-500">(اختياري)</span>
          </p>
          <p className="text-[13px] text-brown-600">يساعد فريقنا على الوصول إليك بسهولة. لا نصل إلى موقعك إلا بإذنك.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="soft" size="sm" onClick={useCurrentLocation} loading={locating}>
            {!locating && <Crosshair />}
            استخدم موقعي الحالي
          </Button>
          {!showMap && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowMap(true)}>
              <MapPinned />
              اختر على الخريطة
            </Button>
          )}
        </div>
      </div>

      {showMap && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-sand-300">
          <LocationMap center={center} zoom={zoom} position={value} onPick={pick} className="h-72 w-full sm:h-80" />
        </div>
      )}

      {showMap && !value && <p className="mt-2 text-[13px] text-brown-600">اضغط على الخريطة لوضع الدبوس في موقعك، ويمكنك سحبه للتعديل.</p>}

      {value && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream-50 px-3 py-2 text-sm">
          <span className="text-brown-700">
            تم تحديد الموقع: <span className="ltr-nums text-brown-600">{value[0].toFixed(5)}, {value[1].toFixed(5)}</span>
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            <Trash2 /> إزالة
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className="mt-2 text-sm text-[#8a5f17]">
          {message}
        </p>
      )}
    </div>
  );
}
