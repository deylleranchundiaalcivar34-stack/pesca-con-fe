import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBusinessWhatsAppUrl } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  label?: string;
  className?: string;
}

export function WhatsAppButton({
  label = "Comprar por WhatsApp",
  className,
}: WhatsAppButtonProps) {
  return (
    <Button asChild variant="premium" className={className}>
      <a href={getBusinessWhatsAppUrl()} target="_blank" rel="noreferrer">
        <MessageCircle aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}
