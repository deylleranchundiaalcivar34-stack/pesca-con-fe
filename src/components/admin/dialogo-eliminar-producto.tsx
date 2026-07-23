"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import type { Product } from "@/types/producto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteProductDialogProps {
  product: Product;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const confirmationText = "ELIMINAR";

export function DeleteProductDialog({
  product,
  pending,
  onOpenChange,
  onConfirm,
}: DeleteProductDialogProps) {
  const [confirmation, setConfirmation] = useState("");

  const isConfirmed = confirmation.trim().toUpperCase() === confirmationText;

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!pending) onOpenChange(open);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-dark-blue/60 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-white p-6 shadow-2xl focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-xl font-black text-dark-blue">
                Eliminar producto definitivamente
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                Esta acción eliminará el producto inactivo, sus variantes, atributos e imágenes.
                No se puede deshacer.
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-dark-blue">{product.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
          </div>

          <div className="mt-5">
            <Label htmlFor="delete-product-confirmation">
              Escribe <span className="font-black text-destructive">{confirmationText}</span> para confirmar
            </Label>
            <Input
              id="delete-product-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={pending}
              autoComplete="off"
              className="mt-2"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            El servidor rechazará el borrado si el producto está activo, tiene pedidos,
            ventas físicas o una reserva de stock vigente.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancelar
              </Button>
            </DialogPrimitive.Close>
            <Button
              type="button"
              variant="destructive"
              disabled={!isConfirmed || pending}
              onClick={onConfirm}
            >
              {pending ? "Eliminando..." : "Eliminar definitivamente"}
            </Button>
          </div>

          <DialogPrimitive.Close
            disabled={pending}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-dark-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar confirmación"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
