import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const dataRoot = path.join(repositoryRoot, "src/data/normative/0.1");
const matrixPath = path.join(dataRoot, "sdk-runtime-matrix.json");
const releasePath = path.join(dataRoot, "release-source.json");
const failures = [];

const expectedSdks = [
  {
    id: "python",
    name: "Python",
    package: "missionweaveprotocol",
    toolchain: ["Python 3.12", "uv"],
    admissionOperations: {
      prepare: "prepare_first_admission",
      firstAdmission: "admit_first",
      historicalReplay: "verify_historical_admission",
    },
  },
  {
    id: "typescript",
    name: "TypeScript",
    package: "@missionweaveprotocol/sdk",
    toolchain: ["Node.js 20", "npm"],
    admissionOperations: {
      prepare: "prepareFirstAdmission",
      firstAdmission: "admitFirst",
      historicalReplay: "verifyHistoricalAdmission",
    },
  },
  {
    id: "go",
    name: "Go",
    package: "github.com/missionweaveprotocol/go-sdk",
    toolchain: ["Go 1.24"],
    admissionOperations: {
      prepare: "PrepareFirstAdmission",
      firstAdmission: "AdmitFirst",
      historicalReplay: "VerifyHistoricalAdmission",
    },
  },
  {
    id: "rust",
    name: "Rust",
    package: "missionweaveprotocol",
    toolchain: ["Rust 1.85", "Cargo"],
    admissionOperations: {
      prepare: "prepare_first_admission",
      firstAdmission: "admit_first",
      historicalReplay: "verify_historical_admission",
    },
  },
  {
    id: "java",
    name: "Java",
    package: "org.missionweaveprotocol:missionweaveprotocol-sdk",
    toolchain: ["Java 21", "Maven 3.9"],
    admissionOperations: {
      prepare: "prepareFirstAdmission",
      firstAdmission: "admitFirst",
      historicalReplay: "verifyHistoricalAdmission",
    },
  },
  {
    id: "cpp",
    name: "C++",
    package: "MissionWeaveProtocol::sdk",
    toolchain: ["C++20", "CMake 3.24", "OpenSSL 3"],
    admissionOperations: {
      prepare: "prepare_first_admission",
      firstAdmission: "admit_first",
      historicalReplay: "verify_historical_admission",
    },
  },
];

const requiredPythonCapabilities = [
  "core-runtime",
  "agent-runtime",
  "worker-scheduler",
  "group-gateway",
  "stores",
  "replay",
  "policy",
  "leases",
  "budgets",
  "delegation",
  "strict-json-schema-validation",
  "canonical-json",
  "signed-document-cryptography",
  "registry-key-resolution",
  "frame-codec",
  "conformance",
  "embedded-protocol-bundles",
  "first-admission-and-historical-trust",
];

const requiredProtocolRuntimeCapabilities = [
  "strict-json-schema-validation",
  "canonical-json",
  "signed-document-cryptography",
  "registry-key-resolution",
  "frame-codec",
  "conformance",
  "embedded-protocol-bundles",
  "first-admission-and-historical-trust",
];

const requiredUnavailableCapabilities = [
  "mission-orchestration",
  "worker-scheduler",
  "gateway-service",
  "persistence-runtime",
];

async function readJson(file, description) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      failures.push(`${description}: missing ${path.basename(file)}`);
      return undefined;
    }
    if (error instanceof SyntaxError) {
      failures.push(`${description}: invalid JSON: ${error.message}`);
      return undefined;
    }
    throw error;
  }
}

function sameArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function safeSourcePath(sourcePath) {
  return (
    typeof sourcePath === "string" &&
    sourcePath.length > 0 &&
    !sourcePath.startsWith("/") &&
    !sourcePath.includes("\\") &&
    !sourcePath.split("/").some((segment) => ["", ".", ".."].includes(segment))
  );
}

