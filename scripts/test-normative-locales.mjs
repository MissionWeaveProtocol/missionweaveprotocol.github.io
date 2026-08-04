import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const checker = path.join(
  repositoryRoot,
  "scripts/check-normative-locales.mjs",
);
const locales = ["zh-cn", "zh-tw", "ja", "es", "fr", "de"];
const localizedSentences = {
  "zh-cn": "实现 MUST 保留规范强度。",
  "zh-tw": "實作 MUST 保留規範強度。",
  ja: "実装は規範上の強度を MUST 保持します。",
  es: "La implementación MUST conservar la fuerza normativa.",
  fr: "L’implémentation MUST conserver la force normative.",
  de: "Die Implementierung MUST die normative Stärke beibehalten.",
};

function document(title, sentence, options = {}) {
  const level = options.level ?? "MUST";
  const heading = options.heading ?? "## Details";
  const link = options.link ?? "../other/";
  const linkLabel = options.linkLabel ?? "the local page";
  const clauseId = options.clauseId ?? "MWP-TST-001";
  const importPrefix = options.importPrefix ?? "../../../../";
  const codeBody = options.codeBody ?? "mission.create";
  const code =
    options.code === false ? "" : `\n\`\`\`text\n${codeBody}\n\`\`\`\n`;
  const orderedList = options.orderedList
    ? `\n${options.orderedList.trim()}\n`
    : "";
  const readerBlock = options.readerBlock
    ? `\n${options.readerBlock.trim()}\n`
    : "";
  return `---
title: "${title}"
description: "Localized fixture"
normativeVersion: "0.1"
normativeStatus: normative
clausePrefix: MWP-TST
---

import NormativeClause from "${importPrefix}components/NormativeClause.astro";
import InformativeBlock from "${importPrefix}components/InformativeBlock.astro";

# Fixture

${heading}

<NormativeClause id="${clauseId}" level="${level}">

${sentence} See [${linkLabel}](${link}).
${orderedList}
${readerBlock}

</NormativeClause>

<InformativeBlock title="Context">

Localized supporting text.

</InformativeBlock>
${code}`;
}

function localizedDocument(locale, sentence, options = {}) {
  return document(locale, sentence, {
    ...options,
    importPrefix: "../../../../../",
    linkLabel: options.linkLabel ?? `${locale} 页面`,
  });
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "normative-locales-test-"));
  await mkdir(path.join(root, "src/data/normative/0.1"), { recursive: true });
  await mkdir(path.join(root, "src/content/docs/0.1/reference"), {
    recursive: true,
  });
  await writeFile(
    path.join(root, "src/data/normative/0.1/locale-policy.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        sourceLocale: "en",
        locales: locales.map((directory) => ({ directory })),
        normativeKeywords: [
          "MUST",
          "MUST NOT",
          "REQUIRED",
          "SHALL",
          "SHALL NOT",
          "SHOULD",
          "SHOULD NOT",
          "RECOMMENDED",
          "NOT RECOMMENDED",
          "MAY",
          "OPTIONAL",
        ],
        protocolTerms: [
          "Agent",
          "Mission",
          "Group",
          "WorkItem",
          "Command",
          "Event",
          "Registry",
          "Admission Log",
          "First-Admission Record",
        ],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/page.mdx"),
    document("English", "An implementation MUST preserve normative force."),
  );
  for (const locale of locales) {
    const directory = path.join(
      root,
      "src/content/docs",
      locale,
      "0.1/reference",
    );
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, "page.mdx"),
      localizedDocument(locale, localizedSentences[locale]),
    );
  }
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [checker, "--repository-root", root], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

async function expectFailure(mutate, expected) {
  const root = await createFixture();
  try {
    await mutate(root);
    const result = run(root);
    assert.notEqual(result.status, 0, "invalid locale fixture passed");
    assert.match(`${result.stdout}\n${result.stderr}`, expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const validRoot = await createFixture();
try {
  const result = run(validRoot);
  assert.equal(
    result.status,
    0,
    `valid locale fixture failed:\n${result.stdout}\n${result.stderr}`,
  );
} finally {
  await rm(validRoot, { recursive: true, force: true });
}

await expectFailure(
  (root) => rm(path.join(root, "src/content/docs/fr/0.1/reference/page.mdx")),
  /fr\/0\.1\/reference\/page\.mdx: missing/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/de/0.1/reference/page.mdx"),
      localizedDocument("de", localizedSentences.de, { level: "SHOULD" }),
    ),
  /NormativeClause sequence differs/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/es/0.1/reference/page.mdx"),
      localizedDocument("es", localizedSentences.es, {
        heading: "### Details",
      }),
    ),
  /heading-depth sequence differs/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/ja/0.1/reference/page.mdx"),
      localizedDocument("ja", localizedSentences.ja, { link: "../wrong/" }),
    ),
  /local-link sequence differs/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/ja/0.1/reference/page.mdx"),
      localizedDocument("ja", localizedSentences.ja).replace(
        "[ja 页面](../other/)",
        "ja 页面](../other/)",
      ),
    ),
  /local-link sequence differs/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/zh-tw/0.1/reference/page.mdx"),
      localizedDocument("zh-tw", localizedSentences["zh-tw"], {
        code: false,
      }),
    ),
  /code-block count differs/u,
);
await expectFailure(async (root) => {
  const english = document(
    "English",
    "An implementation MUST preserve normative force.",
  );
  await writeFile(
    path.join(root, "src/content/docs/zh-cn/0.1/reference/page.mdx"),
    english,
  );
}, /body is identical to English/u);
await expectFailure(async (root) => {
  const copied =
    "This explanatory paragraph remains in English even though the first sentence was localized for the target audience.";
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/page.mdx"),
    document(
      "English",
      `An implementation MUST preserve normative force. ${copied}`,
    ),
  );
  await writeFile(
    path.join(root, "src/content/docs/zh-cn/0.1/reference/page.mdx"),
    localizedDocument("zh-cn", `${localizedSentences["zh-cn"]} ${copied}`),
  );
}, /contains untranslated English prose/u);

