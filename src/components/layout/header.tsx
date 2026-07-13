import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HeaderCartButton,
  HeaderSearch,
  HeaderUserControls,
  HeaderWishlistButton,
  MobileMenu,
} from "./controles-header-cliente";
import { EquipmentMenu, FishingArticlesMenu } from "./mega-menu-catalogo";
import { navItems } from "./items-navegacion";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[96rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex h-16 w-36 shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Inicio - Pesca Con Fe">
          <Image src="/images/logos/logo-nuevo-negro.webp" alt="Pesca Con Fe" width={382} height={187} priority className="h-auto max-h-14 w-full object-contain" />
        </Link>

        <nav className="hidden shrink-0 items-center gap-1 lg:flex" aria-label="Principal">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm"><Link href={item.href}>{item.label}</Link></Button>
          ))}
          <FishingArticlesMenu />
          <EquipmentMenu />
        </nav>

        <HeaderSearch />

        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          <HeaderWishlistButton />
          <HeaderUserControls />
          <HeaderCartButton />
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <HeaderCartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
