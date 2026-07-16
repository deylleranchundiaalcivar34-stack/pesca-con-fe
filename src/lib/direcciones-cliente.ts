export type ComparableCustomerAddress = {
  province: string;
  city: string;
  address: string;
  deliveryReference?: string | null;
  contactPhone?: string | null;
};

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
