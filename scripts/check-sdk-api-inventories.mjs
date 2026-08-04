import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const matrixPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/sdk-runtime-matrix.json",
);
const inventoryRoot = path.join(repositoryRoot, "public/artifacts/0.1/sdks");
const failures = [];
const requiredAdmissionTypes = [
  "AdmissionService",
  "AdmissionLog",
  "AdmissionCurrentKeyResolver",
  "TrustedAdmissionContext",
  "FirstAdmissionRecord",
  "PreparedFirstAdmission",
  "AdmittedSignedDocument",
];
const typescriptSelectiveRootExports = new Map([
  ["src/rfc3339.ts", new Set(["Rfc3339Instant"])],
  [
    "src/strict-json.ts",
    new Set([
      "parseStrictJson",
      "parseStrictJsonObject",
      "StrictJsonSyntaxError",
    ]),
  ],
]);
const requiredQualifiedEntries = new Map([
  [
    "typescript",
    new Map([
      ["SchemaCatalog.root", "getter"],
      ["SchemaCatalog.names", "getter"],
      ["AdmissionError.wireCode", "property"],
      ["AdmissionError.auditDetail", "property"],
      ["KeyResolutionRequest.protectedTime", "property"],
      ["SignedDocument.signature", "property"],
      ["SignedDocumentVerificationError.auditDetail", "getter"],
      ["SignedDocumentKind.Command", "enum-member"],
      ["VerifiedSignedDocument.protectedTime", "property"],
    ]),
  ],
  [
    "go",
    new Map([
      ["TrustedAdmissionContext.Issue", "method"],
      ["AdmissionCurrentKeyResolver.ResolveCurrent", "method"],
      ["AdmissionLog.Lookup", "method"],
      ["AdmissionLog.AppendOrReturnExisting", "method"],
      ["AdmissionContextValue.AdmissionRecordID", "field"],
      ["AuthenticatedAdmissionRecord.RecordBytes", "field"],
    ]),
  ],
  [
    "rust",
    new Map([
      ["AdmissionReason.RecordMissing", "enum-member"],
      ["ProtocolPin.repository", "field"],
    ]),
  ],
  [
    "java",
    new Map([
      ["AdmissionLookup.Found", "record"],
      ["AdmissionLookup.AuthoritativeAbsence", "record"],
      ["ProtocolBundle.Verification", "record"],
      ["ProtocolBundle.COMMIT", "constant"],
      ["AdmissionReason.COMMIT_FAILED", "enum-member"],
      ["Principal.type", "record-component"],
    ]),
  ],
  [
    "cpp",
    new Map([
      ["ValidationResult.valid", "field"],
      ["ValidationResult.issue", "field"],
      ["ValidationResult.operator bool", "operator"],
      ["BundleSummary.schema_files", "field"],
      ["SignedDocumentKind.command", "enum-member"],
      ["Principal.operator==", "operator"],
      ["sdk_version", "constant"],
    ]),
  ],
]);
const prohibitedQualifiedEntries = new Map([
  ["rust", new Set(["ArtifactPin", "ArtifactPins", "ConformanceError"])],
  [
    "java",
    new Set([
      "Verification",
      "CryptographyVerification",
      "AdmissionVerification",
    ]),
  ],
  ["cpp", new Set(["ValidationResult.bool", "KeyResolver.key"])],
]);
const requiredEntryCounts = new Map([
  ["typescript", 192],
  ["go", 241],
  ["rust", 311],
  ["java", 298],
  ["cpp", 314],
]);

