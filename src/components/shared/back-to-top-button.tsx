"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 420);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <Button
      type="button"
      size="icon"
      variant="dark"
      aria-label="Volver arriba"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-5 right-4 z-50 size-12 rounded-full border border-white/70 bg-gold text-dark-blue shadow-[0_18px_40px_rgb(37_59_91_/_0.28)] ring-1 ring-dark-blue/10 transition-all duration-300 hover:bg-gold-light hover:text-dark-blue sm:bottom-6 sm:right-6",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUp aria-hidden="true" />
    </Button>
  );
}
