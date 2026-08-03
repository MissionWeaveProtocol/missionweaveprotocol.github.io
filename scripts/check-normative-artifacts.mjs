import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const dataRoot = path.join(repositoryRoot, "src/data/normative/0.1");
const defaultArtifactRoot = path.join(
  repositoryRoot,
  "public/artifacts/0.1/protocol",
);

function parseArtifactRoot(argv) {
  if (argv.length === 0) {
    return defaultArtifactRoot;
  }
  assert.deepEqual(
    argv.slice(0, 1),
    ["--artifact-root"],
    "usage: check-normative-artifacts.mjs [--artifact-root /absolute/path]",
  );
  assert.equal(
    argv.length,
    2,
    "usage: check-normative-artifacts.mjs [--artifact-root /absolute/path]",
  );
  assert.equal(
    path.isAbsolute(argv[1]),
    true,
    "--artifact-root must be an absolute path",
  );
  return path.resolve(argv[1]);
}

const artifactRoot = parseArtifactRoot(process.argv.slice(2));

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function requirePath(candidate, kind, label) {
  let metadata;
  try {
    metadata = await stat(candidate);
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail(`missing ${label}: ${candidate}`);
    }
    throw error;
  }

  assert.equal(
    kind === "directory" ? metadata.isDirectory() : metadata.isFile(),
    true,
    `${label} must be a ${kind}: ${candidate}`,
  );
}

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function assertSafeRepositoryPath(value, label, allowedRoots) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.length > 0, `${label} must not be empty`);
  assert.equal(
    value.includes("\\"),
    false,
    `${label} must use POSIX separators`,
  );
  assert.equal(value.includes("\0"), false, `${label} must not contain NUL`);
  assert.equal(
    path.posix.isAbsolute(value),
    false,
    `${label} must be relative`,
  );
  assert.equal(
    path.posix.normalize(value),
    value,
    `${label} must be a canonical repository path`,
  );
  assert.equal(
    value.includes("//"),
    false,
    `${label} must not contain empty segments`,
  );
  assert.equal(
    value.split("/").some((segment) => segment === "." || segment === ".."),
    false,
    `${label} must not traverse directories`,
  );
  assert.equal(
    allowedRoots.some((root) => value === root || value.startsWith(`${root}/`)),
    true,
    `${label} is outside the allowed artifact roots: ${value}`,
  );

  const resolved = path.resolve(artifactRoot, ...value.split("/"));
  assert.equal(
    resolved.startsWith(`${artifactRoot}${path.sep}`),
    true,
    `${label} resolves outside the artifact root`,
  );
  return resolved;
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(candidate)));
    } else if (entry.isFile()) {
      files.push(candidate);
    } else {
      assert.fail(`artifact tree contains a non-file entry: ${candidate}`);
    }
  }
  return files.sort();
}

async function treeDigest(files) {
  const digest = createHash("sha256");
  for (const file of files) {
    const relative = path
      .relative(artifactRoot, file)
      .split(path.sep)
      .join("/");
    digest.update(relative, "utf8");
    digest.update(Buffer.from([0]));
    digest.update(await readFile(file));
    digest.update(Buffer.from([0]));
  }
  return `sha256:${digest.digest("hex")}`;
}

