import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sql = await readFile(resolve("docs/reiniciar-base-datos.sql"), "utf8");
const truncateBlock = sql.match(/truncate table([\s\S]*?)restart identity;/i)?.[1] ?? "";

describe("SQL de reinicio de base de datos", () => {
  it("permanece bloqueado por defecto", () => {
    expect(sql).toMatch(/-- select set_config\(/);
    expect(sql).toContain("REINICIAR_BASE_PESCA_CON_FE");
    expect(sql).toMatch(/is distinct from 'REINICIAR_BASE_PESCA_CON_FE'/);
  });

  it("no usa operaciones destructivas de esquema ni truncate cascade", () => {
    expect(sql).not.toMatch(/\bdrop\s+(table|view|schema)\b/i);
    expect(truncateBlock).not.toMatch(/\bcascade\b/i);
  });

  it("conserva las tablas estructurales", () => {
    for (const table of [
      "public.categorias",
      "public.subcategorias",
      "public.catalogo_nodos",
      "public.catalogo_atributos",
      "public.perfiles_admin",
    ]) {
      expect(truncateBlock).not.toContain(table);
    }
  });

  it("incluye todos los datos operativos en el reinicio", () => {
    for (const table of [
      "public.productos",
      "public.marcas",
      "public.producto_imagenes",
      "public.producto_variantes",
      "public.producto_atributos",
      "public.pedidos",
      "public.pedido_items",
      "public.ventas_fisicas",
      "public.venta_fisica_items",
      "public.direcciones_cliente",
      "private.intentos_pago",
      "private.reservas_stock",
      "private.auditoria_seguridad",
      "private.limites_frecuencia",
    ]) {
      expect(truncateBlock).toContain(table);
    }
  });

  it("no depende de inventarios ni procesos externos", () => {
    expect(sql).not.toMatch(/cloudinary|manifiesto|ELIMINAR_IMAGENES/i);
  });

  it("elimina solo usuarios sin perfil administrativo dentro de una transaccion", () => {
    expect(sql).toMatch(/begin;[\s\S]*delete from auth\.users as u[\s\S]*where not exists[\s\S]*public\.perfiles_admin[\s\S]*commit;/i);
  });
});
