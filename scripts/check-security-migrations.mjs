import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();
const failures = [];

if (new Set(files.map((file) => file.slice(0, 14))).size !== files.length) {
  failures.push("Hay dos migraciones con la misma versión.");
}

for (const file of files) {
  const sql = readFileSync(join(directory, file), "utf8");
  const normalized = sql.replace(/--.*$/gm, " ").replace(/\s+/g, " ").toLowerCase();

  if (/grant\s+all(?:\s+privileges)?[^;]*\s+to\s+(?:anon|authenticated)\b/.test(normalized)) {
    failures.push(`${file}: concede ALL a anon/authenticated.`);
  }

  if (/grant\s+execute\s+on\s+all\s+functions[^;]*\s+to\s+authenticated\b/.test(normalized)) {
    failures.push(`${file}: concede todas las funciones a authenticated.`);
  }

  const publicTables = [...normalized.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-z0-9_]+)/g)]
    .map((match) => match[1]);

  for (const table of publicTables) {
    if (!normalized.includes(`alter table public.${table} enable row level security`)) {
      failures.push(`${file}: la tabla pública ${table} no habilita RLS en su migración.`);
    }
  }

  const definerBlocks = normalized.split(/create\s+or\s+replace\s+function|create\s+function/).slice(1);
  for (const block of definerBlocks) {
    const declaration = block.split(/\$\$/)[0] ?? block;
    if (declaration.includes("security definer") && !declaration.includes("set search_path")) {
      failures.push(`${file}: función SECURITY DEFINER sin search_path fijo.`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Migraciones revisadas: ${files.length}.`);
