import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { CatalogNode } from "@/types/producto";

const paramByDepth = ["categoria", "clasificacion", "subclasificacion", "tipo"] as const;

function catalogHref(path: CatalogNode[]) {
  const params = new URLSearchParams();

  path.slice(0, paramByDepth.length).forEach((node, index) => {
    params.set(paramByDepth[index], node.slug);
  });

  return `/productos?${params.toString()}`;
}

export function CatalogMegaMenu({ nodes }: { nodes: CatalogNode[] }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-dark-blue transition-all hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        aria-haspopup="menu"
      >
        Productos
        <ChevronDown className="size-4 transition-transform group-hover:rotate-180" aria-hidden="true" />
      </button>
      <div className="invisible absolute left-1/2 top-full z-50 w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-md border border-border bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <p className="font-black text-dark-blue">Catalogo</p>
            <Link href="/productos" className="text-sm font-semibold text-primary hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {nodes.map((node) => renderDesktopCategory(node))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderDesktopCategory(node: CatalogNode) {
  return (
    <section key={node.id} className="min-w-0">
      <div className="mb-2 border-b border-border/70 pb-2">
        <p className="truncate text-sm font-black text-dark-blue">{node.name}</p>
      </div>
      <div className="space-y-1 border-l border-border pl-3">
        {node.children.length ? (
          node.children.map((child) => renderDesktopNode(child, [node]))
        ) : (
          <Link
            href={catalogHref([node])}
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary"
          >
            Ver productos
          </Link>
        )}
      </div>
    </section>
  );
}

function renderDesktopNode(node: CatalogNode, path: CatalogNode[]) {
  const nextPath = [...path, node];

  if (!node.children.length) {
    return (
      <Link
        key={node.id}
        href={catalogHref(nextPath)}
        className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary"
      >
        {node.name}
      </Link>
    );
  }

  return (
    <details key={node.id} className="group/desktop break-inside-avoid">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold text-dark-blue transition hover:bg-secondary/80">
        <span>{node.name}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition group-open/desktop:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="ml-3 border-l border-border/80 pl-2">
        {node.children.map((child) => renderDesktopNode(child, nextPath))}
      </div>
    </details>
  );
}

export function MobileCatalogTree({ nodes }: { nodes: CatalogNode[] }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <Link
        href="/productos"
        className="block rounded-md px-3 py-2 text-sm font-bold text-dark-blue hover:bg-secondary"
      >
        Productos
      </Link>
      <div className="mt-1 space-y-1">{nodes.map((node) => renderMobileNode(node, []))}</div>
    </div>
  );
}

function renderMobileNode(node: CatalogNode, path: CatalogNode[]) {
  const nextPath = [...path, node];

  if (!node.children.length) {
    return (
      <Link
        key={node.id}
        href={catalogHref(nextPath)}
        className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary"
      >
        {node.name}
      </Link>
    );
  }

  return (
    <details key={node.id} className="group/mobile">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-dark-blue hover:bg-secondary">
        <span>{node.name}</span>
        <ChevronDown className="size-4 transition group-open/mobile:rotate-180" aria-hidden="true" />
      </summary>
      <div className="ml-3 border-l border-border pl-2">
        {node.children.map((child) => renderMobileNode(child, nextPath))}
      </div>
    </details>
  );
}
