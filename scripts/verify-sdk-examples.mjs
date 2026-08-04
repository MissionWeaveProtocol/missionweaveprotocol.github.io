import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const release = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "src/data/normative/0.1/release-source.json"),
    "utf8",
  ),
);
const repositoryDirectories = {
  python: "python-sdk",
  typescript: "typescript-sdk",
  go: "go-sdk",
  rust: "rust-sdk",
  java: "java-sdk",
  cpp: "cpp-sdk",
};

const plans = [
  {
    sdk: "python",
    repositoryDirectory: repositoryDirectories.python,
    commit: release.sdks.python,
    requiredCommands: ["uv"],
    commands: [
      "uv sync --all-extras",
      "uv run python examples/website_admission.py",
    ],
  },
  {
    sdk: "typescript",
    repositoryDirectory: repositoryDirectories.typescript,
    commit: release.sdks.typescript,
    requiredCommands: ["node", "npm"],
    commands: [
      "npm ci",
      "npm run check",
      "npm run typecheck:examples",
      "npm run build",
      "node --experimental-strip-types examples/website-admission.ts",
    ],
  },
  {
    sdk: "go",
    repositoryDirectory: repositoryDirectories.go,
    commit: release.sdks.go,
    requiredCommands: ["go"],
    commands: ["go test ./...", "go run ./examples/website-admission"],
  },
  {
    sdk: "rust",
    repositoryDirectory: repositoryDirectories.rust,
    commit: release.sdks.rust,
    requiredCommands: ["cargo", "rustc"],
    commands: [
      "cargo test --locked --all-targets --all-features",
      "cargo run --locked --example website_admission",
    ],
  },
  {
    sdk: "java",
    repositoryDirectory: repositoryDirectories.java,
    commit: release.sdks.java,
    requiredCommands: ["java", "./mvnw"],
    commands: [
      "./mvnw -B -ntp verify",
      "./mvnw -q -Dexec.mainClass=org.missionweaveprotocol.examples.AdmissionExample -Dexec.classpathScope=test exec:java",
    ],
  },
  {
    sdk: "cpp",
    repositoryDirectory: repositoryDirectories.cpp,
    commit: release.sdks.cpp,
    requiredCommands: ["cmake"],
    commands: [
      "cmake -S . -B build/website-sdk -DMISSIONWEAVEPROTOCOL_BUILD_TESTS=ON -DMISSIONWEAVEPROTOCOL_BUILD_EXAMPLES=ON",
      "cmake --build build/website-sdk --parallel 2",
      "ctest --test-dir build/website-sdk --output-on-failure",
      "cmake -S website-example -B build/website-example -DMISSIONWEAVEPROTOCOL_SDK_ROOT=<exact-checkout>",
      "cmake --build build/website-example --target missionweaveprotocol_website_admission --parallel 2",
      "build/website-example/missionweaveprotocol_website_admission",
    ],
  },
];
const planBySdk = new Map(plans.map((plan) => [plan.sdk, plan]));

function parseArguments(arguments_) {
  let sdk;
  let describe = false;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--describe") {
      assert.equal(describe, false, "duplicate --describe");
      describe = true;
      continue;
    }
    if (argument === "--sdk") {
      assert.equal(sdk, undefined, "duplicate --sdk");
      sdk = arguments_[index + 1];
      assert.ok(sdk, "--sdk requires a value");
      index += 1;
      assert.ok(planBySdk.has(sdk), `unknown SDK ${sdk}`);
      continue;
    }
    assert.fail(`unknown argument ${argument}`);
  }
  assert.equal(
    describe && sdk !== undefined,
    false,
    "--describe cannot be combined with --sdk",
  );
  return { describe, sdk };
}

function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: "utf8",
    env: options.env ?? process.env,
    maxBuffer: 64 * 1024 * 1024,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const rendered = [command, ...arguments_].join(" ");
    const details = options.capture
      ? `\n${result.stdout ?? ""}\n${result.stderr ?? ""}`
      : "";
    assert.fail(`${rendered} exited ${String(result.status)}${details}`);
  }
  return result;
}

