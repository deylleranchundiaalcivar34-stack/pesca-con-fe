import type { CheckoutCustomerDefaults, CustomerAddress } from "@/types/cliente";

export type ComparableCustomerAddress = {
  province: string;
  city: string;
  address: string;
  deliveryReference?: string | null;
  contactPhone?: string | null;
};

export type InitialCheckoutAddress = {
  addressId: string;
  addressAlias: string;
  province: string;
  city: string;
  address: string;
  deliveryReference: string;
  contactPhone: string;
};

// Mantiene alineados el identificador seleccionado y los datos que valida el
// formulario desde el primer render del checkout.
export function getInitialCheckoutAddress(
  customerDefaults: CheckoutCustomerDefaults,
  checkoutAddresses: CustomerAddress[],
): InitialCheckoutAddress {
  const selectedAddress =
    checkoutAddresses.find((address) => address.id === customerDefaults.addressId) ??
    checkoutAddresses.find((address) => address.isPrimary) ??
    checkoutAddresses[0];

  if (!selectedAddress) {
    return {
      addressId: "",
      addressAlias: "Principal",
      province: customerDefaults.province ?? "",
      city: customerDefaults.city ?? "",
      address: customerDefaults.address ?? "",
      deliveryReference: customerDefaults.deliveryReference ?? "",
      contactPhone: customerDefaults.contactPhone ?? customerDefaults.phone ?? "",
    };
  }

  return {
    addressId: selectedAddress.id,
    addressAlias: selectedAddress.alias,
    province: selectedAddress.province,
    city: selectedAddress.city,
    address: selectedAddress.address,
    deliveryReference: selectedAddress.deliveryReference ?? "",
    contactPhone:
      selectedAddress.contactPhone ?? customerDefaults.contactPhone ?? customerDefaults.phone ?? "",
  };
}

function normalizeText(value?: string | null) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es-EC");
}

function normalizePhone(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

// Dos direcciones son iguales si llevan al mismo lugar y contacto, aunque
// cambien mayúsculas o espacios al escribirlas.
export function isSameCustomerAddress(
  left: ComparableCustomerAddress,
  right: ComparableCustomerAddress,
) {
  return (
    normalizeText(left.province) === normalizeText(right.province) &&
    normalizeText(left.city) === normalizeText(right.city) &&
    normalizeText(left.address) === normalizeText(right.address) &&
    normalizeText(left.deliveryReference) === normalizeText(right.deliveryReference) &&
    normalizePhone(left.contactPhone) === normalizePhone(right.contactPhone)
  );
}
