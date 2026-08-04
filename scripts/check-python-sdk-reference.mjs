import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const sdkRoot = path.join(repositoryRoot, "src/content/docs/0.1/build/sdk");
const examplePath = path.join(
  repositoryRoot,
  "examples/sdk/python/admission.py",
);
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
    "index.mdx",
    [
      'import SdkRuntimeMatrix from "../../../../../components/SdkRuntimeMatrix.astro"',
      "normative",
      "<SdkRuntimeMatrix />",
      "./python/",
    ],
  ],
  [
    "python/index.mdx",
    [
      'import SdkInstall from "../../../../../../components/SdkInstall.astro"',
      'import SdkRuntimeMatrix from "../../../../../../components/SdkRuntimeMatrix.astro"',
      "Python 3.12",
      "missionweaveprotocol",
      "missionweaveprotocol-server",
      "missionweaveprotocol-demo",
      "missionweaveprotocol-conformance",
      '<SdkRuntimeMatrix sdk="python" />',
      "./runtime/",
      "./admission/",
      "./api/",
    ],
  ],
  [
    "python/runtime.mdx",
    [
      'import SupportStatus from "../../../../../../components/SupportStatus.astro"',
      '<SupportStatus status="implemented" />',
      '<SupportStatus status="deployment-adapter-required" />',
      "missionweaveprotocol.core",
      "missionweaveprotocol.agent",
      "missionweaveprotocol.artifacts",
      "missionweaveprotocol.auth",
      "missionweaveprotocol.scheduler",
      "missionweaveprotocol.gateway",
      "missionweaveprotocol.store",
      "missionweaveprotocol.local_store",
      "missionweaveprotocol.replay",
      "missionweaveprotocol.context",
      "missionweaveprotocol.control",
      "missionweaveprotocol.documents",
      "missionweaveprotocol.execution",
      "missionweaveprotocol.ingress",
      "missionweaveprotocol.offline",
      "missionweaveprotocol.poc",
      "missionweaveprotocol.policy",
      "missionweaveprotocol.lease",
      "missionweaveprotocol.budget",
      "missionweaveprotocol.delegation",
      "missionweaveprotocol.models",
      "missionweaveprotocol.schema_formats",
      "missionweaveprotocol.canonical",
      "missionweaveprotocol.crypto",
      "missionweaveprotocol.signed_documents",
      "missionweaveprotocol.registry",
      "missionweaveprotocol.wire",
      "missionweaveprotocol.conformance",
      "missionweaveprotocol.bundle",
      "missionweaveprotocol.cli",
      "missionweaveprotocol.admission",
      "database",
      "network",
    ],
  ],
  [
    "python/admission.mdx",
    [
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      "AdmissionLookupStatus.AUTHORITATIVE_ABSENCE",
      "AuthenticatedAdmissionRecord",
      "AdmissionService",
      "prepare_first_admission",
      "admit_first",
      "verify_historical_admission",
      "#mwp-adm-003",
      "#mwp-adm-005",
      "#mwp-adm-006",
      "#mwp-adm-008",
      "#mwp-adm-009",
      "#mwp-adm-010",
      "#mwp-adm-012",
      "#mwp-adm-013",
      "#mwp-adm-014",
      "../../../runtime/first-admission-and-historical-trust/",
      "../../../../reference/specification/first-admission-and-historical-trust/",
      ":::note[Informative example]",
      ":::note[Implementation note]",
      "admissionExample",
      "?raw",
      "caller-provided trust boolean",
    ],
  ],
  [
    "python/api.mdx",
    [
      'import SdkApiInventory from "../../../../../../components/SdkApiInventory.astro"',
      '<SdkApiInventory sdk="python" />',
      "9403cf1310914670506c56cbab363fdaa465d3cc",
      "exact-commit",
    ],
  ],
]);

for (const [relativePath, tokens] of requiredPages) {
  const file = path.join(sdkRoot, relativePath);
  if (!(await exists(file))) {
    failures.push(`${relativePath}: missing Python SDK reference page`);
    continue;
  }

  const contents = await readFile(file, "utf8");
  requireTokens(relativePath, contents, tokens);
  prohibitRepositoryDocumentation(relativePath, contents);
}

if (!(await exists(examplePath))) {
  failures.push("examples/sdk/python/admission.py: missing runnable example");
} else {
  const example = await readFile(examplePath, "utf8");
  requireTokens("examples/sdk/python/admission.py", example, [
    "from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey",
    "AdmissionCurrentKeyResolver",
    "TrustedAdmissionContext",
    "AdmissionLog",
    "class CurrentRegistryFixture",
    "def resolve_current(",
    "def resolve(",
    "class FixedTrustedAdmissionContext",
    "def issue(",
    "class InMemoryAdmissionLog",
    "def lookup(",
    "def append_or_return_existing(",
    "AdmissionLookupStatus.AUTHORITATIVE_ABSENCE",
    "AuthenticatedAdmissionRecord",
    "KeyRegistryCompleteness.ORGANIZATION_WIDE",
    "SignedDocumentCodec",
    "SigningKey",
    "bytes(range(1, 33))",
    "hashlib.sha256",
    "Lock",
    "with self._lock:",
    ".sign(",
    ".admit_first(",
    ".verify_historical_admission(",
    "first.record.admission_record_id == historical.record.admission_record_id",
    "first.verified.signing_hash == historical.verified.signing_hash",
    "first.record.raw_bytes == historical.record.raw_bytes",
    "assert admission_log_impl.append_count == 1",
    '"first admission:',
    '"historical replay:',
    "print(",
  ]);

  if (/cryptography\/(?:vectors|keys)\//u.test(example)) {
    failures.push(
      "examples/sdk/python/admission.py: example must not depend on repository fixtures",
    );
  }

  if (/\b(?:is_)?trusted\s*=\s*(?:True|False)\b/u.test(example)) {
    failures.push(
      "examples/sdk/python/admission.py: caller-provided trust boolean is prohibited",
    );
  }
}

if (failures.length > 0) {
  console.error("Python SDK reference check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Python SDK reference passed ${requiredPages.size} normative pages and one typed Admission example.`,
);
