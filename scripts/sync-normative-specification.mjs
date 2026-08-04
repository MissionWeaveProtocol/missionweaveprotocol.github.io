import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

import {
  clauseAssignments,
  sourceInjections,
  sourceReplacements,
  specificationPages,
} from "./lib/normative-specification-config.mjs";
import {
  buildInitialClauseManifest,
  refreshClauseManifest,
  renderSpecification,
} from "./lib/normative-specification.mjs";

function parseArguments(argv) {
  if (argv.length === 0) return { check: false };
  if (argv.length === 1 && argv[0] === "--check") return { check: true };
  throw new Error("usage: sync-normative-specification.mjs [--check]");
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

const { check } = parseArguments(process.argv.slice(2));
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/clauses.json",
);
const sourcePath = path.join(
  repositoryRoot,
  "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
);
const terminologyPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/terminology.json",
);
const localePolicyPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/locale-policy.json",
);
const releaseSourcePath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/release-source.json",
);
const contentRoot = path.join(repositoryRoot, "src/content/docs/0.1");
const prettierConfig = (await resolveConfig(manifestPath)) ?? {};

const [
  source,
  terminologyText,
  localePolicyText,
  releaseSourceText,
  manifestText,
] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(terminologyPath, "utf8"),
  readFile(localePolicyPath, "utf8"),
  readFile(releaseSourcePath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
const terminology = JSON.parse(terminologyText);
const localePolicy = JSON.parse(localePolicyText);
const releaseSource = JSON.parse(releaseSourceText);
const currentManifest = JSON.parse(manifestText);
const refreshedManifest =
  currentManifest.clauses.length === 0
    ? buildInitialClauseManifest({
        source,
        sourcePath: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
        sourceRepository: releaseSource.repository,
        sourceCommit: releaseSource.protocolCommit,
        protocolVersion: releaseSource.protocolVersion,
        prefixes: currentManifest.prefixes,
        pages: specificationPages,
        normativeLevels: terminology.normativeKeywords,
      })
    : refreshClauseManifest({
        source,
        manifest: currentManifest,
        pages: specificationPages,
        normativeLevels: terminology.normativeKeywords,
        clauseAssignments,
      });
const manifest = {
  ...refreshedManifest,
  protocolVersion: releaseSource.protocolVersion,
  source: {
    ...refreshedManifest.source,
    repository: releaseSource.repository,
    commit: releaseSource.protocolCommit,
    path: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
  },
};
const publication = renderSpecification({
  source,
  manifest,
  pages: specificationPages,
  normativeLevels: terminology.normativeKeywords,
  explicitExclusionsByClauseId: localePolicy.explicitExclusionsByClauseId,
  releaseStatus: "Draft Standard",
  releaseVersion: "0.1.0",
  replacements: sourceReplacements,
  injections: sourceInjections,
});
const expectedManifest = await format(JSON.stringify(manifest), {
  ...prettierConfig,
  filepath: manifestPath,
});
const expectedFiles = new Map();
for (const [relativePath, contents] of publication.files) {
  expectedFiles.set(
    relativePath,
    await format(contents, {
      ...prettierConfig,
      filepath: path.join(contentRoot, relativePath),
    }),
  );
}

if (check) {
  const failures = [];
  if (manifestText !== expectedManifest) {
    failures.push("src/data/normative/0.1/clauses.json is not synchronized");
  }
  for (const [relativePath, expected] of expectedFiles) {
    const destination = path.join(contentRoot, relativePath);
    if (!(await exists(destination))) {
      failures.push(`missing generated specification page: ${relativePath}`);
      continue;
    }
    const actual = await readFile(destination, "utf8");
    if (actual !== expected) {
      failures.push(`generated specification page differs: ${relativePath}`);
    }
  }
  if (failures.length > 0) {
    console.error("Normative specification synchronization check failed:");
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log(
    `Normative specification synchronization passed ${manifest.clauses.length} clauses across ${publication.files.size - 1} source pages.`,
  );
  process.exit(0);
}

await writeFile(manifestPath, expectedManifest);
for (const [relativePath, contents] of expectedFiles) {
  const destination = path.join(contentRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}
console.log(
  `Synchronized ${manifest.clauses.length} normative clauses across ${publication.files.size - 1} source pages and one index.`,
);
