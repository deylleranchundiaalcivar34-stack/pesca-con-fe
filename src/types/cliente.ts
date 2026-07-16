export type CheckoutCustomerDefaults = {
  isAuthenticated?: boolean;
  addressId?: string;
  fullName?: string;
  cedula?: string;
  phone?: string;
  email?: string;
  province?: string;
  city?: string;
  address?: string;
  deliveryReference?: string;
  contactPhone?: string;
};

// Modelos de perfil y direccion del cliente autenticado.
export type CustomerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  cedula?: string;
  phone?: string;
  email: string;
};

export type CustomerAddress = {
  id: string;
  customerId: string;
  alias: string;
  province: string;
  city: string;
  address: string;
  deliveryReference?: string;
  contactPhone?: string;
  isPrimary: boolean;
  isActive: boolean;
};
