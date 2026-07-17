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
      title: "MissionWeaveProtocol",
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
      sidebar: [
        {
          label: "Learn",
          items: [
            {
              label: "MissionWeaveProtocol 0.1",
              slug: "docs/0.1",
              badge: { text: "Draft", variant: "caution" },
            },
            { label: "Core model", slug: "docs/0.1/core-model" },
            { label: "Work lifecycle", slug: "docs/0.1/work-lifecycle" },
            { label: "Multi-Group scheduling", slug: "docs/0.1/scheduling" },
            {
              label: "Trust and authority",
              slug: "docs/0.1/trust-and-authority",
            },
            { label: "Child Missions", slug: "docs/0.1/child-missions" },
          ],
        },
        {
          label: "Build",
          items: [{ label: "Python SDK", slug: "sdk/python" }],
        },
        {
          label: "Reference",
          items: [
            {
              label: "Specification",
              slug: "reference/specification",
              badge: { text: "0.1", variant: "caution" },
            },
            { label: "Terminology", slug: "reference/terminology" },
            { label: "JSON Schemas", slug: "reference/schemas" },
            { label: "Conformance", slug: "reference/conformance" },
          ],
        },
        {
          label: "Community",
          items: [{ label: "Contribute and report", slug: "community" }],
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/missionweaveprotocol",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/missionweaveprotocol/missionweaveprotocol.github.io/edit/main/",
      },
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
