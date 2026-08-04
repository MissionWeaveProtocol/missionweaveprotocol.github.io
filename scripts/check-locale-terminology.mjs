import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import localePolicy from "../src/data/normative/0.1/locale-policy.json" with { type: "json" };
import { navigationManifest } from "./lib/normative-routes.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const contentRoot = path.join(repositoryRoot, "src/content/docs");
const failures = [];
const normalizeWhitespace = (value) => value.replace(/\s+/gu, " ").trim();
const contentExtensions = new Set([".md", ".mdx"]);

function withoutLiteralCode(contents) {
  return contents
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/gu, " ")
    .replace(/`[^`\n]*`/gu, " ");
}

function withoutAllowedDefinitions(contents, firstForms) {
  let result = normalizeWhitespace(withoutLiteralCode(contents));
  for (const form of firstForms) {
    result = result.replaceAll(form, "");
  }
  return result;
}

async function collectContentFiles(directory, prefix = "") {
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectContentFiles(absolutePath, relativePath)));
    } else if (contentExtensions.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }

  return files;
}

const sharedDiagramEnglish = [
  "Root Mission and Group",
  "parent WorkItem becomes blocked",
  "Child Mission and its own Group",
  "child Coordinator",
  "child WorkItems and Evidence",
  "child Approval",
  "result returns as Evidence and Artifacts",
  "for the parent WorkItem",
];

const localeRuleDetails = new Map([
  [
    "zh-cn",
    {
      forbidden: [/子\s*Mission/gu, /子使命/gu, /子任務/gu],
      childRequirements: ["子任务内的 WorkItem", "子任务不是 WorkItem"],
    },
  ],
  [
    "zh-tw",
    {
      forbidden: [/子\s*Mission/gu, /子使命/gu, /子任務/gu],
      childRequirements: ["子任务內的 WorkItem", "子任务不是 WorkItem"],
    },
  ],
  [
    "ja",
    {
      forbidden: [/子\s*Mission/gu, /子ミッション/gu, /サブミッション/gu],
      childRequirements: [
        "サブタスク内の WorkItem",
        "サブタスクは WorkItem ではありません",
      ],
    },
  ],
  [
    "es",
    {
      forbidden: [
        /(?:Missions?|Misi(?:[oó]n|ones)) secundaria(?:s)?/giu,
        /(?:Missions?|Misi(?:[oó]n|ones)) hija(?:s)?/giu,
        /submisi(?:ón|ones)/giu,
      ],
      childRequirements: [
        "WorkItems y Evidence de la subtarea",
        "La subtarea no es un WorkItem",
      ],
    },
  ],
  [
    "fr",
    {
      forbidden: [
        /Mission(?:s)? enfant(?:s)?/giu,
        /sous-missions?/giu,
        /missions? filles?/giu,
      ],
      childRequirements: [
        "WorkItems et Evidence de la sous-tâche",
        "La sous-tâche n'est pas un WorkItem",
      ],
    },
  ],
  [
    "de",
    {
      forbidden: [
        /untergeordnet\p{L}*\s+Mission\p{L}*/giu,
        /Kindmission(?:en)?/giu,
        /Teilmission(?:en)?/giu,
      ],
      childRequirements: [
        "WorkItems und Evidence der Unteraufgabe",
        "Die Unteraufgabe ist kein WorkItem",
      ],
    },
  ],
]);

const localeRules = localePolicy.locales.map((locale) => ({
  locale: locale.tag,
  directory: locale.directory,
  term: locale.childMissionTerm,
  firstForms: [locale.childMissionFirstUse],
  ...localeRuleDetails.get(locale.directory),
}));

const homeStoryLocaleMarkers = [
  { locale: "zh-CN", marker: '  "zh-CN": {' },
  { locale: "zh-TW", marker: '  "zh-TW": {' },
  { locale: "ja", marker: "  ja: {" },
  { locale: "es", marker: "  es: {" },
  { locale: "fr", marker: "  fr: {" },
  { locale: "de", marker: "  de: {" },
];

function extractHomeStoryLocaleBlock(source, locale) {
  const markerIndex = homeStoryLocaleMarkers.findIndex(
    (candidate) => candidate.locale === locale,
  );
  const marker = homeStoryLocaleMarkers[markerIndex]?.marker;
  if (marker === undefined) {
    failures.push(`src/components/HomeStory.astro: missing ${locale} marker`);
    return "";
  }

  const start = source.indexOf(marker);
  if (start === -1) {
    failures.push(
      `src/components/HomeStory.astro: missing ${locale} copy block`,
    );
    return "";
  }

  const nextMarker = homeStoryLocaleMarkers[markerIndex + 1]?.marker;
  const end =
    nextMarker === undefined
      ? source.indexOf("\n};", start + marker.length)
      : source.indexOf(nextMarker, start + marker.length);
  if (end === -1) {
    failures.push(
      `src/components/HomeStory.astro: unterminated ${locale} copy block`,
    );
    return "";
  }

  return source.slice(start, end);
}

const requiredPaths = [
  "0.1/learn/child-missions.mdx",
  "0.1/learn/index.mdx",
  "0.1/learn/core-model.mdx",
  "0.1/reference/terminology.mdx",
];
const termRequiredPaths = requiredPaths.filter(
  (relativePath) => relativePath !== "0.1/reference/terminology.mdx",
);
const allContentFiles = await collectContentFiles(contentRoot);
const localizedContentPathCount = allContentFiles.filter((file) =>
  file.startsWith(`${localeRules[0].directory}/`),
).length;

for (const rule of localeRules) {
  const learnGroup = navigationManifest.groups.find(
    (group) => group.id === "learn",
  );
  const childMissionNavigation = learnGroup?.items.find(
    (item) => item.route === "learn-child-missions",
  );
  const localizedNavigationLabel =
    childMissionNavigation?.labels?.[rule.directory];
  if (
    localizedNavigationLabel?.toLocaleLowerCase(rule.locale) !==
    rule.term.toLocaleLowerCase(rule.locale)
  ) {
    failures.push(
      `navigation.json: missing ${rule.locale} navigation label ${rule.term}`,
    );
  }

  const localePrefix = `${rule.directory}/`;
  const localizedBodies = await Promise.all(
    allContentFiles
      .filter((file) => file.startsWith(localePrefix))
      .map(async (relativeFile) => {
        const file = path.join(contentRoot, relativeFile);
        return {
          contents: await readFile(file, "utf8"),
          file,
          relativePath: relativeFile.slice(localePrefix.length),
        };
      }),
  );
  const localizedByPath = new Map(
    localizedBodies.map((body) => [body.relativePath, body]),
  );

  if (localizedBodies.length !== localizedContentPathCount) {
    failures.push(
      `${rule.directory}: expected ${localizedContentPathCount} localized content paths, found ${localizedBodies.length}`,
    );
  }

  for (const relativePath of requiredPaths) {
    const localizedBody = localizedByPath.get(relativePath);
    if (localizedBody === undefined) {
      failures.push(
        `${rule.directory}/${relativePath}: missing content source`,
      );
      continue;
    }
  }

  for (const relativePath of termRequiredPaths) {
    const localizedBody = localizedByPath.get(relativePath);
    if (localizedBody === undefined) continue;
    const { contents, file } = localizedBody;

    if (
      !normalizeWhitespace(contents)
        .toLocaleLowerCase("en-US")
        .includes(rule.term.toLocaleLowerCase("en-US"))
    ) {
      failures.push(
        `${path.relative(repositoryRoot, file)}: missing localized term ${rule.term}`,
      );
    }
  }

  for (const requiredDefinition of ["0.1/learn/child-missions.mdx"]) {
    const body = normalizeWhitespace(
      localizedByPath.get(requiredDefinition)?.contents ?? "",
    );
    if (!rule.firstForms.some((form) => body.includes(form))) {
      failures.push(
        `${rule.directory}/${requiredDefinition}: missing first-use Child Mission definition`,
      );
    }
  }

  const combinedRaw = localizedBodies
    .map(({ contents }) => contents)
    .join("\n");
  const withoutDefinitions = withoutAllowedDefinitions(
    combinedRaw,
    rule.firstForms,
  );
  if (/child mission/iu.test(withoutDefinitions)) {
    failures.push(
      `${rule.directory}: unlocalized Child Mission remains outside a first definition`,
    );
  }

  for (const pattern of rule.forbidden) {
    pattern.lastIndex = 0;
    if (pattern.test(combinedRaw)) {
      failures.push(
        `${rule.directory}: retired Child Mission wording matches ${pattern}`,
      );
    }
  }

  const childPage = normalizeWhitespace(
    localizedByPath.get("0.1/learn/child-missions.mdx")?.contents ?? "",
  );
  for (const phrase of sharedDiagramEnglish) {
    if (childPage?.includes(phrase)) {
      failures.push(
        `${rule.directory}/0.1/learn/child-missions.mdx: untranslated diagram text ${phrase}`,
      );
    }
  }
  for (const phrase of rule.childRequirements) {
    if (!childPage?.includes(phrase)) {
      failures.push(
        `${rule.directory}/0.1/learn/child-missions.mdx: missing ${phrase}`,
      );
    }
  }
}

const homeStory = await readFile(
  path.join(repositoryRoot, "src/components/HomeStory.astro"),
  "utf8",
);

for (const rule of localeRules) {
  const localizedHomeStory = extractHomeStoryLocaleBlock(
    homeStory,
    rule.locale,
  );
  if (
    /child mission/iu.test(
      withoutAllowedDefinitions(localizedHomeStory, rule.firstForms),
    )
  ) {
    failures.push(
      `src/components/HomeStory.astro:${rule.locale}: unlocalized Child Mission remains outside a first definition`,
    );
  }

  for (const pattern of rule.forbidden) {
    pattern.lastIndex = 0;
    if (pattern.test(localizedHomeStory)) {
      failures.push(
        `src/components/HomeStory.astro:${rule.locale}: retired Child Mission wording matches ${pattern}`,
      );
    }
  }
}

const zhCnHome = await readFile(
  path.join(contentRoot, "zh-cn/index.mdx"),
  "utf8",
);
const zhTwReview = await readFile(
  path.join(contentRoot, "zh-tw/0.1/learn/work-lifecycle.mdx"),
  "utf8",
);

for (const phrase of ["将工作接收到", "將工作接收到"]) {
  if (homeStory.includes(phrase)) {
    failures.push(
      `src/components/HomeStory.astro: awkward queue wording ${phrase}`,
    );
  }
}
const referenceGroup = navigationManifest.groups.find(
  (group) => group.id === "reference",
);
const conformanceGroup = referenceGroup?.items.find(
  (item) => item.id === "conformance",
);
if (conformanceGroup?.labels?.["zh-cn"] !== "符合性") {
  failures.push(
    "navigation.json: Simplified Chinese conformance label must be 符合性",
  );
}
if (zhCnHome.includes("人类审批")) {
  failures.push(
    "src/content/docs/zh-cn/index.mdx: use 人类批准 rather than 人类审批",
  );
}
if (zhTwReview.includes("評審")) {
  failures.push(
    "src/content/docs/zh-tw/0.1/learn/work-lifecycle.mdx: use 審查 rather than 評審",
  );
}

if (failures.length > 0) {
  console.error("Locale terminology violations:");
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Locale terminology passed for ${localeRules.length} localized Child Mission vocabularies across ${localizedContentPathCount} content paths.`,
);