function probe(command, arguments_) {
  const result = spawnSync(command, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (!result.error && result.status === 0) return undefined;
  if (result.error?.code === "ENOENT") return `${command} was not found`;
  const detail = `${result.stderr ?? result.stdout ?? ""}`.trim();
  return `${command} ${arguments_.join(" ")} exited ${String(result.status)}${detail ? `: ${detail.split("\n", 1)[0]}` : ""}`;
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

async function requireDirectory(candidate, label) {
  let metadata;
  try {
    metadata = await stat(candidate);
  } catch (error) {
    if (error?.code === "ENOENT") assert.fail(`missing ${label}: ${candidate}`);
    throw error;
  }
  assert.equal(metadata.isDirectory(), true, `${label} is not a directory`);
}

function git(repo, arguments_) {
  return run("git", ["-C", repo, ...arguments_], {
    capture: true,
  }).stdout.trim();
}

function assertExactDetachedCheckout(plan, repo) {
  assert.equal(
    git(repo, ["rev-parse", "HEAD"]),
    plan.commit,
    `${plan.sdk} HEAD differs from the normative release pin`,
  );
  assert.equal(
    git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]),
    "HEAD",
    `${plan.sdk} checkout must be detached`,
  );
  assert.equal(
    git(repo, ["status", "--porcelain", "--untracked-files=all"]),
    "",
    `${plan.sdk} checkout must be clean`,
  );
}

async function copyExclusive(source, destination) {
  assert.equal(
    await exists(destination),
    false,
    `refusing to overwrite verifier destination ${destination}`,
  );
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, errorOnExist: true });
}

async function withTemporaryCopies(copies, operation) {
  const created = [];
  try {
    for (const [source, destination] of copies) {
      await copyExclusive(source, destination);
      created.push(destination);
    }
    await operation();
  } finally {
    for (const destination of created.reverse()) {
      await rm(destination, { recursive: true, force: true });
    }
  }
}

function toolchainBoundary(plan, repo) {
  const probes = {
    python: [["uv", ["--version"]]],
    typescript: [
      ["node", ["--version"]],
      ["npm", ["--version"]],
    ],
    go: [["go", ["version"]]],
    rust: [
      ["cargo", ["--version"]],
      ["rustc", ["--version"]],
    ],
    java: [
      ["java", ["-version"]],
      [path.join(repo, "mvnw"), ["-v"]],
    ],
    cpp: [["cmake", ["--version"]]],
  };
  for (const [command, arguments_] of probes[plan.sdk]) {
    const boundary = probe(command, arguments_);
    if (boundary) return boundary;
  }
  return undefined;
}

