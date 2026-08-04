import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  appendFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const checkoutScript = path.join(
  repositoryRoot,
  "scripts/checkout-normative-sources.mjs",
);
const releasePath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/release-source.json",
);

function parseArguments(argv) {
  assert.deepEqual(
    argv.slice(0, 1),
    ["--mirror-root"],
    "usage: test-checkout-normative-sources.mjs --mirror-root /absolute/path",
  );
  assert.equal(argv.length, 2, "--mirror-root requires exactly one value");
  assert.equal(
    path.isAbsolute(argv[1]),
    true,
    "--mirror-root must be an absolute path",
  );
  return path.resolve(argv[1]);
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: options.cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
}

const mirrorRoot = parseArguments(process.argv.slice(2));
const release = JSON.parse(await readFile(releasePath, "utf8"));
const protocolMirror = path.join(mirrorRoot, "missionweaveprotocol");
assert.equal(
  git([
    "-C",
    protocolMirror,
    "rev-parse",
    `${release.protocolCommit}^{commit}`,
  ]).trim(),
  release.protocolCommit,
  "protocol mirror does not contain the pinned commit",
);
const baselineCommit = git([
  "-C",
  protocolMirror,
  "rev-parse",
  `${release.protocolCommit}^`,
]).trim();
assert.notEqual(
  baselineCommit,
  release.protocolCommit,
  "test baseline must differ from the pinned commit",
);

const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), "missionweaveprotocol-source-path-test-"),
);
try {
  const sourcesRoot = path.join(temporaryRoot, "sources");
  const externalRoot = path.join(temporaryRoot, "external");
  const externalRepository = path.join(externalRoot, "missionweaveprotocol");
  await mkdir(sourcesRoot);
  await mkdir(externalRoot);

  git([
    "clone",
    "--no-checkout",
    pathToFileURL(protocolMirror).href,
    externalRepository,
  ]);
  git(["-C", externalRepository, "checkout", "--detach", baselineCommit]);
  const externalSentinel = path.join(
    externalRepository,
    "external-sentinel.txt",
  );
  const externalSentinelContents = "external worktree contents must survive\n";
  await appendFile(
    path.join(externalRepository, ".git/info/exclude"),
    "\nexternal-sentinel.txt\n",
  );
  await writeFile(externalSentinel, externalSentinelContents);
  const externalStatus = git([
    "-C",
    externalRepository,
    "status",
    "--porcelain",
    "--ignored",
  ]);

  await symlink(
    externalRepository,
    path.join(sourcesRoot, "missionweaveprotocol"),
    "dir",
  );
  await writeFile(
    path.join(sourcesRoot, "python-sdk"),
    "stop after protocol\n",
  );

  const result = spawnSync(
    process.execPath,
    [
      checkoutScript,
      "--sources-root",
      sourcesRoot,
      "--mirror-root",
      mirrorRoot,
    ],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0, "checkout accepted a destination symlink");
  assert.equal(
    git(["-C", externalRepository, "rev-parse", "HEAD"]).trim(),
    baselineCommit,
    "checkout followed the destination symlink and modified an external worktree",
  );
  assert.equal(
    await readFile(externalSentinel, "utf8"),
    externalSentinelContents,
    "checkout modified ignored contents in the external worktree",
  );
  assert.equal(
    git(["-C", externalRepository, "status", "--porcelain", "--ignored"]),
    externalStatus,
    "checkout changed the external worktree status",
  );
  assert.match(
    output,
    /symbolic link|symlink/u,
    "checkout did not identify the rejected destination symlink",
  );

  console.log(
    "Destination symlink regression passed without modifying the external worktree.",
  );

  const ignoredSourcesRoot = path.join(temporaryRoot, "ignored-sources");
  const ignoredRepository = path.join(
    ignoredSourcesRoot,
    "missionweaveprotocol",
  );
  await mkdir(ignoredSourcesRoot);
  git([
    "clone",
    "--no-checkout",
    pathToFileURL(protocolMirror).href,
    ignoredRepository,
  ]);
  git(["-C", ignoredRepository, "checkout", "--detach", baselineCommit]);

  const ignoredFile = path.join(ignoredRepository, "admission/README.md");
  const ignoredContents = "ignored local work must survive\n";
  await appendFile(
    path.join(ignoredRepository, ".git/info/exclude"),
    "\nadmission/README.md\n",
  );
  await mkdir(path.dirname(ignoredFile), { recursive: true });
  await writeFile(ignoredFile, ignoredContents);
  assert.equal(
    git(["-C", ignoredRepository, "status", "--porcelain"]).trim(),
    "",
    "ignored-file fixture must appear clean to the checkout script",
  );
  const ignoredStatus = git([
    "-C",
    ignoredRepository,
    "status",
    "--porcelain",
    "--ignored",
  ]);
  await writeFile(
    path.join(ignoredSourcesRoot, "python-sdk"),
    "stop after protocol\n",
  );

  const ignoredResult = spawnSync(
    process.execPath,
    [
      checkoutScript,
      "--sources-root",
      ignoredSourcesRoot,
      "--mirror-root",
      mirrorRoot,
    ],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const ignoredOutput = `${ignoredResult.stdout ?? ""}\n${ignoredResult.stderr ?? ""}`;

  assert.notEqual(
    ignoredResult.status,
    0,
    "checkout overwrote an ignored local file",
  );
  assert.equal(
    git(["-C", ignoredRepository, "rev-parse", "HEAD"]).trim(),
    baselineCommit,
    "checkout changed HEAD despite the ignored local-file conflict",
  );
  assert.equal(
    await readFile(ignoredFile, "utf8"),
    ignoredContents,
    "checkout overwrote ignored local work",
  );
  assert.equal(
    git(["-C", ignoredRepository, "status", "--porcelain", "--ignored"]),
    ignoredStatus,
    "checkout changed ignored local worktree status",
  );
  assert.match(
    ignoredOutput,
    /ignored|overwrite/u,
    "checkout did not identify the ignored-file overwrite conflict",
  );

  console.log("Ignored-file regression passed without overwriting local work.");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
