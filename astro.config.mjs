import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

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
  integrations: [
    starlight({
      title: {
        en: "MissionWeaveProtocol",
        "zh-CN": "MissionWeaveProtocol",
        ja: "MissionWeaveProtocol",
        es: "MissionWeaveProtocol",
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
        ja: { label: "日本語", lang: "ja" },
        es: { label: "Español", lang: "es" },
        de: { label: "Deutsch", lang: "de" },
      },
      defaultLocale: "root",
      sidebar: [
        {
          label: "Learn",
          translations: {
            "zh-CN": "学习",
            ja: "学ぶ",
            es: "Aprender",
            de: "Lernen",
          },
          items: [
            {
              label: "MissionWeaveProtocol 0.1",
              slug: "docs/0.1",
              badge: {
                text: {
                  en: "Draft",
                  "zh-CN": "草案",
                  ja: "ドラフト",
                  es: "Borrador",
                  de: "Entwurf",
                },
                variant: "caution",
              },
            },
            {
              label: "Core model",
              translations: {
                "zh-CN": "核心模型",
                ja: "コアモデル",
                es: "Modelo central",
                de: "Kernmodell",
              },
              slug: "docs/0.1/core-model",
            },
            {
              label: "Work lifecycle",
              translations: {
                "zh-CN": "工作生命周期",
                ja: "作業ライフサイクル",
                es: "Ciclo de trabajo",
                de: "Arbeitslebenszyklus",
              },
              slug: "docs/0.1/work-lifecycle",
            },
            {
              label: "Multi-Group scheduling",
              translations: {
                "zh-CN": "多 Group 调度",
                ja: "複数 Group のスケジューリング",
                es: "Planificación entre múltiples Group",
                de: "Planung über mehrere Group",
              },
              slug: "docs/0.1/scheduling",
            },
            {
              label: "Trust and authority",
              translations: {
                "zh-CN": "信任与权限",
                ja: "信頼と権限",
                es: "Confianza y autoridad",
                de: "Vertrauen und Autorität",
              },
              slug: "docs/0.1/trust-and-authority",
            },
            {
              label: "Child Missions",
              translations: {
                "zh-CN": "子 Mission",
                ja: "子 Mission",
                es: "Mission secundarias",
                de: "Child Mission",
              },
              slug: "docs/0.1/child-missions",
            },
          ],
        },
        {
          label: "Build",
          translations: {
            "zh-CN": "构建",
            ja: "構築",
            es: "Desarrollo",
            de: "Entwickeln",
          },
          items: [{ label: "Python SDK", slug: "sdk/python" }],
        },
        {
          label: "Reference",
          translations: {
            "zh-CN": "参考",
            ja: "リファレンス",
            es: "Referencia",
            de: "Referenz",
          },
          items: [
            {
              label: "Specification",
              translations: {
                "zh-CN": "规范",
                ja: "仕様",
                es: "Especificación",
                de: "Spezifikation",
              },
              slug: "reference/specification",
              badge: { text: "0.1", variant: "caution" },
            },
            {
              label: "Terminology",
              translations: {
                "zh-CN": "术语",
                ja: "用語",
                es: "Terminología",
                de: "Terminologie",
              },
              slug: "reference/terminology",
            },
            { label: "JSON Schemas", slug: "reference/schemas" },
            {
              label: "Conformance",
              translations: {
                "zh-CN": "一致性",
                ja: "適合性",
                es: "Conformidad",
                de: "Konformität",
              },
              slug: "reference/conformance",
            },
          ],
        },
        {
          label: "Community",
          translations: {
            "zh-CN": "社区",
            ja: "コミュニティ",
            es: "Comunidad",
            de: "Community",
          },
          items: [
            {
              label: "Contribute and report",
              translations: {
                "zh-CN": "贡献与报告",
                ja: "貢献と報告",
                es: "Contribuir e informar",
                de: "Mitwirken und melden",
              },
              slug: "community",
            },
          ],
        },
      ],
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
