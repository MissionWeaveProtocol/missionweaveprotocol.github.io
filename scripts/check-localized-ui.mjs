import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseRepositoryRoot(arguments_) {
  if (arguments_.length === 0) {
    return fileURLToPath(new URL("../", import.meta.url));
  }
  assert.deepEqual(
    arguments_.slice(0, 1),
    ["--repository-root"],
    "usage: check-localized-ui.mjs [--repository-root /absolute/path]",
  );
  assert.equal(arguments_.length, 2, "--repository-root requires one value");
  assert.equal(
    path.isAbsolute(arguments_[1]),
    true,
    "--repository-root must be absolute",
  );
  return path.resolve(arguments_[1]);
}

const repositoryRoot = parseRepositoryRoot(process.argv.slice(2));
const contentRoot = path.join(repositoryRoot, "src/content/docs");
const distRoot = path.join(repositoryRoot, "dist");
const localeAuthorities = [
  ["zh-cn", "zh-CN"],
  ["zh-tw", "zh-TW"],
  ["ja", "ja"],
  ["es", "es"],
  ["fr", "fr"],
  ["de", "de"],
];
const locales = localeAuthorities.map(([directory]) => directory);
const localeDataKeys = localeAuthorities.map(([, locale]) => locale);
const expectedGlossaryTermCount = 63;
const readerFacingProp = /\b(title|description|heading|label)="([^"]+)"/gu;
const allowedIdenticalProps = /^(?:TypeScript|Go|Rust|Java|C\+\+) SDK$/u;
const forbiddenRenderedEnglish = [
  "This context defines the language for organization-internal Missions",
  "Exact-commit public API inventory",
  "Download local JSON inventory",
  "Source commit:",
  "Package identity",
  "Required toolchain",
  "Documented commit",
  "Verify the installed package",
  "Normative release facts",
  "Normative evidence",
  "Runtime capability",
  "Evidence or boundary",
  "Expected-valid vector directory",
  "Expected-invalid vector directory",
  "Schema artifact",
  "Declared title",
  "Browse all",
  "Informative — not a protocol requirement",
  "Link to normative clause",
];
const forbiddenLocaleTerminology = new Map([
  [
    "zh-cn",
    /入学|入场|引脚|板条箱|键入|运输和装框|坚持与恢复|公共 API 库存|公开\s*API\s*库存|一致性表面|连接\s*JSON|本地预测|可重建预测|节点运行时|线路安全(?:错误|故障边界)|当前注册表|注册表证据|准入日志|录取|文物|前往\s*SDK/gu,
  ],
  [
    "zh-tw",
    /入學|入场|入場|引腳|板條箱|鍵入|運輸和裝框|堅持與恢復|公共 API 庫存|公開\s*API\s*庫存|一致性表面|連接\s*JSON|本地預測|節點運行時|線路安全(?:錯誤|故障邊界)|目前註冊表|註冊表證據|準入日誌|錄取|文物|前往\s*SDK/gu,
  ],
  [
    "ja",
    /入学|入場|輸送と額装|持続性と回復|入力された|ノード\s*ランタイム|ワイヤリングします|パブリック\s*クラスの問題|現在のレジストリ|レジストリの証拠|アドミッション\s*ログ|SDK\s*に行く|公開在庫\s*API|API\s*インベントリを公開する|受け入れ(?:バンドル|操作|プロファイル|ダイジェスト)|初回承認|暗号化(?:準拠|適合性|バンドル|ダイジェスト|ステージ|段階|検証|後|を介して|仕様)|検証と暗号化|プロトコル、暗号化|暗号化(?:と|および|や)アドミッション/gu,
  ],
  [
    "es",
    /confirmación exacta|confirmaciones exactas|caja exacta|raíz de (?:la )?caja|superficies? de conformidad|interfaz escrita|interfaces?[^\n.]*escritas?|resultados?[^\n.]*escritos?|evidencia escrita|admisión(?: y confianza histórica)? escritas?|rasgos? de registro|evidencia de registro|Transporte y enmarcado|Cable JSON|Errores seguros para cables|registro actual|registro de admisión|\bIr SDK\b|\bIr Primera|Ir al inventario público API|Comandos, eventos y pedidos|estados, pedidos, autorización|pedidos cruzados Group|lista negra de pedidos\s+pequeños/giu,
  ],
  [
    "fr",
    /\bbroches?\b|caisse exacte|racine de (?:la )?caisse|transport et encadrement|Transport et tramage|\bsaisies?\b|résultats?[^\n.]*tapés?|problèmes? de (?:classe|package)|(?:cryptographie|exécution) du nœud|offres? groupées?|caractéristiques? du registre|preuves du registre|règles de câblage canoniques|Problème d'exécution|Canoniques JSON|registre actuel|journal d'admission|\bAllez SDK\b|Aller à la référence d'exécution|Rendre l'inventaire API public|Commandes, événements et classement/giu,
  ],
  [
    "de",
    /\bBegehen\b|genaue Kiste|eingegebenen|Transport und Einrahmung|Beharrlichkeit und Genesung|Vorkaufsrecht|Bestellung|Verdauungsoberfläche|Eintrittspaket|Einlassbetrieb|Vernetzen Sie JSON|\b[Aa]utorisierend\p{L}*|Registrierungsnachweise|First Admission und Historical Trust|Knotenlaufzeit|Klassenproblem|Vorbelegung|Nachverfolgung von Grenzen|Alle installierten Header betreffen|aktuelle Registrierung|Zulassungsprotokoll|Gehen Sie zu SDK|Gehen Sie an die Börse/gu,
  ],
]);

