import { describe, expect, it } from "vitest";
import type { CustomerAddress } from "@/types/cliente";
import { getInitialCheckoutAddress } from "./direcciones-cliente";

const addresses: CustomerAddress[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    customerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    alias: "Trabajo",
    province: "Pichincha",
    city: "Quito",
    address: "Av. Amazonas N24-123",
    contactPhone: "0991111111",
    isPrimary: false,
    isActive: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    customerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    alias: "Principal",
    province: "Sucumbíos",
    city: "Lago Agrio",
    address: "Barrio El Dorado",
    deliveryReference: "Casa azul",
    contactPhone: "0989659754",
    isPrimary: true,
    isActive: true,
  },
];

describe("dirección inicial del checkout", () => {
  it("inicializa todos los campos con la dirección seleccionada", () => {
    expect(
      getInitialCheckoutAddress(
        {
          addressId: addresses[1].id,
          phone: "0990000000",
        },
        addresses,
      ),
    ).toEqual({
      addressId: addresses[1].id,
      addressAlias: "Principal",
      province: "Sucumbíos",
      city: "Lago Agrio",
      address: "Barrio El Dorado",
      deliveryReference: "Casa azul",
      contactPhone: "0989659754",
    });
  });

  it("usa la dirección principal si el identificador recibido ya no existe", () => {
    const result = getInitialCheckoutAddress(
      {
        addressId: "33333333-3333-4333-8333-333333333333",
      },
      addresses,
    );

    expect(result.addressId).toBe(addresses[1].id);
    expect(result.province).toBe("Sucumbíos");
    expect(result.city).toBe("Lago Agrio");
  });
});
