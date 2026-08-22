import type { ReactNode } from "react";
import { FloatingWhatsAppHelp } from "@/components/shared/ayuda-whatsapp-flotante";
import { WelcomePromotionPopup } from "@/components/shared/popup-promocion-bienvenida";
import { Footer } from "./footer";
import { Header } from "./header";

// Envuelve paginas publicas sin leer cookies para mantener un shell cacheable.
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="public-page-canvas flex-1 bg-secondary pt-16">{children}</main>
      <Footer />
      <FloatingWhatsAppHelp />
      <WelcomePromotionPopup />
    </>
  );
}
