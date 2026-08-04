import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const learnRoot = path.join(repositoryRoot, "src/content/docs/0.1/learn");
const failures = [];

const requiredPages = new Map([
  [
    "index.mdx",
    [
      "Draft Standard 0.1",
      "./core-model/",
      "./identity-roles-and-authority/",
      "./work-lifecycle/",
      "./groups-and-scheduling/",
      "./child-missions/",
      "./signed-documents-and-trust/",
      "./first-admission-and-historical-trust/",
      "./security-boundaries/",
      "../reference/specification/foundations/#mwp-fnd-002",
      "../reference/normative-release/",
    ],
  ],
  [
    "core-model.mdx",
    [
      "../../reference/specification/foundations/#mwp-fnd-013",
      "../../reference/specification/foundations/#mwp-fnd-023",
      "../../reference/specification/missions-groups-and-membership/#mwp-msn-001",
    ],
  ],
  [
    "identity-roles-and-authority.mdx",
    [
      "../../reference/specification/identity-registry-and-sessions/#mwp-idn-001",
      "../../reference/specification/identity-registry-and-sessions/#mwp-idn-002",
      "../../reference/specification/identity-registry-and-sessions/#mwp-idn-005",
      "../../reference/specification/identity-registry-and-sessions/#mwp-idn-007",
      "../../reference/specification/identity-registry-and-sessions/#mwp-idn-008",
      "../../reference/specification/authorization-and-budgets/#mwp-aut-001",
    ],
  ],
  [
    "work-lifecycle.mdx",
    [
      "../../reference/specification/missions-groups-and-membership/#mwp-msn-017",
      "../../reference/specification/missions-groups-and-membership/#mwp-msn-019",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-001",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-005",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-025",
      "../../reference/specification/missions-groups-and-membership/#mwp-msn-008",
    ],
  ],
  [
    "groups-and-scheduling.mdx",
    [
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-008",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-009",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-010",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-013",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-015",
      "../../reference/specification/work-scheduling-and-recovery/#mwp-wrk-029",
    ],
  ],
  [
    "child-missions.mdx",
    [
      "../../reference/specification/missions-groups-and-membership/#mwp-msn-024",
      "../../reference/specification/missions-groups-and-membership/#mwp-msn-025",
      "../../reference/specification/missions-groups-and-membership/#mwp-msn-026",
      "../../reference/specification/foundations/#mwp-fnd-020",
    ],
  ],
  [
    "signed-documents-and-trust.mdx",
    [
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-001",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-002",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-008",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-010",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-014",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-015",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-017",
      "../../reference/schemas/",
      "../../reference/conformance/cryptography/",
    ],
  ],
  [
    "first-admission-and-historical-trust.mdx",
    [
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-001",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-003",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-005",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-006",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-008",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-009",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-012",
      "../../reference/schemas/",
      "../../reference/conformance/admission/",
    ],
  ],
  [
    "security-boundaries.mdx",
    [
      "current Registry evidence",
      "historical Registry evidence",
      "Command freshness",
      "signer authorization",
      "portable Admission Log proof",
      "state-machine acceptance",
      "caller-provided trust booleans",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-010",
      "../../reference/specification/signed-documents-and-trust/#mwp-sdv-012",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-003",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-013",
      "../../reference/specification/first-admission-and-historical-trust/#mwp-adm-014",
      "../../reference/specification/errors-extensions-and-security/#mwp-ext-013",
      "../../reference/specification/commands-events-and-ordering/#mwp-evt-004",
    ],
  ],
]);

const firstAdmissionFlow = [
  "six-stage cryptographic verification",
  "authoritative Admission Log lookup",
  "found record validation OR authoritative absence",
  "trusted context and candidate preparation",
  "atomic append-or-return-existing",
  "returned record validation",
  "admitted result",
];
const historicalReplayFlow = [
  "six-stage cryptographic verification",
  "required found record",
  "record validation",
  "no trusted context or append",
];

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
    offset = next + token.length;
  }
}

for (const [relativePath, tokens] of requiredPages) {
  const file = path.join(learnRoot, relativePath);
  if (!(await exists(file))) {
    failures.push(`${relativePath}: missing Learn page`);
    continue;
  }

  const contents = await readFile(file, "utf8");
  requireTokens(relativePath, contents, tokens);

  if (/non-normative learning guide/iu.test(contents)) {
    failures.push(`${relativePath}: retains retired non-normative wording`);
  }
  if (
    /https:\/\/github\.com\/[^\s)]+\/(?:blob|tree)\/[^\s)]*(?:README|docs\/|spec\/PROTOCOL\.md)/iu.test(
      contents,
    )
  ) {
    failures.push(`${relativePath}: depends on repository documentation`);
  }
}

const firstAdmissionPage = path.join(
  learnRoot,
  "first-admission-and-historical-trust.mdx",
);
if (await exists(firstAdmissionPage)) {
  const contents = await readFile(firstAdmissionPage, "utf8");
  requireOrdered(
    "first-admission-and-historical-trust.mdx",
    contents,
    firstAdmissionFlow,
  );
  requireOrdered(
    "first-admission-and-historical-trust.mdx",
    contents,
    historicalReplayFlow,
  );
}

if (failures.length > 0) {
  console.error("Learn page check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Learn pages passed ${requiredPages.size} local pages, exact trust flows, and local clause-link checks.`,
);
