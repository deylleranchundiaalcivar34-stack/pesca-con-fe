"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, MapPin, MessageCircle, Store, Truck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createCheckoutOrder } from "@/app/checkout/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/store/cart-store";
import { useIsClient } from "@/hooks/use-is-client";
import { DELIVERY_TYPE_LABELS } from "@/lib/constants";
import { isValidEcuadorianCedula } from "@/lib/ecuador";
import { formatCurrency } from "@/lib/utils";
import {
  buildCheckoutWhatsAppMessage,
  getWhatsAppPrefilledUrl,
} from "@/lib/whatsapp";
import type { DeliveryType } from "@/types/order";
import type { CheckoutCustomerDefaults, CustomerAddress } from "@/types/customer";
import type { BankAccount, BusinessConfig } from "@/types/business";
import { BankAccountCard } from "./bank-account-card";

const checkoutSchema = z
  .object({
    fullName: z.string().min(3, "Escribe tu nombre completo."),
    cedula: z
      .string()
      .min(10, "Escribe tu cédula ecuatoriana.")
      .refine(isValidEcuadorianCedula, "Ingresa una cédula ecuatoriana válida."),
    phone: z.string().min(9, "Escribe un celular válido."),
    email: z.string().email("Correo inválido.").optional().or(z.literal("")),
    addressId: z.string().optional(),
    addressAlias: z.string().optional(),
    contactPhone: z.string().optional(),
    saveAddress: z.boolean().optional(),
    deliveryType: z.enum(["envio_servientrega", "retiro_local"]),
    province: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    deliveryReference: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.deliveryType !== "envio_servientrega") return;

    if (!values.province || values.province.trim().length < 2) {
      context.addIssue({
        code: "custom",
        path: ["province"],
        message: "Indica la provincia.",
      });
    }

    if (!values.city || values.city.trim().length < 2) {
      context.addIssue({
        code: "custom",
        path: ["city"],
        message: "Indica la ciudad.",
      });
    }

    if (!values.address || values.address.trim().length < 8) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "Escribe una dirección de entrega.",
      });
    }

    if (!values.contactPhone || values.contactPhone.trim().length < 9) {
      context.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "Escribe un celular de contacto válido.",
      });
    }
  });

type CheckoutValues = z.infer<typeof checkoutSchema>;

const deliveryOptions: Array<{
  value: DeliveryType;
  title: string;
  description: string;
  icon: typeof Truck;
}> = [
  {
    value: "envio_servientrega",
    title: "Envío por Servientrega",
    description: "Recibe tu pedido en cualquier ciudad de Ecuador.",
    icon: Truck,
  },
  {
    value: "retiro_local",
    title: "Retiro en local",
    description: "Sin costo de envío. Te avisamos cuando esté listo.",
    icon: Store,
  },
];

