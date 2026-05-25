import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { LocalBusinessJsonLd } from "@/components/shared/local-business-json-ld";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pesca Con Fe | Artículos de pesca en Shushufindi",
    template: "%s | Pesca Con Fe",
  },
  description:
    "Ecommerce de artículos de pesca en Shushufindi, Ecuador. Cañas, carretes, señuelos e indumentaria con pago por transferencia y confirmación por WhatsApp.",
  keywords: [
    "Pesca Con Fe",
    "artículos de pesca Ecuador",
    "cañas de pesca",
    "carretes",
    "señuelos",
    "Shushufindi",
  ],
  openGraph: {
    title: "Pesca Con Fe",
    description:
      "Confianza, pasión y aventura. Compra artículos de pesca con envío por Servientrega Ecuador.",
    url: SITE_URL,
    siteName: "Pesca Con Fe",
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pesca Con Fe",
    description:
      "Equipos de pesca seleccionados para cada aventura en Ecuador.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster
          richColors
          position="top-right"
          offset={{ top: 76, right: 24 }}
          mobileOffset={{ top: 88, right: 16, left: 16 }}
        />
        <LocalBusinessJsonLd />
      </body>
    </html>
  );
}
