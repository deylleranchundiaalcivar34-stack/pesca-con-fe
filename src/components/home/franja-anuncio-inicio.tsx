import { BadgePercent, Sparkles } from "lucide-react";
import { WELCOME_PROMOTION } from "@/lib/promocion-bienvenida";

const promotionPercentage = Math.round(WELCOME_PROMOTION.percentage * 100);

/** Franja informativa del inicio; no contiene enlaces ni acciones. */
export function HomeAnnouncementStrip() {
  const promotionLabel = `${promotionPercentage}% de descuento en tu primera compra, con compra mínima de $${WELCOME_PROMOTION.minimumSubtotal}. Próximamente habrá más sorpresas.`;

  return (
    <aside
      data-home-announcement-strip
      className="sticky top-16 z-30 overflow-hidden border-y border-dark-blue/15 bg-gold text-dark-blue shadow-[0_3px_10px_rgb(5_44_101_/_0.12)]"
      aria-label={promotionLabel}
    >
      <div className="mx-auto flex h-10 max-w-[96rem] items-center gap-2 px-3 sm:h-11 sm:gap-4 sm:px-6 lg:px-8">
        <BadgePercent className="size-4 shrink-0 text-dark-blue sm:size-5" aria-hidden="true" />

        <div className="relative h-5 min-w-0 flex-1 overflow-hidden" aria-hidden="true">
          <p className="home-announcement-message home-announcement-message-primary">
            <span className="text-dark-blue">{promotionPercentage}%</span>
            <span className="sm:hidden">en tu primera compra · mínimo ${WELCOME_PROMOTION.minimumSubtotal}</span>
            <span className="hidden sm:inline">de descuento en tu primera compra · compra mínima ${WELCOME_PROMOTION.minimumSubtotal}</span>
          </p>
          <p className="home-announcement-message home-announcement-message-secondary">
            <span className="text-dark-blue">Próximamente:</span>
            <span className="sm:hidden">más sorpresas</span>
            <span className="hidden sm:inline">más sorpresas para nuestra comunidad</span>
          </p>
        </div>

        <Sparkles className="size-4 shrink-0 text-dark-blue sm:size-5" aria-hidden="true" />
      </div>
    </aside>
  );
}
