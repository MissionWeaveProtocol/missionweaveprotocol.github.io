import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const sdkRoot = path.join(repositoryRoot, "src/content/docs/0.1/build/sdk");
const failures = [];

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function normalized(contents) {
  return contents.replace(/\s+/gu, " ");
}

function requireTokens(relativePath, contents, tokens) {
  const normalizedContents = normalized(contents);
  for (const token of tokens) {
    if (!normalizedContents.includes(normalized(token))) {
      failures.push(`${relativePath}: missing required content ${token}`);
    }
  }
}

function prohibitRepositoryDocumentation(relativePath, contents) {
  if (
    /https:\/\/github\.com\/[^\s)"']+\/(?:blob|tree)\/[^\s)"']*(?:README|docs\/|spec\/PROTOCOL\.md)/iu.test(
      contents,
    )
  ) {
    failures.push(`${relativePath}: depends on repository documentation`);
  }
}

const requiredPages = new Map([
  [
    "typescript/index.mdx",
    [
      "SdkInstall",
      "SdkRuntimeMatrix",
      "Node.js 20",
      "@missionweaveprotocol/sdk",
      "ESM",
      "CommonJS",
      "missionweaveprotocol-conformance",
      "git clone",
      "git checkout --detach 6d53ebfcf8350ae81d89fd818611b07f7373685c",
      "npm ci",
      "npm run build",
      "npm pack",
      "npm install ./missionweaveprotocol-sdk-0.1.0.tgz",
      "npx --no-install missionweaveprotocol-conformance --json",
      '<SdkRuntimeMatrix sdk="typescript" />',
      "./runtime/",
      "./admission/",
      "./api/",
    ],
  ],
  [
    "typescript/runtime.mdx",
    [
      "SupportStatus",
      '<SupportStatus status="implemented" />',
      '<SupportStatus status="not-implemented" />',
      '<SupportStatus status="deployment-adapter-required" />',
      "strict-json.ts",
      "schema-catalog.ts",
      "canonical-json.ts",
      "signed-document-codec.ts",
      "crypto.ts",
      "frame-codec.ts",
      "conformance.ts",
      "package-root.ts",
      "admission.ts",
      "`packageRoot` locates the packaged artifact tree",
      "`runConformance` executes only the structural conformance manifest and vectors",
      "does not expose public APIs that verify the cryptography or Admission bundle digests",
      "Mission orchestration",
      "Worker scheduler",
      "gateway service",
      "persistence runtime",
    ],
  ],
  [
    "typescript/admission.mdx",
    [
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      'status: "authoritative-absence"',
      "AuthenticatedAdmissionRecord",
      "AdmissionService",
      "prepareFirstAdmission",
      "admitFirst",
      "verifyHistoricalAdmission",
      "#mwp-adm-003",
      "#mwp-adm-005",
      "#mwp-adm-006",
      "#mwp-adm-008",
      "#mwp-adm-009",
      "#mwp-adm-010",
      "#mwp-adm-012",
      "#mwp-adm-013",
      "#mwp-adm-014",
      ":::note[Informative example]",
      ":::note[Implementation note]",
      "typescriptAdmissionExample",
      "?raw",
      "caller-provided trust boolean",
    ],
  ],
  [
    "typescript/api.mdx",
    [
      "SdkApiInventory",
      '<SdkApiInventory sdk="typescript" />',
      "6d53ebfcf8350ae81d89fd818611b07f7373685c",
      "exact-commit",
    ],
  ],
  [
    "go/index.mdx",
    [
      "SdkInstall",
      "SdkRuntimeMatrix",
      "Go 1.24",
      "github.com/missionweaveprotocol/go-sdk",
      "missionweaveprotocol-conformance",
      '<SdkRuntimeMatrix sdk="go" />',
      "./runtime/",
      "./admission/",
      "./api/",
    ],
  ],
  [
    "go/runtime.mdx",
    [
      "SupportStatus",
      '<SupportStatus status="implemented" />',
      '<SupportStatus status="not-implemented" />',
      '<SupportStatus status="deployment-adapter-required" />',
      "json.go",
      "schema.go",
      "canonical.go",
      "signing.go",
      "signed_document_codec.go",
      "signed_document_verification.go",
      "frame.go",
      "conformance.go",
      "bundle.go",
      "admission.go",
      "VerifyProtocolBundle",
      "VerifyCryptographyBundle",
      "VerifyAdmissionBundle",
      "RunEmbeddedConformance",
      "Mission orchestration",
      "Worker scheduler",
      "gateway service",
      "persistence runtime",
    ],
  ],
  [
    "go/admission.mdx",
    [
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      "AuthoritativeAbsence: true",
      "AuthenticatedAdmissionRecord",
      "NewAdmissionService",
      "PrepareFirstAdmission",
      "AdmitFirst",
      "VerifyHistoricalAdmission",
      "#mwp-adm-003",
      "#mwp-adm-005",
      "#mwp-adm-006",
      "#mwp-adm-008",
      "#mwp-adm-009",
      "#mwp-adm-010",
      "#mwp-adm-012",
      "#mwp-adm-013",
      "#mwp-adm-014",
      ":::note[Informative example]",
      ":::note[Implementation note]",
      "goAdmissionExample",
      "?raw",
      "caller-provided trust boolean",
      "makes `AppendOrReturnExisting` atomic",
    ],
  ],
  [
    "go/api.mdx",
    [
      "SdkApiInventory",
      '<SdkApiInventory sdk="go" />',
      "80c39852e8a2053ac761b8d53d62483264f803f1",
      "exact-commit",
    ],
  ],
]);

