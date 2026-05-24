import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-dark-blue">Crear producto</h1>
        <p className="mt-1 text-muted-foreground">
          Formulario listo para conectar con Supabase y Cloudinary.
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
