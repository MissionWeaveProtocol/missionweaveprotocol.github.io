import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { localeDefinitions, routeManifest } from "./lib/normative-routes.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const canonicalSiteOrigin =
  process.env.CANONICAL_SITE_URL ?? "https://missionweaveprotocol.github.io";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizedOrigin(value) {
  const origin = new URL(value);
  invariant(
    origin.protocol === "http:" || origin.protocol === "https:",
    `SITE_URL must use http or https: ${value}`,
  );
  invariant(
    origin.username === "" && origin.password === "",
    "SITE_URL must not contain credentials",
  );
  origin.pathname = "/";
  origin.search = "";
  origin.hash = "";
  return origin;
}

function localizedPath(directory, route) {
  return directory === "" ? route : `/${directory}${route}`;
}

function canonicalMarker(route, canonicalOrigin) {
  const origin = normalizedOrigin(canonicalOrigin);
  return `<link rel="canonical" href="${new URL(route.slice(1), origin).href}"/>`;
}

export function buildVerificationChecks({
  canonicalOrigin = canonicalSiteOrigin,
} = {}) {
  const routesById = new Map(
    routeManifest.routes.map((route) => [route.id, route]),
  );
  const checks = [];
  const addHtml = (label, path, expectedPath = path) => {
    checks.push({
      label,
      path,
      expectedPath,
      contentType: "text/html",
      marker: canonicalMarker(expectedPath, canonicalOrigin),
    });
  };
  const routeFor = (id) => {
    const route = routesById.get(id);
    invariant(route, `route manifest is missing ${id}`);
    return route;
  };

  for (const id of [
    "learn",
    "reference-specification",
    "reference-conformance-structural",
    "reference-conformance-cryptography",
    "reference-conformance-admission",
    "build-sdk-python",
    "build-sdk-typescript",
    "build-sdk-go",
    "build-sdk-rust",
    "build-sdk-java",
    "build-sdk-cpp",
  ]) {
    const route = routeFor(id);
    addHtml(`English canonical ${id}`, route.versioned);
  }

  const localeSdkRepresentatives = new Map([
    ["zh-cn", "python"],
    ["zh-tw", "typescript"],
    ["ja", "go"],
    ["es", "rust"],
    ["fr", "java"],
    ["de", "cpp"],
  ]);
  for (const { directory } of localeDefinitions) {
    if (directory === "") continue;
    const sdk = localeSdkRepresentatives.get(directory);
    invariant(sdk, `no SDK representative configured for ${directory}`);
    for (const id of [
      "learn",
      "reference-specification-first-admission-and-historical-trust",
      `build-sdk-${sdk}`,
    ]) {
      const route = routeFor(id);
      addHtml(
        `${directory} canonical ${id}`,
        localizedPath(directory, route.versioned),
      );
    }
  }

  for (const id of ["learn", "build-sdk-python", "reference-specification"]) {
    const route = routeFor(id);
    addHtml(`Latest alias ${id}`, route.latest, route.versioned);
  }
  const learnRoute = routeFor("learn");
  for (const { directory } of localeDefinitions) {
    if (directory === "") continue;
    addHtml(
      `${directory} Latest Learn alias`,
      localizedPath(directory, learnRoute.latest),
      localizedPath(directory, learnRoute.versioned),
    );
  }

  for (const id of [
    "learn-child-missions",
    "build-sdk-go",
    "reference-conformance",
  ]) {
    const route = routeFor(id);
    const source = route.legacy[0] ?? route.latest;
    addHtml(`Compatibility route ${id}`, source, route.versioned);
  }

  checks.push(
    {
      label: "normative release manifest",
      path: "/artifacts/0.1/normative-release.json",
      expectedPath: "/artifacts/0.1/normative-release.json",
      contentType: "application/json",
      marker: '"releaseId": "missionweaveprotocol-0.1"',
    },
    {
      label: "First-Admission Record schema",
      path: "/artifacts/0.1/protocol/schemas/first-admission-record.schema.json",
      expectedPath:
        "/artifacts/0.1/protocol/schemas/first-admission-record.schema.json",
      contentType: "application/json",
      marker: '"title": "MissionWeaveProtocol 0.1 First-Admission Record"',
    },
  );

  const duplicatePaths = checks
    .map((check) => check.path)
    .filter((path, index, paths) => paths.indexOf(path) !== index);
  invariant(
    duplicatePaths.length === 0,
    `verification plan contains duplicate paths: ${duplicatePaths.join(", ")}`,
  );
  return checks;
}

