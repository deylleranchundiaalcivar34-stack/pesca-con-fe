"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductSort } from "@/lib/estado-listado-productos";

export function ProductSortSelect({
  value,
  onChange,
  includeRelevance = false,
}: {
  value: ProductSort;
  onChange: (value: ProductSort) => void;
  includeRelevance?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ProductSort)}>
      <SelectTrigger className="w-52" aria-label="Ordenar productos">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {includeRelevance ? (
          <SelectItem value="relevance">Más relevantes</SelectItem>
        ) : null}
        <SelectItem value="name-asc">Nombre: A–Z</SelectItem>
        <SelectItem value="name-desc">Nombre: Z–A</SelectItem>
        <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
        <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
      </SelectContent>
    </Select>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pageWindow = 5;
  const halfWindow = Math.floor(pageWindow / 2);
  const start = Math.max(
    1,
    Math.min(currentPage - halfWindow, totalPages - pageWindow + 1),
  );
  const end = Math.min(totalPages, start + pageWindow - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function ProductPagination({
  currentPage,
  totalPages,
  totalProducts,
  productsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  productsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  if (totalProducts <= productsPerPage) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      className="mt-8 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginación de productos"
    >
      <p className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </Button>
        {visiblePages.map((page) => (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
