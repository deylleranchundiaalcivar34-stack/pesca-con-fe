import { ManualSaleForm } from "@/components/admin/manual-sale-form";

export default function NewManualSalePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-dark-blue">Crear venta manual</h1>
        <p className="mt-1 text-muted-foreground">
          Registra una venta presencial, WhatsApp o web y reduce stock al confirmar.
        </p>
      </div>
      <ManualSaleForm />
    </div>
  );
}
