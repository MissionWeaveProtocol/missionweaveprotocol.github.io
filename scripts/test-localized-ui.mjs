import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const checker = path.join(repositoryRoot, "scripts/check-localized-ui.mjs");
const localeDirectories = ["zh-cn", "zh-tw", "ja", "es", "fr", "de"];
const localeDataKeys = {
  "zh-cn": "zh-CN",
  "zh-tw": "zh-TW",
  ja: "ja",
  es: "es",
  fr: "fr",
  de: "de",
};
const sourceTermCount = 63;

function englishGlossary() {
  const terms = Array.from(
    { length: sourceTermCount },
    (_, index) =>
      `**Term ${index + 1}**:\nEnglish description ${index + 1}.\n_Avoid_: English avoid ${index + 1}`,
  );
  return `# Fixture\n\nFixture introduction.\n\n## Terms\n\n${terms.join("\n\n")}\n`;
}

function glossaryData() {
  return {
    schemaVersion: 1,
    protocolVersion: "0.1",
    sourceTermCount,
    locales: Object.fromEntries(
      Object.values(localeDataKeys).map((locale) => [
        locale,
        {
          introduction: `${locale} localized introduction.`,
          sectionTitles: [`${locale} localized terms`],
          entries: Array.from({ length: sourceTermCount }, (_, index) => ({
            term: `Term ${index + 1}`,
            description: `${locale} localized description ${index + 1}.`,
            avoid: `${locale} localized avoid ${index + 1}.`,
          })),
        },
      ]),
    ),
  };
}

function uiCopyData() {
  const english = {
    clauseLink: "Link to normative clause {id}",
    publicEntries: "{count} public entries",
    capabilities: { runtime: "Runtime", boundary: "Boundary" },
    reasons: { boundary: "Deployment boundary." },
  };
  return {
    schemaVersion: 1,
    protocolVersion: "0.1",
    locales: {
      en: english,
      ...Object.fromEntries(
        Object.values(localeDataKeys).map((locale) => [
          locale,
          {
            clauseLink: `${locale} clause {id}`,
            publicEntries: `${locale} entries {count}`,
            capabilities: {
              runtime: `${locale} runtime`,
              boundary: `${locale} boundary capability`,
            },
            reasons: { boundary: `${locale} boundary.` },
          },
        ]),
      ),
    },
  };
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "localized-ui-test-"));
  await mkdir(path.join(root, "public/artifacts/0.1/protocol"), {
    recursive: true,
  });
  await mkdir(path.join(root, "src/data/normative/0.1"), { recursive: true });
  await mkdir(path.join(root, "src/content/docs/0.1"), { recursive: true });
  await writeFile(
    path.join(root, "public/artifacts/0.1/protocol/CONTEXT.md"),
    englishGlossary(),
  );
  await writeJson(
    path.join(root, "src/data/normative/0.1/context-glossary-locales.json"),
    glossaryData(),
  );
  await writeJson(
    path.join(root, "src/data/normative/0.1/ui-copy.json"),
    uiCopyData(),
  );
  await writeJson(
    path.join(root, "src/data/normative/0.1/sdk-runtime-matrix.json"),
    {
      sdks: [
        {
          implemented: [
            {
              capability: "runtime",
              label: "Runtime",
              sourceFiles: ["runtime.ts"],
            },
          ],
          deploymentAdapters: [
            {
              capability: "boundary",
              label: "Boundary",
              sourceFiles: ["adapter.ts"],
              reason: "Deployment boundary.",
            },
          ],
          notImplemented: [],
        },
      ],
    },
  );
  await writeJson(
    path.join(root, "src/data/normative/0.1/navigation.json"),
    {},
  );
  await writeFile(
    path.join(root, "src/content/docs/0.1/page.mdx"),
    '<Widget title="English reader-facing title" />\n',
  );
  for (const directory of localeDirectories) {
    await mkdir(path.join(root, `src/content/docs/${directory}/0.1`), {
      recursive: true,
    });
    await writeFile(
      path.join(root, `src/content/docs/${directory}/0.1/page.mdx`),
      `<Widget title="${directory} localized title" />\n`,
    );
    await mkdir(path.join(root, `dist/${directory}`), { recursive: true });
    await writeFile(
      path.join(root, `dist/${directory}/index.html`),
      `<html lang="${directory}"><body>${directory} localized output</body></html>\n`,
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
  rejectingCaseCount += 1;
  const root = await createFixture();
  try {
    await mutate(root);
    const result = run(root);
    assert.notEqual(result.status, 0, "invalid localized UI fixture passed");
    assert.match(`${result.stdout}\n${result.stderr}`, expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

let rejectingCaseCount = 0;

const validRoot = await createFixture();
try {
  const result = run(validRoot);
  assert.equal(
    result.status,
    0,
    `valid localized UI fixture failed:\n${result.stdout}\n${result.stderr}`,
  );
} finally {
  await rm(validRoot, { recursive: true, force: true });
}

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/context-glossary-locales.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.locales.fr.entries.pop();
  await writeJson(file, data);
}, /fr.*glossary.*63|fr.*glossary.*count/iu);

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/context-glossary-locales.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.locales["zh-CN"].entries[0].description = "English description 1.";
  await writeJson(file, data);
}, /zh-CN.*glossary.*description.*English/iu);

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/context-glossary-locales.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.locales.de.entries[1].avoid = "English avoid 2";
  await writeJson(file, data);
}, /de.*glossary.*avoid.*English/iu);

