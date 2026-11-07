"use client";

import { CheckCheck } from "lucide-react";
import { useTransition } from "react";
import { markNotificationsRead } from "@/app/admin/(panel)/actions";
import { Button } from "@/components/ui/button";

export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" size="sm" loading={pending} onClick={() => start(async () => void (await markNotificationsRead(null)))}>
      {!pending && <CheckCheck />} تعليم الكل كمقروء
    </Button>
  );
}
