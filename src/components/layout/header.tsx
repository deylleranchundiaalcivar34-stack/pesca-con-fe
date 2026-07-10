import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HeaderCartButton,
  HeaderUserControls,
  MobileMenu,
} from "./controles-header-cliente";
import { navItems } from "./items-navegacion";

// Header publico: deja logo y navegacion en servidor, e hidrata solo controles.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex h-16 w-48 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Inicio - Pesca Con Fe"
        >
          <Image
            src="/images/logos/logo-nuevo-negro.webp"
            alt="Pesca Con Fe"
            width={382}
            height={187}
            priority
            className="h-auto max-h-14 w-full object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <HeaderUserControls />
          <HeaderCartButton />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <HeaderCartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
