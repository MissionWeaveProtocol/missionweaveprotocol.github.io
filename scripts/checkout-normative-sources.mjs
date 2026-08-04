import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstat, mkdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const releasePath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/release-source.json",
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

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    assert.ok(value, `missing value for ${flag ?? "argument"}`);
    assert.equal(
      ["--sources-root", "--mirror-root"].includes(flag),
      true,
      `unknown argument ${flag}`,
    );
    assert.equal(flag in options, false, `duplicate argument ${flag}`);
    assert.equal(
      path.isAbsolute(value),
      true,
      `${flag} must be an absolute path`,
    );
    options[flag] = path.resolve(value);
  }
  assert.ok(options["--sources-root"], "--sources-root is required");
  return {
    sourcesRoot: options["--sources-root"],
    mirrorRoot: options["--mirror-root"],
  };
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: options.cwd,
    encoding: options.encoding ?? "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
}

async function pathKind(candidate) {
  try {
    const metadata = await lstat(candidate);
    if (metadata.isSymbolicLink()) return "symbolic link";
    if (metadata.isDirectory()) return "directory";
    return "other";
  } catch (error) {
    if (error?.code === "ENOENT") return "missing";
    throw error;
  }
}

function isWithinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function resolveSafeDestination(sourcesRoot, destination) {
  const destinationKind = await pathKind(destination);
  assert.notEqual(
    destinationKind,
    "symbolic link",
    `repository destination is a symbolic link: ${destination}`,
  );
  if (destinationKind === "missing") {
    return { destinationKind, repositoryPath: destination };
  }
  const repositoryPath = await realpath(destination);
  assert.equal(
    isWithinRoot(sourcesRoot, repositoryPath),
    true,
    `repository destination resolves outside sources root: ${destination}`,
  );
  return { destinationKind, repositoryPath };
}

function normalizeRepository(value) {
  return value
    .replace(/\.git$/u, "")
    .replace(/\/$/u, "")
    .toLowerCase();
}

const { sourcesRoot, mirrorRoot } = parseArguments(process.argv.slice(2));
if (mirrorRoot) {
  assert.equal(
    await pathKind(mirrorRoot),
    "directory",
    `mirror root is not a directory: ${mirrorRoot}`,
  );
}
await mkdir(sourcesRoot, { recursive: true });
const resolvedSourcesRoot = await realpath(sourcesRoot);

const release = JSON.parse(await readFile(releasePath, "utf8"));
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
  const destination = path.join(resolvedSourcesRoot, source.directory);
  assert.equal(
    isWithinRoot(resolvedSourcesRoot, destination),
    true,
    `repository destination escapes sources root: ${destination}`,
  );
  const cloneSource = mirrorRoot
    ? pathToFileURL(path.join(mirrorRoot, source.directory)).href
    : source.repository;
  let { destinationKind, repositoryPath } = await resolveSafeDestination(
    resolvedSourcesRoot,
    destination,
  );
  let newlyCloned = false;

  if (destinationKind === "missing") {
    const cloneArguments = ["clone", "--no-checkout"];
    cloneArguments.push(cloneSource, destination);
    git(cloneArguments, { cwd: resolvedSourcesRoot, stdio: "inherit" });
    newlyCloned = true;
    ({ destinationKind, repositoryPath } = await resolveSafeDestination(
      resolvedSourcesRoot,
      destination,
    ));
    assert.equal(
      destinationKind,
      "directory",
      `cloned repository destination is not a directory: ${destination}`,
    );
  } else {
    assert.equal(
      destinationKind,
      "directory",
      `repository destination is not a directory: ${destination}`,
    );
    assert.equal(
      git(["-C", repositoryPath, "rev-parse", "--is-inside-work-tree"]).trim(),
      "true",
      `repository destination is not a Git worktree: ${destination}`,
    );
    assert.equal(
      normalizeRepository(
        git(["-C", repositoryPath, "remote", "get-url", "origin"]).trim(),
      ),
      normalizeRepository(cloneSource),
      `${name} origin differs from the configured normative repository`,
    );
  }

  if (!newlyCloned) {
    assert.equal(
      git(["-C", repositoryPath, "status", "--porcelain"]).trim(),
      "",
      `${name} checkout is dirty; refusing to replace local work`,
    );
  }
  ({ repositoryPath } = await resolveSafeDestination(
    resolvedSourcesRoot,
    destination,
  ));
  git(["-C", repositoryPath, "fetch", "--no-tags", "origin", source.commit], {
    stdio: "inherit",
  });
  ({ repositoryPath } = await resolveSafeDestination(
    resolvedSourcesRoot,
    destination,
  ));
  git(
    [
      "-C",
      repositoryPath,
      "checkout",
      "--no-overwrite-ignore",
      "--detach",
      source.commit,
    ],
    {
      stdio: "inherit",
    },
  );
  assert.equal(
    git(["-C", repositoryPath, "rev-parse", "HEAD"]).trim(),
    source.commit,
    `${name} detached HEAD differs from the release source`,
  );
  assert.equal(
    git(["-C", repositoryPath, "rev-parse", "--abbrev-ref", "HEAD"]).trim(),
    "HEAD",
    `${name} checkout is not detached`,
  );
  assert.equal(
    git(["-C", repositoryPath, "status", "--porcelain"]).trim(),
    "",
    `${name} detached checkout is dirty`,
  );
}

console.log(
  `Checked out ${Object.keys(repositories).length} exact normative repositories under ${sourcesRoot}.`,
);