function checkCapabilityEntries(sdkId, field, entries) {
  if (!Array.isArray(entries)) {
    failures.push(`${sdkId}.${field}: must be an array`);
    return new Set();
  }

  const capabilities = new Set();
  for (const [index, entry] of entries.entries()) {
    const prefix = `${sdkId}.${field}[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      failures.push(`${prefix}: must be an object`);
      continue;
    }
    if (typeof entry.capability !== "string" || entry.capability.length === 0) {
      failures.push(`${prefix}.capability: must be a non-empty string`);
      continue;
    }
    if (capabilities.has(entry.capability)) {
      failures.push(
        `${sdkId}.${field}: duplicate capability ${entry.capability}`,
      );
    }
    capabilities.add(entry.capability);
    if (typeof entry.label !== "string" || entry.label.length === 0) {
      failures.push(`${prefix}.label: must be a non-empty string`);
    }

    if (field === "notImplemented") {
      if (typeof entry.reason !== "string" || entry.reason.length === 0) {
        failures.push(`${prefix}.reason: must be a non-empty string`);
      }
      continue;
    }

    if (!Array.isArray(entry.sourceFiles) || entry.sourceFiles.length === 0) {
      failures.push(
        `${prefix}.sourceFiles: must contain at least one source path`,
      );
      continue;
    }
    const sourceFiles = new Set();
    for (const sourceFile of entry.sourceFiles) {
      if (!safeSourcePath(sourceFile)) {
        failures.push(
          `${prefix}.sourceFiles: unsafe source path ${String(sourceFile)}`,
        );
      } else if (sourceFiles.has(sourceFile)) {
        failures.push(
          `${prefix}.sourceFiles: duplicate source path ${sourceFile}`,
        );
      }
      sourceFiles.add(sourceFile);
    }
    if (
      field === "deploymentAdapters" &&
      (typeof entry.reason !== "string" || entry.reason.length === 0)
    ) {
      failures.push(`${prefix}.reason: must be a non-empty string`);
    }
  }
  return capabilities;
}

function requireCapabilities(sdkId, field, actual, required) {
  for (const capability of required) {
    if (!actual.has(capability)) {
      failures.push(`${sdkId}.${field}: missing capability ${capability}`);
    }
  }
}

const release = await readJson(releasePath, "release source");
const matrix = await readJson(matrixPath, "SDK runtime matrix");

if (release && matrix) {
  if (matrix.schemaVersion !== 1) {
    failures.push("schemaVersion: expected 1");
  }
  if (matrix.protocolVersion !== release.protocolVersion) {
    failures.push(
      `protocolVersion: expected ${release.protocolVersion}, got ${String(matrix.protocolVersion)}`,
    );
  }
  if (!Array.isArray(matrix.sdks)) {
    failures.push("sdks: must be an array");
  } else {
    if (matrix.sdks.length !== expectedSdks.length) {
      failures.push(`sdks: expected exactly ${expectedSdks.length} entries`);
    }
    const actualIds = matrix.sdks.map((sdk) => sdk?.id);
    const expectedIds = expectedSdks.map((sdk) => sdk.id);
    if (!sameArray(actualIds, expectedIds)) {
      failures.push(
        `sdks: expected deterministic order ${expectedIds.join(", ")}`,
      );
    }

    for (const expected of expectedSdks) {
      const sdk = matrix.sdks.find((entry) => entry?.id === expected.id);
      if (!sdk) continue;
      const prefix = expected.id;
      if (sdk.name !== expected.name) {
        failures.push(`${prefix}.name: expected ${expected.name}`);
      }
      if (sdk.package !== expected.package) {
        failures.push(`${prefix}.package: expected ${expected.package}`);
      }
      if (!sameArray(sdk.toolchain, expected.toolchain)) {
        failures.push(
          `${prefix}.toolchain: expected ${expected.toolchain.join(", ")}`,
        );
      }
      if (sdk.commit !== release.sdks?.[expected.id]) {
        failures.push(
          `${prefix}.commit: expected release pin ${String(release.sdks?.[expected.id])}`,
        );
      }
      if (sdk.repository !== release.sdkRepositories?.[expected.id]) {
        failures.push(
          `${prefix}.repository: expected ${String(release.sdkRepositories?.[expected.id])}`,
        );
      }
      if (
        JSON.stringify(sdk.admissionOperations) !==
        JSON.stringify(expected.admissionOperations)
      ) {
        failures.push(
          `${prefix}.admissionOperations: exact public names required`,
        );
      }

      const implemented = checkCapabilityEntries(
        prefix,
        "implemented",
        sdk.implemented,
      );
      checkCapabilityEntries(
        prefix,
        "deploymentAdapters",
        sdk.deploymentAdapters,
      );
      const notImplemented = checkCapabilityEntries(
        prefix,
        "notImplemented",
        sdk.notImplemented,
      );

      requireCapabilities(
        prefix,
        "implemented",
        implemented,
        expected.id === "python"
          ? requiredPythonCapabilities
          : requiredProtocolRuntimeCapabilities,
      );
      if (expected.id !== "python") {
        requireCapabilities(
          prefix,
          "notImplemented",
          notImplemented,
          requiredUnavailableCapabilities,
        );
      }

      for (const capability of implemented) {
        if (notImplemented.has(capability)) {
          failures.push(
            `${prefix}: capability ${capability} cannot be both implemented and not implemented`,
          );
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error("SDK runtime matrix check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `SDK runtime matrix passed ${expectedSdks.length} exact SDK pins and complete capability declarations.`,
);
