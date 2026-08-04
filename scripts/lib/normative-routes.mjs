import navigationDocument from "../../src/data/normative/0.1/navigation.json" with { type: "json" };
import routesDocument from "../../src/data/normative/0.1/routes.json" with { type: "json" };

export const localeDefinitions = [
  { directory: "", key: "en", starlight: "en" },
  { directory: "zh-cn", key: "zh-cn", starlight: "zh-CN" },
  { directory: "zh-tw", key: "zh-tw", starlight: "zh-TW" },
  { directory: "ja", key: "ja", starlight: "ja" },
  { directory: "es", key: "es", starlight: "es" },
  { directory: "fr", key: "fr", starlight: "fr" },
  { directory: "de", key: "de", starlight: "de" },
];

export const routeManifest = routesDocument;
export const navigationManifest = navigationDocument;

const localizedPath = (directory, routePath) =>
  directory === "" ? routePath : `/${directory}${routePath}`;

const translationsFor = (labels) =>
  Object.fromEntries(
    localeDefinitions
      .filter(({ directory }) => directory !== "")
      .map(({ key, starlight }) => [starlight, labels[key]]),
  );

const addRedirect = (redirects, source, destination) => {
  if (source === destination) return;
  if (redirects[source] && redirects[source] !== destination) {
    throw new Error(
      `Conflicting normative redirects for ${source}: ${redirects[source]} and ${destination}`,
    );
  }
  redirects[source] = destination;
};

export const buildNormativeRedirects = () => {
  const redirects = {};
  for (const route of routesDocument.routes) {
    for (const { directory } of localeDefinitions) {
      const destination = localizedPath(directory, route.versioned);
      addRedirect(
        redirects,
        localizedPath(directory, route.latest),
        destination,
      );
      for (const legacyPath of route.legacy) {
        addRedirect(
          redirects,
          localizedPath(directory, legacyPath),
          destination,
        );
      }
    }
  }
  return redirects;
};

const routeById = new Map(
  routesDocument.routes.map((route) => [route.id, route]),
);

const convertItem = (item) => {
  if (item.route) {
    const route = routeById.get(item.route);
    if (!route) throw new Error(`Unknown navigation route ${item.route}`);
    const converted = {
      label: item.labels.en,
      translations: translationsFor(item.labels),
      slug: route.versioned.replace(/^\//, "").replace(/\/$/, ""),
    };
    if (item.badge) {
      converted.badge = {
        text: Object.fromEntries(
          localeDefinitions.map(({ key, starlight }) => [
            starlight,
            navigationDocument.badge.labels[key],
          ]),
        ),
        variant: navigationDocument.badge.variant,
      };
    }
    return converted;
  }

  if (item.slug) {
    return {
      label: item.labels.en,
      translations: translationsFor(item.labels),
      slug: item.slug,
    };
  }

  return {
    label: item.labels.en,
    translations: translationsFor(item.labels),
    items: item.items.map(convertItem),
  };
};

export const buildNormativeSidebar = () =>
  navigationDocument.groups.map((group) => ({
    label: group.labels.en,
    translations: translationsFor(group.labels),
    items: group.items.map(convertItem),
  }));
