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
  "0.1/build/sdk/index.html",
  "0.1/build/sdk/python/index.html",
  "0.1/build/sdk/python/runtime/index.html",
  "0.1/build/sdk/python/admission/index.html",
  "0.1/build/sdk/python/api/index.html",
  "reference/specification/index.html",
  "reference/schemas/index.html",
  "reference/conformance/index.html",
  "sdk/index.html",
  "sdk/python/index.html",
  "artifacts/0.1/normative-release.json",
  "artifacts/0.1/protocol/CONTEXT.md",
  "artifacts/0.1/protocol/spec/PROTOCOL.md",
  "artifacts/0.1/protocol/cryptography/manifest.json",
  "artifacts/0.1/protocol/admission/manifest.json",
  "zh-cn/index.html",
  "zh-cn/docs/0.1/index.html",
  "zh-cn/sdk/index.html",
  "zh-cn/sdk/python/index.html",
  "zh-tw/index.html",
  "zh-tw/docs/0.1/index.html",
  "zh-tw/sdk/index.html",
  "zh-tw/sdk/python/index.html",
  "ja/index.html",
  "ja/docs/0.1/index.html",
  "ja/sdk/index.html",
  "ja/sdk/python/index.html",
  "es/index.html",
  "es/docs/0.1/index.html",
  "es/sdk/index.html",
  "es/sdk/python/index.html",
  "fr/index.html",
  "fr/docs/0.1/index.html",
  "fr/sdk/index.html",
  "fr/sdk/python/index.html",
  "de/index.html",
  "de/docs/0.1/index.html",
  "de/sdk/index.html",
  "de/sdk/python/index.html",
  "sitemap-index.xml",
  "llms.txt",
  "robots.txt",
];

for (const output of requiredOutputs) {
  await access(path.join(dist, output));
}

const localePrefixes = ["", "zh-cn", "zh-tw", "ja", "es", "fr", "de"];
const latestSdkAliases = localePrefixes.flatMap((locale) => {
  const prefix = locale === "" ? "" : `${locale}/`;
  return [
    [`${prefix}sdk/index.html`, `/${prefix}0.1/build/sdk/`],
    [`${prefix}sdk/python/index.html`, `/${prefix}0.1/build/sdk/python/`],
  ];
});

const aliasFailures = [];
for (const [output, target] of latestSdkAliases) {
  const html = await readFile(path.join(dist, output), "utf8");
  const targetWithBase = withBase(target);
  if (
    !html.includes(
      `<meta http-equiv="refresh" content="0;url=${targetWithBase}">`,
    )
  ) {
    aliasFailures.push(`${output} does not redirect to ${targetWithBase}`);
  }
  if (
    !html.includes(`<link rel="canonical" href="${origin}${targetWithBase}">`)
  ) {
    aliasFailures.push(
      `${output} does not declare ${origin}${targetWithBase} canonical`,
    );
  }
}

for (const locale of localePrefixes) {
  const prefix = locale === "" ? "" : `${locale}/`;
  const html = await readFile(
    path.join(dist, prefix, "0.1/build/sdk/index.html"),
    "utf8",
  );
  for (const target of [
    `/${prefix}0.1/build/sdk/`,
    `/${prefix}0.1/build/sdk/python/`,
  ]) {
    const targetWithBase = withBase(target);
    if (!html.includes(`href="${targetWithBase}"`)) {
      aliasFailures.push(
        `${prefix}0.1/build/sdk/index.html navigation misses ${targetWithBase}`,
      );
    }
  }
  for (const staleTarget of [`/${prefix}sdk/`, `/${prefix}sdk/python/`]) {
    const staleTargetWithBase = withBase(staleTarget);
    if (html.includes(`href="${staleTargetWithBase}"`)) {
      aliasFailures.push(
        `${prefix}0.1/build/sdk/index.html navigation retains ${staleTargetWithBase}`,
      );
    }
  }
}

assert.equal(
  aliasFailures.length,
  0,
  `Latest SDK alias validation failed:\n${aliasFailures
    .map((failure) => `  ${failure}`)
    .join("\n")}`,
);

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

  if (/^(?:(?:zh-cn|zh-tw|ja|es|fr|de)\/)?404\/$/u.test(relativePath)) {
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
  for (const match of html.matchAll(
    /\{(?:release|artifacts)\.[A-Za-z0-9_.]+\}/gu,
  )) {
    failures.push(
      `${path.relative(dist, file)} exposes an unresolved normative data expression: ${match[0]}`,
    );
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
