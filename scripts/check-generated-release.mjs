import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = path.join(repositoryRoot, "dist");
const releaseSourcePath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/release-source.json",
);
const generatedManifestPath = path.join(
  distRoot,
  "artifacts/0.1/normative-release.json",
);
const localePrefixes = {
  "zh-CN": "zh-cn",
  "zh-TW": "zh-tw",
  ja: "ja",
  es: "es",
  fr: "fr",
  de: "de",
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(candidate)));
    } else if (entry.isFile()) {
      files.push(candidate);
    }
  }
  return files.sort();
}

function relativeOutput(file) {
  return path.relative(distRoot, file).split(path.sep).join("/");
}

function localeForOutput(relative) {
  for (const [locale, prefix] of Object.entries(localePrefixes)) {
    if (relative.startsWith(`${prefix}/`)) return locale;
  }
  return "en";
}

async function computeContentDigests(locales) {
  const byLocale = Object.fromEntries(locales.map((locale) => [locale, []]));
  const htmlFiles = (await collectFiles(distRoot)).filter((file) =>
    file.endsWith(".html"),
  );
  assert.equal(
    htmlFiles.some((file) => file === generatedManifestPath),
    false,
    "normative-release.json must be excluded from content digests",
  );

  for (const file of htmlFiles) {
    const relative = relativeOutput(file);
    const locale = localeForOutput(relative);
    assert.ok(
      locale in byLocale,
      `output maps to unknown locale ${locale}: ${relative}`,
    );
    byLocale[locale].push(file);
  }

  const digests = {};
  for (const locale of locales) {
    const files = byLocale[locale].sort();
    assert.ok(
      files.length > 0,
      `no built HTML output found for locale ${locale}`,
    );
    const digest = createHash("sha256");
    for (const file of files) {
      digest.update(relativeOutput(file), "utf8");
      digest.update(Buffer.from([0]));
      digest.update(await readFile(file));
      digest.update(Buffer.from([0]));
    }
    digests[locale] = `sha256:${digest.digest("hex")}`;
  }
  return digests;
}

const releaseSource = JSON.parse(await readFile(releaseSourcePath, "utf8"));
let rawManifest;
try {
  rawManifest = await readFile(generatedManifestPath, "utf8");
} catch (error) {
  if (error?.code === "ENOENT") {
    assert.fail(
      `missing generated normative release manifest: ${generatedManifestPath}`,
    );
  }
  throw error;
}
const manifest = JSON.parse(rawManifest);
const websiteCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).trim();

assert.equal(manifest.releaseId, "missionweaveprotocol-0.1");
assert.equal(
  manifest.contentDigestAlgorithm,
  "missionweaveprotocol.built-html-tree-sha256.v1",
);
assert.match(manifest.websiteCommit, /^[0-9a-f]{40}$/u);
assert.equal(manifest.websiteCommit, websiteCommit);
assert.equal(typeof manifest.buildIdentity, "string");
assert.ok(manifest.buildIdentity.length > 0);
assert.match(
  manifest.buildIdentity,
  /^(?:github:[^:\s]+:[^:\s]+|local:[0-9a-f]{40})$/u,
  "build identity must be a GitHub run/attempt pair or a local website commit",
);
if (manifest.buildIdentity.startsWith("local:")) {
  assert.equal(
    manifest.buildIdentity,
    `local:${websiteCommit}`,
    "local build identity must name the website commit",
  );
}
if (process.env.NORMATIVE_EXPECTED_BUILD_IDENTITY) {
  assert.equal(
    manifest.buildIdentity,
    process.env.NORMATIVE_EXPECTED_BUILD_IDENTITY,
    "generated build identity differs from the explicitly expected identity",
  );
}
assert.deepEqual(Object.keys(manifest.contentDigests), releaseSource.locales);
for (const locale of releaseSource.locales) {
  assert.match(manifest.contentDigests[locale], /^sha256:[0-9a-f]{64}$/u);
}
assert.deepEqual(
  manifest.contentDigests,
  await computeContentDigests(releaseSource.locales),
);

const sourceFields = structuredClone(manifest);
delete sourceFields.websiteCommit;
delete sourceFields.buildIdentity;
delete sourceFields.contentDigests;
assert.deepEqual(
  sourceFields,
  releaseSource,
  "generated manifest must preserve every release-source field exactly",
);
assert.equal(
  rawManifest.endsWith("\n"),
  true,
  "generated manifest needs a final newline",
);

console.log(
  `Generated normative release passed for website ${websiteCommit}, build ${manifest.buildIdentity}, and ${releaseSource.locales.length} locale content digests.`,
);
