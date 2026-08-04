import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const generator = path.join(
  repositoryRoot,
  "scripts/generate-locale-clause-signatures.mjs",
);
const checker = path.join(
  repositoryRoot,
  "scripts/check-locale-clause-signatures.mjs",
);
const locales = ["zh-cn", "zh-tw", "ja", "es", "fr", "de"];
const localizedSentences = {
  "zh-cn": "实现 MUST 保留线值，并且 MUST NOT 接受调用方的信任声明。",
  "zh-tw": "實作 MUST 保留線值，並且 MUST NOT 接受呼叫端的信任宣告。",
  ja: "実装はワイヤ値を MUST 保持し、呼び出し元の信頼宣言を MUST NOT 受け入れます。",
  es: "La implementación MUST conservar los valores de cable y MUST NOT aceptar la confianza del llamante.",
  fr: "L’implémentation MUST conserver les valeurs filaires et MUST NOT accepter la confiance de l’appelant.",
  de: "Die Implementierung MUST Wire-Werte beibehalten und MUST NOT das Vertrauen des Aufrufers akzeptieren.",
};

function document(sentence, options = {}) {
  const id = options.id ?? "MWP-TST-001";
  const level = options.level ?? ["MUST", "MUST NOT"];
  const code = options.code ?? "AUTH_INVALID_SIGNATURE";
  const link = options.link ?? "../other/#mwp-tst-002";
  const linkKind = options.linkKind ?? "inline";
  const exclusions = options.exclusions ?? ["caller-provided-trust-booleans"];
  const levelAttribute =
    typeof level === "string"
      ? `level=${JSON.stringify(level)}`
      : `level={${JSON.stringify(level)}}`;
  let linkMarkup;
  let definitions = "";
  if (linkKind === "reference") {
    linkMarkup = "[the related clause][related-clause]";
    definitions = `\n[related-clause]: ${link}\n`;
    if (options.duplicateLink !== undefined) {
      definitions += `[related-clause]: ${options.duplicateLink}\n`;
    }
  } else if (linkKind === "expression") {
    linkMarkup = `<a href={${JSON.stringify(link)}}>the related clause</a>`;
  } else {
    assert.equal(linkKind, "inline", `unknown fixture link kind: ${linkKind}`);
    linkMarkup = `[the related clause](${link})`;
  }
  return `---
title: Fixture
description: Fixture
normativeVersion: "0.1"
normativeStatus: normative
clausePrefix: MWP-TST
---

# Fixture

<NormativeClause
  id="${id}"
  ${levelAttribute}
  exclusions={${JSON.stringify(exclusions)}}
>

${sentence} Use \`${code}\`, reject \`callerTrust\`, and see ${linkMarkup}.

</NormativeClause>
${definitions}
`;
}

async function createFixture(documentOptions = {}) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "locale-clause-signatures-test-"),
  );
  await mkdir(path.join(root, "src/data/normative/0.1"), { recursive: true });
  await mkdir(path.join(root, "src/content/docs/0.1/reference/specification"), {
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
        explicitExclusionIds: [
          "caller-provided-trust-booleans",
          "portable-log-proof-verification",
        ],
        explicitExclusionsByClauseId: {
          "MWP-TST-001": ["caller-provided-trust-booleans"],
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(root, "src/content/docs/0.1/reference/specification/page.mdx"),
    document(
      "An implementation MUST preserve wire values and MUST NOT accept caller trust.",
      documentOptions,
    ),
  );
  for (const locale of locales) {
    const directory = path.join(
      root,
      "src/content/docs",
      locale,
      "0.1/reference/specification",
    );
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, "page.mdx"),
      document(localizedSentences[locale], documentOptions),
    );
  }
  return root;
}