await expectFailure(async (root) => {
  const file = path.join(root, "src/data/normative/0.1/ui-copy.json");
  const data = JSON.parse(await readFile(file, "utf8"));
  data.locales.es.clauseLink = "es clause {clauseId}";
  await writeJson(file, data);
}, /es.*clauseLink.*placeholder/iu);

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/sdk-runtime-matrix.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.sdks[0].implemented.push({
    capability: "future-runtime",
    label: "Future runtime",
    sourceFiles: ["future.ts"],
  });
  await writeJson(file, data);
}, /capability.*future-runtime.*UI copy/iu);

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/context-glossary-locales.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.locales.ja.entries[0].term = "Term 2";
  await writeJson(file, data);
}, /ja.*glossary.*term.*Term 1/iu);

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/context-glossary-locales.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.locales.fr.entries[0].description = "   ";
  await writeJson(file, data);
}, /fr.*glossary.*description.*empty/iu);

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/context-glossary-locales.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.locales.it = data.locales.es;
  await writeJson(file, data);
}, /glossary locale key set differs/iu);

await expectFailure(async (root) => {
  const file = path.join(root, "src/data/normative/0.1/ui-copy.json");
  const data = JSON.parse(await readFile(file, "utf8"));
  delete data.locales.de.capabilities.runtime;
  await writeJson(file, data);
}, /de.*UI copy key set differs/iu);

await expectFailure(async (root) => {
  const file = path.join(
    root,
    "src/data/normative/0.1/sdk-runtime-matrix.json",
  );
  const data = JSON.parse(await readFile(file, "utf8"));
  data.sdks[0].deploymentAdapters[0].reason = "Different boundary.";
  await writeJson(file, data);
}, /boundary.*reason differs from canonical English/iu);

const retiredTerminologyCases = [
  ["zh-cn", "入学清单"],
  ["zh-tw", "協定引腳"],
  ["ja", "輸送と額装"],
  ["es", "confirmación exacta del SDK"],
  ["fr", "Broche SHA-256"],
  ["de", "Begehen"],
];
for (const [locale, phrase] of retiredTerminologyCases) {
  await expectFailure(
    (root) =>
      writeFile(
        path.join(root, `src/content/docs/${locale}/0.1/page.mdx`),
        `<Widget title="${locale} localized title" />\n${phrase}\n`,
      ),
    new RegExp(`${locale}.*retired localized terminology`, "iu"),
  );
}

const semanticFalseFriendCases = [
  ["zh-cn", "连接 JSON"],
  ["zh-tw", "本地預測"],
  ["ja", "ノード ランタイム"],
  ["es", "Resultados escritos"],
  ["fr", "Racine de caisse"],
  ["de", "Vernetzen Sie JSON"],
  ["zh-cn", "当前注册表"],
  ["zh-tw", "準入日誌"],
  ["ja", "現在のレジストリ"],
  ["es", "Ir SDK"],
  ["fr", "journal d'admission"],
  ["de", "aktuelle Registrierung"],
  ["zh-cn", "文物和摘要"],
  ["es", "Comandos, eventos y pedidos"],
  ["fr", "Commandes, événements et classement"],
  ["ja", "受け入れバンドル"],
  ["ja", "初回承認"],
  ["ja", "暗号化準拠"],
  ["ja", "暗号化段階"],
  ["de", "Autorisierende Core-Laufzeit"],
  ["de", "First Admission und Historical Trust"],
  ["zh-cn", "注册表证据"],
  ["zh-tw", "註冊表證據"],
  ["ja", "レジストリの証拠"],
  ["es", "evidencia de registro"],
  ["fr", "preuves du registre"],
  ["de", "Registrierungsnachweise"],
  ["fr", "règles de câblage canoniques"],
  ["zh-cn", "可重建预测"],
  ["de", "autorisierenden Übergang"],
  ["zh-cn", "录取证据包"],
  ["zh-tw", "錄取證據包"],
  ["es", "estados, pedidos, autorización"],
  ["es", "pedidos cruzados Group"],
  ["es", "lista negra de pedidos\npequeños"],
  ["zh-cn", "文物"],
  ["zh-tw", "文物"],
];
for (const [locale, phrase] of semanticFalseFriendCases) {
  await expectFailure(
    (root) =>
      writeFile(
        path.join(root, `src/content/docs/${locale}/0.1/page.mdx`),
        `<Widget title="${locale} localized title" />\n${phrase}\n`,
      ),
    new RegExp(`${locale}.*retired localized terminology`, "iu"),
  );
}

await expectFailure(async (root) => {
  const matrixFile = path.join(
    root,
    "src/data/normative/0.1/sdk-runtime-matrix.json",
  );
  const matrix = JSON.parse(await readFile(matrixFile, "utf8"));
  matrix.sdks[0].implemented.push({
    capability: "embedded-protocol-bundles",
    label: "Protocol bundles and digest verification",
    sourceFiles: ["package-root.ts"],
  });
  await writeJson(matrixFile, matrix);

  const copyFile = path.join(root, "src/data/normative/0.1/ui-copy.json");
  const copy = JSON.parse(await readFile(copyFile, "utf8"));
  for (const locale of Object.keys(copy.locales)) {
    copy.locales[locale].capabilities["embedded-protocol-bundles"] =
      locale === "en"
        ? "Protocol bundles and digest verification"
        : `${locale} protocol bundles and digest verification`;
  }
  await writeJson(copyFile, copy);
}, /embedded-protocol-bundles.*must not claim digest verification/iu);

console.log(
  `Localized UI checker fixture tests passed one valid and ${rejectingCaseCount} rejecting cases.`,
);
