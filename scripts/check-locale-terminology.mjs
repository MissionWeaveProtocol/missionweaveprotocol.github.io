import { readFile } from "node:fs/promises";
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
    forbidden: [/子\s+Mission/gu],
    childRequirements: ["子任务内的工作项", "不是 WorkItem"],
  },
  {
    locale: "zh-TW",
    directory: "zh-tw",
    term: "子任務",
    firstForms: ["子任務（Child Mission）"],
    navigation: '"zh-TW": "子任務"',
    forbidden: [/子\s+Mission/gu],
    childRequirements: ["子任務內的工作項", "不是 WorkItem"],
  },
  {
    locale: "ja",
    directory: "ja",
    term: "サブタスク",
    firstForms: ["サブタスク（Child Mission）"],
    navigation: 'ja: "サブタスク"',
    forbidden: [/子\s+Mission/gu, /子ミッション/gu],
    childRequirements: ["サブタスク内の WorkItem", "WorkItem ではありません"],
  },
  {
    locale: "es",
    directory: "es",
    term: "subtarea",
    firstForms: ["subtarea (Child Mission)"],
    navigation: 'es: "Subtarea"',
    forbidden: [/Mission secundaria(?:s)?/giu, /Mission hija(?:s)?/giu],
    childRequirements: ["WorkItem de la subtarea", "no es un WorkItem"],
  },
  {
    locale: "fr",
    directory: "fr",
    term: "sous-tâche",
    firstForms: ["sous-tâche (Child Mission)"],
    navigation: 'fr: "Sous-tâche"',
    forbidden: [/Mission(?:s)? enfant(?:s)?/giu],
    childRequirements: ["WorkItem de la sous-tâche", "pas un WorkItem"],
  },
  {
    locale: "de",
    directory: "de",
    term: "Unteraufgabe",
    firstForms: ["Unteraufgabe (Child Mission)"],
    navigation: 'de: "Unteraufgabe"',
    forbidden: [/untergeordnet\p{L}*\s+Mission\p{L}*/giu],
    childRequirements: ["WorkItem der Unteraufgabe", "kein WorkItem"],
  },
];

const requiredPaths = [
  "docs/0.1/child-missions.md",
  "docs/0.1/index.mdx",
  "docs/0.1/core-model.md",
  "reference/terminology.md",
  "sdk/python/index.md",
];

for (const rule of localeRules) {
  if (!config.includes(rule.navigation)) {
    failures.push(
      `astro.config.mjs: missing ${rule.locale} navigation label ${rule.term}`,
    );
  }

  const localizedBodies = [];
  for (const relativePath of requiredPaths) {
    const file = path.join(contentRoot, rule.directory, relativePath);
    const contents = await readFile(file, "utf8");
    localizedBodies.push({ file, contents });

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
      localizedBodies.find(({ file }) => file.endsWith(requiredDefinition))
        ?.contents ?? "",
    );
    if (
      body === undefined ||
      !rule.firstForms.some((form) => body.includes(form))
    ) {
      failures.push(
        `${rule.directory}/${requiredDefinition}: missing first-use Child Mission definition`,
      );
    }
  }

  const combinedRaw = localizedBodies
    .map(({ contents }) => contents)
    .join("\n");
  const combined = normalizeWhitespace(combinedRaw);
  let withoutDefinitions = combined;
  for (const form of rule.firstForms) {
    withoutDefinitions = withoutDefinitions.replaceAll(form, "");
  }
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
    localizedBodies.find(({ file }) =>
      file.endsWith("docs/0.1/child-missions.md"),
    )?.contents ?? "",
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
  `Locale terminology passed for ${localeRules.length} localized Child Mission vocabularies.`,
);
