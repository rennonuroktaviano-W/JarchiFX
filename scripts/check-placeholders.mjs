import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../web/src", import.meta.url));
const needle = "[ISI]";
const skippedDirectories = new Set(["generated", "node_modules"]);
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".json",
  ".css",
  ".md",
  ".txt",
  ".svg",
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        files.push(...(await walk(path.join(directory, entry.name))));
      }
    } else if (textExtensions.has(path.extname(entry.name))) {
      files.push(path.join(directory, entry.name));
    }
  }

  return files;
}

const matches = [];

for (const file of await walk(root)) {
  const content = await readFile(file, "utf8");

  content.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(needle)) {
      matches.push({
        file: path.relative(process.cwd(), file),
        line: index + 1,
        text: line.trim(),
      });
    }
  });
}

if (matches.length === 0) {
  console.log("Tidak ada placeholder [ISI] di web/src.");
  process.exit(0);
}

console.error(
  `Ditemukan ${matches.length} placeholder [ISI]. Ganti dengan konten nyata sebelum deploy:`,
);

for (const match of matches) {
  console.error(`${match.file}:${match.line}  ${match.text}`);
}

process.exit(1);
