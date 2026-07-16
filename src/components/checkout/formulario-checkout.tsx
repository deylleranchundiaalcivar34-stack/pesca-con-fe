"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Store,
  Truck,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { createCheckoutOrder, discardPayPhoneCheckout } from "@/app/checkout/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/store/tienda-carrito";
import { useIsClient } from "@/hooks/use-es-cliente";
import { DELIVERY_TYPE_LABELS } from "@/lib/constantes";
import {
  ECUADOR_PROVINCIAS,
  ECUADOR_UBICACIONES,
  isGalapagosDestination,
  isValidEcuadorianCedula,
} from "@/lib/checkout-envio";
import { formatCurrency } from "@/lib/utilidades";
import { getEffectivePrice } from "@/lib/precios-producto";
import {
  buildCheckoutWhatsAppMessage,
  getWhatsAppPrefilledUrl,
} from "@/lib/whatsapp";
import type { DeliveryType, PaymentMethod } from "@/types/pedido";
import type { CheckoutCustomerDefaults, CustomerAddress } from "@/types/cliente";
import type { BankAccount, BusinessConfig } from "@/types/negocio";
import { BankAccountCard } from "./tarjeta-cuenta-bancaria";
import { PayPhoneBox } from "./cajita-payphone";
import type { PayPhoneBoxPayment } from "@/lib/payphone";

// Define reglas de validacion segun si el cliente pide envio o retiro local.
const checkoutSchema = z
  .object({
    fullName: z.string().min(3, "Escribe tu nombre completo."),
    phone: z.string().optional(),
    email: z.string().email("Correo inválido.").optional().or(z.literal("")),
    addressId: z.string().optional(),
    addressAlias: z.string().optional(),
    cedula: z.string().optional(),
    contactPhone: z.string().optional(),
    saveAddress: z.boolean().optional(),
    deliveryType: z.enum(["envio_servientrega", "retiro_local"]),
    paymentMethod: z.enum(["transferencia", "payphone"]),
    province: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    deliveryReference: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (!values.contactPhone || values.contactPhone.trim().length < 9) {
      context.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "Escribe un celular de contacto válido.",
      });
    }

    if (values.deliveryType !== "envio_servientrega") return;

    if (!isValidEcuadorianCedula(values.cedula)) {
      context.addIssue({
        code: "custom",
        path: ["cedula"],
        message: "Ingresa una cédula ecuatoriana válida de 10 dígitos.",
      });
    }

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

    if (values.saveAddress && (!values.address || values.address.trim().length < 8)) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "Escribe una dirección de referencia para guardarla.",
      });
    }

  });

type CheckoutValues = z.infer<typeof checkoutSchema>;

const PAYPHONE_SERVICE_FEE = 0.45;

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