async function collectFiles(directory, suffix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectFiles(candidate, suffix)));
    else if (entry.isFile() && candidate.endsWith(suffix))
      files.push(candidate);
  }
  return files.sort();
}

function propValues(source) {
  return [...source.matchAll(readerFacingProp)].map((match) => ({
    name: match[1],
    value: match[2],
  }));
}

const failures = [];

function normalizeText(value) {
  return value.trim().replace(/\s+/gu, " ");
}

function parseEnglishGlossary(source) {
  const lines = source.split(/\r?\n/u);
  const introduction = [];
  const sections = [];
  let currentSection;
  for (let index = 1; index < lines.length;) {
    const line = lines[index];
    if (line.trim().length === 0) {
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      currentSection = { title: line.slice(3), entries: [] };
      sections.push(currentSection);
      index += 1;
      continue;
    }
    const termMatch = line.match(/^\*\*(.+)\*\*:\s*$/u);
    if (!termMatch) {
      if (currentSection) {
        throw new Error(`unexpected context glossary line: ${line}`);
      }
      introduction.push(line.trim());
      index += 1;
      continue;
    }
    if (!currentSection) {
      throw new Error(`context glossary term has no section: ${termMatch[1]}`);
    }
    const block = [];
    index += 1;
    while (
      index < lines.length &&
      !lines[index].startsWith("## ") &&
      !/^\*\*(.+)\*\*:\s*$/u.test(lines[index])
    ) {
      if (lines[index].trim().length > 0) block.push(lines[index].trim());
      index += 1;
    }
    const avoidIndex = block.findIndex((entry) => entry.startsWith("_Avoid_:"));
    if (avoidIndex < 0) {
      throw new Error(`context glossary term lacks _Avoid_: ${termMatch[1]}`);
    }
    currentSection.entries.push({
      term: termMatch[1],
      description: block.slice(0, avoidIndex).join(" "),
      avoid: [
        block[avoidIndex].slice("_Avoid_:".length),
        ...block.slice(avoidIndex + 1),
      ]
        .join(" ")
        .trim(),
    });
  }
  return {
    introduction: introduction.join(" "),
    sections,
    entries: sections.flatMap((section) => section.entries),
  };
}