function jcs(value) {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    assert.equal(
      Number.isSafeInteger(value),
      true,
      "manifest numbers must be safe integers",
    );
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => jcs(item)).join(",")}]`;
  }
  assert.equal(
    typeof value,
    "object",
    `unsupported JCS value type: ${typeof value}`,
  );
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${jcs(value[key])}`)
    .join(",")}}`;
}

function flattenEvaluations(manifest, label) {
  assert.ok(Array.isArray(manifest.cases), `${label} cases must be an array`);
  const caseIds = new Set();
  const evaluations = [];
  for (const [caseIndex, testCase] of manifest.cases.entries()) {
    assert.equal(
      typeof testCase,
      "object",
      `${label} case ${caseIndex} must be an object`,
    );
    assert.equal(
      typeof testCase.id,
      "string",
      `${label} case ${caseIndex} needs an id`,
    );
    assert.equal(
      caseIds.has(testCase.id),
      false,
      `${label} has duplicate case id ${testCase.id}`,
    );
    caseIds.add(testCase.id);
    assert.ok(
      Array.isArray(testCase.evaluations) && testCase.evaluations.length > 0,
      `${label} case ${testCase.id} needs evaluations`,
    );
    for (const evaluation of testCase.evaluations) {
      evaluations.push({ kind: testCase.kind, evaluation });
    }
  }
  return evaluations;
}

async function verifyManifest({
  label,
  manifestPath,
  allowedRoots,
  releaseSection,
  artifactSection,
  classify,
}) {
  const manifestFile = path.join(artifactRoot, ...manifestPath.split("/"));
  const raw = await readFile(manifestFile);
  assert.equal(
    sha256(raw),
    artifactSection.manifestSha256,
    `${label} raw manifest digest mismatch`,
  );
  const manifest = JSON.parse(raw.toString("utf8"));

  assert.equal(
    manifest.protocolVersion,
    "0.1",
    `${label} protocol version mismatch`,
  );
  assert.equal(
    manifest.manifestVersion,
    releaseSection.manifestVersion,
    `${label} manifest version mismatch`,
  );
  assert.equal(
    manifest.profileId,
    releaseSection.profile,
    `${label} profile mismatch`,
  );
  assert.ok(
    Array.isArray(manifest.artifacts),
    `${label} artifacts must be an array`,
  );
  assert.equal(
    manifest.artifacts.length,
    releaseSection.artifacts,
    `${label} artifact count mismatch`,
  );

  const declaredPaths = new Set();
  for (const [index, item] of manifest.artifacts.entries()) {
    assert.equal(
      typeof item,
      "object",
      `${label} artifact ${index} must be an object`,
    );
    const file = assertSafeRepositoryPath(
      item.path,
      `${label} artifact ${index} path`,
      allowedRoots,
    );
    assert.equal(
      declaredPaths.has(item.path),
      false,
      `${label} declares duplicate artifact path ${item.path}`,
    );
    declaredPaths.add(item.path);
    await requirePath(file, "file", `${label} artifact ${item.path}`);
    const bytes = await readFile(file);
    assert.equal(
      bytes.length,
      item.byteLength,
      `${label} artifact ${item.path} byteLength mismatch`,
    );
    assert.equal(
      sha256(bytes),
      item.sha256,
      `${label} artifact ${item.path} sha256 mismatch`,
    );
  }

  const digestInput = structuredClone(manifest);
  delete digestInput.artifactDigest;
  const computedDigest = sha256(Buffer.from(jcs(digestInput), "utf8"));
  assert.equal(
    computedDigest,
    manifest.artifactDigest,
    `${label} manifest JCS artifactDigest mismatch`,
  );
  assert.equal(
    manifest.artifactDigest,
    releaseSection.digest,
    `${label} release digest mismatch`,
  );

  const evaluations = flattenEvaluations(manifest, label);
  assert.equal(
    manifest.cases.length,
    releaseSection.cases,
    `${label} case count mismatch`,
  );
  assert.equal(
    evaluations.length,
    releaseSection.evaluations,
    `${label} evaluation count mismatch`,
  );
  const outcomes = evaluations.reduce(
    (counts, entry) => {
      counts[classify(entry)] += 1;
      return counts;
    },
    { complete: 0, rejected: 0 },
  );
  assert.equal(
    outcomes.complete,
    releaseSection.complete,
    `${label} complete outcome count mismatch`,
  );
  assert.equal(
    outcomes.rejected,
    releaseSection.rejected,
    `${label} rejected outcome count mismatch`,
  );
}

await requirePath(artifactRoot, "directory", "local protocol artifact root");

const release = await readJson(path.join(dataRoot, "release-source.json"));
const artifacts = await readJson(path.join(dataRoot, "artifacts.json"));

for (const [relative, kind] of [
  ["CONTEXT.md", "file"],
  ["spec/PROTOCOL.md", "file"],
  ["schemas", "directory"],
  ["conformance", "directory"],
  ["cryptography", "directory"],
  ["admission", "directory"],
]) {
  await requirePath(
    path.join(artifactRoot, ...relative.split("/")),
    kind,
    `protocol artifact ${relative}`,
  );
}

assert.equal(artifacts.protocolCommit, release.protocolCommit);
assert.equal(artifacts.publicBase, "/artifacts/0.1/protocol/");
assert.deepEqual(artifacts.protocolPin, {
  sha256: release.protocolPinSha256,
  bundleSha256: release.protocolBundleSha256,
});

for (const [label, descriptor] of [
  ["protocol context", artifacts.context],
  ["protocol specification", artifacts.specification],
]) {
  const file = assertSafeRepositoryPath(descriptor.path, `${label} path`, [
    "CONTEXT.md",
    "spec",
  ]);
  const bytes = await readFile(file);
  assert.equal(
    bytes.length,
    descriptor.byteLength,
    `${label} byteLength mismatch`,
  );
  assert.equal(sha256(bytes), descriptor.sha256, `${label} sha256 mismatch`);
}

const specification = await readFile(
  path.join(artifactRoot, "spec/PROTOCOL.md"),
  "utf8",
);
assert.match(
  specification,
  /\.\.\/CONTEXT\.md/u,
  "the vendored protocol specification must retain its normative CONTEXT.md dependency",
);

const schemaFiles = (
  await collectFiles(path.join(artifactRoot, "schemas"))
).filter((file) => file.endsWith(".schema.json"));
assert.equal(
  schemaFiles.length,
  release.schemas.count,
  "schema count mismatch",
);
assert.equal(
  schemaFiles.length,
  artifacts.schemas.files,
  "schema metadata mismatch",
);
assert.equal(
  await treeDigest(schemaFiles),
  artifacts.schemas.digest,
  "schema tree digest mismatch",
);

const conformanceManifest = await readJson(
  path.join(artifactRoot, "conformance/manifest.json"),
);
assert.ok(
  Array.isArray(conformanceManifest),
  "conformance manifest must be an array",
);
const vectorPaths = new Set();
const vectorNames = new Set();
let validVectors = 0;
let invalidVectors = 0;
for (const [index, vector] of conformanceManifest.entries()) {
  assert.equal(
    typeof vector,
    "object",
    `conformance vector ${index} must be an object`,
  );
  assert.equal(
    typeof vector.name,
    "string",
    `conformance vector ${index} needs a name`,
  );
  assert.equal(
    vectorNames.has(vector.name),
    false,
    `duplicate conformance vector name ${vector.name}`,
  );
  vectorNames.add(vector.name);
  const file = assertSafeRepositoryPath(
    vector.instance,
    `conformance vector ${index} path`,
    ["conformance/vectors"],
  );
  assert.equal(
    vectorPaths.has(vector.instance),
    false,
    `duplicate conformance vector path ${vector.instance}`,
  );
  vectorPaths.add(vector.instance);
  await requirePath(file, "file", `conformance vector ${vector.instance}`);
  const schema = assertSafeRepositoryPath(
    vector.schema,
    `conformance vector ${index} schema`,
    ["schemas"],
  );
  await requirePath(schema, "file", `conformance schema ${vector.schema}`);
  assert.equal(
    typeof vector.valid,
    "boolean",
    `${vector.instance} valid must be boolean`,
  );
  if (vector.valid) validVectors += 1;
  else invalidVectors += 1;
}
assert.equal(
  vectorPaths.size,
  release.structural.total,
  "structural vector count mismatch",
);
assert.equal(
  validVectors,
  release.structural.valid,
  "valid vector count mismatch",
);
assert.equal(
  invalidVectors,
  release.structural.invalid,
  "invalid vector count mismatch",
);
const actualVectorFiles = (
  await collectFiles(path.join(artifactRoot, "conformance/vectors"))
).map((file) => path.relative(artifactRoot, file).split(path.sep).join("/"));
assert.deepEqual(
  actualVectorFiles.sort(),
  [...vectorPaths].sort(),
  "conformance manifest and vector files differ",
);
const conformanceJsonFiles = (
  await collectFiles(path.join(artifactRoot, "conformance"))
).filter((file) => file.endsWith(".json"));
assert.equal(
  conformanceJsonFiles.length,
  artifacts.structural.files,
  "structural JSON file count mismatch",
);
assert.equal(
  await treeDigest(conformanceJsonFiles),
  artifacts.structural.digest,
  "structural tree digest mismatch",
);

await verifyManifest({
  label: "cryptography",
  manifestPath: artifacts.cryptography.manifest,
  allowedRoots: ["cryptography", "schemas"],
  releaseSection: release.cryptography,
  artifactSection: artifacts.cryptography,
  classify: ({ kind, evaluation }) => {
    if (kind === "canonicalization") {
      assert.equal(
        "expect" in evaluation,
        false,
        "canonicalization outcome is implicit",
      );
      assert.equal(typeof evaluation.input, "string");
      assert.equal(typeof evaluation.expectedJcs, "string");
      assert.match(evaluation.sha256, /^sha256:[0-9a-f]{64}$/u);
      return "complete";
    }
    assert.equal(
      typeof evaluation.expect,
      "object",
      "cryptography evaluation needs expect",
    );
    return evaluation.expect.stage === "complete" ? "complete" : "rejected";
  },
});

await verifyManifest({
  label: "admission",
  manifestPath: artifacts.admission.manifest,
  allowedRoots: ["admission", "schemas"],
  releaseSection: release.admission,
  artifactSection: artifacts.admission,
  classify: ({ evaluation }) => {
    assert.equal(
      typeof evaluation.expect,
      "object",
      "Admission evaluation needs expect",
    );
    return evaluation.expect.stage === "complete" ? "complete" : "rejected";
  },
});

const admissionManifest = await readJson(
  path.join(artifactRoot, "admission/manifest.json"),
);
assert.equal(
  admissionManifest.cryptography.artifactDigest,
  release.admission.cryptographyDigest,
  "Admission cryptography digest mismatch",
);
assert.equal(
  admissionManifest.semanticStage,
  "admission",
  "Admission semantic stage mismatch",
);
assert.equal(
  admissionManifest.wireCode,
  "AUTH_INVALID_SIGNATURE",
  "Admission wire code mismatch",
);

const allFiles = await collectFiles(artifactRoot);
assert.equal(
  allFiles.length,
  artifacts.bundle.files,
  "vendored artifact file count mismatch",
);
assert.equal(
  await treeDigest(allFiles),
  artifacts.bundle.digest,
  "vendored artifact tree digest mismatch",
);

console.log(
  `Normative protocol artifacts passed ${schemaFiles.length} schemas, ${vectorPaths.size} structural vectors, ${release.cryptography.evaluations} cryptography evaluations, and ${release.admission.evaluations} Admission evaluations across ${allFiles.length} exact files.`,
);
