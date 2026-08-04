import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const verifier = path.join(repositoryRoot, "scripts/verify-sdk-examples.mjs");

function run(arguments_) {
  return spawnSync(process.execPath, [verifier, ...arguments_], {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

const described = run(["--describe"]);
assert.equal(
  described.status,
  0,
  `--describe failed:\n${described.stdout}\n${described.stderr}`,
);
const plans = JSON.parse(described.stdout);
assert.deepEqual(
  plans.map((plan) => plan.sdk),
  ["python", "typescript", "go", "rust", "java", "cpp"],
);

const expectedCommands = new Map([
  [
    "python",
    ["uv sync --all-extras", "uv run python examples/website_admission.py"],
  ],
  [
    "typescript",
    [
      "npm ci",
      "npm run check",
      "npm run typecheck:examples",
      "npm run build",
      "node --experimental-strip-types examples/website-admission.ts",
    ],
  ],
  ["go", ["go test ./...", "go run ./examples/website-admission"]],
  [
    "rust",
    [
      "cargo test --locked --all-targets --all-features",
      "cargo run --locked --example website_admission",
    ],
  ],
  [
    "java",
    [
      "./mvnw -B -ntp verify",
      "./mvnw -q -Dexec.mainClass=org.missionweaveprotocol.examples.AdmissionExample -Dexec.classpathScope=test exec:java",
    ],
  ],
]);
for (const [sdk, commands] of expectedCommands) {
  assert.deepEqual(
    plans.find((plan) => plan.sdk === sdk)?.commands,
    commands,
    `${sdk} command plan differs`,
  );
}
const cpp = plans.find((plan) => plan.sdk === "cpp");
assert.ok(cpp.commands.some((command) => command.startsWith("cmake -S . -B ")));
assert.ok(cpp.commands.some((command) => command.includes("ctest --test-dir")));
assert.ok(
  cpp.commands.some((command) =>
    command.includes("missionweaveprotocol_website_admission"),
  ),
);

for (const plan of plans) {
  assert.match(plan.commit, /^[0-9a-f]{40}$/u);
  assert.equal(typeof plan.repositoryDirectory, "string");
  assert.ok(plan.repositoryDirectory.length > 0);
  assert.ok(plan.requiredCommands.length > 0);
}

const unknownSdk = run(["--sdk", "ruby"]);
assert.notEqual(unknownSdk.status, 0);
assert.match(`${unknownSdk.stdout}\n${unknownSdk.stderr}`, /unknown SDK ruby/u);

const duplicateSdk = run(["--sdk", "python", "--sdk", "go"]);
assert.notEqual(duplicateSdk.status, 0);
assert.match(
  `${duplicateSdk.stdout}\n${duplicateSdk.stderr}`,
  /duplicate --sdk/u,
);

const packageJson = JSON.parse(
  await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
);
assert.equal(
  packageJson.scripts["test:sdk-examples"],
  "node scripts/test-verify-sdk-examples.mjs",
);
assert.equal(
  packageJson.scripts["verify:sdk-examples"],
  "node scripts/verify-sdk-examples.mjs",
);
assert.match(packageJson.scripts.check, /npm run test:sdk-examples/u);

const workflow = await readFile(
  path.join(repositoryRoot, ".github/workflows/pages.yml"),
  "utf8",
);
for (const sdk of ["python", "typescript", "go", "rust", "java", "cpp"]) {
  assert.match(workflow, new RegExp(`- ${sdk}\\b`, "u"));
}
for (const action of [
  "actions/setup-python@v6",
  "actions/setup-node@v7",
  "actions/setup-go@v6",
  "dtolnay/rust-toolchain@",
  "actions/setup-java@v5",
]) {
  assert.ok(workflow.includes(action), `workflow is missing ${action}`);
}
assert.match(
  workflow,
  /npm run verify:sdk-examples -- --sdk \$\{\{ matrix\.sdk \}\}/u,
);
assert.match(workflow, /sdk-examples:[\s\S]*?needs: release-sources/u);
assert.match(workflow, /sdk-examples:[\s\S]*?- run: npm ci/u);
assert.match(workflow, /needs: \[build, release-sources, sdk-examples\]/u);

console.log("SDK example verifier CLI tests passed six exact execution plans.");
