import { describe, expect, it } from "vitest";

import {
  CONFIRMATION_TEXT,
  PROJECT_REF,
  applyDeletionError,
  applyDeletionResults,
  assertConfirmation,
  buildManifest,
  pendingResources,
  validateManifest,
} from "./limpiar-cloudinary-reinicio.mjs";

const rows = [
  {
    id: "imagen-b",
    source: "producto",
    ownerId: "producto-1",
    cloudinary_public_id: "pesca/b",
  },
  {
    id: "marca-a",
    source: "marca",
    ownerId: "marca-1",
    cloudinary_public_id: "pesca/a",
  },
];

describe("manifiesto de reinicio de Cloudinary", () => {
  it("ordena y valida los recursos registrados", () => {
    const manifest = buildManifest(rows, "2026-07-21T00:00:00.000Z");

    expect(manifest.projectRef).toBe(PROJECT_REF);
    expect(manifest.resources.map((entry) => entry.publicId)).toEqual(["pesca/a", "pesca/b"]);
    expect(manifest.resources.map((entry) => entry.source)).toEqual(["marca", "producto"]);
    expect(() => validateManifest(manifest)).not.toThrow();
  });

  it("rechaza un manifiesto alterado o de otro proyecto", () => {
    const manifest = buildManifest(rows);
    const altered = structuredClone(manifest);
    altered.resources[0].publicId = "otro/recurso";

    expect(() => validateManifest(altered)).toThrow(/hash/i);
    expect(() => validateManifest(manifest, "otro-proyecto")).toThrow(/pertenece/i);
  });

  it("exige el texto exacto de confirmacion", () => {
    expect(() => assertConfirmation("incorrecto")).toThrow(/bloqueada/i);
    expect(() => assertConfirmation(CONFIRMATION_TEXT)).not.toThrow();
  });

  it("trata eliminados e inexistentes como finales", () => {
    const manifest = buildManifest(rows);
    const updated = applyDeletionResults(
      manifest,
      ["pesca/a", "pesca/b"],
      { deleted: { "pesca/a": "deleted", "pesca/b": "not_found" } },
      "2026-07-21T00:00:00.000Z",
    );

    expect(updated.resources.map((entry) => entry.status)).toEqual(["eliminado", "no_encontrado"]);
    expect(pendingResources(updated)).toHaveLength(0);
    expect(() => validateManifest(updated)).not.toThrow();
  });

  it("conserva los errores como pendientes para reintento", () => {
    const manifest = buildManifest(rows);
    const partiallyDeleted = applyDeletionResults(
      manifest,
      ["pesca/a"],
      { deleted: { "pesca/a": "deleted" } },
    );
    const withError = applyDeletionError(partiallyDeleted, ["pesca/b"], new Error("limite temporal"));

    expect(pendingResources(withError).map((entry) => entry.publicId)).toEqual(["pesca/b"]);
    expect(withError.resources.find((entry) => entry.publicId === "pesca/a")?.status).toBe("eliminado");
  });
});
