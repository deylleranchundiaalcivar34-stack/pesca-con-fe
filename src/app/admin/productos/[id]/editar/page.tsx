import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { mockProducts } from "@/data/mock-products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = mockProducts.find((item) => item.id === id);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-dark-blue">Editar producto</h1>
        <p className="mt-1 text-muted-foreground">
          Editando datos mock de {product.name}.
        </p>
      </div>
      <ProductForm mode="edit" product={product} />
    </div>
  );
}