function stringLeaves(value, prefix = "") {
  const leaves = new Map();
  for (const [key, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") {
      leaves.set(childPath, child);
    } else if (child && typeof child === "object" && !Array.isArray(child)) {
      for (const [nestedPath, nestedValue] of stringLeaves(child, childPath)) {
        leaves.set(nestedPath, nestedValue);
      }
    } else {
      failures.push(`UI copy ${childPath} must be a string or string map`);
    }
  }
  return leaves;
}

function placeholders(template) {
  return [
    ...new Set(
      [...template.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/gu)].map(
        (match) => match[1],
      ),
    ),
  ].sort();
}

const contextSource = await readFile(
  path.join(repositoryRoot, "public/artifacts/0.1/protocol/CONTEXT.md"),
  "utf8",
);
const englishGlossary = parseEnglishGlossary(contextSource);
const glossaryData = JSON.parse(
  await readFile(
    path.join(
      repositoryRoot,
      "src/data/normative/0.1/context-glossary-locales.json",
    ),
    "utf8",
  ),
);
if (englishGlossary.entries.length !== expectedGlossaryTermCount) {
  failures.push(
    `English glossary must contain ${expectedGlossaryTermCount} terms; found ${englishGlossary.entries.length}`,
  );
}
if (glossaryData.sourceTermCount !== expectedGlossaryTermCount) {
  failures.push(
    `localized glossary sourceTermCount must be ${expectedGlossaryTermCount}; found ${glossaryData.sourceTermCount}`,
  );
}
if (
  JSON.stringify(Object.keys(glossaryData.locales ?? {}).sort()) !==
  JSON.stringify([...localeDataKeys].sort())
) {
  failures.push(
    `glossary locale key set differs: expected ${JSON.stringify([...localeDataKeys].sort())}, found ${JSON.stringify(Object.keys(glossaryData.locales ?? {}).sort())}`,
  );
}

for (const [, locale] of localeAuthorities) {
  const localized = glossaryData.locales?.[locale];
  if (!localized) {
    failures.push(`${locale} glossary data is missing`);
    continue;
  }
  if (localized.entries?.length !== expectedGlossaryTermCount) {
    failures.push(
      `${locale} glossary must contain ${expectedGlossaryTermCount} entries; found ${localized.entries?.length ?? 0}`,
    );
  }
  if (localized.sectionTitles?.length !== englishGlossary.sections.length) {
    failures.push(
      `${locale} glossary section count differs: expected ${englishGlossary.sections.length}, found ${localized.sectionTitles?.length ?? 0}`,
    );
  }
  if (
    !localized.introduction?.trim() ||
    normalizeText(localized.introduction) ===
      normalizeText(englishGlossary.introduction)
  ) {
    failures.push(`${locale} glossary introduction is empty or English`);
  }
  for (let index = 0; index < englishGlossary.sections.length; index += 1) {
    const localizedTitle = localized.sectionTitles?.[index];
    if (
      !localizedTitle?.trim() ||
      normalizeText(localizedTitle) ===
        normalizeText(englishGlossary.sections[index].title)
    ) {
      failures.push(
        `${locale} glossary section ${index + 1} title is empty or English`,
      );
    }
  }
  const comparableCount = Math.min(
    englishGlossary.entries.length,
    localized.entries?.length ?? 0,
  );
  for (let index = 0; index < comparableCount; index += 1) {
    const english = englishGlossary.entries[index];
    const translated = localized.entries[index];
    if (translated?.term !== english.term) {
      failures.push(
        `${locale} glossary term ${index + 1} must be ${JSON.stringify(english.term)}; found ${JSON.stringify(translated?.term)}`,
      );
    }
    for (const field of ["description", "avoid"]) {
      if (!translated?.[field]?.trim()) {
        failures.push(`${locale} glossary ${english.term} ${field} is empty`);
      } else if (
        normalizeText(translated[field]) === normalizeText(english[field])
      ) {
        failures.push(
          `${locale} glossary ${english.term} ${field} is identical to English`,
        );
      }
    }
  }
}

