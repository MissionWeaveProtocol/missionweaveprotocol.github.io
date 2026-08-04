import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildNormativeRedirects,
  localeDefinitions,
  navigationManifest,
  routeManifest,
} from "./lib/normative-routes.mjs";

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

function prohibitTokens(relativePath, contents, tokens) {
  const normalizedContents = normalized(contents);
  for (const token of tokens) {
    if (normalizedContents.includes(normalized(token))) {
      failures.push(`${relativePath}: prohibited content ${token}`);
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

function localizedRoute(directory, route) {
  return directory === "" ? route : `/${directory}${route}`;
}

function requireSdkRoutes(sdk, label) {
  const routesById = new Map(
    routeManifest.routes.map((route) => [route.id, route]),
  );
  const redirects = buildNormativeRedirects();
  const expectedSuffixes = ["", "runtime", "admission", "api"];
  const expectedRouteIds = expectedSuffixes.map((suffix) =>
    suffix === "" ? `build-sdk-${sdk}` : `build-sdk-${sdk}-${suffix}`,
  );
  const buildGroup = navigationManifest.groups.find(
    (group) => group.id === "build",
  );
  const sdkGroup = buildGroup?.items.find((item) => item.id === "sdks");
  const languageGroup = sdkGroup?.items.find(
    (item) => item.id === `sdk-${sdk}`,
  );

  if (languageGroup?.labels?.en !== label) {
    failures.push(`navigation.json: sdk-${sdk} English label must be ${label}`);
  }
  const actualRouteIds = languageGroup?.items?.map((item) => item.route) ?? [];
  if (JSON.stringify(actualRouteIds) !== JSON.stringify(expectedRouteIds)) {
    failures.push(
      `navigation.json: sdk-${sdk} routes must be ${JSON.stringify(expectedRouteIds)}`,
    );
  }

  for (const suffix of expectedSuffixes) {
    const routeSuffix = suffix === "" ? "" : `-${suffix}`;
    const pathSuffix = suffix === "" ? "" : `/${suffix}`;
    const id = `build-sdk-${sdk}${routeSuffix}`;
    const route = routesById.get(id);
    const expected = {
      source: `build/sdk/${sdk}${pathSuffix}`,
      versioned: `/0.1/build/sdk/${sdk}${pathSuffix}/`,
      latest: `/build/sdk/${sdk}${pathSuffix}/`,
      legacy: suffix === "" ? [`/sdk/${sdk}/`] : [],
    };

    if (!route) {
      failures.push(`routes.json: missing ${id}`);
      continue;
    }
    for (const [field, value] of Object.entries(expected)) {
      if (JSON.stringify(route[field]) !== JSON.stringify(value)) {
        failures.push(
          `routes.json: ${id}.${field} must be ${JSON.stringify(value)}`,
        );
      }
    }
    for (const { directory } of localeDefinitions) {
      const destination = localizedRoute(directory, route.versioned);
      for (const source of [route.latest, ...route.legacy]) {
        const localizedSource = localizedRoute(directory, source);
        if (redirects[localizedSource] !== destination) {
          failures.push(
            `routes.json: ${localizedSource} must redirect to ${destination}`,
          );
        }
      }
    }
  }
}

const languages = [
  {
    sdk: "rust",
    label: "Rust",
    pin: "2727f8777737265d98dde4ceaca306612ef54c52",
    packageName: "missionweaveprotocol",
    toolchain: ["Rust 1.85", "edition 2024"],
    runtimeSources: [
      "strict_json.rs",
      "schema.rs",
      "canonical.rs",
      "signed_document.rs",
      "frame.rs",
      "conformance.rs",
      "bundle.rs",
      "admission.rs",
    ],
    prohibitedRuntimeSources: ["rfc3339.rs"],
    admissionPageTokens: [],
    admissionOperations: [
      "prepare_first_admission",
      "admit_first",
      "verify_historical_admission",
    ],
    example: "examples/sdk/rust/admission.rs",
    exampleTokens: [
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      "AdmissionLookup::AuthoritativeAbsence",
      "AuthenticatedAdmissionRecord",
      "AdmissionService",
      "ProtocolBundle",
      ".admit_first(",
      ".verify_historical_admission(",
      "append_count",
      "first.record().admission_record_id() == historical.record().admission_record_id()",
      "first.verified().signing_hash() == historical.verified().signing_hash()",
      "first.record().bytes() == historical.record().bytes()",
      "admission_log.append_count() == 1",
      '"first admission:',
      '"historical replay:',
    ],
  },
  {
    sdk: "java",
    label: "Java",
    pin: "3b2798c21d906c81887c54fe80e5bca8a19ddac7",
    packageName: "org.missionweaveprotocol:missionweaveprotocol-sdk",
    toolchain: ["Java 21", "Maven 3.9"],
    runtimeSources: [
      "StrictJson.java",
      "SchemaCatalog.java",
      "CanonicalJson.java",
      "SignedDocumentCodec.java",
      "FrameCodec.java",
      "ConformanceRunner.java",
      "ProtocolBundle.java",
      "AdmissionService.java",
    ],
    prohibitedRuntimeSources: ["SdkMetadata.java"],
    admissionPageTokens: [],
    admissionOperations: [
      "prepareFirstAdmission",
      "admitFirst",
      "verifyHistoricalAdmission",
    ],
    example: "examples/sdk/java/AdmissionExample.java",
    exampleTokens: [
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      "AdmissionLookup.AuthoritativeAbsence",
      "AuthenticatedAdmissionRecord",
      "AdmissionService",
      "ProtocolBundle",
      ".admitFirst(",
      ".verifyHistoricalAdmission(",
      "appendCount",
      "first.record().admissionRecordId().equals(historical.record().admissionRecordId())",
      "first.verified().signingHash().equals(historical.verified().signingHash())",
      "Arrays.equals(first.recordBytes(), historical.recordBytes())",
      "admissionLog.appendCount() == 1",
      '"first admission: "',
      '"historical replay: "',
    ],
  },
  {
    sdk: "cpp",
    label: "C++",
    pin: "481b0ce3a65c1f2265935318b54481ece5032fdf",
    packageName: "MissionWeaveProtocol::sdk",
    toolchain: ["C++20", "CMake 3.24", "OpenSSL 3", "jsoncons 1.8.1"],
    runtimeSources: [
      "json.hpp",
      "schema.hpp",
      "canonical.hpp",
      "signed_document.hpp",
      "frame.hpp",
      "conformance.hpp",
      "bundle.hpp",
      "admission.hpp",
    ],
    prohibitedRuntimeSources: [],
    admissionPageTokens: [
      "CMakeLists.txt?raw",
      "-DMISSIONWEAVEPROTOCOL_SDK_ROOT=",
      "--target missionweaveprotocol_website_admission",
      "./build/missionweaveprotocol_website_admission",
    ],
    admissionOperations: [
      "prepare_first_admission",
      "admit_first",
      "verify_historical_admission",
    ],
    example: "examples/sdk/cpp/admission.cpp",
    exampleBuild: "examples/sdk/cpp/CMakeLists.txt",
    exampleBuildTokens: [
      "cmake_minimum_required(VERSION 3.24)",
      'add_subdirectory("${MISSIONWEAVEPROTOCOL_SDK_ROOT}"',
      "add_executable(missionweaveprotocol_website_admission admission.cpp)",
      "target_link_libraries(missionweaveprotocol_website_admission PRIVATE MissionWeaveProtocol::sdk)",
      "target_compile_features(missionweaveprotocol_website_admission PRIVATE cxx_std_20)",
    ],
    exampleTokens: [
      "AdmissionCurrentKeyResolver",
      "TrustedAdmissionContext",
      "AdmissionLog",
      "AdmissionLookup::authoritative_absence",
      "AuthenticatedAdmissionRecord",
      "AdmissionService",
      "ProtocolBundle",
      ".admit_first(",
      ".verify_historical_admission(",
      "append_count",
      "first.record().admission_record_id() != historical.record().admission_record_id()",
      "first.verified().signing_hash() != historical.verified().signing_hash()",
      "std::ranges::equal(first.record_bytes(), historical.record_bytes())",
      "admission_log.append_count() == 1",
      '"first admission: "',
      '"historical replay: "',
    ],
  },
];

const admissionClauses = [
  "#mwp-adm-003",
  "#mwp-adm-005",
  "#mwp-adm-006",
  "#mwp-adm-008",
  "#mwp-adm-009",
  "#mwp-adm-010",
  "#mwp-adm-012",
  "#mwp-adm-013",
  "#mwp-adm-014",
];

for (const language of languages) {
  const pages = new Map([
    [
      `${language.sdk}/index.mdx`,
      [
        "SdkInstall",
        "SdkRuntimeMatrix",
        language.pin,
        language.packageName,
        ...language.toolchain,
        `<SdkRuntimeMatrix sdk="${language.sdk}" />`,
        "./runtime/",
        "./admission/",
        "./api/",
      ],
    ],
    [
      `${language.sdk}/runtime.mdx`,
      [
        "SupportStatus",
        '<SupportStatus status="implemented" />',
        '<SupportStatus status="not-implemented" />',
        '<SupportStatus status="deployment-adapter-required" />',
        ...language.runtimeSources,
        "Mission orchestration",
        "Worker scheduler",
        "gateway service",
        "persistence runtime",
      ],
    ],
    [
      `${language.sdk}/admission.mdx`,
      [
        "AdmissionCurrentKeyResolver",
        "TrustedAdmissionContext",
        "AdmissionLog",
        "AuthenticatedAdmissionRecord",
        "AdmissionService",
        ...language.admissionOperations,
        ...admissionClauses,
        ...language.admissionPageTokens,
        ":::note[Informative example]",
        ":::note[Implementation note]",
        "?raw",
        "caller-provided trust boolean",
      ],
    ],
    [
      `${language.sdk}/api.mdx`,
      [
        "SdkApiInventory",
        `<SdkApiInventory sdk="${language.sdk}" />`,
        language.pin,
        "exact-commit",
      ],
    ],
  ]);

  for (const [relativePath, tokens] of pages) {
    const file = path.join(sdkRoot, relativePath);
    if (!(await exists(file))) {
      failures.push(`${relativePath}: missing SDK reference page`);
      continue;
    }
    const contents = await readFile(file, "utf8");
    requireTokens(relativePath, contents, tokens);
    if (relativePath.endsWith("/runtime.mdx")) {
      prohibitTokens(relativePath, contents, language.prohibitedRuntimeSources);
    }
    prohibitRepositoryDocumentation(relativePath, contents);
  }

  const examplePath = path.join(repositoryRoot, language.example);
  if (!(await exists(examplePath))) {
    failures.push(`${language.example}: missing runnable example`);
  } else {
    const contents = await readFile(examplePath, "utf8");
    requireTokens(language.example, contents, language.exampleTokens);
    if (/\b(?:is_?|was_?)?trusted\s*[=:]\s*(?:true|false)\b/iu.test(contents)) {
      failures.push(
        `${language.example}: caller-provided trust boolean is prohibited`,
      );
    }
    if (
      /(?:std::ifstream|Files\.readAllBytes|read_to_(?:string|end)|readFileSync|fs::read)\b/u.test(
        contents,
      )
    ) {
      failures.push(
        `${language.example}: example must use packaged assets rather than repository files`,
      );
    }
  }

  if (language.exampleBuild) {
    const exampleBuildPath = path.join(repositoryRoot, language.exampleBuild);
    if (!(await exists(exampleBuildPath))) {
      failures.push(`${language.exampleBuild}: missing runnable build recipe`);
    } else {
      const contents = await readFile(exampleBuildPath, "utf8");
      requireTokens(
        language.exampleBuild,
        contents,
        language.exampleBuildTokens,
      );
    }
  }
}

const sdkIndex = await readFile(path.join(sdkRoot, "index.mdx"), "utf8");
requireTokens("index.mdx", sdkIndex, ["./rust/", "./java/", "./cpp/"]);
for (const language of languages) {
  requireSdkRoutes(language.sdk, `${language.label} SDK`);
}

if (failures.length > 0) {
  console.error(
    `Rust, Java, and C++ SDK reference validation failed:\n${failures
      .map((failure) => `- ${failure}`)
      .join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.log("Rust, Java, and C++ SDK reference validation passed.");
}