export function CheckoutForm({
  customerDefaults = {},
  checkoutAddresses,
  bankAccounts,
  businessConfig,
}: {
  customerDefaults?: CheckoutCustomerDefaults;
  checkoutAddresses: CustomerAddress[];
  bankAccounts: BankAccount[];
  businessConfig: BusinessConfig;
}) {
  const items = useCartStore((state) => state.items);
  const isClient = useIsClient();
  const subtotal = useCartStore((state) => state.subtotal());
  const shipping = useCartStore((state) => state.shipping());
  const clearCart = useCartStore((state) => state.clearCart);
  const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id ?? "");
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const displaySubtotal = isClient ? subtotal : 0;

  const selectedBank = useMemo(
    () => bankAccounts.find((account) => account.id === selectedBankId) ?? bankAccounts[0],
    [bankAccounts, selectedBankId],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: customerDefaults.fullName ?? "",
      cedula: customerDefaults.cedula ?? "",
      phone: customerDefaults.phone ?? "",
      email: customerDefaults.email ?? "",
      addressId: customerDefaults.addressId ?? "",
      addressAlias: "Principal",
      contactPhone: customerDefaults.contactPhone ?? customerDefaults.phone ?? "",
      saveAddress: false,
      deliveryType: "envio_servientrega",
      province: customerDefaults.province ?? "Sucumbíos",
      city: customerDefaults.city ?? "Shushufindi",
      address: customerDefaults.address ?? "",
      deliveryReference: customerDefaults.deliveryReference ?? "",
    },
  });

  const deliveryType = useWatch({ control, name: "deliveryType" });
  const selectedAddressId = useWatch({ control, name: "addressId" });
  const saveAddress = useWatch({ control, name: "saveAddress" });
  const displayShipping = isClient && deliveryType === "envio_servientrega" ? shipping : 0;
  const displayTotal = displaySubtotal + displayShipping;
  const visibleItems = isClient ? items : [];
  const orderItems = visibleItems.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    productSlug: item.product.slug,
    image: item.product.mainImage,
    price: item.product.price,
    quantity: item.quantity,
    categorySlug: item.product.categorySlug,
  }));
  const canSaveAddresses = Boolean(customerDefaults.isAuthenticated);
  const hasSavedAddresses = checkoutAddresses.length > 0;
  const isManualAddress = !selectedAddressId;
  const clearSelectedAddress = () => {
    if (selectedAddressId) {
      setValue("addressId", "", { shouldDirty: true });
    }
  };
  const provinceField = register("province", { onChange: clearSelectedAddress });
  const cityField = register("city", { onChange: clearSelectedAddress });
  const addressField = register("address", { onChange: clearSelectedAddress });
  const deliveryReferenceField = register("deliveryReference", {
    onChange: clearSelectedAddress,
  });
  const contactPhoneField = register("contactPhone", { onChange: clearSelectedAddress });

  const selectAddress = (address: CustomerAddress) => {
    setValue("addressId", address.id, { shouldDirty: true, shouldValidate: true });
    setValue("province", address.province, { shouldDirty: true, shouldValidate: true });
    setValue("city", address.city, { shouldDirty: true, shouldValidate: true });
    setValue("address", address.address, { shouldDirty: true, shouldValidate: true });
    setValue("deliveryReference", address.deliveryReference ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("contactPhone", address.contactPhone ?? customerDefaults.phone ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("saveAddress", false, { shouldDirty: true });
  };

  const useManualAddress = () => {
    setValue("addressId", "", { shouldDirty: true, shouldValidate: true });
    setValue("saveAddress", false, { shouldDirty: true });
  };

  const onSubmit = async (values: CheckoutValues) => {
    if (!visibleItems.length) {
      toast.error("Agrega productos al carrito antes de generar el pedido.");
      return;
    }

    if (!selectedBank) {
      toast.error("Configura una cuenta bancaria antes de generar pedidos.");
      return;
    }

    const createdOrder = await createCheckoutOrder({
      customer: values,
      items: orderItems,
      subtotal: displaySubtotal,
      shipping: displayShipping,
      total: displayTotal,
      bankAccount: selectedBank,
      business: businessConfig,
      deliveryType: values.deliveryType,
    });

    if (!createdOrder.ok || !createdOrder.code) {
      toast.error(createdOrder.message);
      return;
    }

    const message = buildCheckoutWhatsAppMessage({
      customer: values,
      items: orderItems,
      subtotal: displaySubtotal,
      shipping: displayShipping,
      total: displayTotal,
      bankAccount: selectedBank,
      deliveryType: values.deliveryType,
      orderCode: createdOrder.code,
      business: businessConfig,
    });

    setSuccessOrder(createdOrder.code);
    window.open(getWhatsAppPrefilledUrl(message, businessConfig), "_blank", "noopener,noreferrer");
    clearCart();
  };

  if (successOrder) {
    return (
      <Card className="mx-auto max-w-3xl border-primary/25">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
          <CardTitle className="text-2xl">Pedido generado: {successOrder}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Se abrió WhatsApp con el mensaje del pedido. Envía el comprobante de
            transferencia para que Pesca Con Fe confirme el pago y coordine la entrega.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/productos">Seguir comprando</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contacto">Contactar tienda</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_390px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" {...register("addressId")} />
            <Field id="fullName" label="Nombre completo" error={errors.fullName?.message}>
              <Input id="fullName" {...register("fullName")} autoComplete="name" />
            </Field>
            <Field id="cedula" label="Cédula ecuatoriana" error={errors.cedula?.message}>
              <Input
                id="cedula"
                {...register("cedula")}
                autoComplete="off"
                inputMode="numeric"
                maxLength={10}
              />
            </Field>
            <Field id="phone" label="Celular" error={errors.phone?.message}>
              <Input id="phone" {...register("phone")} inputMode="tel" autoComplete="tel" />
            </Field>
            <Field id="email" label="Correo (opcional)" error={errors.email?.message}>
              <Input id="email" {...register("email")} type="email" autoComplete="email" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modalidad de entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <input type="hidden" {...register("deliveryType")} />
            <div className="grid gap-3 sm:grid-cols-2">
              {deliveryOptions.map((option) => {
                const Icon = option.icon;
                const selected = deliveryType === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue("deliveryType", option.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    className={`rounded-lg border p-4 text-left transition hover:border-primary hover:bg-secondary ${
                      selected
                        ? "border-primary bg-secondary ring-2 ring-primary/20"
                        : "border-border bg-white"
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="flex items-center gap-3 font-semibold text-dark-blue">
                      <Icon className="size-5 text-primary" aria-hidden="true" />
                      {option.title}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {deliveryType === "retiro_local" ? (
              <div className="mt-4 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm leading-6 text-dark-blue">
                <p className="flex gap-2 font-semibold">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {businessConfig.location}, {businessConfig.city}
                </p>
                <p className="mt-2 text-muted-foreground">{businessConfig.schedule}</p>
                <p className="mt-2 text-muted-foreground">
                  {businessConfig.localPickupInstructions}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-lg border border-primary/20 bg-secondary p-4 text-sm leading-6 text-muted-foreground">
                  <p className="flex gap-2 font-semibold text-dark-blue">
                    <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    Tarifa de envío por Servientrega
                  </p>
                  <p className="mt-2">
                    Cañas: $8.50. Carretes y otros productos: mínimo $6.50. Si
                    hay varios productos, se aplica el valor más alto.
                  </p>
                </div>
                {hasSavedAddresses ? (
                  <div className="mt-5">
                    <Label>Direcciones guardadas</Label>
                    <div className="mt-2 grid gap-3">
                      {checkoutAddresses.map((address) => {
                        const selected = selectedAddressId === address.id;

                        return (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() => selectAddress(address)}
                            className={`rounded-lg border p-4 text-left transition hover:border-primary hover:bg-secondary ${
                              selected
                                ? "border-primary bg-secondary ring-2 ring-primary/20"
                                : "border-border bg-white"
                            }`}
                            aria-pressed={selected}
                          >
                            <span className="flex flex-wrap items-center gap-2 font-semibold text-dark-blue">
                              {address.alias}
                              {address.isPrimary ? <Badge>Principal</Badge> : null}
                            </span>
                            <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                              {address.address}, {address.city}, {address.province}
                            </span>
                            {address.contactPhone ? (
                              <span className="mt-1 block text-sm text-muted-foreground">
                                Contacto: {address.contactPhone}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                      <Button
                        type="button"
                        variant={isManualAddress ? "default" : "outline"}
                        onClick={useManualAddress}
                        className="justify-start"
                      >
                        <MapPin aria-hidden="true" />
                        Usar otra dirección
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field id="province" label="Provincia" error={errors.province?.message}>
                    <Input id="province" {...provinceField} />
                  </Field>
                  <Field id="city" label="Ciudad" error={errors.city?.message}>
                    <Input id="city" {...cityField} />
                  </Field>
                  <Field
                    id="address"
                    className="sm:col-span-2"
                    label="Dirección"
                    error={errors.address?.message}
                  >
                    <Input id="address" {...addressField} autoComplete="street-address" />
                  </Field>
                  <Field
                    id="deliveryReference"
                    className="sm:col-span-2"
                    label="Referencia de entrega"
                    error={errors.deliveryReference?.message}
                  >
                    <Textarea
                      id="deliveryReference"
                      {...deliveryReferenceField}
                      placeholder="Ejemplo: casa esquinera, local comercial o punto cercano."
                    />
                  </Field>
                  <Field
                    id="contactPhone"
                    className="sm:col-span-2"
                    label="Celular de contacto"
                    error={errors.contactPhone?.message}
                  >
                    <Input
                      id="contactPhone"
                      {...contactPhoneField}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </Field>
                  {canSaveAddresses && isManualAddress ? (
                    <div className="space-y-4 rounded-lg border border-border p-4 sm:col-span-2">
                      <label className="flex items-start gap-3 text-sm font-semibold text-dark-blue">
                        <input
                          type="checkbox"
                          {...register("saveAddress")}
                          className="mt-0.5 size-4 rounded border-border"
                        />
                        Guardar esta dirección para próximas compras
                      </label>
                      {saveAddress ? (
                        <Field
                          id="addressAlias"
                          label="Alias de la dirección"
                          error={errors.addressAlias?.message}
                        >
                          <Input
                            id="addressAlias"
                            {...register("addressAlias")}
                            placeholder="Casa, trabajo, oficina"
                          />
                        </Field>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Método de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Transferencias nacionales Ecuador. Elige una cuenta y envía el
              comprobante por WhatsApp.
            </p>
            <div className="grid gap-3">
              {bankAccounts.map((account) => (
                <BankAccountCard
                  key={account.id}
                  account={account}
                  selected={selectedBankId === account.id}
                  onSelect={() => setSelectedBankId(account.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Resumen del pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <div key={item.product.id} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {item.product.name} x{item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(displaySubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{DELIVERY_TYPE_LABELS[deliveryType]}</span>
                <span>{formatCurrency(displayShipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-dark-blue">
                <span>Total</span>
                <span>{formatCurrency(displayTotal)}</span>
              </div>
            </div>
            <Button
              type="submit"
              className="mt-6 h-auto min-h-11 w-full whitespace-normal py-3 text-center leading-snug"
              size="lg"
              disabled={isSubmitting || !visibleItems.length}
            >
              <MessageCircle aria-hidden="true" />
              Generar pedido y enviar comprobante por WhatsApp
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              El pedido queda pendiente de pago. Pesca Con Fe confirma tu transferencia
              y coordina el envío o retiro en local por WhatsApp.
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2 [&>input]:w-full [&>textarea]:w-full">
        {children}
      </div>
      {error ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
