import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const contentRoot = path.join(repositoryRoot, "src/content/docs");
const config = await readFile(
  path.join(repositoryRoot, "astro.config.mjs"),
  "utf8",
);
const failures = [];
const normalizeWhitespace = (value) => value.replace(/\s+/gu, " ").trim();
const contentExtensions = new Set([".md", ".mdx"]);

function withoutAllowedDefinitions(contents, firstForms) {
  let result = normalizeWhitespace(contents);
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

const localeRules = [
  {
    locale: "zh-CN",
    directory: "zh-cn",
    term: "子任务",
    firstForms: ["子任务（Child Mission）"],
    navigation: '"zh-CN": "子任务"',
    forbidden: [/子\s*Mission/gu, /子使命/gu, /子任務/gu],
    childRequirements: ["子任务内的工作项", "不是 WorkItem"],
  },
  {
    locale: "zh-TW",
    directory: "zh-tw",
    term: "子任务",
    firstForms: ["子任务（Child Mission）"],
    navigation: '"zh-TW": "子任务"',
    forbidden: [/子\s*Mission/gu, /子使命/gu, /子任務/gu],
    childRequirements: ["子任务內的工作項", "不是 WorkItem"],
  },
  {
    locale: "ja",
    directory: "ja",
    term: "サブタスク",
    firstForms: ["サブタスク（Child Mission）"],
    navigation: 'ja: "サブタスク"',
    forbidden: [/子\s*Mission/gu, /子ミッション/gu, /サブミッション/gu],
    childRequirements: ["サブタスク内の WorkItem", "WorkItem ではありません"],
  },
  {
    locale: "es",
    directory: "es",
    term: "subtarea",
    firstForms: ["subtarea (Child Mission)"],
    navigation: 'es: "Subtarea"',
    forbidden: [
      /(?:Missions?|Misi(?:[oó]n|ones)) secundaria(?:s)?/giu,
      /(?:Missions?|Misi(?:[oó]n|ones)) hija(?:s)?/giu,
      /submisi(?:ón|ones)/giu,
    ],
    childRequirements: ["WorkItem de la subtarea", "no es un WorkItem"],
  },
  {
    locale: "fr",
    directory: "fr",
    term: "sous-tâche",
    firstForms: ["sous-tâche (Child Mission)"],
    navigation: 'fr: "Sous-tâche"',
    forbidden: [
      /Mission(?:s)? enfant(?:s)?/giu,
      /sous-missions?/giu,
      /missions? filles?/giu,
    ],
    childRequirements: ["WorkItem de la sous-tâche", "pas un WorkItem"],
  },
  {
    locale: "de",
    directory: "de",
    term: "Unteraufgabe",
    firstForms: ["Unteraufgabe (Child Mission)"],
    navigation: 'de: "Unteraufgabe"',
    forbidden: [
      /untergeordnet\p{L}*\s+Mission\p{L}*/giu,
      /Kindmission(?:en)?/giu,
      /Teilmission(?:en)?/giu,
    ],
    childRequirements: ["WorkItem der Unteraufgabe", "kein WorkItem"],
  },
];

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
  "docs/0.1/child-missions.md",
  "docs/0.1/index.mdx",
  "docs/0.1/core-model.md",
  "reference/terminology.md",
  "sdk/python/index.md",
];
const allContentFiles = await collectContentFiles(contentRoot);
const localizedContentPathCount = allContentFiles.filter((file) =>
  file.startsWith(`${localeRules[0].directory}/`),
).length;

for (const rule of localeRules) {
  if (!config.includes(rule.navigation)) {
    failures.push(
      `astro.config.mjs: missing ${rule.locale} navigation label ${rule.term}`,
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

  for (const requiredDefinition of [
    "docs/0.1/child-missions.md",
    "reference/terminology.md",
  ]) {
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
    localizedByPath.get("docs/0.1/child-missions.md")?.contents ?? "",
  );
  for (const phrase of sharedDiagramEnglish) {
    if (childPage?.includes(phrase)) {
      failures.push(
        `${rule.directory}/docs/0.1/child-missions.md: untranslated diagram text ${phrase}`,
      );
    }
  }
  for (const phrase of rule.childRequirements) {
    if (!childPage?.includes(phrase)) {
      failures.push(
        `${rule.directory}/docs/0.1/child-missions.md: missing ${phrase}`,
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
  path.join(contentRoot, "zh-tw/docs/0.1/work-lifecycle.md"),
  "utf8",
);

for (const phrase of ["将工作接收到", "將工作接收到"]) {
  if (homeStory.includes(phrase)) {
    failures.push(
      `src/components/HomeStory.astro: awkward queue wording ${phrase}`,
    );
  }
}
if (!config.includes('"zh-CN": "符合性"')) {
  failures.push(
    "astro.config.mjs: Simplified Chinese conformance label must be 符合性",
  );
}
if (zhCnHome.includes("人类审批")) {
  failures.push(
    "src/content/docs/zh-cn/index.mdx: use 人类批准 rather than 人类审批",
  );
}
if (zhTwReview.includes("評審")) {
  failures.push(
    "src/content/docs/zh-tw/docs/0.1/work-lifecycle.md: use 審查 rather than 評審",
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
