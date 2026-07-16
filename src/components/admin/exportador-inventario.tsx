"use client";

import { Download, FileSpreadsheet, PackageSearch } from "lucide-react";
import type { Product } from "@/types/producto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utilidades";

type InventoryRow = { sku: string; product: string; variant: string; category: string; brand: string; regularPrice: number; offerPrice?: number; stock: number; active: boolean };

function inventoryRows(products: Product[]): InventoryRow[] {
  return products.flatMap((product) => {
    const variants = product.variants.filter((variant) => variant.isActive);
    if (!variants.length) return [{ sku: product.sku, product: product.name, variant: "", category: product.category, brand: product.brand, regularPrice: product.price, offerPrice: product.offerPrice, stock: product.stock, active: product.isActive }];
    return variants.map((variant) => ({ sku: variant.sku || product.sku, product: product.name, variant: variant.name, category: product.category, brand: product.brand, regularPrice: variant.price, offerPrice: variant.offerPrice, stock: variant.stock, active: product.isActive && variant.isActive }));
  });
}

function xmlEscape(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }

// Excel abre de forma nativa este SpreadsheetML (.xls), sin enviar el inventario a ningún tercero.
function downloadExcel(rows: InventoryRow[]) {
  const headers = ["SKU", "Producto", "Variante", "Categoría", "Marca", "Precio regular", "Precio oferta", "Stock", "Estado"];
  const cells = (values: Array<string | number>) => values.map((value) => `<Cell><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${typeof value === "number" ? value : xmlEscape(value)}</Data></Cell>`).join("");
  const rowsXml = rows.map((row) => `<Row>${cells([row.sku, row.product, row.variant, row.category, row.brand, row.regularPrice, row.offerPrice ?? "", row.stock, row.active ? "Activo" : "Inactivo"])}</Row>`).join("");
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0B3D91" ss:Pattern="Solid"/></Style><Style ss:ID="Money"><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style></Styles><Worksheet ss:Name="Inventario"><Table><Row ss:StyleID="Header">${cells(headers)}</Row>${rowsXml}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `inventario-pesca-con-fe-${new Date().toISOString().slice(0, 10)}.xls`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function InventoryExporter({ products }: { products: Product[] }) {
  const rows = inventoryRows(products);
  const units = rows.reduce((sum, row) => sum + row.stock, 0);
  const unavailable = rows.filter((row) => row.stock === 0).length;
  return <div className="space-y-6"><Card className="overflow-hidden border-primary/20"><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><FileSpreadsheet className="size-6" /></span><div><p className="font-bold text-dark-blue">Archivo de inventario para Excel</p><p className="mt-1 text-sm text-muted-foreground">Incluye cada producto y cada variante activa, con SKU, precio y stock actual.</p></div></div><Button type="button" size="lg" onClick={() => downloadExcel(rows)}><Download />Exportar inventario</Button></CardContent></Card><div className="grid gap-4 sm:grid-cols-3"><Metric label="Referencias exportadas" value={String(rows.length)} /><Metric label="Unidades en inventario" value={String(units)} /><Metric label="Sin existencias" value={String(unavailable)} /></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><PackageSearch className="size-5 text-primary" />Vista previa del archivo</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.slice(0, 12).map((row, index) => <div key={`${row.sku}-${index}`} className="rounded-lg bg-secondary p-3"><p className="font-semibold text-dark-blue">{row.product}{row.variant ? ` · ${row.variant}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">SKU: {row.sku || "Sin SKU"} · {row.category}</p><p className="mt-2 flex justify-between text-sm"><span>Stock: <strong>{row.stock}</strong></span><span>{formatCurrency(row.offerPrice ?? row.regularPrice)}</span></p></div>)}</CardContent></Card></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <Card className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black text-dark-blue">{value}</p></Card>; }
