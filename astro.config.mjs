import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import {
  buildNormativeRedirects,
  buildNormativeSidebar,
} from "./scripts/lib/normative-routes.mjs";

const configuredBase = process.env.SITE_BASE;
const base =
  configuredBase === undefined || configuredBase === "" ? "/" : configuredBase;
const site = process.env.SITE_URL ?? "https://missionweaveprotocol.github.io";
const withBase = (path) => `${base === "/" ? "" : base}${path}`;
const absoluteAsset = (path) => new URL(withBase(path), site).href;
export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  redirects: buildNormativeRedirects(),
  integrations: [
    starlight({
      title: {
        en: "MissionWeaveProtocol",
        "zh-CN": "MissionWeaveProtocol",
        "zh-TW": "MissionWeaveProtocol",
        ja: "MissionWeaveProtocol",
        es: "MissionWeaveProtocol",
        fr: "MissionWeaveProtocol",
        de: "MissionWeaveProtocol",
      },
      description:
        "Group-oriented cooperation for autonomous agents inside one organization.",
      logo: {
        light: "./src/assets/missionweaveprotocol-icon.svg",
        dark: "./src/assets/missionweaveprotocol-icon-white.svg",
        alt: "MissionWeaveProtocol",
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      lastUpdated: true,
      locales: {
        root: { label: "English", lang: "en" },
        "zh-cn": { label: "简体中文", lang: "zh-CN" },
        "zh-tw": { label: "繁體中文", lang: "zh-TW" },
        ja: { label: "日本語", lang: "ja" },
        es: { label: "Español", lang: "es" },
        fr: { label: "Français", lang: "fr" },
        de: { label: "Deutsch", lang: "de" },
      },
      defaultLocale: "root",
      sidebar: buildNormativeSidebar(),
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/missionweaveprotocol",
        },
      ],
      head: [
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            href: withBase("/apple-touch-icon.png"),
          },
        },
        {
          tag: "link",
          attrs: { rel: "manifest", href: withBase("/site.webmanifest") },
        },
        {
          tag: "meta",
          attrs: { name: "theme-color", content: "#121826" },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: absoluteAsset("/og-image.png"),
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: absoluteAsset("/og-image.png"),
          },
        },
      ],
    }),
    sitemap(),
  ],
});
