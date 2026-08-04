import uiCopyData from "../data/normative/0.1/ui-copy.json";

export type NormativeLocale =
  "en" | "zh-CN" | "zh-TW" | "ja" | "es" | "fr" | "de";

export interface NormativeUiCopy {
  [key: string]: string | Record<string, string>;
  capabilities: Record<string, string>;
  reasons: Record<string, string>;
}

const localePrefixes: ReadonlyArray<readonly [string, NormativeLocale]> = [
  ["/zh-cn/", "zh-CN"],
  ["/zh-tw/", "zh-TW"],
  ["/ja/", "ja"],
  ["/es/", "es"],
  ["/fr/", "fr"],
  ["/de/", "de"],
];

export function localeForPathname(pathname: string): NormativeLocale {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return (
    localePrefixes.find(([prefix]) => normalized.startsWith(prefix))?.[1] ??
    "en"
  );
}

export function uiCopyForPathname(pathname: string): NormativeUiCopy {
  const locale = localeForPathname(pathname);
  return uiCopyData.locales[locale] as NormativeUiCopy;
}

export function localizedText(
  copy: NormativeUiCopy,
  key: string,
  values: Record<string, string | number> = {},
): string {
  const template = copy[key];
  if (typeof template !== "string") {
    throw new Error(`Missing localized UI string: ${key}`);
  }
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/gu, (_, name) => {
    if (!(name in values)) {
      throw new Error(`Missing localized UI value ${name} for ${key}`);
    }
    return String(values[name]);
  });
}
