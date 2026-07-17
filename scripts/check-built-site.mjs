import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const configuredBase = process.env.SITE_BASE;
const baseSegments = configuredBase?.split("/").filter(Boolean) ?? [];
const base = baseSegments.length === 0 ? "/" : `/${baseSegments.join("/")}`;
const origin = process.env.SITE_URL ?? "https://missionweaveprotocol.github.io";
const withBase = (route) => {
  const normalizedRoute = route.replace(/^\//u, "");
  return base === "/" ? `/${normalizedRoute}` : `${base}/${normalizedRoute}`;
};

const requiredOutputs = [
  "index.html",
  "404.html",
  "docs/0.1/index.html",
  "reference/specification/index.html",
  "reference/schemas/index.html",
  "reference/conformance/index.html",
  "sdk/python/index.html",
  "zh-cn/index.html",
  "zh-cn/docs/0.1/index.html",
  "ja/index.html",
  "ja/docs/0.1/index.html",
  "es/index.html",
  "es/docs/0.1/index.html",
  "de/index.html",
  "de/docs/0.1/index.html",
  "sitemap-index.xml",
  "llms.txt",
  "robots.txt",
];

for (const output of requiredOutputs) {
  await access(path.join(dist, output));
}

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(candidate)));
    } else if (entry.name.endsWith(".html")) {
      files.push(candidate);
    }
  }

  return files;
}

async function targetExists(pathname) {
  const relativePath = decodeURIComponent(
    base === "/" ? pathname.slice(1) : pathname.slice(base.length),
  ).replace(/^\//u, "");

  if (/^(?:(?:zh-cn|ja|es|de)\/)?404\/$/u.test(relativePath)) {
    try {
      await access(path.join(dist, "404.html"));
      return true;
    } catch {
      return false;
    }
  }

  const candidates = pathname.endsWith("/")
    ? [path.join(dist, relativePath, "index.html")]
    : [
        path.join(dist, relativePath),
        path.join(dist, relativePath, "index.html"),
      ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return true;
    } catch {
      // Try the next static output shape.
    }
  }

  return false;
}

const htmlFiles = await collectHtmlFiles(dist);
const failures = [];
let checkedReferences = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  if (html.includes("/edit/main/")) {
    failures.push(`${path.relative(dist, file)} exposes an edit-page link`);
  }
  const route = path
    .relative(dist, file)
    .replace(/\\/gu, "/")
    .replace(/index\.html$/u, "");
  const pageUrl = new URL(withBase(route), origin);
  const references = html.matchAll(
    /<(?:a|img|link|script|source)\b[^>]*?\b(?:href|src)="([^"]+)"/giu,
  );

  for (const [, reference] of references) {
    if (
      reference.startsWith("#") ||
      reference.startsWith("data:") ||
      reference.startsWith("mailto:") ||
      reference.startsWith("tel:") ||
      reference.startsWith("javascript:")
    ) {
      continue;
    }

    const target = new URL(reference, pageUrl);
    if (target.origin !== origin) {
      continue;
    }

    checkedReferences += 1;
    const isWithinBase =
      base === "/"
        ? target.pathname.startsWith("/")
        : target.pathname === base || target.pathname.startsWith(`${base}/`);
    if (!isWithinBase) {
      failures.push(
        `${path.relative(dist, file)} escapes the Pages base: ${reference}`,
      );
      continue;
    }

    if (!(await targetExists(target.pathname))) {
      failures.push(
        `${path.relative(dist, file)} has a missing target: ${reference}`,
      );
    }
  }
}

assert.equal(
  failures.length,
  0,
  `Built-site validation failed:\n${failures.map((failure) => `  ${failure}`).join("\n")}`,
);

console.log(
  `Built site passed ${requiredOutputs.length} output checks and ${checkedReferences} internal reference checks across ${htmlFiles.length} pages.`,
);