export async function verifyPublishedCheck(siteOrigin, check) {
  const origin = normalizedOrigin(siteOrigin);
  const requestedUrl = new URL(check.path.slice(1), origin);
  const expectedUrl = new URL(check.expectedPath.slice(1), origin);
  let response = await fetch(requestedUrl, { redirect: "follow" });
  invariant(
    response.ok,
    `${check.label}: ${requestedUrl.href} returned HTTP ${response.status}`,
  );

  const finalUrl = new URL(response.url);
  const reachedExpectedUrl =
    finalUrl.origin === expectedUrl.origin &&
    finalUrl.pathname === expectedUrl.pathname &&
    finalUrl.search === expectedUrl.search;
  if (!reachedExpectedUrl) {
    const responseType =
      response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        .trim()
        .toLowerCase() ?? "";
    const redirectBody = await response.text();
    const staticRedirectMarker = `<meta http-equiv="refresh" content="0;url=${check.expectedPath}">`;
    const staticCanonicalMarker = check.marker.replace(/\/>$/u, ">");
    invariant(
      finalUrl.origin === requestedUrl.origin &&
        finalUrl.pathname === requestedUrl.pathname &&
        responseType === "text/html" &&
        redirectBody.includes(staticRedirectMarker) &&
        (redirectBody.includes(check.marker) ||
          redirectBody.includes(staticCanonicalMarker)),
      `${check.label}: final URL ${finalUrl.href} differs from ${expectedUrl.href} and does not declare that static redirect`,
    );
    response = await fetch(expectedUrl, { redirect: "follow" });
    invariant(
      response.ok,
      `${check.label}: static redirect target ${expectedUrl.href} returned HTTP ${response.status}`,
    );
    const staticTargetUrl = new URL(response.url);
    invariant(
      staticTargetUrl.origin === expectedUrl.origin &&
        staticTargetUrl.pathname === expectedUrl.pathname &&
        staticTargetUrl.search === expectedUrl.search,
      `${check.label}: static redirect target ended at ${staticTargetUrl.href}`,
    );
  }

  const contentType =
    response.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase() ?? "";
  invariant(
    contentType === check.contentType,
    `${check.label}: content type ${contentType || "<missing>"} differs from ${check.contentType}`,
  );
  const body = await response.text();
  invariant(
    body.includes(check.marker),
    `${check.label}: response is missing content marker ${check.marker}`,
  );
}

export async function verifyPublishedSite(siteOrigin, checks) {
  for (const check of checks) {
    await verifyPublishedCheck(siteOrigin, check);
  }
}

async function findAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  invariant(address && typeof address !== "string", "failed to allocate port");
  const { port } = address;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForPreview(origin, child, output) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Astro preview exited with ${child.exitCode} before readiness:\n${output()}`,
      );
    }
    try {
      const response = await fetch(origin);
      if (response.status < 500) return;
    } catch {
      // The listener is not ready yet.
    }
    await delay(100);
  }
  throw new Error(`Astro preview did not become ready at ${origin}`);
}

async function stopPreview(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  const deadline = Date.now() + 2_000;
  while (child.exitCode === null && Date.now() < deadline) await delay(50);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function verifyPreview(checks) {
  await access(path.join(repositoryRoot, "dist/index.html"));
  const port = await findAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const astroCli = path.join(
    repositoryRoot,
    "node_modules/astro/bin/astro.mjs",
  );
  const child = spawn(
    process.execPath,
    [astroCli, "preview", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: repositoryRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let previewOutput = "";
  const appendOutput = (chunk) => {
    previewOutput = `${previewOutput}${chunk}`.slice(-16_000);
  };
  child.stdout.on("data", appendOutput);
  child.stderr.on("data", appendOutput);

  try {
    await waitForPreview(origin, child, () => previewOutput);
    await verifyPublishedSite(origin, checks);
  } finally {
    await stopPreview(child);
  }
  return origin;
}

async function main() {
  const args = process.argv.slice(2);
  const spawnPreview = args.includes("--spawn-preview");
  const unknownArgs = args.filter((argument) => argument !== "--spawn-preview");
  invariant(
    unknownArgs.length === 0,
    `unknown arguments: ${unknownArgs.join(", ")}`,
  );
  const checks = buildVerificationChecks();
  const origin = spawnPreview
    ? await verifyPreview(checks)
    : process.env.SITE_URL;
  invariant(origin, "SITE_URL is required unless --spawn-preview is used");
  if (!spawnPreview) await verifyPublishedSite(origin, checks);
  console.log(
    `Published site verification passed ${checks.length} HTTP checks at ${origin}.`,
  );
}

const entrypoint = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;
if (entrypoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
