import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const releasePath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/release-source.json",
);
const artifactsPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/artifacts.json",
);
const vendoredProtocolRoot = path.join(
  repositoryRoot,
  "public/artifacts/0.1/protocol",
);
const repositoryDirectories = {
  protocol: "missionweaveprotocol",
  python: "python-sdk",
  typescript: "typescript-sdk",
  go: "go-sdk",
  rust: "rust-sdk",
  java: "java-sdk",
  cpp: "cpp-sdk",
};
const protocolRoots = [
  "CONTEXT.md",
  "spec/PROTOCOL.md",
  "schemas",
  "conformance",
  "cryptography",
  "admission",
];

async function requireDirectory(candidate, label) {
  let metadata;
  try {
    metadata = await stat(candidate);
  } catch (error) {
    if (error?.code === "ENOENT") assert.fail(`missing ${label}: ${candidate}`);
    throw error;
  }
  assert.equal(
    metadata.isDirectory(),
    true,
    `${label} is not a directory: ${candidate}`,
  );
}

function git(repo, args, options = {}) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: options.encoding ?? "buffer",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(candidate)));
    else if (entry.isFile()) files.push(candidate);
    else
      assert.fail(`vendored protocol contains a non-file entry: ${candidate}`);
  }
  return files.sort();
}

function stripSha256Prefix(value) {
  assert.match(value, /^sha256:[0-9a-f]{64}$/u);
  return value.slice("sha256:".length);
}

function withoutTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const sourcesRootValue = process.env.MW_SOURCES_ROOT;
assert.ok(sourcesRootValue, "MW_SOURCES_ROOT is required");
assert.equal(
  path.isAbsolute(sourcesRootValue),
  true,
  "MW_SOURCES_ROOT must be absolute",
);
const sourcesRoot = path.resolve(sourcesRootValue);
await requireDirectory(sourcesRoot, "normative sources root");
for (const directory of Object.values(repositoryDirectories)) {
  await requireDirectory(
    path.join(sourcesRoot, directory),
    `source repository ${directory}`,
  );
}

const release = JSON.parse(await readFile(releasePath, "utf8"));
const artifacts = JSON.parse(await readFile(artifactsPath, "utf8"));
const repositories = {
  protocol: {
    directory: repositoryDirectories.protocol,
    repository: release.repository,
    commit: release.protocolCommit,
  },
  ...Object.fromEntries(
    Object.entries(release.sdks).map(([name, commit]) => [
      name,
      {
        directory: repositoryDirectories[name],
        repository: release.sdkRepositories[name],
        commit,
      },
    ]),
  ),
};

for (const [name, source] of Object.entries(repositories)) {
  const repo = path.join(sourcesRoot, source.directory);
  assert.equal(
    git(repo, ["rev-parse", `${source.commit}^{commit}`], {
      encoding: "utf8",
    }).trim(),
    source.commit,
    `${name} source does not contain the pinned commit`,
  );
}

const protocolRepository = path.join(
  sourcesRoot,
  repositoryDirectories.protocol,
);
const sourcePaths = git(protocolRepository, [
  "ls-tree",
  "-r",
  "-z",
  release.protocolCommit,
  "--",
  ...protocolRoots,
])
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .map((record) => {
    const separator = record.indexOf("\t");
    assert.ok(separator > 0, `unexpected git ls-tree record: ${record}`);
    const metadata = record.slice(0, separator).split(" ");
    const sourcePath = record.slice(separator + 1);
    assert.deepEqual(
      metadata.slice(0, 2),
      ["100644", "blob"],
      `normative source is not a regular non-executable blob: ${sourcePath}`,
    );
    return sourcePath;
  })
  .sort();
const vendoredPaths = (await collectFiles(vendoredProtocolRoot)).map((file) =>
  path.relative(vendoredProtocolRoot, file).split(path.sep).join("/"),
);
assert.deepEqual(
  vendoredPaths,
  sourcePaths,
  "vendored protocol path set differs from the exact protocol commit",
);
for (const sourcePath of sourcePaths) {
  const sourceBytes = git(protocolRepository, [
    "show",
    `${release.protocolCommit}:${sourcePath}`,
  ]);
  const vendoredBytes = await readFile(
    path.join(vendoredProtocolRoot, ...sourcePath.split("/")),
  );
  assert.equal(
    Buffer.compare(sourceBytes, vendoredBytes),
    0,
    `vendored protocol bytes differ for ${sourcePath}`,
  );
}

const expectedPin = {
  repository: release.repository,
  commit: release.protocolCommit,
  protocolVersion: release.protocolVersion,
  wireNamespace: release.wireNamespace,
  artifacts: {
    schemas: {
      path: withoutTrailingSlash(artifacts.schemas.path),
      files: artifacts.schemas.files,
      sha256: stripSha256Prefix(artifacts.schemas.digest),
    },
    conformance: {
      path: withoutTrailingSlash(artifacts.structural.path),
      files: artifacts.structural.files,
      sha256: stripSha256Prefix(artifacts.structural.digest),
    },
  },
  cryptography: {
    path: artifacts.cryptography.manifest,
    sourceCommit: release.cryptography.sourceCommit,
    profileId: release.cryptography.profile,
    manifestVersion: release.cryptography.manifestVersion,
    artifactDigest: release.cryptography.digest,
    artifactCount: release.cryptography.artifacts,
    caseCount: release.cryptography.cases,
    evaluationCount: release.cryptography.evaluations,
  },
  admission: {
    path: artifacts.admission.manifest,
    sourceCommit: release.admission.sourceCommit,
    profileId: release.admission.profile,
    manifestVersion: release.admission.manifestVersion,
    cryptographyArtifactDigest: release.admission.cryptographyDigest,
    artifactDigest: release.admission.digest,
    artifactCount: release.admission.artifacts,
    caseCount: release.admission.cases,
    evaluationCount: release.admission.evaluations,
  },
  bundleSha256: release.protocolBundleSha256,
};

for (const name of Object.keys(release.sdks)) {
  const source = repositories[name];
  const repo = path.join(sourcesRoot, source.directory);
  const pinBytes = git(repo, ["show", `${source.commit}:PROTOCOL_PIN.json`]);
  assert.equal(
    sha256(pinBytes),
    release.protocolPinSha256,
    `${name} PROTOCOL_PIN.json byte digest mismatch`,
  );
  assert.deepEqual(
    JSON.parse(pinBytes.toString("utf8")),
    expectedPin,
    `${name} PROTOCOL_PIN.json fields differ from the normative release`,
  );
}

console.log(
  `Exact normative sources passed ${sourcePaths.length} protocol files and ${Object.keys(release.sdks).length} complete SDK pins at their seven pinned commits.`,
);
