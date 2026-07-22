import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";

export const PROJECT_REF = "pdfypkworycuumufcdno";
export const CONFIRMATION_TEXT = "ELIMINAR_IMAGENES_PESCA_CON_FE";
export const DEFAULT_MANIFEST_PATH = ".reinicio-local/cloudinary-catalogo.json";
export const MANIFEST_VERSION = 2;

const QUERY_PAGE_SIZE = 1000;
const DELETE_BATCH_SIZE = 50;
const FINAL_STATUSES = new Set(["eliminado", "no_encontrado"]);

function normalizeSupabaseUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}.supabase.co`;
}

export function projectRefFromUrl(value) {
  const normalized = normalizeSupabaseUrl(value);
  if (!normalized) return null;

  let hostname;
  try {
    hostname = new URL(normalized).hostname;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no es una URL valida.");
  }

  const suffix = ".supabase.co";
  if (!hostname.endsWith(suffix)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no pertenece a un proyecto alojado en Supabase.");
  }

  return hostname.slice(0, -suffix.length);
}

function manifestIdentity(manifest) {
  return {
    version: manifest.version,
    projectRef: manifest.projectRef,
    resources: manifest.resources.map((entry) => ({
      recordId: entry.recordId,
      source: entry.source,
      ownerId: entry.ownerId,
      publicId: entry.publicId,
      resourceType: entry.resourceType,
      deliveryType: entry.deliveryType,
    })),
  };
}

export function computeManifestHash(manifest) {
  return createHash("sha256")
    .update(JSON.stringify(manifestIdentity(manifest)))
    .digest("hex");
}

export function buildManifest(rows, createdAt = new Date().toISOString()) {
  const resources = rows
    .map((row) => ({
      recordId: row.id,
      source: row.source,
      ownerId: row.ownerId,
      publicId: row.cloudinary_public_id,
      resourceType: "image",
      deliveryType: "upload",
      status: "pendiente",
      result: null,
      updatedAt: null,
    }))
    .sort((left, right) =>
      left.publicId.localeCompare(right.publicId) || left.recordId.localeCompare(right.recordId),
    );

  const manifest = {
    version: MANIFEST_VERSION,
    projectRef: PROJECT_REF,
    createdAt,
    total: resources.length,
    hash: "",
    resources,
  };

  manifest.hash = computeManifestHash(manifest);
  return manifest;
}

export function validateManifest(manifest, expectedProjectRef = PROJECT_REF) {
  if (!manifest || typeof manifest !== "object") throw new Error("El manifiesto no es un objeto valido.");
  if (manifest.version !== MANIFEST_VERSION) throw new Error("Version de manifiesto no compatible.");
  if (manifest.projectRef !== expectedProjectRef) {
    throw new Error(`El manifiesto pertenece a ${manifest.projectRef ?? "un proyecto desconocido"}, no a ${expectedProjectRef}.`);
  }
  if (!Array.isArray(manifest.resources) || manifest.total !== manifest.resources.length) {
    throw new Error("El total del manifiesto no coincide con sus recursos.");
  }

  const publicIds = new Set();
  for (const entry of manifest.resources) {
    if (!entry || typeof entry !== "object") throw new Error("El manifiesto contiene una entrada invalida.");
    if (!entry.recordId || !entry.ownerId || !entry.publicId) {
      throw new Error("Una entrada del manifiesto no tiene todos sus identificadores.");
    }
    if (entry.source !== "producto" && entry.source !== "marca") {
      throw new Error(`Origen no permitido para ${entry.publicId}.`);
    }
    if (entry.resourceType !== "image" || entry.deliveryType !== "upload") {
      throw new Error(`Tipo de recurso no permitido para ${entry.publicId}.`);
    }
    if (publicIds.has(entry.publicId)) throw new Error(`ID publico duplicado: ${entry.publicId}.`);
    publicIds.add(entry.publicId);
  }

  const expectedHash = computeManifestHash(manifest);
  if (manifest.hash !== expectedHash) throw new Error("El hash del manifiesto no coincide; el archivo fue alterado.");
  return manifest;
}

export function pendingResources(manifest) {
  return manifest.resources.filter((entry) => !FINAL_STATUSES.has(entry.status));
}

function resultStatus(value) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "deleted") return "eliminado";
  if (normalized === "not_found" || normalized === "not found") return "no_encontrado";
  return "error";
}

export function applyDeletionResults(manifest, publicIds, response, updatedAt = new Date().toISOString()) {
  const targetIds = new Set(publicIds);
  const deleted = response?.deleted ?? {};

  return {
    ...manifest,
    resources: manifest.resources.map((entry) => {
      if (!targetIds.has(entry.publicId)) return entry;
      const rawResult = deleted[entry.publicId] ?? "respuesta_ausente";
      return {
        ...entry,
        status: resultStatus(rawResult),
        result: String(rawResult),
        updatedAt,
      };
    }),
  };
}

export function applyDeletionError(manifest, publicIds, error, updatedAt = new Date().toISOString()) {
  const targetIds = new Set(publicIds);
  const safeMessage = error instanceof Error ? error.message.slice(0, 500) : "Error desconocido de Cloudinary";

  return {
    ...manifest,
    resources: manifest.resources.map((entry) =>
      targetIds.has(entry.publicId)
        ? { ...entry, status: "error", result: safeMessage, updatedAt }
        : entry,
    ),
  };
}

export function assertConfirmation(value) {
  if (value !== CONFIRMATION_TEXT) {
    throw new Error(`Operacion bloqueada. Usa --confirmar=${CONFIRMATION_TEXT} solo despues del reinicio SQL aprobado.`);
  }
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = { command, manifestPath: DEFAULT_MANIFEST_PATH, overwrite: false, confirmation: null };

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === "--sobrescribir") {
      options.overwrite = true;
    } else if (argument.startsWith("--manifiesto=")) {
      options.manifestPath = argument.slice("--manifiesto=".length);
    } else if (argument === "--manifiesto") {
      options.manifestPath = rest[index + 1];
      index += 1;
    } else if (argument.startsWith("--confirmar=")) {
      options.confirmation = argument.slice("--confirmar=".length);
    } else if (argument === "--confirmar") {
      options.confirmation = rest[index + 1];
      index += 1;
    } else {
      throw new Error(`Argumento no reconocido: ${argument}`);
    }
  }

  if (!options.manifestPath) throw new Error("Debes indicar una ruta de manifiesto valida.");
  return options;
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function atomicWriteJson(path, value) {
  const absolutePath = resolve(path);
  await mkdir(dirname(absolutePath), { recursive: true });
  const temporaryPath = `${absolutePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, absolutePath);
}