function run(script, root) {
  return spawnSync(process.execPath, [script, "--repository-root", root], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

async function generate(root) {
  const result = run(generator, root);
  assert.equal(
    result.status,
    0,
    `signature generation failed:\n${result.stdout}\n${result.stderr}`,
  );
}

async function expectSemanticFailure(
  locale,
  options,
  expected,
  documentOptions = {},
) {
  const root = await createFixture(documentOptions);
  try {
    await generate(root);
    await writeFile(
      path.join(
        root,
        "src/content/docs",
        locale,
        "0.1/reference/specification/page.mdx",
      ),
      document(options.sentence ?? localizedSentences[locale], {
        ...documentOptions,
        ...options,
      }),
    );
    await generate(root);
    const result = run(checker, root);
    assert.notEqual(result.status, 0, "semantic mismatch passed");
    assert.match(`${result.stdout}\n${result.stderr}`, expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function expectGenerationFailure(locale, options, expected) {
  const root = await createFixture();
  try {
    await writeFile(
      path.join(
        root,
        "src/content/docs",
        locale,
        "0.1/reference/specification/page.mdx",
      ),
      document(options.sentence ?? localizedSentences[locale], options),
    );
    const result = run(generator, root);
    assert.notEqual(result.status, 0, "invalid signature source generated");
    assert.match(`${result.stdout}\n${result.stderr}`, expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function expectLocaleOnlyDocumentFailure() {
  const root = await createFixture();
  try {
    await generate(root);
    await writeFile(
      path.join(
        root,
        "src/content/docs/zh-cn/0.1/reference/specification/extra.mdx",
      ),
      document(localizedSentences["zh-cn"], {
        id: "MWP-TST-002",
        exclusions: [],
      }),
    );
    await generate(root);
    const result = run(checker, root);
    assert.notEqual(result.status, 0, "localized-only clause page passed");
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /semantic document route sequence differs/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function expectArtifactFailure(value, expected) {
  const root = await createFixture();
  try {
    await generate(root);
    await writeFile(
      path.join(root, "src/data/normative/0.1/locale-clause-signatures.json"),
      `${JSON.stringify(value)}\n`,
    );
    const result = run(checker, root);
    assert.notEqual(result.status, 0, "malformed signature artifact passed");
    assert.match(`${result.stdout}\n${result.stderr}`, expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const validRoot = await createFixture();
try {
  await generate(validRoot);
  const signaturePath = path.join(
    validRoot,
    "src/data/normative/0.1/locale-clause-signatures.json",
  );
  const first = await readFile(signaturePath, "utf8");
  assert.equal(
    first,
    await format(first, { parser: "json" }),
    "generated signatures are not Prettier-stable",
  );
  await generate(validRoot);
  const second = await readFile(signaturePath, "utf8");
  assert.equal(second, first, "signature generation is not deterministic");

  const result = run(checker, validRoot);
  assert.equal(
    result.status,
    0,
    `valid signatures failed:\n${result.stdout}\n${result.stderr}`,
  );
} finally {
  await rm(validRoot, { recursive: true, force: true });
}

await expectSemanticFailure(
  "fr",
  { code: "AUTH_FORBIDDEN" },
  /code-token sequence differs/u,
);
await expectSemanticFailure(
  "de",
  { link: "../wrong/#mwp-tst-999" },
  /local-clause target sequence differs/u,
);
await expectSemanticFailure(
  "zh-cn",
  { link: "#mwp-tst-999" },
  /local-clause target sequence differs/u,
  { link: "#mwp-tst-001" },
);
await expectSemanticFailure(
  "fr",
  { link: "../wrong/#mwp-tst-999" },
  /local-clause target sequence differs/u,
  { linkKind: "reference" },
);
await expectSemanticFailure(
  "zh-tw",
  { link: "#mwp-tst-999" },
  /local-clause target sequence differs/u,
  { link: "#mwp-tst-001", linkKind: "expression" },
);
await expectSemanticFailure(
  "es",
  {
    sentence:
      "La implementación MUST conservar los valores de cable y rechaza la confianza del llamante.",
  },
  /BCP 14 keyword sequence differs/u,
);
await expectSemanticFailure(
  "ja",
  { exclusions: ["portable-log-proof-verification"] },
  /explicit exclusion sequence differs/u,
);
await expectGenerationFailure(
  "de",
  { id: "MWP-TST-002" },
  /explicit-exclusion clause MWP-TST-001 is missing/u,
);
await expectGenerationFailure(
  "fr",
  {
    duplicateLink: "../wrong/#mwp-tst-999",
    linkKind: "reference",
  },
  /duplicate Markdown link definition related-clause/u,
);
await expectSemanticFailure("fr", { level: "MUST" }, /clause level differs/u);
await expectLocaleOnlyDocumentFailure();
await expectArtifactFailure(
  { schemaVersion: 1 },
  /locale clause signatures have invalid structure/u,
);

console.log(
  "Locale clause signature tests passed deterministic generation, eleven semantic rejection cases, and malformed-artifact validation.",
);
