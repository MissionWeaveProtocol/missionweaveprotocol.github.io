import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const referenceRoot = path.join(
  repositoryRoot,
  "src/content/docs/0.1/reference",
);
const artifactRoot = path.join(repositoryRoot, "public/artifacts/0.1");
const failures = [];

const requiredPages = new Map([
  [
    "terminology.mdx",
    [
      "ContextGlossary",
      "ArtifactLink",
      'path="protocol/CONTEXT.md"',
      "normative vocabulary",
    ],
  ],
  [
    "schemas.mdx",
    [
      "SchemaCatalog",
      "{release.schemas.count}",
      'path="protocol/schemas/README.md"',
      "Draft 2020-12",
    ],
  ],
  [
    "conformance/index.mdx",
    [
      "./structural/",
      "./cryptography/",
      "./admission/",
      "Passing one surface does not imply passing either of the others.",
    ],
  ],
  [
    "conformance/structural.mdx",
    [
      "{release.structural.total}",
      "{release.structural.valid}",
      "{release.structural.invalid}",
      "StructuralVectorCatalog",
      'path="protocol/conformance/manifest.json"',
    ],
  ],
  [
    "conformance/cryptography.mdx",
    [
      "{release.cryptography.artifacts}",
      "{release.cryptography.cases}",
      "{release.cryptography.evaluations}",
      "{release.cryptography.complete}",
      "{release.cryptography.rejected}",
      "{release.cryptography.digest}",
      "strict UTF-8 JSON parsing",
      "normative JSON Schema validation",
      "signature-envelope and protected-time validation",
      "signing-key resolution and validity validation",
      "RFC 8785 canonicalization and signing-hash production",
      "Ed25519 signature verification",
      'bundle="cryptography"',
    ],
  ],
  [
    "conformance/admission.mdx",
    [
      "{release.admission.artifacts}",
      "{release.admission.cases}",
      "{release.admission.evaluations}",
      "{release.admission.complete}",
      "{release.admission.rejected}",
      "{release.admission.profile}",
      "{release.admission.digest}",
      "Command freshness",
      "signer authorization",
      "state-machine transitions",
      "portable Admission Log proof format",
      'bundle="admission"',
    ],
  ],
  [
    "artifacts-and-digests.mdx",
    [
      "{artifacts.bundle.files}",
      "{artifacts.bundle.digest}",
      "{artifacts.protocolPin.sha256}",
      "{artifacts.protocolPin.bundleSha256}",
      "RFC 8785 JCS",
      "artifactDigest",
      'path="normative-release.json"',
    ],
  ],
  [
    "normative-release.mdx",
    [
      "release-source.json",
      "normative-release.json",
      "websiteCommit",
      "buildIdentity",
      "contentDigests",
      "generated during the production build",
      "not committed",
      "NormativeReleaseFacts",
    ],
  ],
  [
    "errata.mdx",
    [
      "No published errata for this release",
      "cross-language conflict is a release defect",
      "../specification/",
    ],
  ],
]);

const requiredComponents = new Map([
  [
    "ArtifactLink.astro",
    ["import.meta.env.BASE_URL", "artifacts/0.1/", "path traversal"],
  ],
  [
    "ContextGlossary.astro",
    ["protocol/CONTEXT.md?raw", "_Avoid_:", "contextSections"],
  ],
  [
    "SchemaCatalog.astro",
    ["protocol/schemas", "import.meta.glob", "import.meta.env.BASE_URL"],
  ],
  [
    "StructuralVectorCatalog.astro",
    [
      "protocol/conformance/manifest.json",
      "expected-valid",
      "expected-invalid",
      "import.meta.env.BASE_URL",
    ],
  ],
  [
    "BundleArtifactCatalog.astro",
    [
      "protocol/cryptography/manifest.json",
      "protocol/admission/manifest.json",
      "import.meta.env.BASE_URL",
    ],
  ],
]);

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function checkRequiredTokens(relativePath, contents, tokens) {
  const normalizedContents = contents.replace(/\s+/gu, " ");
  for (const token of tokens) {
    const normalizedToken = token.replace(/\s+/gu, " ");
    if (
      !contents.includes(token) &&
      !normalizedContents.includes(normalizedToken)
    ) {
      failures.push(`${relativePath}: missing required content ${token}`);
    }
  }
}

for (const [relativePath, tokens] of requiredPages) {
  const file = path.join(referenceRoot, relativePath);
  if (!(await exists(file))) {
    failures.push(`${relativePath}: missing normative reference page`);
    continue;
  }
  const contents = await readFile(file, "utf8");
  checkRequiredTokens(relativePath, contents, tokens);
  if (/https:\/\/github\.com\/[^\s)]+\/(?:blob|tree)\//u.test(contents)) {
    failures.push(
      `${relativePath}: links to repository docs instead of local pages`,
    );
  }
  if (/\]\(\/artifacts\/0\.1\/|href="\/artifacts\/0\.1\//u.test(contents)) {
    failures.push(`${relativePath}: uses a root-relative artifact link`);
  }

  for (const match of contents.matchAll(/<ArtifactLink\s+path="([^"]+)"/gu)) {
    const artifactPath = match[1];
    if (
      artifactPath.startsWith("/") ||
      artifactPath.includes("\\") ||
      artifactPath
        .split("/")
        .some((segment) => ["", ".", ".."].includes(segment))
    ) {
      failures.push(`${relativePath}: unsafe artifact path ${artifactPath}`);
      continue;
    }
    if (artifactPath === "normative-release.json") continue;
    if (!(await exists(path.join(artifactRoot, artifactPath)))) {
      failures.push(`${relativePath}: missing local artifact ${artifactPath}`);
    }
  }
}

for (const [name, tokens] of requiredComponents) {
  const relativePath = `src/components/${name}`;
  const file = path.join(repositoryRoot, relativePath);
  if (!(await exists(file))) {
    failures.push(`${relativePath}: missing normative reference component`);
    continue;
  }
  checkRequiredTokens(relativePath, await readFile(file, "utf8"), tokens);
}

if (failures.length > 0) {
  console.error("Normative reference page check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

assert.equal(requiredPages.size, 9);
console.log(
  `Normative reference pages passed ${requiredPages.size} local pages and ${requiredComponents.size} data-driven components.`,
);
