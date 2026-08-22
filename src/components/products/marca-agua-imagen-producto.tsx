import type { CSSProperties, SyntheticEvent } from "react";

const watermarkPatternStyle: CSSProperties = {
  backgroundImage: "url('/images/logos/logo-nuevo-negro.webp')",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "contain",
};

const watermarkPositions = [
  "left-[2%] top-[7%]",
  "right-[2%] top-[38%]",
  "bottom-[5%] left-[18%]",
] as const;

// Evita las formas casuales de copiar una imagen sin bloquear el resto de la pagina.
export function preventProtectedImageAction(event: SyntheticEvent) {
  event.preventDefault();
}

// Reutiliza un unico logo local y transparente sobre todas las fotos del producto.
export function ProductImageWatermark() {
  return (
    <div
      aria-hidden="true"
      data-product-image-watermark
      className="pointer-events-none absolute inset-0 z-[15] overflow-hidden select-none"
    >
      {watermarkPositions.map((position) => (
        <span
          key={position}
          className={`absolute h-[23%] w-[46%] -rotate-[14deg] opacity-15 mix-blend-multiply ${position}`}
          style={watermarkPatternStyle}
        />
      ))}
    </div>
  );
}
