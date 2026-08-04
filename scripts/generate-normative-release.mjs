import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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

function buildIdentity(websiteCommit) {
  const runId = process.env.GITHUB_RUN_ID;
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT;
  assert.equal(
    Boolean(runId),
    Boolean(runAttempt),
    "GITHUB_RUN_ID and GITHUB_RUN_ATTEMPT must be supplied together",
  );
  if (runId && runAttempt) {
    return `github:${runId}:${runAttempt}`;
  }
  return `local:${websiteCommit}`;
}

const releaseSource = JSON.parse(await readFile(releaseSourcePath, "utf8"));
assert.equal(
  releaseSource.contentDigestAlgorithm,
  "missionweaveprotocol.built-html-tree-sha256.v1",
  "generator does not implement the declared content digest algorithm",
);
const websiteCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).trim();
assert.match(
  websiteCommit,
  /^[0-9a-f]{40}$/u,
  "website HEAD must be a full commit id",
);

const manifest = {
  ...releaseSource,
  websiteCommit,
  buildIdentity: buildIdentity(websiteCommit),
  contentDigests: await computeContentDigests(releaseSource.locales),
};
await mkdir(path.dirname(generatedManifestPath), { recursive: true });
await writeFile(
  generatedManifestPath,
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Generated normative release for website ${websiteCommit}, build ${manifest.buildIdentity}, and ${releaseSource.locales.length} locales.`,
);
