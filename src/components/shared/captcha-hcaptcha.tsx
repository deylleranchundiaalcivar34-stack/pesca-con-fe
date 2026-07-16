"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";

const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

type HCaptchaControlProps = {
  onTokenChange: (token: string | null) => void;
};

// La Sitekey es publica; la Secret key se configura exclusivamente en Supabase.
export function isHCaptchaConfigured() {
  return Boolean(siteKey);
}

export function HCaptchaControl({ onTokenChange }: HCaptchaControlProps) {
  if (!siteKey) return null;

  return (
    <div className="overflow-hidden rounded-md" data-testid="hcaptcha-control">
      <HCaptcha
        sitekey={siteKey}
        theme="dark"
        onVerify={onTokenChange}
        onExpire={() => onTokenChange(null)}
        onError={() => onTokenChange(null)}
      />
    </div>
  );
}
