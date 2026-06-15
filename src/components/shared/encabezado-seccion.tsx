import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utilidades";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

// Encabezado reutilizable para secciones con titulo, texto y etiqueta opcional.
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Badge variant="premium" className="mb-3">
          {eyebrow}
        </Badge>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-dark-blue sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
