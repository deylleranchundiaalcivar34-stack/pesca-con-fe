export interface BankAccount {
  id: string;
  bank: string;
  owner: string;
  cedula?: string;
  accountType: "Ahorro" | "Corriente";
  accountNumber: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  whatsapp: string;
}

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