async function readManifest(path) {
  const content = await readFile(resolve(path), "utf8");
  return JSON.parse(content);
}

function requireSupabaseProject() {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const projectRef = projectRefFromUrl(supabaseUrl);
  if (projectRef !== PROJECT_REF) {
    throw new Error(`Las credenciales apuntan a ${projectRef ?? "ningun proyecto"}, no a ${PROJECT_REF}.`);
  }
  return supabaseUrl;
}

async function fetchProductImageRows(supabase) {
  const rows = [];
  for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("producto_imagenes")
      .select("id, producto_id, cloudinary_public_id")
      .order("cloudinary_public_id", { ascending: true })
      .range(offset, offset + QUERY_PAGE_SIZE - 1);

    if (error) throw new Error(`No se pudo leer producto_imagenes: ${error.message}`);
    rows.push(
      ...(data ?? []).map((row) => ({
        id: row.id,
        source: "producto",
        ownerId: row.producto_id,
        cloudinary_public_id: row.cloudinary_public_id,
      })),
    );
    if (!data || data.length < QUERY_PAGE_SIZE) return rows;
  }
}

async function fetchBrandImageRows(supabase) {
  const rows = [];
  for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("marcas")
      .select("id, cloudinary_public_id")
      .not("cloudinary_public_id", "is", null)
      .order("cloudinary_public_id", { ascending: true })
      .range(offset, offset + QUERY_PAGE_SIZE - 1);

    if (error) throw new Error(`No se pudieron leer los logos de marcas: ${error.message}`);
    rows.push(
      ...(data ?? []).map((row) => ({
        id: row.id,
        source: "marca",
        ownerId: row.id,
        cloudinary_public_id: row.cloudinary_public_id,
      })),
    );
    if (!data || data.length < QUERY_PAGE_SIZE) return rows;
  }
}

async function prepareManifest(options) {
  const absolutePath = resolve(options.manifestPath);
  if (!options.overwrite && await pathExists(absolutePath)) {
    throw new Error(`El manifiesto ya existe: ${absolutePath}. Usa --sobrescribir solo para reemplazarlo conscientemente.`);
  }

  const supabaseUrl = requireSupabaseProject();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Falta SUPABASE_SECRET_KEY.");

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const [productRows, brandRows] = await Promise.all([
    fetchProductImageRows(supabase),
    fetchBrandImageRows(supabase),
  ]);
  const rows = [...productRows, ...brandRows];
  const manifest = buildManifest(rows);
  validateManifest(manifest);
  await atomicWriteJson(absolutePath, manifest);

  console.log(`Manifiesto preparado sin modificar Supabase ni Cloudinary: ${absolutePath}`);
  console.log(`Recursos registrados: ${manifest.total}`);
  console.log(`SHA-256: ${manifest.hash}`);
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function statusSummary(manifest) {
  return manifest.resources.reduce((summary, entry) => {
    summary[entry.status] = (summary[entry.status] ?? 0) + 1;
    return summary;
  }, {});
}

async function deleteFromManifest(options) {
  assertConfirmation(options.confirmation);
  requireSupabaseProject();
  configureCloudinary();

  const absolutePath = resolve(options.manifestPath);
  let manifest = validateManifest(await readManifest(absolutePath));
  const pending = pendingResources(manifest);

  if (pending.length === 0) {
    console.log("El manifiesto ya esta completo; no hay recursos pendientes.");
    console.log(statusSummary(manifest));
    return;
  }

  for (const batch of chunks(pending, DELETE_BATCH_SIZE)) {
    const publicIds = batch.map((entry) => entry.publicId);
    try {
      const response = await cloudinary.api.delete_resources(publicIds, {
        resource_type: "image",
        type: "upload",
        invalidate: true,
      });
      manifest = applyDeletionResults(manifest, publicIds, response);
    } catch (error) {
      manifest = applyDeletionError(manifest, publicIds, error);
    }
    await atomicWriteJson(absolutePath, manifest);
  }

  const summary = statusSummary(manifest);
  console.log("Resultado de limpieza de Cloudinary:");
  console.log(summary);
  if ((summary.error ?? 0) > 0) {
    throw new Error("Cloudinary devolvio errores. Conserva el manifiesto y vuelve a ejecutar para reintentar solo los pendientes.");
  }
}

function printUsage() {
  console.log(`Uso:\n  pnpm reset:cloudinary -- preparar [--manifiesto=${DEFAULT_MANIFEST_PATH}] [--sobrescribir]\n  pnpm reset:cloudinary -- eliminar [--manifiesto=${DEFAULT_MANIFEST_PATH}] --confirmar=${CONFIRMATION_TEXT}`);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.command === "preparar") return prepareManifest(options);
  if (options.command === "eliminar") return deleteFromManifest(options);
  printUsage();
  throw new Error("Debes elegir preparar o eliminar.");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
