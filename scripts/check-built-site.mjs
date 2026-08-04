import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildNormativeRedirects,
  localeDefinitions,
  routeManifest,
} from "./lib/normative-routes.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const configuredBase = process.env.SITE_BASE;
const baseSegments = configuredBase?.split("/").filter(Boolean) ?? [];
const base = baseSegments.length === 0 ? "/" : `/${baseSegments.join("/")}`;
const origin = process.env.SITE_URL ?? "https://missionweaveprotocol.github.io";
const withBase = (route) => {
  const normalizedRoute = route.replace(/^\//u, "");
  return base === "/" ? `/${normalizedRoute}` : `${base}/${normalizedRoute}`;
};

const routeToOutput = (route) => {
  const relative = route.replace(/^\/|\/$/gu, "");
  return relative === ""
    ? "index.html"
    : path.posix.join(relative, "index.html");
};
const localizedRoute = (directory, route) =>
  directory === "" ? route : "/" + directory + route;

const redirects = buildNormativeRedirects();
const requiredOutputs = new Set([
  "index.html",
  "404.html",
  ...localeDefinitions
    .filter(({ directory }) => directory !== "")
    .map(({ directory }) => path.posix.join(directory, "index.html")),
  ...localeDefinitions.map(({ directory }) =>
    routeToOutput(localizedRoute(directory, "/community/")),
  ),
  ...routeManifest.routes.flatMap((route) =>
    localeDefinitions.map(({ directory }) =>
      routeToOutput(localizedRoute(directory, route.versioned)),
    ),
  ),
  ...Object.keys(redirects).map(routeToOutput),
  "artifacts/0.1/normative-release.json",
  "artifacts/0.1/protocol/CONTEXT.md",
  "artifacts/0.1/protocol/spec/PROTOCOL.md",
  "artifacts/0.1/protocol/cryptography/manifest.json",
  "artifacts/0.1/protocol/admission/manifest.json",
  "artifacts/0.1/protocol/schemas/first-admission-record.schema.json",
  "sitemap-index.xml",
  "llms.txt",
  "robots.txt",
]);

for (const output of requiredOutputs) {
  await access(path.join(dist, output));
}

const metadataFailures = [];
for (const [source, target] of Object.entries(redirects)) {
  const output = routeToOutput(source);
  const html = await readFile(path.join(dist, output), "utf8");
  const targetWithBase = withBase(target);
  if (
    !html.includes(
      '<meta http-equiv="refresh" content="0;url=' + targetWithBase + '">',
    )
  ) {
    metadataFailures.push(output + " does not redirect to " + targetWithBase);
  }
  const expectedCanonical =
    '<link rel="canonical" href="' + origin + targetWithBase + '">';
  if (!html.includes(expectedCanonical)) {
    metadataFailures.push(
      output + " does not declare " + origin + targetWithBase + " canonical",
    );
  }
}

for (const route of routeManifest.routes) {
  for (const currentLocale of localeDefinitions) {
    const currentRoute = localizedRoute(
      currentLocale.directory,
      route.versioned,
    );
    const output = routeToOutput(currentRoute);
    const html = await readFile(path.join(dist, output), "utf8");
    const expectedCanonical =
      '<link rel="canonical" href="' + origin + withBase(currentRoute) + '"/>';
    const canonicalMatches =
      html.match(/<link rel="canonical" href="[^"]+"\/>/gu) ?? [];
    if (
      canonicalMatches.length !== 1 ||
      canonicalMatches[0] !== expectedCanonical
    ) {
      metadataFailures.push(
        output + " must declare exactly " + expectedCanonical,
      );
    }

    for (const alternateLocale of localeDefinitions) {
      const alternateRoute = localizedRoute(
        alternateLocale.directory,
        route.versioned,
      );
      const expectedAlternate =
        '<link rel="alternate" hreflang="' +
        alternateLocale.starlight +
        '" href="' +
        origin +
        withBase(alternateRoute) +
        '"/>';
      if (!html.includes(expectedAlternate)) {
        metadataFailures.push(
          output + " is missing alternate " + alternateLocale.starlight,
        );
      }
    }
    const expectedDefault =
      '<link rel="alternate" hreflang="x-default" href="' +
      origin +
      withBase(route.versioned) +
      '"/>';
    if (!html.includes(expectedDefault)) {
      metadataFailures.push(output + " is missing x-default alternate");
    }
  }
}

for (const { directory } of localeDefinitions) {
  const prefix = directory === "" ? "" : directory + "/";
  const html = await readFile(
    path.join(dist, prefix, "0.1/build/sdk/index.html"),
    "utf8",
  );
  for (const target of [
    "/" + prefix + "0.1/build/sdk/",
    "/" + prefix + "0.1/build/sdk/python/",
    "/" + prefix + "0.1/build/sdk/typescript/",
    "/" + prefix + "0.1/build/sdk/go/",
    "/" + prefix + "0.1/build/sdk/rust/",
    "/" + prefix + "0.1/build/sdk/java/",
    "/" + prefix + "0.1/build/sdk/cpp/",
  ]) {
    const targetWithBase = withBase(target);
    if (!html.includes('href="' + targetWithBase + '"')) {
      metadataFailures.push(
        prefix + "0.1/build/sdk/index.html navigation misses " + targetWithBase,
      );
    }
  }
  for (const staleTarget of [
    "/" + prefix + "sdk/",
    "/" + prefix + "sdk/python/",
    "/" + prefix + "sdk/typescript/",
    "/" + prefix + "sdk/go/",
    "/" + prefix + "sdk/rust/",
    "/" + prefix + "sdk/java/",
    "/" + prefix + "sdk/cpp/",
  ]) {
    const staleTargetWithBase = withBase(staleTarget);
    if (html.includes('href="' + staleTargetWithBase + '"')) {
      metadataFailures.push(
        prefix +
          "0.1/build/sdk/index.html navigation retains " +
          staleTargetWithBase,
      );
    }
  }
}

assert.equal(
  metadataFailures.length,
  0,
  "Normative route metadata validation failed:\n" +
    metadataFailures.map((failure) => "  " + failure).join("\n"),
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
  `Built site passed ${requiredOutputs.size} output checks and ${checkedReferences} internal reference checks across ${htmlFiles.length} pages.`,
);
