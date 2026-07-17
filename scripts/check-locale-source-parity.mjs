import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const contentRoot = fileURLToPath(
  new URL("../src/content/docs/", import.meta.url),
);
const locales = ["zh-cn", "ja", "es"];
const contentExtensions = new Set([".md", ".mdx"]);

async function collectContentFiles(directory, prefix = "") {
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectContentFiles(absolutePath, relativePath)));
    } else if (contentExtensions.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }

  return files;
}

function normalizedBody(contents) {
  return contents
    .toString("utf8")
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/u, "")
    .trim()
    .replace(/\s+/gu, " ");
}

const allFiles = await collectContentFiles(contentRoot);
const englishFiles = allFiles.filter(
  (file) => !locales.some((locale) => file.startsWith(`${locale}/`)),
);
const availableFiles = new Set(allFiles);
const failures = [];

for (const englishFile of englishFiles) {
  const englishContents = await readFile(path.join(contentRoot, englishFile));

  for (const locale of locales) {
    const localizedFile = `${locale}/${englishFile}`;

    if (!availableFiles.has(localizedFile)) {
      failures.push(`${localizedFile}: missing translation source`);
      continue;
    }

    const localizedContents = await readFile(
      path.join(contentRoot, localizedFile),
    );
    if (normalizedBody(localizedContents) === normalizedBody(englishContents)) {
      failures.push(`${localizedFile}: body is identical to English`);
    }
  }
}

if (failures.length > 0) {
  console.error("Locale source parity violations:");
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Locale source parity passed for ${englishFiles.length} English paths across ${locales.length} locales.`,
);
