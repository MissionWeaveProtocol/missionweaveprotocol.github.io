import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const assets = new URL("../src/assets/", import.meta.url);
const publicDirectory = new URL("../public/", import.meta.url);
const outputPath = (name) => fileURLToPath(new URL(name, publicDirectory));

await mkdir(publicDirectory, { recursive: true });

const blueIcon = await readFile(
  new URL("missionweaveprotocol-icon.svg", assets),
);
const whiteIcon = await readFile(
  new URL("missionweaveprotocol-icon-white.svg", assets),
);

await writeFile(new URL("favicon.svg", publicDirectory), blueIcon);

await Promise.all([
  sharp(blueIcon)
    .resize(180, 180)
    .png()
    .toFile(outputPath("apple-touch-icon.png")),
  sharp(blueIcon).resize(192, 192).png().toFile(outputPath("icon-192.png")),
  sharp(blueIcon).resize(512, 512).png().toFile(outputPath("icon-512.png")),
]);

const embeddedIcon = whiteIcon.toString("base64");
const socialCard = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F7F9FC"/>
  <path d="M820 0H1200V630H740C850 522 899 398 889 259C882 163 859 76 820 0Z" fill="#EAF0FC"/>
  <path d="M925 0C971 115 992 227 987 336C983 449 953 547 898 630" fill="none" stroke="#C9D8F5" stroke-width="2"/>
  <rect x="80" y="78" width="148" height="148" rx="36" fill="#2F6FDB"/>
  <image x="80" y="78" width="148" height="148" href="data:image/svg+xml;base64,${embeddedIcon}"/>
  <text x="80" y="350" fill="#121826" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="700" letter-spacing="-2">MissionWeaveProtocol</text>
  <text x="84" y="418" fill="#465269" font-family="Arial, Helvetica, sans-serif" font-size="34">Accountable cooperation for autonomous agents.</text>
  <line x1="84" y1="494" x2="1116" y2="494" stroke="#D8DEE9" stroke-width="2"/>
  <text x="84" y="554" fill="#2F6FDB" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="1.5">MISSION GROUPS  ·  EXPLICIT WORK  ·  HUMAN APPROVAL</text>
</svg>`.trim();

await writeFile(new URL("og-image.svg", publicDirectory), `${socialCard}\n`);
await sharp(Buffer.from(socialCard)).png().toFile(outputPath("og-image.png"));

const manifest = {
  name: "MissionWeaveProtocol",
  short_name: "MissionWeaveProtocol",
  description:
    "Group-oriented cooperation for autonomous agents inside one organization.",
  start_url: ".",
  display: "standalone",
  background_color: "#F7F9FC",
  theme_color: "#121826",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
  ],
};

await writeFile(
  new URL("site.webmanifest", publicDirectory),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
