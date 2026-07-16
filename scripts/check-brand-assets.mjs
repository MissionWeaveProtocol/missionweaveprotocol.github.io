import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const assets = new URL("../src/assets/", import.meta.url);
const publicDirectory = new URL("../public/", import.meta.url);
const publicPath = (name) => fileURLToPath(new URL(name, publicDirectory));

const canonicalIcon = await readFile(new URL("missionweave-icon.svg", assets));
const favicon = await readFile(new URL("favicon.svg", publicDirectory));
assert.deepEqual(
  favicon,
  canonicalIcon,
  "favicon.svg must match the canonical blue icon",
);

const expectedRasterSizes = new Map([
  ["apple-touch-icon.png", [180, 180]],
  ["icon-192.png", [192, 192]],
  ["icon-512.png", [512, 512]],
  ["og-image.png", [1200, 630]],
]);

for (const [name, [expectedWidth, expectedHeight]] of expectedRasterSizes) {
  const metadata = await sharp(publicPath(name)).metadata();
  assert.equal(metadata.format, "png", `${name} must be a PNG image`);
  assert.equal(
    metadata.width,
    expectedWidth,
    `${name} has an unexpected width`,
  );
  assert.equal(
    metadata.height,
    expectedHeight,
    `${name} has an unexpected height`,
  );
}

const socialCard = await readFile(
  new URL("og-image.svg", publicDirectory),
  "utf8",
);
assert.match(socialCard, /width="1200" height="630"/u);
assert.match(socialCard, />MissionWeave<\/text>/u);

const manifest = JSON.parse(
  await readFile(new URL("site.webmanifest", publicDirectory), "utf8"),
);
assert.equal(manifest.name, "MissionWeave");
assert.equal(manifest.start_url, ".");
assert.deepEqual(
  manifest.icons.map(({ sizes, type }) => ({ sizes, type })),
  [
    { sizes: "192x192", type: "image/png" },
    { sizes: "512x512", type: "image/png" },
  ],
);

console.log(
  `Brand assets passed ${expectedRasterSizes.size + 3} portable checks.`,
);