// Controla el flujo completo de checkout: datos, envio, pedido y WhatsApp.
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
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const isClient = useIsClient();
  const subtotal = useCartStore((state) => state.subtotal());
  const shipping = useCartStore((state) => state.shipping());
  const clearCart = useCartStore((state) => state.clearCart);
  const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id ?? "");
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [payPhonePayment, setPayPhonePayment] = useState<PayPhoneBoxPayment | null>(null);
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
      phone: customerDefaults.phone ?? "",
      email: customerDefaults.email ?? "",
      addressId: customerDefaults.addressId ?? "",
      addressAlias: "Principal",
      cedula: customerDefaults.cedula ?? "",
      contactPhone: customerDefaults.contactPhone ?? customerDefaults.phone ?? "",
      saveAddress: false,
      deliveryType: "envio_servientrega",
      paymentMethod: "transferencia",
      province: "",
      city: "",
      address: customerDefaults.address ?? "",
      deliveryReference: customerDefaults.deliveryReference ?? "",
    },
  });

  const deliveryType = useWatch({ control, name: "deliveryType" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const selectedProvince = useWatch({ control, name: "province" });
  const selectedCity = useWatch({ control, name: "city" });
  const selectedAddressId = useWatch({ control, name: "addressId" });
  const saveAddress = useWatch({ control, name: "saveAddress" });
  const visibleItems = isClient ? items : [];
  const checkoutItems = visibleItems.map((item) => ({
    productId: item.product.id,
    variantId: item.variant?.id,
    quantity: item.quantity,
  }));
  const canSaveAddresses = Boolean(customerDefaults.isAuthenticated);
  const hasSavedAddresses = checkoutAddresses.length > 0;
  const isManualAddress = !selectedAddressId;
  const isGalapagosDelivery =
    deliveryType === "envio_servientrega" &&
    isGalapagosDestination(selectedProvince, selectedCity);
  const displayShipping =
    isClient && deliveryType === "envio_servientrega" && !isGalapagosDelivery ? shipping : 0;
  const displayPayPhoneFee = isClient && paymentMethod === "payphone" ? PAYPHONE_SERVICE_FEE : 0;
  const displayTotal = displaySubtotal + displayShipping + displayPayPhoneFee;
  const cityOptions = useMemo(() => {
    const cities = [
      ...(ECUADOR_UBICACIONES[selectedProvince as keyof typeof ECUADOR_UBICACIONES] ?? []),
    ] as string[];

    return selectedCity && !cities.includes(selectedCity)
      ? [selectedCity, ...cities]
      : cities;
  }, [selectedCity, selectedProvince]);

  useEffect(() => {
    if (isGalapagosDelivery && paymentMethod === "payphone") {
      setValue("paymentMethod", "transferencia", { shouldDirty: true, shouldValidate: true });
    }
  }, [isGalapagosDelivery, paymentMethod, setValue]);
  const clearSelectedAddress = () => {
    if (selectedAddressId) {
      setValue("addressId", "", { shouldDirty: true });
    }
  };
  const selectProvince = (province: string) => {
    clearSelectedAddress();
    setValue("province", province, { shouldDirty: true, shouldValidate: true });
    setValue("city", "", { shouldDirty: true, shouldValidate: true });
  };
  const selectCity = (city: string) => {
    clearSelectedAddress();
    setValue("city", city, { shouldDirty: true, shouldValidate: true });
  };
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

  const useSavedAddress = () => {
    const preferredAddress =
      checkoutAddresses.find((address) => address.isPrimary) ?? checkoutAddresses[0];

    if (preferredAddress) selectAddress(preferredAddress);
  };

  const onInvalid = () => {
    toast.error(
      deliveryType === "envio_servientrega"
        ? "Para abrir PayPhone con envío completa cédula, provincia, ciudad y celular. Esos datos son para Servientrega."
        : "Completa los datos requeridos antes de continuar.",
    );
  };

  const onSubmit = async (values: CheckoutValues) => {
    if (!visibleItems.length) {
      toast.error("Agrega productos al carrito antes de generar el pedido.");
      return;
    }

    const isGalapagosOrder =
      values.deliveryType === "envio_servientrega" &&
      isGalapagosDestination(values.province, values.city);

    if (values.paymentMethod === "transferencia" && !selectedBank && !isGalapagosOrder) {
      toast.error("Configura una cuenta bancaria antes de generar pedidos.");
      return;
    }

    let createdOrder;

    try {
      createdOrder = await createCheckoutOrder({
        customer: values,
        items: checkoutItems,
        deliveryType: values.deliveryType,
        paymentMethod: values.paymentMethod,
      });
    } catch (error) {
      console.error("Checkout order request failed", error);
      toast.error(
        values.paymentMethod === "payphone"
          ? "No pudimos abrir el pago seguro. Intenta nuevamente."
          : "No pudimos generar el pedido. Intenta nuevamente.",
      );
      return;
    }

    if ("requiresAuth" in createdOrder && createdOrder.requiresAuth) {
      router.push("/login?redirect=%2Fcheckout");
      return;
    }

    if ("requiresProfile" in createdOrder && createdOrder.requiresProfile) {
      toast.error(createdOrder.message);
      router.push("/mi-cuenta?seccion=perfil&checkout=1");
      return;
    }

    if (!createdOrder.ok || !createdOrder.code) {
      toast.error(createdOrder.message);
      return;
    }

    if (values.paymentMethod === "payphone") {
      if (!("paymentBox" in createdOrder) || !createdOrder.paymentBox) {
        toast.error("No pudimos preparar el pago seguro. Intenta nuevamente.");
        return;
      }
      setPayPhonePayment(createdOrder.paymentBox);
      return;
    }

    if (
      !("order" in createdOrder) ||
      !createdOrder.order ||
      (!selectedBank && !isGalapagosOrder)
    ) {
      toast.error("No pudimos preparar el comprobante de transferencia.");
      return;
    }

    const message = buildCheckoutWhatsAppMessage({
      customer: {
        ...values,
        phone: values.contactPhone ?? "",
      },
      items: createdOrder.order.items,
      subtotal: createdOrder.order.subtotal,
      shipping: createdOrder.order.shipping,
      total: createdOrder.order.total,
      bankAccount: isGalapagosOrder ? undefined : selectedBank,
      deliveryType: values.deliveryType,
      orderCode: createdOrder.code,
      business: businessConfig,
    });

    setSuccessOrder(createdOrder.code);
    window.open(getWhatsAppPrefilledUrl(message, businessConfig), "_blank", "noopener,noreferrer");
    clearCart();
  };

  const closePayPhonePayment = async () => {
    if (!payPhonePayment) return;

    const discarded = await discardPayPhoneCheckout(payPhonePayment.clientTransactionId);
    if (!discarded.ok) {
      toast.error("No pudimos cancelar este intento. Espera un momento y vuelve a intentar.");
      return;
    }

    setPayPhonePayment(null);
    toast.message("Pago cancelado. El pedido no se registró y el stock quedó disponible.");
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
    <>
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-8 lg:grid-cols-[1fr_390px]">
      <input type="hidden" {...register("addressId")} />
      <input type="hidden" {...register("fullName")} />
      <input type="hidden" {...register("phone")} />
      <input type="hidden" {...register("email")} />
      <div className="space-y-6">
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
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm leading-6 text-dark-blue">
                  <p className="flex gap-2 font-semibold">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {businessConfig.location}, {businessConfig.city}
                  </p>
                  <p className="mt-2 text-muted-foreground">{businessConfig.schedule}</p>
                  <p className="mt-2 text-muted-foreground">
                    Espera la confirmación por WhatsApp antes de acercarte.
                  </p>
                </div>
                <Field id="contactPhone" label="Celular de contacto" error={errors.contactPhone?.message}>
                  <Input
                    id="contactPhone"
                    {...contactPhoneField}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Ejemplo: 0991234567"
                  />
                </Field>
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-lg border border-primary/20 bg-secondary p-4 text-sm leading-6 text-muted-foreground">
                  <p className="flex gap-2 font-semibold text-dark-blue">
                    <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    Tarifa de envío por Servientrega
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <p>
                      <span className="font-medium text-dark-blue">Cañas:</span> $8.50
                    </p>
                    <p>
                      <span className="font-medium text-dark-blue">
                        Carretes y otros productos:
                      </span>{" "}
                      mínimo $6.50
                    </p>
                    <p className="pt-1">
                      Si hay varios productos, se aplica el valor de envío más alto.
                    </p>
                  </div>
                </div>
                {isGalapagosDelivery ? (
                  <div
                    className="mt-4 rounded-lg border border-gold/50 bg-gold/10 p-4 text-sm leading-6 text-dark-blue"
                    role="alert"
                  >
                    <p className="flex gap-2 font-semibold">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                      Envíos a Galápagos: tarifa por confirmar
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      Servientrega calcula este envío según peso y tamaño. Te contactaremos por
                      WhatsApp para confirmar el valor antes de solicitar el pago.
                    </p>
                    <p className="mt-1 font-medium text-dark-blue">
                      Para este destino solo está disponible transferencia por WhatsApp; el pago
                      con PayPhone se habilitará cuando confirmemos la tarifa.
                    </p>
                  </div>
                ) : null}
                <AnimatePresence initial={false} mode="popLayout">
                {hasSavedAddresses && !isManualAddress ? (
                  <motion.div
                    key="saved-addresses"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="mt-5 overflow-hidden"
                  >
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
                  </motion.div>
                ) : null}
                </AnimatePresence>
                {hasSavedAddresses && isManualAddress ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="mt-5"
                  >
                    <Button type="button" variant="outline" onClick={useSavedAddress} className="w-full justify-start">
                      <MapPin aria-hidden="true" />
                      Volver a mi dirección guardada
                    </Button>
                  </motion.div>
                ) : null}
                <AnimatePresence initial={false} mode="wait">
                {(!hasSavedAddresses || isManualAddress) ? (
                <motion.div
                  key="manual-address-form"
                  initial={{ opacity: 0, y: 18, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -12, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-5 grid gap-4 overflow-hidden sm:grid-cols-2"
                >
                  <Field id="province" label="Provincia" error={errors.province?.message}>
                    <Select value={selectedProvince ?? ""} onValueChange={selectProvince}>
                      <SelectTrigger id="province" aria-label="Seleccione una provincia">
                        <SelectValue placeholder="Seleccione una provincia" />
                      </SelectTrigger>
                      <SelectContent>
                      {selectedProvince && !ECUADOR_PROVINCIAS.includes(selectedProvince) ? (
                        <SelectItem value={selectedProvince}>{selectedProvince}</SelectItem>
                      ) : null}
                      {ECUADOR_PROVINCIAS.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="city" label="Ciudad" error={errors.city?.message}>
                    <Select
                      value={selectedCity ?? ""}
                      onValueChange={selectCity}
                      disabled={!selectedProvince || !cityOptions.length}
                    >
                      <SelectTrigger id="city" aria-label="Seleccione una ciudad">
                        <SelectValue placeholder="Seleccione una ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                      {cityOptions.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    id="cedula"
                    className="sm:col-span-2"
                    label="Cédula ecuatoriana"
                    error={errors.cedula?.message}
                  >
                    <Input
                      id="cedula"
                      {...register("cedula", {
                        onChange: (event) => {
                          event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
                        },
                      })}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Ingresa una cédula ecuatoriana válida de 10 dígitos."
                      placeholder="Ejemplo: 1710034065"
                    />
                  </Field>
                  <Field
                    id="address"
                    className="sm:col-span-2"
                    label="Dirección de referencia (opcional)"
                    error={errors.address?.message}
                  >
                    <>
                      <Input id="address" {...addressField} autoComplete="street-address" />
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Si no indicas una dirección, enviaremos el pedido a la oficina de
                        Servientrega de la ciudad seleccionada.
                      </p>
                    </>
                  </Field>
                  <Field
                    id="deliveryReference"
                    className="sm:col-span-2"
                    label="Referencia adicional (opcional)"
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
                </motion.div>
                ) : null}
                </AnimatePresence>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Método de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <input type="hidden" {...register("paymentMethod")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <PaymentMethodButton
                value="transferencia"
                selected={paymentMethod === "transferencia"}
                title="Transferencia bancaria"
                description="Genera el pedido y envía el comprobante por WhatsApp."
                icon={MessageCircle}
                onSelect={(value) =>
                  setValue("paymentMethod", value, { shouldDirty: true })
                }
              />
              <PaymentMethodButton
                value="payphone"
                selected={paymentMethod === "payphone"}
                title="Tarjeta con PayPhone"
                description={
                  isGalapagosDelivery
                    ? "Disponible después de confirmar la tarifa de envío por WhatsApp."
                    : deliveryType === "envio_servientrega"
                      ? "Disponible para envíos por Servientrega en Ecuador continental."
                      : "Paga aquí mismo, en la cajita segura de PayPhone."
                }
                icon={CreditCard}
                disabled={isGalapagosDelivery}
                onSelect={(value) =>
                  setValue("paymentMethod", value, { shouldDirty: true })
                }
              />
            </div>

            {paymentMethod === "transferencia" ? (
              isGalapagosDelivery ? (
                <div className="mt-5 rounded-lg border border-gold/50 bg-gold/10 p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-semibold text-dark-blue">Cotización pendiente por WhatsApp</p>
                  <p className="mt-1">
                    Primero confirmaremos el costo de Servientrega según el peso y tamaño
                    del pedido. No realices la transferencia hasta recibir esa cotización.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  {bankAccounts.map((account) => (
                    <BankAccountCard
                      key={account.id}
                      account={account}
                      selected={selectedBankId === account.id}
                      onSelect={() => setSelectedBankId(account.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="mt-5 rounded-lg border border-primary/20 bg-secondary p-4 text-sm leading-6 text-muted-foreground">
                <p className="font-semibold text-dark-blue">Pago protegido por PayPhone</p>
                <p className="mt-1 font-medium text-primary">El total incluye $0.45 por uso del servicio PayPhone.</p>
                <p className="mt-1">
                  Ingresa los datos de tu tarjeta aquí mismo. Pesca Con Fe no almacena esa información.
                </p>
                {deliveryType === "envio_servientrega" ? (
                  <p className="mt-2 border-t border-primary/15 pt-2 text-xs leading-5">
                    PayPhone solo procesa el cobro. Tu cédula, provincia, ciudad y celular se guardan
                    únicamente para que Servientrega entregue el pedido correctamente.
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Resumen del pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <div key={item.lineId ?? `${item.product.id}:base`} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {item.product.name} x{item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(getEffectivePrice(item.variant ?? item.product) * item.quantity)}
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
                <span>{isGalapagosDelivery ? "Por cotizar" : formatCurrency(displayShipping)}</span>
              </div>
              {paymentMethod === "payphone" ? (
                <div className="flex justify-between text-primary">
                  <span>Uso del servicio PayPhone</span>
                  <span>{formatCurrency(displayPayPhoneFee)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-bold text-dark-blue">
                <span>Total</span>
                <span>{formatCurrency(displayTotal)}</span>
              </div>
            </div>
            <Button
              type="submit"
              variant={paymentMethod === "payphone" ? "dark" : "default"}
              className="mt-6 h-auto min-h-11 w-full whitespace-normal py-3 text-center leading-snug"
              size="lg"
              disabled={isSubmitting || !visibleItems.length}
            >
              {paymentMethod === "payphone" && isSubmitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : paymentMethod === "payphone" ? (
                <CreditCard aria-hidden="true" />
              ) : (
                <MessageCircle aria-hidden="true" />
              )}
              {paymentMethod === "payphone"
                ? isSubmitting
                  ? "Abriendo pago seguro..."
                  : "Abrir pago seguro"
                : isGalapagosDelivery
                  ? "Solicitar cotización por WhatsApp"
                  : "Generar pedido y enviar comprobante por WhatsApp"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
      {paymentMethod === "payphone"
                ? "El pedido se confirmará automáticamente cuando PayPhone apruebe el pago."
                : isGalapagosDelivery
                  ? "Confirmaremos por WhatsApp la tarifa de Galápagos antes de solicitar el pago."
                  : "Te contactaremos por WhatsApp para confirmar tu pedido y coordinar la entrega."}
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
    {payPhonePayment ? <PayPhoneBox payment={payPhonePayment} onClose={closePayPhonePayment} /> : null}
    </>
  );
}

function PaymentMethodButton({
  value,
  selected,
  title,
  description,
  icon: Icon,
  disabled = false,
  onSelect,
}: {
  value: PaymentMethod;
  selected: boolean;
  title: string;
  description: string;
  icon: typeof CreditCard;
  disabled?: boolean;
  onSelect: (value: PaymentMethod) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      disabled={disabled}
      className={`rounded-lg border p-4 text-left transition ${
        selected
          ? "border-primary bg-secondary ring-2 ring-primary/20"
          : "border-border bg-white"
      } ${
        disabled ? "cursor-not-allowed opacity-55" : "hover:border-primary hover:bg-secondary"
      }`}
      aria-pressed={selected}
    >
      <span className="flex items-center gap-3 font-semibold text-dark-blue">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        {title}
      </span>
      <span className="mt-2 block text-sm leading-6 text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

// Reutiliza el patron de etiqueta, campo y error en el formulario.
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
      <div className="mt-2 [&>input]:w-full [&>select]:w-full [&>textarea]:w-full">
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
