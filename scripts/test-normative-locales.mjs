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
  const code = options.code === false ? "" : "\n```text\nwire-value\n```\n";
  return `---
title: "${title}"
description: "Localized fixture"
normativeVersion: "0.1"
normativeStatus: normative
clausePrefix: MWP-TST
---

import NormativeClause from "../../../../components/NormativeClause.astro";
import InformativeBlock from "../../../../components/InformativeBlock.astro";

# Fixture

${heading}

<NormativeClause id="MWP-TST-001" level="${level}">

${sentence} See [the local page](${link}).

</NormativeClause>

<InformativeBlock title="Context">

Localized supporting text.

</InformativeBlock>
${code}`;
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
      document(locale, localizedSentences[locale]),
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
      document("de", localizedSentences.de, { level: "SHOULD" }),
    ),
  /NormativeClause sequence differs/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/es/0.1/reference/page.mdx"),
      document("es", localizedSentences.es, { heading: "### Details" }),
    ),
  /heading-depth sequence differs/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/ja/0.1/reference/page.mdx"),
      document("ja", localizedSentences.ja, { link: "../wrong/" }),
    ),
  /local-link sequence differs/u,
);
await expectFailure(
  (root) =>
    writeFile(
      path.join(root, "src/content/docs/zh-tw/0.1/reference/page.mdx"),
      document("zh-tw", localizedSentences["zh-tw"], { code: false }),
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

console.log(
  "Normative locale checker fixture tests passed one valid and six rejecting cases.",
);
