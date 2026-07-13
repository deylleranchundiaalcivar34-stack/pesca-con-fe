import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Header } from "./header";

// Envuelve paginas publicas sin leer cookies para mantener un shell cacheable.
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </>
  );
}
