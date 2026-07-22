"use client";

import { LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function BrandStatusButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus();
  const nextActive = !active;

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-live="polite"
    >
      {pending ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : nextActive ? (
        <RotateCcw aria-hidden="true" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
      {pending ? (nextActive ? "Reactivando..." : "Quitando...") : nextActive ? "Reactivar" : "Quitar"}
    </Button>
  );
}
