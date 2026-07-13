import Link from "next/link";
import { Heart } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  return <PublicShell>
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary"><Heart className="size-8" aria-hidden="true" /></div>
      <h1 className="mt-6 text-3xl font-black text-dark-blue">Lista de deseos</h1>
      <p className="mt-3 leading-7 text-muted-foreground">Muy pronto podrás guardar aquí tus productos favoritos para encontrarlos rápidamente.</p>
      <Button asChild className="mt-7"><Link href="/productos">Explorar productos</Link></Button>
    </section>
  </PublicShell>;
}
