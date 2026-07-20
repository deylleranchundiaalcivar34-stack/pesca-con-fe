import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const candidates = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.endsWith("pnpm-lock.yaml"));

const patterns = [
  ["clave privada", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["token secreto Supabase", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  ["token GitHub", /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/],
  ["clave AWS", /\bAKIA[0-9A-Z]{16}\b/],
];

const failures = [];

for (const file of candidates) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const [label, pattern] of patterns) {
    if (pattern.test(content)) failures.push(`${file}: posible ${label}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Archivos versionables revisados: ${candidates.length}.`);