function safeSourcePath(sourcePath) {
  return (
    typeof sourcePath === "string" &&
    sourcePath.length > 0 &&
    !sourcePath.startsWith("/") &&
    !sourcePath.includes("\\") &&
    !sourcePath.split("/").some((segment) => ["", ".", ".."].includes(segment))
  );
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareEntries(left, right) {
  return (
    compareStrings(left.qualifiedName, right.qualifiedName) ||
    compareStrings(left.sourceFile, right.sourceFile) ||
    left.line - right.line ||
    compareStrings(left.kind, right.kind)
  );
}

function sameArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

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

const matrix = await readJson(matrixPath, "SDK runtime matrix");

if (matrix?.sdks) {
  for (const sdk of matrix.sdks) {
    const inventoryPath = path.join(inventoryRoot, `${sdk.id}-api.json`);
    const inventory = await readJson(
      inventoryPath,
      `${sdk.name} API inventory`,
    );
    if (!inventory) continue;

    const prefix = `${sdk.id} API inventory`;
    if (inventory.schemaVersion !== 1) {
      failures.push(`${prefix}: schemaVersion must be 1`);
    }
    for (const field of ["sdk", "name", "repository", "commit", "package"]) {
      const expected = field === "sdk" ? sdk.id : sdk[field];
      if (inventory[field] !== expected) {
        failures.push(
          `${prefix}: ${field} must equal ${JSON.stringify(expected)}`,
        );
      }
    }
    if (!sameArray(inventory.toolchain, sdk.toolchain)) {
      failures.push(`${prefix}: toolchain must match the runtime matrix`);
    }

    if (
      !Array.isArray(inventory.sourceFiles) ||
      inventory.sourceFiles.length === 0
    ) {
      failures.push(`${prefix}: sourceFiles must be a non-empty array`);
    } else {
      const expectedSourceFiles = [...new Set(inventory.sourceFiles)].sort();
      if (!sameArray(inventory.sourceFiles, expectedSourceFiles)) {
        failures.push(`${prefix}: sourceFiles must be sorted and unique`);
      }
      for (const sourceFile of inventory.sourceFiles) {
        if (!safeSourcePath(sourceFile)) {
          failures.push(`${prefix}: unsafe source path ${String(sourceFile)}`);
        }
      }
    }

    if (!Array.isArray(inventory.entries) || inventory.entries.length === 0) {
      failures.push(`${prefix}: entries must be a non-empty array`);
      continue;
    }
    const entryKeys = new Set();
    const propertyKeys = new Set();
    for (const [index, entry] of inventory.entries.entries()) {
      const entryPrefix = `${prefix}.entries[${index}]`;
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        failures.push(`${entryPrefix}: must be an object`);
        continue;
      }
      for (const field of ["name", "qualifiedName", "kind"]) {
        if (typeof entry[field] !== "string" || entry[field].length === 0) {
          failures.push(`${entryPrefix}.${field}: must be a non-empty string`);
        }
      }
      if (!safeSourcePath(entry.sourceFile)) {
        failures.push(`${entryPrefix}.sourceFile: must be repository-relative`);
      } else if (!inventory.sourceFiles?.includes(entry.sourceFile)) {
        failures.push(`${entryPrefix}.sourceFile: missing from sourceFiles`);
      }
      if (!Number.isInteger(entry.line) || entry.line < 1) {
        failures.push(`${entryPrefix}.line: must be a positive integer`);
      }
      const entryKey = [
        entry.qualifiedName,
        entry.kind,
        entry.sourceFile,
        entry.line,
      ].join("\0");
      if (entryKeys.has(entryKey)) {
        failures.push(`${entryPrefix}: duplicate API entry`);
      }
      entryKeys.add(entryKey);
      if (entry.kind === "property") {
        if (propertyKeys.has(entry.qualifiedName)) {
          failures.push(
            `${entryPrefix}: duplicate property ${entry.qualifiedName}`,
          );
        }
        propertyKeys.add(entry.qualifiedName);
      }
    }
    const sortedEntries = [...inventory.entries].sort(compareEntries);
    if (JSON.stringify(inventory.entries) !== JSON.stringify(sortedEntries)) {
      failures.push(`${prefix}: entries must be deterministically sorted`);
    }

    const requiredEntryCount = requiredEntryCounts.get(sdk.id);
    if (
      requiredEntryCount !== undefined &&
      inventory.entries.length !== requiredEntryCount
    ) {
      failures.push(
        `${prefix}: expected ${requiredEntryCount} exact-pinned entries, found ${inventory.entries.length}`,
      );
    }

    if (sdk.id === "typescript") {
      for (const entry of inventory.entries) {
        const allowedRoots = typescriptSelectiveRootExports.get(
          entry.sourceFile,
        );
        if (!allowedRoots) continue;
        const rootName = entry.qualifiedName.split(".", 1)[0];
        if (!allowedRoots.has(rootName)) {
          failures.push(
            `${prefix}: ${entry.qualifiedName} is not exported from the package root`,
          );
        }
      }
    }

    if (sdk.id === "cpp") {
      const privateNestedDeclarations = [
        {
          name: "Impl",
          sourceFile: "include/missionweaveprotocol/schema.hpp",
          label: "SchemaCatalog.Impl",
        },
        {
          name: "ParsedAdmissionRecord",
          sourceFile: "include/missionweaveprotocol/admission.hpp",
          label: "AdmissionService.ParsedAdmissionRecord",
        },
      ];
      for (const privateDeclaration of privateNestedDeclarations) {
        const matches = inventory.entries.filter(
          (entry) =>
            entry.name === privateDeclaration.name &&
            entry.sourceFile === privateDeclaration.sourceFile,
        );
        if (matches.length > 0) {
          failures.push(
            `${prefix}: private ${privateDeclaration.label} must not appear in the public API inventory`,
          );
        }
      }
      if (inventory.entries.some((entry) => entry.name === "const")) {
        failures.push(
          `${prefix}: multiline method continuations must not be parsed as fields`,
        );
      }
    }

    const requiredEntries = requiredQualifiedEntries.get(sdk.id);
    if (requiredEntries) {
      for (const [qualifiedName, kind] of requiredEntries) {
        const matches = inventory.entries.filter(
          (entry) =>
            entry.qualifiedName === qualifiedName && entry.kind === kind,
        );
        if (matches.length !== 1) {
          failures.push(
            `${prefix}: expected one ${kind} entry for ${qualifiedName}, found ${matches.length}`,
          );
        }
      }
    }

    const prohibitedEntries = prohibitedQualifiedEntries.get(sdk.id);
    if (prohibitedEntries) {
      for (const qualifiedName of prohibitedEntries) {
        if (
          inventory.entries.some(
            (entry) => entry.qualifiedName === qualifiedName,
          )
        ) {
          failures.push(`${prefix}: prohibited public entry ${qualifiedName}`);
        }
      }
    }

    const expectedSymbols = [
      ...new Set(inventory.entries.map((entry) => entry.name)),
    ].sort();
    if (!sameArray(inventory.symbols, expectedSymbols)) {
      failures.push(
        `${prefix}: symbols must be the sorted unique names from entries`,
      );
      continue;
    }
    const requiredSymbols = [
      ...requiredAdmissionTypes,
      ...Object.values(sdk.admissionOperations),
    ];
    for (const symbol of requiredSymbols) {
      if (!inventory.symbols.includes(symbol)) {
        failures.push(`${prefix}: missing required symbol ${symbol}`);
      }
    }
    for (const operation of Object.values(sdk.admissionOperations)) {
      const operationEntries = inventory.entries.filter(
        (entry) => entry.name === operation,
      );
      if (
        operationEntries.length !== 1 ||
        operationEntries[0].kind !== "method" ||
        operationEntries[0].qualifiedName !== `AdmissionService.${operation}`
      ) {
        failures.push(
          `${prefix}: ${operation} must be the unique AdmissionService method`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("SDK API inventory check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `SDK API inventories passed ${matrix.sdks.length} exact-commit public surfaces.`,
);
