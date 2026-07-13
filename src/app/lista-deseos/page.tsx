import { PublicShell } from "@/components/layout/contenedor-publico";
import { WishlistContent } from "@/components/products/lista-deseos-cliente";
import { getProducts } from "@/lib/supabase/data";

export default async function WishlistPage() {
  const products = await getProducts();

  return (
    <PublicShell>
      <WishlistContent products={products} />
    </PublicShell>
  );
}
