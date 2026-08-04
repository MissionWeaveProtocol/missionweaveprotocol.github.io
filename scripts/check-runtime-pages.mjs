import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const buildRoot = path.join(repositoryRoot, "src/content/docs/0.1/build");
const failures = [];
const implementationNote = ":::note[Implementation note]";

const signingFlow = [
  "Construct all non-signature fields",
  "Choose the protected time and expected signing key",
  "Produce RFC 8785 JCS signing bytes",
  "Compute the signing hash and pure-Ed25519 signature",
  "Attach the complete signature envelope",
  "Validate the final Signed Document",
];

const requiredPages = new Map([
  [
    "index.mdx",
    [
      "Draft Standard 0.1",
      implementationNote,
      "./runtime/architecture-and-bootstrap/",
      "./runtime/protocol-types/",
      "./runtime/validation-canonicalization-and-signing/",
      "./runtime/first-admission-and-historical-trust/",
      "./runtime/persistence-and-recovery/",
      "./runtime/transport-and-framing/",
      "./runtime/errors-and-observability/",
      "./runtime/conformance-and-upgrades/",
      "../reference/normative-release/",
      "../reference/specification/foundations/#mwp-fnd-001",
    ],
  ],
  [
    "runtime/architecture-and-bootstrap.mdx",
    [
      implementationNote,
      "../../../reference/specification/foundations/#mwp-fnd-002",
      "../../../reference/specification/foundations/#mwp-fnd-012",
      "../../../reference/specification/foundations/#mwp-fnd-013",
      "../../../reference/specification/foundations/#mwp-fnd-014",
      "../../../reference/specification/foundations/#mwp-fnd-015",
      "../../../reference/specification/foundations/#mwp-fnd-019",
      "../../../reference/specification/foundations/#mwp-fnd-023",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-001",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-007",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-008",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-009",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-004",
      "../../../reference/specification/authorization-and-budgets/#mwp-aut-001",
    ],
  ],
  [
    "runtime/protocol-types.mdx",
    [
      "../../../reference/specification/foundations/#mwp-fnd-004",
      "../../../reference/specification/foundations/#mwp-fnd-005",
      "../../../reference/specification/foundations/#mwp-fnd-007",
      "../../../reference/specification/foundations/#mwp-fnd-008",
      "../../../reference/specification/foundations/#mwp-fnd-009",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-001",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-005",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-012",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-010",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-001",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-008",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-009",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-010",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-011",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-015",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-016",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-018",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-001",
    ],
  ],
  [
    "runtime/validation-canonicalization-and-signing.mdx",
    [
      "../../../reference/specification/foundations/#mwp-fnd-006",
      "../../../reference/specification/foundations/#mwp-fnd-004",
      "../../../reference/specification/foundations/#mwp-fnd-005",
      "../../../reference/specification/foundations/#mwp-fnd-007",
      "../../../reference/specification/foundations/#mwp-fnd-009",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-012",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-001",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-002",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-003",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-004",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-005",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-006",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-007",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-008",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-009",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-010",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-011",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-012",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-013",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-014",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-015",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-017",
      "../../../reference/conformance/cryptography/",
    ],
  ],
  [
    "runtime/first-admission-and-historical-trust.mdx",
    [
      implementationNote,
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-001",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-002",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-003",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-004",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-005",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-006",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-007",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-008",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-009",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-010",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-011",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-012",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-013",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-014",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-010",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-015",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-017",
      "../../../reference/conformance/admission/",
    ],
  ],
  [
    "runtime/persistence-and-recovery.mdx",
    [
      implementationNote,
      "../../../reference/specification/foundations/#mwp-fnd-018",
      "../../../reference/specification/foundations/#mwp-fnd-023",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-003",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-005",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-007",
      "../../../reference/specification/missions-groups-and-membership/#mwp-msn-009",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-008",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-013",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-014",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-017",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-018",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-019",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-020",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-021",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-022",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-029",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-030",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-031",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-005",
    ],
  ],
  [
    "runtime/transport-and-framing.mdx",
    [
      implementationNote,
      "../../../reference/specification/foundations/#mwp-fnd-003",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-006",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-007",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-008",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-008",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-009",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-010",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-011",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-012",
      "../../../reference/specification/missions-groups-and-membership/#mwp-msn-014",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-029",
      "../../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-030",
    ],
  ],
  [
    "runtime/errors-and-observability.mdx",
    [
      implementationNote,
      "../../../reference/specification/foundations/#mwp-fnd-022",
      "../../../reference/specification/authorization-and-budgets/#mwp-aut-002",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-001",
      "../../../reference/specification/commands-events-and-ordering/#mwp-evt-005",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-004",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-005",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-018",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-016",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-019",
      "../../../reference/specification/first-admission-and-historical-trust/#mwp-adm-012",
    ],
  ],
  [
    "runtime/conformance-and-upgrades.mdx",
    [
      implementationNote,
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-001",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-002",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-003",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-010",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-011",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-012",
      "../../../reference/specification/errors-extensions-and-security/#mwp-ext-013",
      "../../../reference/specification/identity-registry-and-sessions/#mwp-idn-003",
      "../../../reference/specification/signed-documents-and-trust/#mwp-sdv-019",
      "../../../reference/normative-release/",
      "../../../reference/schemas/",
      "../../../reference/conformance/",
    ],
  ],
]);

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

function requireOrdered(relativePath, contents, tokens) {
  const normalizedContents = normalized(contents);
  let offset = 0;
  for (const token of tokens) {
    const next = normalizedContents.indexOf(normalized(token), offset);
    if (next < 0) {
      failures.push(`${relativePath}: missing ordered flow step ${token}`);
      return;
    }
    offset = next + normalized(token).length;
  }
}

for (const [relativePath, tokens] of requiredPages) {
  const file = path.join(buildRoot, relativePath);
  if (!(await exists(file))) {
    failures.push(`${relativePath}: missing runtime page`);
    continue;
  }

  const contents = await readFile(file, "utf8");
  requireTokens(relativePath, contents, tokens);

  if (
    /https:\/\/github\.com\/[^\s)]+\/(?:blob|tree)\/[^\s)]*(?:README|docs\/|spec\/PROTOCOL\.md)/iu.test(
      contents,
    )
  ) {
    failures.push(`${relativePath}: depends on repository documentation`);
  }
}

const signingPage = path.join(
  buildRoot,
  "runtime/validation-canonicalization-and-signing.mdx",
);
if (await exists(signingPage)) {
  const contents = await readFile(signingPage, "utf8");
  requireOrdered(
    "runtime/validation-canonicalization-and-signing.mdx",
    contents,
    signingFlow,
  );
}

if (failures.length > 0) {
  console.error("Runtime page check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Runtime pages passed ${requiredPages.size} required local pages, selected local-clause references, and required implementation-note directives.`,
);