await expectFailure(async (root) => {
  const english = document(
    "English",
    "The adapter MUST establish Organization scope, applicable authoritative revision, evidence completeness, and historical coverage or report that it cannot.",
  );
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/page.mdx"),
    english,
  );
  await writeFile(
    path.join(root, "src/content/docs/fr/0.1/reference/page.mdx"),
    localizedDocument(
      "fr",
      "L’adaptateur MUST établir applicable authoritative revision, evidence completeness, and historical coverage avant la vérification.",
    ),
  );
}, /contains untranslated English (?:prose|run)/u);

await expectFailure(async (root) => {
  const diagram =
    "current state\n→ validate the combined Evidence\n→ authoritative result";
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/page.mdx"),
    document("English", "An implementation MUST preserve normative force.", {
      codeBody: diagram,
    }),
  );
  for (const locale of locales) {
    await writeFile(
      path.join(root, `src/content/docs/${locale}/0.1/reference/page.mdx`),
      localizedDocument(locale, localizedSentences[locale], {
        codeBody: locale === "ja" ? diagram : `${locale} localized diagram`,
      }),
    );
  }
}, /ja\/0\.1\/reference\/page\.mdx: untranslated reader-facing text block/u);

await expectFailure(async (root) => {
  const englishList = [
    "1. Parse the document.",
    "2. Validate the schema.",
    "3. Build the signing projection.",
    "4. Resolve the Registry key.",
    "5. Canonicalize the projection.",
    "6. Verify the signature.",
  ].join("\n");
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/page.mdx"),
    document("English", "An implementation MUST preserve normative force.", {
      clauseId: "MWP-SDV-015",
      orderedList: englishList,
    }),
  );
  for (const locale of locales) {
    const markers =
      locale === "zh-cn" ? [1, 2, 3, 3, 4, 5] : [1, 2, 3, 4, 5, 6];
    const orderedList = markers
      .map((marker, index) => `${marker}. ${locale} 阶段 ${index + 1}。`)
      .join("\n");
    await writeFile(
      path.join(root, `src/content/docs/${locale}/0.1/reference/page.mdx`),
      localizedDocument(locale, localizedSentences[locale], {
        clauseId: "MWP-SDV-015",
        orderedList,
      }),
    );
  }
}, /zh-cn\/0\.1\/reference\/page\.mdx: ordered-list marker sequence differs/u);

await expectFailure(async (root) => {
  const englishList = [
    "1. Parse the document.",
    "2. Validate the schema.",
    "3. Verify the result.",
  ].join("\n");
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/page.mdx"),
    document("English", "An implementation MUST preserve normative force.", {
      orderedList: englishList,
    }),
  );
  for (const locale of locales) {
    const orderedList =
      locale === "zh-cn"
        ? "解析文档。\n验证架构。\n验证结果。"
        : [1, 2, 3]
            .map((marker) => `${marker}. ${locale} 阶段 ${marker}。`)
            .join("\n");
    await writeFile(
      path.join(root, `src/content/docs/${locale}/0.1/reference/page.mdx`),
      localizedDocument(locale, localizedSentences[locale], { orderedList }),
    );
  }
}, /zh-cn\/0\.1\/reference\/page\.mdx: reader list\/table structure differs/u);

await expectFailure(async (root) => {
  const englishTable = [
    "| Stage | Outcome |",
    "| --- | --- |",
    "| parse | complete |",
  ].join("\n");
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/page.mdx"),
    document("English", "An implementation MUST preserve normative force.", {
      readerBlock: englishTable,
    }),
  );
  for (const locale of locales) {
    const readerBlock =
      locale === "zh-tw"
        ? [
            "| 階段 | 結果 | 備註 |",
            "| --- | --- | --- |",
            "| 解析 | 完成 | 無 |",
          ].join("\n")
        : [
            `| ${locale} stage | ${locale} outcome |`,
            "| --- | --- |",
            `| ${locale} parse | ${locale} complete |`,
          ].join("\n");
    await writeFile(
      path.join(root, `src/content/docs/${locale}/0.1/reference/page.mdx`),
      localizedDocument(locale, localizedSentences[locale], { readerBlock }),
    );
  }
}, /zh-tw\/0\.1\/reference\/page\.mdx: reader list\/table structure differs/u);

console.log(
  "Normative locale checker fixture tests passed one valid and thirteen rejecting cases.",
);