function cppEnvironment() {
  const environment = { ...process.env };
  if (environment.OPENSSL_ROOT_DIR) return environment;
  const brew = spawnSync("brew", ["--prefix", "openssl@3"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (brew.status === 0) {
    const opensslRoot = brew.stdout.trim();
    environment.OPENSSL_ROOT_DIR = opensslRoot;
    environment.CMAKE_PREFIX_PATH = [opensslRoot, environment.CMAKE_PREFIX_PATH]
      .filter(Boolean)
      .join(path.delimiter);
  }
  return environment;
}

async function verifyPython(repo) {
  const destination = path.join(repo, "examples/website_admission.py");
  await withTemporaryCopies(
    [
      [
        path.join(repositoryRoot, "examples/sdk/python/admission.py"),
        destination,
      ],
    ],
    async () => {
      run("uv", ["sync", "--all-extras"], { cwd: repo });
      run("uv", ["run", "python", "examples/website_admission.py"], {
        cwd: repo,
      });
    },
  );
}

async function verifyTypeScript(repo) {
  const destination = path.join(repo, "examples/website-admission.ts");
  run("npm", ["ci"], { cwd: repo });
  run("npm", ["run", "check"], { cwd: repo });
  await withTemporaryCopies(
    [
      [
        path.join(repositoryRoot, "examples/sdk/typescript/admission.ts"),
        destination,
      ],
    ],
    async () => {
      run("npm", ["run", "typecheck:examples"], { cwd: repo });
      run("npm", ["run", "build"], { cwd: repo });
      run(
        "node",
        ["--experimental-strip-types", "examples/website-admission.ts"],
        { cwd: repo },
      );
    },
  );
}

async function verifyGo(repo) {
  const destination = path.join(repo, "examples/website-admission");
  await withTemporaryCopies(
    [[path.join(repositoryRoot, "examples/sdk/go/admission"), destination]],
    async () => {
      run("go", ["test", "./..."], { cwd: repo });
      run("go", ["run", "./examples/website-admission"], { cwd: repo });
    },
  );
}

async function verifyRust(repo) {
  const destination = path.join(repo, "examples/website_admission.rs");
  await withTemporaryCopies(
    [
      [
        path.join(repositoryRoot, "examples/sdk/rust/admission.rs"),
        destination,
      ],
    ],
    async () => {
      run("cargo", ["test", "--locked", "--all-targets", "--all-features"], {
        cwd: repo,
      });
      run("cargo", ["run", "--locked", "--example", "website_admission"], {
        cwd: repo,
      });
    },
  );
}

async function verifyJava(repo) {
  const destination = path.join(
    repo,
    "examples/src/main/java/org/missionweaveprotocol/examples/AdmissionExample.java",
  );
  await withTemporaryCopies(
    [
      [
        path.join(repositoryRoot, "examples/sdk/java/AdmissionExample.java"),
        destination,
      ],
    ],
    async () => {
      run("./mvnw", ["-B", "-ntp", "verify"], { cwd: repo });
      run(
        "./mvnw",
        [
          "-q",
          "-Dexec.mainClass=org.missionweaveprotocol.examples.AdmissionExample",
          "-Dexec.classpathScope=test",
          "exec:java",
        ],
        { cwd: repo },
      );
    },
  );
}

async function verifyCpp(repo) {
  const exampleRoot = path.join(repo, "website-example");
  const sdkBuild = path.join(repo, "build/website-sdk");
  const exampleBuild = path.join(repo, "build/website-example");
  const environment = cppEnvironment();
  await withTemporaryCopies(
    [[path.join(repositoryRoot, "examples/sdk/cpp"), exampleRoot]],
    async () => {
      run(
        "cmake",
        [
          "-S",
          ".",
          "-B",
          sdkBuild,
          "-DMISSIONWEAVEPROTOCOL_BUILD_TESTS=ON",
          "-DMISSIONWEAVEPROTOCOL_BUILD_EXAMPLES=ON",
        ],
        { cwd: repo, env: environment },
      );
      run("cmake", ["--build", sdkBuild, "--parallel", "2"], {
        cwd: repo,
        env: environment,
      });
      run("ctest", ["--test-dir", sdkBuild, "--output-on-failure"], {
        cwd: repo,
        env: environment,
      });
      run(
        "cmake",
        [
          "-S",
          exampleRoot,
          "-B",
          exampleBuild,
          `-DMISSIONWEAVEPROTOCOL_SDK_ROOT=${repo}`,
        ],
        { cwd: repo, env: environment },
      );
      run(
        "cmake",
        [
          "--build",
          exampleBuild,
          "--target",
          "missionweaveprotocol_website_admission",
          "--parallel",
          "2",
        ],
        { cwd: repo, env: environment },
      );
      run(
        path.join(exampleBuild, "missionweaveprotocol_website_admission"),
        [],
        { cwd: repo, env: environment },
      );
    },
  );
}

const verifiers = {
  python: verifyPython,
  typescript: verifyTypeScript,
  go: verifyGo,
  rust: verifyRust,
  java: verifyJava,
  cpp: verifyCpp,
};

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.describe) {
    console.log(JSON.stringify(plans, null, 2));
    return;
  }

  const sourcesRootValue = process.env.MW_SOURCES_ROOT;
  assert.ok(sourcesRootValue, "MW_SOURCES_ROOT is required");
  assert.equal(
    path.isAbsolute(sourcesRootValue),
    true,
    "MW_SOURCES_ROOT must be absolute",
  );
  const sourcesRoot = path.resolve(sourcesRootValue);
  await requireDirectory(sourcesRoot, "SDK sources root");
  const selectedPlans = options.sdk ? [planBySdk.get(options.sdk)] : plans;

  for (const plan of selectedPlans) {
    const repo = path.join(sourcesRoot, plan.repositoryDirectory);
    await requireDirectory(repo, `${plan.sdk} SDK checkout`);
    assertExactDetachedCheckout(plan, repo);
  }

  run(process.execPath, ["scripts/generate-sdk-api-inventories.mjs"], {
    cwd: repositoryRoot,
    env: { ...process.env, MW_SOURCES_ROOT: sourcesRoot },
  });
  run("git", ["diff", "--exit-code", "--", "public/artifacts/0.1/sdks"], {
    cwd: repositoryRoot,
  });

  const unavailable = [];
  for (const plan of selectedPlans) {
    const repo = path.join(sourcesRoot, plan.repositoryDirectory);
    const boundary = toolchainBoundary(plan, repo);
    if (boundary) {
      unavailable.push({ sdk: plan.sdk, boundary });
      console.warn(
        `SDK example verifier boundary: ${plan.sdk} unavailable locally: ${boundary}`,
      );
      continue;
    }
    console.log(
      `Verifying ${plan.sdk} SDK example at exact detached commit ${plan.commit}.`,
    );
    await verifiers[plan.sdk](repo);
    assertExactDetachedCheckout(plan, repo);
    console.log(
      `${plan.sdk} SDK native suite and website Admission example passed.`,
    );
  }

  if (
    unavailable.length > 0 &&
    (process.env.CI === "true" ||
      process.env.MW_REQUIRE_ALL_SDK_TOOLCHAINS === "1")
  ) {
    assert.fail(
      `required SDK toolchains unavailable: ${unavailable
        .map(({ sdk, boundary }) => `${sdk}: ${boundary}`)
        .join("; ")}`,
    );
  }

  console.log(
    `SDK example verification completed ${selectedPlans.length - unavailable.length} native toolchains with ${unavailable.length} explicit local boundaries.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