const uiCopyData = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "src/data/normative/0.1/ui-copy.json"),
    "utf8",
  ),
);
const navigationSource = await readFile(
  path.join(repositoryRoot, "src/data/normative/0.1/navigation.json"),
  "utf8",
);
const englishUiLeaves = stringLeaves(uiCopyData.locales?.en ?? {});
const expectedUiLocaleKeys = ["en", ...localeDataKeys].sort();
if (
  JSON.stringify(Object.keys(uiCopyData.locales ?? {}).sort()) !==
  JSON.stringify(expectedUiLocaleKeys)
) {
  failures.push(
    `UI locale key set differs: expected ${JSON.stringify(expectedUiLocaleKeys)}, found ${JSON.stringify(Object.keys(uiCopyData.locales ?? {}).sort())}`,
  );
}
const sdkRuntimeMatrix = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "src/data/normative/0.1/sdk-runtime-matrix.json"),
    "utf8",
  ),
);
const matrixRows = sdkRuntimeMatrix.sdks.flatMap((sdk) => [
  ...sdk.implemented,
  ...sdk.deploymentAdapters,
  ...sdk.notImplemented,
]);
const matrixCapabilityIds = [
  ...new Set(matrixRows.map((row) => row.capability)),
].sort();
const uiCapabilityIds = Object.keys(
  uiCopyData.locales?.en?.capabilities ?? {},
).sort();
if (
  /digest verification/iu.test(
    uiCopyData.locales?.en?.capabilities?.["embedded-protocol-bundles"] ?? "",
  )
) {
  failures.push(
    "embedded-protocol-bundles must not claim digest verification for every SDK",
  );
}
for (const capability of matrixCapabilityIds.filter(
  (id) => !uiCapabilityIds.includes(id),
)) {
  failures.push(`SDK matrix capability ${capability} is missing from UI copy`);
}
for (const capability of uiCapabilityIds.filter(
  (id) => !matrixCapabilityIds.includes(id),
)) {
  failures.push(`UI copy capability ${capability} is absent from SDK matrix`);
}
const matrixReasonIds = [
  ...new Set(
    matrixRows
      .filter((row) => row.reason !== undefined)
      .map((row) => row.capability),
  ),
].sort();
const uiReasonIds = Object.keys(uiCopyData.locales?.en?.reasons ?? {}).sort();
if (JSON.stringify(matrixReasonIds) !== JSON.stringify(uiReasonIds)) {
  failures.push(
    `SDK matrix reason key set differs from UI copy: matrix=${JSON.stringify(matrixReasonIds)} UI=${JSON.stringify(uiReasonIds)}`,
  );
}
for (const row of matrixRows) {
  const englishLabel = uiCopyData.locales?.en?.capabilities?.[row.capability];
  if (englishLabel !== undefined && row.label !== englishLabel) {
    failures.push(
      `SDK matrix capability ${row.capability} label differs from canonical English UI copy`,
    );
  }
  if (row.reason !== undefined) {
    const englishReason = uiCopyData.locales?.en?.reasons?.[row.capability];
    if (englishReason !== undefined && row.reason !== englishReason) {
      failures.push(
        `SDK matrix capability ${row.capability} reason differs from canonical English UI copy`,
      );
    }
  }
}
for (const [, locale] of localeAuthorities) {
  const localizedUi = uiCopyData.locales?.[locale];
  if (!localizedUi) {
    failures.push(`${locale} UI copy is missing`);
    continue;
  }
  const localizedLeaves = stringLeaves(localizedUi);
  const englishPaths = [...englishUiLeaves.keys()].sort();
  const localizedPaths = [...localizedLeaves.keys()].sort();
  if (JSON.stringify(localizedPaths) !== JSON.stringify(englishPaths)) {
    failures.push(`${locale} UI copy key set differs from English`);
  }
  for (const [key, englishTemplate] of englishUiLeaves) {
    const localizedTemplate = localizedLeaves.get(key);
    if (localizedTemplate === undefined) continue;
    if (
      JSON.stringify(placeholders(localizedTemplate)) !==
      JSON.stringify(placeholders(englishTemplate))
    ) {
      failures.push(
        `${locale} ${key} placeholder set differs from English: expected ${JSON.stringify(placeholders(englishTemplate))}, found ${JSON.stringify(placeholders(localizedTemplate))}`,
      );
    }
  }
}

