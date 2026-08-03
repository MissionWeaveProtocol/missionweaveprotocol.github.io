import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const dataRoot = path.join(repositoryRoot, "src/data/normative/0.1");

async function readJson(name) {
  return JSON.parse(await readFile(path.join(dataRoot, name), "utf8"));
}

const expectedLocales = ["en", "zh-CN", "zh-TW", "ja", "es", "fr", "de"];
const expectedSdks = {
  python: "9403cf1310914670506c56cbab363fdaa465d3cc",
  typescript: "6d53ebfcf8350ae81d89fd818611b07f7373685c",
  go: "80c39852e8a2053ac761b8d53d62483264f803f1",
  rust: "2727f8777737265d98dde4ceaca306612ef54c52",
  java: "3b2798c21d906c81887c54fe80e5bca8a19ddac7",
  cpp: "481b0ce3a65c1f2265935318b54481ece5032fdf",
};
const expectedSdkRepositories = {
  python: "https://github.com/MissionWeaveProtocol/python-sdk",
  typescript: "https://github.com/MissionWeaveProtocol/typescript-sdk",
  go: "https://github.com/MissionWeaveProtocol/go-sdk",
  rust: "https://github.com/MissionWeaveProtocol/rust-sdk",
  java: "https://github.com/MissionWeaveProtocol/java-sdk",
  cpp: "https://github.com/MissionWeaveProtocol/cpp-sdk",
};
const expectedKeywords = [
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
];

const release = await readJson("release-source.json");
assert.equal(release.releaseId, "missionweaveprotocol-0.1");
assert.equal(release.status, "draft-standard");
assert.equal(release.protocolVersion, "0.1");
assert.equal(
  release.contentDigestAlgorithm,
  "missionweaveprotocol.built-html-tree-sha256.v1",
);
assert.equal(
  release.repository,
  "https://github.com/missionweaveprotocol/missionweaveprotocol",
);
assert.equal(
  release.protocolCommit,
  "f7e70a72c76bbeb5014c186cd820aac2112f0dde",
);
assert.equal(release.wireNamespace, "missionweaveprotocol");
assert.equal(
  release.protocolPinSha256,
  "bfb11b76a989b9949844d3380c3b01cefcde6c01259167b922b6f30d151bac31",
);
assert.equal(
  release.protocolBundleSha256,
  "c95fc8f8334947dacf51a2c6e84d9b13f5b39b7d3827591569a1e2c5acfe47d7",
);
assert.deepEqual(release.locales, expectedLocales);
assert.deepEqual(release.sdks, expectedSdks);
assert.deepEqual(release.sdkRepositories, expectedSdkRepositories);
assert.deepEqual(release.schemas, { count: 22 });
assert.deepEqual(release.structural, { total: 58, valid: 27, invalid: 31 });
assert.deepEqual(release.cryptography, {
  sourceCommit: release.protocolCommit,
  profile: "missionweaveprotocol.signed-document-verification.v0.1",
  manifestVersion: 1,
  artifacts: 98,
  cases: 22,
  evaluations: 62,
  complete: 12,
  rejected: 50,
  digest:
    "sha256:5eade516e4bc5dcf04477727ebcccd11f33348b2d9135fb6fe0365c6e6cc2ea3",
});
assert.deepEqual(release.admission, {
  sourceCommit: release.protocolCommit,
  manifestVersion: 1,
  artifacts: 19,
  cases: 5,
  evaluations: 30,
  complete: 12,
  rejected: 18,
  profile: "missionweaveprotocol.first-admission-historical-trust.v0.1",
  cryptographyDigest: release.cryptography.digest,
  digest:
    "sha256:39971bfafb68ef6c18f9026220cccc4f023fd4d5c8074f8ff0276cb1129cd0a0",
});
assert.equal("websiteCommit" in release, false);
assert.equal("contentDigests" in release, false);

const artifacts = await readJson("artifacts.json");
assert.equal(artifacts.protocolCommit, release.protocolCommit);
assert.equal(artifacts.publicBase, "/artifacts/0.1/protocol/");
assert.deepEqual(artifacts.protocolPin, {
  sha256: release.protocolPinSha256,
  bundleSha256: release.protocolBundleSha256,
});
assert.deepEqual(artifacts.context, {
  path: "CONTEXT.md",
  byteLength: 12330,
  sha256:
    "sha256:a16b598f4254545952b6c043e11f505cb14b58bb6a09797b14b15e1bd0e3b31a",
});
assert.deepEqual(artifacts.specification, {
  path: "spec/PROTOCOL.md",
  byteLength: 83039,
  sha256:
    "sha256:9c7297a1d2973652641efe43ca352830d2dbd69b1782ef15c22e2470f105d235",
});
assert.deepEqual(artifacts.schemas, {
  path: "schemas/",
  files: 22,
  digest:
    "sha256:941a5a19b8664207f1ff48b799219c2f981ecd491a5cca527d586028d976ec76",
});
assert.deepEqual(artifacts.structural, {
  path: "conformance/",
  files: 59,
  vectors: 58,
  valid: 27,
  invalid: 31,
  digest:
    "sha256:2362acd8345e5860e605ed06984f1673a1ea0a00e76c1fe00fed222326782f24",
});
assert.deepEqual(artifacts.cryptography, {
  path: "cryptography/",
  manifest: "cryptography/manifest.json",
  manifestSha256:
    "sha256:314f05d7aafee0d23654411c2f709b360cfde62a0079f654ae7ac01e105bdd16",
  artifacts: release.cryptography.artifacts,
  digest: release.cryptography.digest,
});
assert.deepEqual(artifacts.admission, {
  path: "admission/",
  manifest: "admission/manifest.json",
  manifestSha256:
    "sha256:140f75fed9ae4c9c180d6055b28ede99fe5c35eedbe7d22016c8022df50b6065",
  artifacts: release.admission.artifacts,
  digest: release.admission.digest,
});
assert.deepEqual(artifacts.bundle, {
  files: 194,
  digest:
    "sha256:95a16adaab17df2626db0f35b470723558637fc496840ddd837ce68fbe234875",
});

const terminology = await readJson("terminology.json");
assert.equal(terminology.protocolVersion, release.protocolVersion);
assert.deepEqual(terminology.normativeKeywords, expectedKeywords);
assert.deepEqual(terminology.locales, expectedLocales);
assert.deepEqual(terminology.wireTerms, [
  "Agent",
  "Mission",
  "Group",
  "WorkItem",
  "Command",
  "Event",
  "Registry",
  "Admission Log",
  "First-Admission Record",
]);
for (const locale of expectedLocales) {
  const labels = terminology.labels[locale];
  assert.equal(typeof labels.normative, "string");
  assert.ok(labels.normative.length > 0);
  assert.equal(typeof labels.informativeExample, "string");
  assert.ok(labels.informativeExample.length > 0);
  assert.equal(typeof labels.implementationNote, "string");
  assert.ok(labels.implementationNote.length > 0);
}

console.log(
  `Normative release source passed for protocol ${release.protocolCommit}, ${expectedLocales.length} locales, and ${Object.keys(expectedSdks).length} SDKs.`,
);
