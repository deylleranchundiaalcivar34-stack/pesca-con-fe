import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Home,
  PackagePlus,
  Settings,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/productos", label: "Productos", icon: Boxes },
  { href: "/admin/productos/nuevo", label: "Crear producto", icon: PackagePlus },
  { href: "/admin/ventas", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-dark-blue p-5 text-white lg:block">
      <Link href="/admin" className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-gold text-dark-blue">
          <Store className="size-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-bold">Pesca Con Fe</span>
          <span className="block text-xs text-white/60">Panel administrador</span>
        </span>
      </Link>

      <nav className="mt-8 grid gap-1" aria-label="Administrador">
        {adminLinks.map((item) => (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className="justify-start text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={item.href}>
              <item.icon aria-hidden="true" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>

      <div className="mt-8 rounded-lg border border-gold/30 bg-white/5 p-4 text-sm text-white/75">
        <p className="font-semibold text-gold-light">Modo demo</p>
        <p className="mt-2 leading-6">
          La interfaz simula operaciones. Luego se conectará a Supabase y
          Cloudinary con autenticación real.
        </p>
      </div>

      <Button asChild variant="premium" className="mt-5 w-full">
        <Link href="/">
          <Home aria-hidden="true" />
          Ver tienda
        </Link>
      </Button>
    </aside>
  );
}