const englishFiles = await collectFiles(path.join(contentRoot, "0.1"), ".mdx");
for (const englishFile of englishFiles) {
  const relative = path.relative(path.join(contentRoot, "0.1"), englishFile);
  const englishProps = propValues(await readFile(englishFile, "utf8"));
  for (const locale of locales) {
    const localizedFile = path.join(contentRoot, locale, "0.1", relative);
    const localizedProps = propValues(await readFile(localizedFile, "utf8"));
    assert.equal(
      localizedProps.length,
      englishProps.length,
      `${locale}/0.1/${relative}: reader-facing prop count differs`,
    );
    for (let index = 0; index < englishProps.length; index += 1) {
      const english = englishProps[index];
      const localized = localizedProps[index];
      assert.equal(
        localized.name,
        english.name,
        `${locale}/0.1/${relative}: reader-facing prop order differs`,
      );
      if (
        localized.value === english.value &&
        !allowedIdenticalProps.test(localized.value)
      ) {
        failures.push(
          `${locale}/0.1/${relative}: untranslated ${localized.name} prop ${JSON.stringify(localized.value)}`,
        );
      }
    }
  }
}

for (const [locale, localeDataKey] of localeAuthorities) {
  const localizedFiles = await collectFiles(
    path.join(contentRoot, locale, "0.1"),
    ".mdx",
  );
  const localizedSources = [
    ...(await Promise.all(
      localizedFiles.map(async (file) => ({
        contents: await readFile(file, "utf8"),
        label: path.relative(repositoryRoot, file),
      })),
    )),
    {
      contents: JSON.stringify(uiCopyData.locales?.[localeDataKey] ?? {}),
      label: `src/data/normative/0.1/ui-copy.json#${localeDataKey}`,
    },
    {
      contents: JSON.stringify(glossaryData.locales?.[localeDataKey] ?? {}),
      label: `src/data/normative/0.1/context-glossary-locales.json#${localeDataKey}`,
    },
    {
      contents: navigationSource,
      label: "src/data/normative/0.1/navigation.json",
    },
  ];
  const retiredPattern = forbiddenLocaleTerminology.get(locale);
  for (const source of localizedSources) {
    retiredPattern.lastIndex = 0;
    for (const match of source.contents.matchAll(retiredPattern)) {
      failures.push(
        `${locale}/${source.label}: retired localized terminology ${JSON.stringify(match[0])}`,
      );
    }
  }

  const htmlRoot = path.join(distRoot, locale);
  const htmlFiles = await collectFiles(htmlRoot, ".html");
  const rendered = (
    await Promise.all(htmlFiles.map((file) => readFile(file, "utf8")))
  ).join("\n");
  for (const phrase of forbiddenRenderedEnglish) {
    if (rendered.includes(phrase)) {
      failures.push(
        `${locale}: rendered localized HTML contains ${JSON.stringify(phrase)}`,
      );
    }
  }
  if (
    /support-status--(?:implemented|not-implemented|deployment-adapter-required)">(?:Implemented|Not implemented|Deployment adapter required)<\/span>/u.test(
      rendered,
    )
  ) {
    failures.push(
      `${locale}: rendered localized HTML contains English SDK support labels`,
    );
  }
  if (/<strong>Avoid:<\/strong>/u.test(rendered)) {
    failures.push(
      `${locale}: rendered localized glossary contains the English Avoid label`,
    );
  }
}

if (failures.length > 0) {
  console.error("Localized UI violations:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Localized UI passed ${expectedGlossaryTermCount}-term glossary, UI placeholders, reader-facing props, and rendered component copy for ${locales.length} normative authorities.`,
);
