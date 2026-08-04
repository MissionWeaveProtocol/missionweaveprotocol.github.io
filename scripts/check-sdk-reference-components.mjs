import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const componentRoot = path.join(repositoryRoot, "src/components");
const matrix = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "src/data/normative/0.1/sdk-runtime-matrix.json"),
    "utf8",
  ),
);
const failures = [];

async function componentSource(name) {
  const file = path.join(componentRoot, name);
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      failures.push(`${name}: missing component`);
      return undefined;
    }
    throw error;
  }
}

const supportStatus = await componentSource("SupportStatus.astro");
const runtimeMatrix = await componentSource("SdkRuntimeMatrix.astro");
const apiInventory = await componentSource("SdkApiInventory.astro");
const sdkInstall = await componentSource("SdkInstall.astro");

if (supportStatus) {
  for (const label of [
    "Implemented",
    "Not implemented",
    "Deployment adapter required",
  ]) {
    if (!supportStatus.includes(label)) {
      failures.push(`SupportStatus.astro: missing exact label ${label}`);
    }
  }
}

if (runtimeMatrix) {
  for (const required of [
    "sdk-runtime-matrix.json",
    "release-source.json",
    "implemented",
    "deploymentAdapters",
    "notImplemented",
    "SupportStatus",
    "structural",
    "cryptography",
    "admission",
  ]) {
    if (!runtimeMatrix.includes(required)) {
      failures.push(`SdkRuntimeMatrix.astro: missing ${required}`);
    }
  }
  const capabilityIds = new Set(
    matrix.sdks.flatMap((sdk) =>
      [
        ...sdk.implemented,
        ...sdk.deploymentAdapters,
        ...sdk.notImplemented,
      ].map((entry) => entry.capability),
    ),
  );
  for (const capability of capabilityIds) {
    if (runtimeMatrix.includes(`"${capability}"`)) {
      failures.push(
        `SdkRuntimeMatrix.astro: hard-coded capability ${capability}`,
      );
    }
  }
}

if (apiInventory) {
  for (const sdk of matrix.sdks) {
    if (!apiInventory.includes(`${sdk.id}-api.json`)) {
      failures.push(`SdkApiInventory.astro: missing local ${sdk.id} inventory`);
    }
  }
  for (const required of ["qualifiedName", "sourceFile", "commit", "#L"]) {
    if (!apiInventory.includes(required)) {
      failures.push(`SdkApiInventory.astro: missing ${required}`);
    }
  }
}

if (sdkInstall) {
  for (const required of [
    "sdk-runtime-matrix.json",
    "package",
    "toolchain",
    "commit",
  ]) {
    if (!sdkInstall.includes(required)) {
      failures.push(`SdkInstall.astro: missing ${required}`);
    }
  }
}

if (failures.length > 0) {
  console.error("SDK reference component check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log("SDK reference components passed data and provenance checks.");
