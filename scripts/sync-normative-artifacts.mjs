import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const destination = path.join(repositoryRoot, "public/artifacts/0.1/protocol");
const destinationParent = path.dirname(destination);
const checker = path.join(
  repositoryRoot,
  "scripts/check-normative-artifacts.mjs",
);
const release = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "src/data/normative/0.1/release-source.json"),
    "utf8",
  ),
);
const sourceRoots = [
  "CONTEXT.md",
  "spec/PROTOCOL.md",
  "schemas",
  "conformance",
  "cryptography",
  "admission",
];

function parseProtocolRoot(argv) {
  assert.deepEqual(
    argv.slice(0, 1),
    ["--protocol-root"],
    "usage: sync-normative-artifacts.mjs --protocol-root /absolute/path/to/missionweaveprotocol",
  );
  assert.equal(
    argv.length,
    2,
    "usage: sync-normative-artifacts.mjs --protocol-root /absolute/path/to/missionweaveprotocol",
  );
  assert.equal(
    path.isAbsolute(argv[1]),
    true,
    "--protocol-root must be an absolute path",
  );
  return path.resolve(argv[1]);
}

function git(protocolRoot, args, options = {}) {
  return execFileSync("git", ["-C", protocolRoot, ...args], {
    encoding: options.encoding ?? "buffer",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function assertSafeSourcePath(value) {
  assert.equal(
    value.includes("\\"),
    false,
    `source path must use POSIX separators: ${value}`,
  );
  assert.equal(
    path.posix.isAbsolute(value),
    false,
    `source path must be relative: ${value}`,
  );
  assert.equal(
    path.posix.normalize(value),
    value,
    `source path must be canonical: ${value}`,
  );
  assert.equal(
    sourceRoots.some((root) => value === root || value.startsWith(`${root}/`)),
    true,
    `source path is outside the approved roots: ${value}`,
  );
}

async function isDirectory(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

const protocolRoot = parseProtocolRoot(process.argv.slice(2));
assert.equal(
  await isDirectory(protocolRoot),
  true,
  `protocol root is not a directory: ${protocolRoot}`,
);

const resolvedCommit = git(
  protocolRoot,
  ["rev-parse", `${release.protocolCommit}^{commit}`],
  { encoding: "utf8" },
).trim();
assert.equal(
  resolvedCommit,
  release.protocolCommit,
  `protocol repository does not resolve the exact pinned commit ${release.protocolCommit}`,
);

const records = git(protocolRoot, [
  "ls-tree",
  "-r",
  "-z",
  release.protocolCommit,
  "--",
  ...sourceRoots,
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
      `normative source must be a regular non-executable blob: ${sourcePath}`,
    );
    assert.match(
      metadata[2],
      /^[0-9a-f]{40,64}$/u,
      `invalid blob id for ${sourcePath}`,
    );
    assertSafeSourcePath(sourcePath);
    return sourcePath;
  })
  .sort();

assert.equal(
  new Set(records).size,
  records.length,
  "git returned duplicate source paths",
);
assert.equal(
  records.length,
  194,
  "unexpected exact-commit normative source file count",
);
for (const required of [
  "CONTEXT.md",
  "spec/PROTOCOL.md",
  "schemas/common.schema.json",
  "conformance/manifest.json",
  "cryptography/manifest.json",
  "admission/manifest.json",
]) {
  assert.equal(
    records.includes(required),
    true,
    `pinned source is missing ${required}`,
  );
}

await mkdir(destinationParent, { recursive: true });
const stagingContainer = await mkdtemp(
  path.join(destinationParent, ".protocol-staging-"),
);
const stagingRoot = path.join(stagingContainer, "protocol");
const backup = path.join(
  destinationParent,
  `.protocol-backup-${process.pid}-${Date.now()}`,
);
let previousMoved = false;
let installed = false;

try {
  await mkdir(stagingRoot);
  for (const sourcePath of records) {
    const output = path.join(stagingRoot, ...sourcePath.split("/"));
    await mkdir(path.dirname(output), { recursive: true });
    const bytes = git(protocolRoot, [
      "show",
      `${release.protocolCommit}:${sourcePath}`,
    ]);
    await writeFile(output, bytes);
  }

  execFileSync(process.execPath, [checker, "--artifact-root", stagingRoot], {
    cwd: repositoryRoot,
    stdio: "inherit",
  });

  if (await isDirectory(destination)) {
    await rename(destination, backup);
    previousMoved = true;
  }

  try {
    await rename(stagingRoot, destination);
    installed = true;
  } catch (error) {
    if (previousMoved) {
      await rename(backup, destination);
      previousMoved = false;
    }
    throw error;
  }

  if (previousMoved) {
    await rm(backup, { recursive: true, force: true });
    previousMoved = false;
  }
} finally {
  if (!installed && previousMoved && !(await isDirectory(destination))) {
    await rename(backup, destination);
  }
  await rm(stagingContainer, { recursive: true, force: true });
}

console.log(
  `Synchronized ${records.length} normative protocol files from ${release.protocolCommit}.`,
);