for (const [relativePath, tokens] of requiredPages) {
  const file = path.join(sdkRoot, relativePath);
  if (!(await exists(file))) {
    failures.push(`${relativePath}: missing SDK reference page`);
    continue;
  }
  const contents = await readFile(file, "utf8");
  requireTokens(relativePath, contents, tokens);
  prohibitRepositoryDocumentation(relativePath, contents);
  if (
    relativePath === "typescript/index.mdx" &&
    contents.includes('command={`npm install "github:')
  ) {
    failures.push(
      `${relativePath}: direct Git dependency install omits the built package output`,
    );
  }
  if (
    relativePath === "typescript/index.mdx" &&
    contents.includes("missionweaveprotocol-conformance --help")
  ) {
    failures.push(
      `${relativePath}: TypeScript conformance CLI does not support --help`,
    );
  }
  if (
    relativePath === "go/runtime.mdx" &&
    contents.includes("VerifyEmbeddedBundle")
  ) {
    failures.push(
      `${relativePath}: names a nonexistent VerifyEmbeddedBundle API`,
    );
  }
  if (
    relativePath === "typescript/runtime.mdx" &&
    contents.includes("verify pins and digests")
  ) {
    failures.push(
      `${relativePath}: overstates the public TypeScript bundle verification surface`,
    );
  }
  if (
    relativePath === "go/admission.mdx" &&
    (contents.includes("atomic logical-key decision") ||
      contents.includes("share one atomic transaction boundary"))
  ) {
    failures.push(
      `${relativePath}: incorrectly requires one transaction spanning lookup and append`,
    );
  }
}

const sdkIndexPath = path.join(sdkRoot, "index.mdx");
const sdkIndex = await readFile(sdkIndexPath, "utf8");
requireTokens("index.mdx", sdkIndex, ["./typescript/", "./go/"]);

const astroConfig = await readFile(
  path.join(repositoryRoot, "astro.config.mjs"),
  "utf8",
);
requireTokens("astro.config.mjs", astroConfig, [
  "`${prefix}/sdk/typescript`",
  "`${prefix}/0.1/build/sdk/typescript/`",
  "`${prefix}/sdk/go`",
  "`${prefix}/0.1/build/sdk/go/`",
  'label: "TypeScript SDK"',
  'slug: "0.1/build/sdk/typescript"',
  'label: "Go SDK"',
  'slug: "0.1/build/sdk/go"',
]);

const requiredExamples = new Map([
  [
    "examples/sdk/typescript/admission.ts",
    [
      'from "node:crypto"',
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      "class InMemoryAdmissionLog",
      "Map<string, AuthenticatedAdmissionRecord>",
      "appendCount",
      'status: "authoritative-absence"',
      "SignedDocumentCodec",
      "SigningKey",
      "createPrivateKey",
      "createPublicKey",
      "Buffer.from(Array.from({ length: 32 }",
      "sha256Hex",
      ".admitFirst(",
      ".verifyHistoricalAdmission(",
      "first.record.admissionRecordId === historical.record.admissionRecordId",
      "first.verified.signingHash === historical.verified.signingHash",
      "Buffer.compare(first.recordBytes, historical.recordBytes) === 0",
      "admissionLog.appendCount === 1",
      '"first admission:',
      '"historical replay:',
    ],
  ],
  [
    "examples/sdk/go/admission/main.go",
    [
      '"crypto/ed25519"',
      '"crypto/sha256"',
      '"sync"',
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      "type inMemoryAdmissionLog struct",
      "sync.Mutex",
      "appendCount",
      "AuthoritativeAbsence: true",
      "NewSignedDocumentCodec",
      "NewAdmissionService",
      "ed25519.NewKeyFromSeed",
      "AdmitFirst(",
      "VerifyHistoricalAdmission(",
      "first.Record().AdmissionRecordID() == historical.Record().AdmissionRecordID()",
      "first.Verified().SigningHash() == historical.Verified().SigningHash()",
      "bytes.Equal(first.RecordBytes(), historical.RecordBytes())",
      "admissionLog.appendCount == 1",
      '"first admission:',
      '"historical replay:',
    ],
  ],
]);

for (const [relativePath, tokens] of requiredExamples) {
  const file = path.join(repositoryRoot, relativePath);
  if (!(await exists(file))) {
    failures.push(`${relativePath}: missing runnable example`);
    continue;
  }
  const contents = await readFile(file, "utf8");
  requireTokens(relativePath, contents, tokens);
  if (/\b(?:is_)?trusted\s*[=:]\s*(?:true|false)\b/iu.test(contents)) {
    failures.push(
      `${relativePath}: caller-provided trust boolean is prohibited`,
    );
  }
  if (
    /(?:cryptography|admission)\/(?:vectors|keys|records|registries)\//u.test(
      contents,
    )
  ) {
    failures.push(
      `${relativePath}: example must not depend on repository fixtures`,
    );
  }
}

if (failures.length > 0) {
  console.error("TypeScript and Go SDK reference check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `TypeScript and Go SDK references passed ${requiredPages.size} normative pages and ${requiredExamples.size} runnable examples.`,
);
