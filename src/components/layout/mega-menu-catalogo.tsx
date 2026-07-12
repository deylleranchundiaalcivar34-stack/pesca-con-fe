"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { CatalogNode } from "@/types/producto";
import { cn } from "@/lib/utilidades";

function catalogHref(path: CatalogNode[]) {
  return `/productos/${path.map((node) => node.slug).join("/")}`;
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
          <div className="mb-4 border-b border-border pb-3">
            <Link href="/productos" className="font-black text-dark-blue transition hover:text-primary">
              Catálogo
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {nodes.map((node) => (
              <DesktopCategory key={node.id} node={node} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopCategory({ node }: { node: CatalogNode }) {
  return (
    <section className="min-w-0">
      <div className="mb-2 border-b border-border/70 pb-2">
        <Link
          href={catalogHref([node])}
          className="block truncate text-sm font-black text-dark-blue hover:text-primary"
        >
          {node.name}
        </Link>
      </div>
      {node.children.length ? (
        <div className="space-y-1 border-l border-border pl-3">
          {node.children.map((child) => (
            <DesktopNode key={child.id} node={child} path={[node]} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DesktopNode({ node, path }: { node: CatalogNode; path: CatalogNode[] }) {
  const [open, setOpen] = useState(false);
  const nextPath = [...path, node];

  return (
    <div className="break-inside-avoid">
      <div className="flex items-center rounded-md transition hover:bg-secondary/80">
        <Link
          href={catalogHref(nextPath)}
          className={cn(
            "min-w-0 flex-1 truncate px-3 py-2 text-sm hover:text-primary",
            node.children.length ? "font-semibold text-dark-blue" : "font-medium text-muted-foreground",
          )}
        >
          {node.name}
        </Link>
        {node.children.length ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${open ? "Contraer" : "Desplegar"} opciones de ${node.name}`}
            aria-expanded={open}
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {node.children.length && open ? (
        <div className="ml-3 border-l border-border/80 pl-2">
          {node.children.map((child) => (
            <DesktopNode key={child.id} node={child} path={nextPath} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MobileCatalogTree({ nodes }: { nodes: CatalogNode[] }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <Link href="/productos" className="block rounded-md px-3 py-2 text-sm font-bold text-dark-blue hover:bg-secondary">
        Productos
      </Link>
      <div className="mt-1 space-y-1">
        {nodes.map((node) => (
          <MobileNode key={node.id} node={node} path={[]} />
        ))}
      </div>
    </div>
  );
}

function MobileNode({ node, path }: { node: CatalogNode; path: CatalogNode[] }) {
  const [open, setOpen] = useState(false);
  const nextPath = [...path, node];

  return (
    <div>
      <div className="flex items-center rounded-md hover:bg-secondary">
        <Link
          href={catalogHref(nextPath)}
          className={cn(
            "min-w-0 flex-1 px-3 py-2 text-sm hover:text-primary",
            node.children.length ? "font-semibold text-dark-blue" : "font-medium text-muted-foreground",
          )}
        >
          {node.name}
        </Link>
        {node.children.length ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="mr-1 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${open ? "Contraer" : "Desplegar"} opciones de ${node.name}`}
            aria-expanded={open}
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {node.children.length && open ? (
        <div className="ml-3 border-l border-border pl-2">
          {node.children.map((child) => (
            <MobileNode key={child.id} node={child} path={nextPath} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
