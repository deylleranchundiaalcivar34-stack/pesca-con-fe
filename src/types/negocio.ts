export interface BankAccount {
  id: string;
  bank: string;
  owner: string;
  cedula?: string;
  logo?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  accountType: "Ahorro" | "Corriente";
  accountNumber: string;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  whatsapp: string;
}

// Modelos de configuracion comercial y cuentas bancarias.
export interface BusinessConfig {
  name: string;
  tagline: string;
  type: string;
  location: string;
  city: string;
  country: string;
  schedule: string;
  phones: string[];
  whatsappPhoneE164: string;
  email: string;
  social: SocialLinks;
  mapsEmbedUrl: string;
  shippingService: string;
  shippingBase: number;
  localPickupEnabled: boolean;
  localPickupInstructions: string;
}
