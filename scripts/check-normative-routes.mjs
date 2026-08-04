import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildNormativeRedirects,
  buildNormativeSidebar,
} from "./lib/normative-routes.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const dataRoot = path.join(projectRoot, "src/data/normative/0.1");
const contentRoot = path.join(projectRoot, "src/content/docs");
const localeDirectories = ["", "zh-cn", "zh-tw", "ja", "es", "fr", "de"];
const expectedGroups = ["learn", "build", "reference", "community"];

const fail = (message) => {
  throw new Error(`Normative route check failed: ${message}`);
};

const readJson = async (fileName) => {
  const filePath = path.join(dataRoot, fileName);
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail(`missing ${path.relative(projectRoot, filePath)}`);
    }
    fail(
      `cannot read ${path.relative(projectRoot, filePath)}: ${error.message}`,
    );
  }
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
};

const contentSlug = (filePath, root) => {
  const relative = path.relative(root, filePath).replaceAll(path.sep, "/");
  return relative.replace(/\.(md|mdx)$/, "").replace(/(?:^|\/)index$/, "");
};

const routePath = (prefix, slug) =>
  `/${[prefix, slug].filter(Boolean).join("/")}/`.replace(/\/+/g, "/");

const requirePath = (value, field) => {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    !value.endsWith("/")
  ) {
    fail(`${field} must be an absolute trailing-slash path`);
  }
  if (value.includes("//")) {
    fail(`${field} contains an empty path segment: ${value}`);
  }
};

const assertUnique = (values, label) => {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) fail(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
};

const fileExists = async (filePath) => {
  try {
    return (await stat(filePath)).isFile();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
};

const routesDocument = await readJson("routes.json");
const navigationDocument = await readJson("navigation.json");

if (routesDocument.schemaVersion !== 1) fail("routes schemaVersion must be 1");
if (routesDocument.protocolVersion !== "0.1") {
  fail("routes protocolVersion must be 0.1");
}
if (
  !Array.isArray(routesDocument.routes) ||
  routesDocument.routes.length === 0
) {
  fail("routes must be a non-empty array");
}

const routeIds = routesDocument.routes.map((route) => route.id);
assertUnique(routeIds, "route id");

const versionedPaths = [];
const sourceSlugs = [];
const redirectSources = [];
const routeById = new Map();

for (const route of routesDocument.routes) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route.id ?? "")) {
    fail(`invalid route id: ${route.id}`);
  }
  if (!expectedGroups.slice(0, 3).includes(route.section)) {
    fail(`route ${route.id} has invalid section ${route.section}`);
  }
  if (
    typeof route.source !== "string" ||
    (route.source !== route.section &&
      !route.source.startsWith(`${route.section}/`))
  ) {
    fail(`route ${route.id} has invalid source ${route.source}`);
  }

  const expectedVersioned = routePath("0.1", route.source);
  const expectedLatest = routePath("", route.source);
  requirePath(route.versioned, `${route.id}.versioned`);
  requirePath(route.latest, `${route.id}.latest`);
  if (route.versioned !== expectedVersioned) {
    fail(`${route.id}.versioned must be ${expectedVersioned}`);
  }
  if (route.latest !== expectedLatest) {
    fail(`${route.id}.latest must be ${expectedLatest}`);
  }
  if (!Array.isArray(route.legacy)) fail(`${route.id}.legacy must be an array`);

  versionedPaths.push(route.versioned);
  sourceSlugs.push(route.source);
  redirectSources.push(route.latest);
  routeById.set(route.id, route);

  for (const legacyPath of route.legacy) {
    requirePath(legacyPath, `${route.id}.legacy`);
    if (legacyPath === "/" || legacyPath === route.versioned) {
      fail(`${route.id} contains a loop or generic fallback: ${legacyPath}`);
    }
    redirectSources.push(legacyPath);
  }

  for (const locale of localeDirectories) {
    const localeRoot = path.join(contentRoot, locale, "0.1");
    const sourcePath = path.join(localeRoot, `${route.source}.mdx`);
    const indexPath = path.join(localeRoot, route.source, "index.mdx");
    if (!(await fileExists(sourcePath)) && !(await fileExists(indexPath))) {
      fail(
        `route ${route.id} is missing localized source for ${locale || "en"}`,
      );
    }
  }
}

assertUnique(versionedPaths, "versioned route");
assertUnique(sourceSlugs, "content source");
assertUnique(redirectSources, "redirect source");

const englishVersionedRoot = path.join(contentRoot, "0.1");
const englishFiles = await walk(englishVersionedRoot);
const actualEnglishSlugs = englishFiles.map((file) =>
  contentSlug(file, englishVersionedRoot),
);
assertUnique(actualEnglishSlugs, "English versioned content slug");

for (const slug of actualEnglishSlugs) {
  if (!sourceSlugs.includes(slug))
    fail(`missing route manifest entry for ${slug}`);
}
for (const slug of sourceSlugs) {
  if (!actualEnglishSlugs.includes(slug))
    fail(`route manifest has no source for ${slug}`);
}

if (navigationDocument.schemaVersion !== 1) {
  fail("navigation schemaVersion must be 1");
}
if (navigationDocument.protocolVersion !== "0.1") {
  fail("navigation protocolVersion must be 0.1");
}
if (!Array.isArray(navigationDocument.groups))
  fail("navigation groups must be an array");

const groupIds = navigationDocument.groups.map((group) => group.id);
if (JSON.stringify(groupIds) !== JSON.stringify(expectedGroups)) {
  fail(`navigation groups must be exactly ${expectedGroups.join(", ")}`);
}

const navigationRouteIds = [];
const validateNavigationItems = (items, groupId) => {
  for (const item of items) {
    if (!item.labels || typeof item.labels !== "object") {
      fail(`navigation item in ${groupId} is missing localized labels`);
    }
    for (const locale of localeDirectories) {
      const localeKey = locale || "en";
      if (
        typeof item.labels[localeKey] !== "string" ||
        item.labels[localeKey] === ""
      ) {
        fail(`navigation item in ${groupId} is missing label ${localeKey}`);
      }
    }

    if (item.route) {
      if (!routeById.has(item.route)) {
        fail(`navigation references unknown route ${item.route}`);
      }
      navigationRouteIds.push(item.route);
    } else if (item.slug) {
      if (item.slug !== "community") {
        fail(`navigation item in ${groupId} has invalid slug ${item.slug}`);
      }
    } else if (Array.isArray(item.items) && item.items.length > 0) {
      validateNavigationItems(item.items, groupId);
    } else {
      fail(
        `navigation item in ${groupId} must reference a route, slug, or items`,
      );
    }
  }
};

for (const group of navigationDocument.groups) {
  if (!group.labels || typeof group.labels !== "object") {
    fail(`navigation group ${group.id} is missing localized labels`);
  }
  for (const locale of localeDirectories) {
    const localeKey = locale || "en";
    if (
      typeof group.labels[localeKey] !== "string" ||
      group.labels[localeKey] === ""
    ) {
      fail(`navigation group ${group.id} is missing label ${localeKey}`);
    }
  }
  if (!Array.isArray(group.items) || group.items.length === 0) {
    fail(`navigation group ${group.id} must contain items`);
  }
  validateNavigationItems(group.items, group.id);
}

assertUnique(navigationRouteIds, "navigation route");
for (const routeId of routeIds) {
  if (!navigationRouteIds.includes(routeId)) {
    fail(`route ${routeId} is missing from navigation`);
  }
}

const requiredRouteIds = [
  "learn-first-admission-and-historical-trust",
  "build-sdk-python",
  "build-sdk-typescript",
  "build-sdk-go",
  "build-sdk-rust",
  "build-sdk-java",
  "build-sdk-cpp",
  "reference-conformance-structural",
  "reference-conformance-cryptography",
  "reference-conformance-admission",
];
for (const routeId of requiredRouteIds) {
  if (!routeById.has(routeId)) fail(`missing required route ${routeId}`);
}

const redirects = buildNormativeRedirects();
const expectedRedirectCount = redirectSources.length * localeDirectories.length;
if (Object.keys(redirects).length !== expectedRedirectCount) {
  fail(
    `generated ${Object.keys(redirects).length} redirects instead of ${expectedRedirectCount}`,
  );
}
if (
  redirects["/docs/0.1/trust-and-authority/"] !==
  "/0.1/learn/first-admission-and-historical-trust/"
) {
  fail("legacy trust-and-authority route does not map to First Admission");
}
if (
  redirects["/de/sdk/java/"] !== "/de/0.1/build/sdk/java/" ||
  redirects["/zh-cn/learn/core-model/"] !== "/zh-cn/0.1/learn/core-model/"
) {
  fail("localized redirect relationships are incomplete");
}

const sidebar = buildNormativeSidebar();
if (sidebar.length !== expectedGroups.length) {
  fail(`generated sidebar must contain ${expectedGroups.length} groups`);
}
if (sidebar[0]?.items[0]?.badge?.text?.en !== "Draft Standard 0.1") {
  fail("versioned root is missing the Draft Standard 0.1 badge");
}

console.log(
  `Normative routes passed ${routeIds.length} canonical pages, ${redirectSources.length} English redirects, ${localeDirectories.length} locales, and ${groupIds.length} navigation groups.`,
);
