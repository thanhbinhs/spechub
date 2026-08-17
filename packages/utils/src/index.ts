export type CurrencyFormatOptions = {
  currency?: string;
  fallback?: string;
  locale?: string;
  maximumFractionDigits?: number;
};

export type DateFormatOptions = {
  fallback?: string;
  locale?: string;
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
};

export function formatCurrency(
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = {},
) {
  if (value === undefined || value === null || value === "") {
    return options.fallback ?? "N/A";
  }

  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return options.fallback ?? "N/A";

  return new Intl.NumberFormat(options.locale ?? "en", {
    style: "currency",
    currency: options.currency ?? "USD",
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(amount);
}

export function formatDate(
  value: Date | string | null | undefined,
  options: DateFormatOptions = {},
) {
  if (!value) return options.fallback ?? "TBD";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return options.fallback ?? "TBD";

  return new Intl.DateTimeFormat(options.locale ?? "en", {
    year: "numeric",
    month: options.month ?? "short",
    day: "numeric",
  }).format(date);
}

export function toDisplayText(value: unknown, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Collapses visually identical whitespace before a value is persisted or
 * displayed.  This deliberately does not change the casing of unknown text:
 * product names and proprietary terms need to retain their official spelling.
 */
export function normalizeText(value: string): string;
export function normalizeText(
  value: string | null | undefined,
): string | undefined;
export function normalizeText(
  value: string | null | undefined,
): string | undefined {
  if (typeof value !== "string") return undefined;
  return value
    .normalize("NFKC")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Converts common Vietnamese and international number notation to a number. */
export function parseSpecificationNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== "string") return undefined;

  const compact = normalizeText(value)?.replace(/\s/g, "");
  if (!compact || !/^[+-]?\d[\d.,]*$/.test(compact)) return undefined;

  const sign = compact.startsWith("-") ? "-" : "";
  const unsigned = compact.replace(/^[+-]/, "");
  const commaCount = (unsigned.match(/,/g) ?? []).length;
  const dotCount = (unsigned.match(/\./g) ?? []).length;
  const lastComma = unsigned.lastIndexOf(",");
  const lastDot = unsigned.lastIndexOf(".");
  let normalized = unsigned;

  if (commaCount && dotCount) {
    const decimalIndex = Math.max(lastComma, lastDot);
    const decimal = unsigned[decimalIndex];
    const thousands = decimal === "," ? "." : ",";
    const integerPart = unsigned.slice(0, decimalIndex);
    const groupedInteger = new RegExp(`^\\d{1,3}(?:\\${thousands}\\d{3})+$`);
    if (integerPart.includes(thousands) && !groupedInteger.test(integerPart)) {
      return undefined;
    }
    normalized = unsigned
      .split("")
      .filter((character, index) => {
        return (
          (character !== "," && character !== ".") || index === decimalIndex
        );
      })
      .join("")
      .replace(decimal, ".");
  } else if (commaCount || dotCount) {
    const separator = commaCount ? "," : ".";
    const groups = unsigned.split(separator);
    const hasThousandsGrouping =
      groups.length > 1 &&
      groups.slice(1).every((group) => group.length === 3) &&
      groups[0].length <= 3;
    if (groups.length > 2 && !hasThousandsGrouping) return undefined;
    normalized = hasThousandsGrouping
      ? groups.join("")
      : `${groups.slice(0, -1).join("")}.${groups.at(-1)}`;
  }

  const parsed = Number(`${sign}${normalized}`);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Keeps the value accepted by an HTML number input in a canonical form. */
export function normalizeNumberInput(value: string): string {
  const parsed = parseSpecificationNumber(value);
  return parsed === undefined ? normalizeText(value) : String(parsed);
}

export function normalizeDisplayTechnology(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const key = normalized.toLocaleLowerCase("en").replace(/[\s_/-]+/g, " ");
  const known: Record<string, string> = {
    "ltpo oled": "LTPO OLED",
    oled: "OLED",
    amoled: "AMOLED",
    "super amoled": "Super AMOLED",
    "dynamic amoled": "Dynamic AMOLED",
    "ips lcd": "IPS LCD",
    lcd: "LCD",
    "mini led": "Mini LED",
    "micro led": "MicroLED",
  };
  return known[key] ?? normalized;
}

export function normalizeAspectRatio(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const match = normalized.match(
    /^(\d+(?:[.,]\d+)?)\s*(?::|\/|x|×)\s*(\d+(?:[.,]\d+)?)$/i,
  );
  return match
    ? `${match[1].replace(",", ".")}:${match[2].replace(",", ".")}`
    : normalized;
}

export function normalizeColorGamut(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const key = normalized.toLocaleLowerCase("en").replace(/[\s._-]+/g, " ");
  const known: Record<string, string> = {
    "dci p3": "DCI-P3",
    srgb: "sRGB",
    "adobe rgb": "Adobe RGB",
    "rec 2020": "Rec. 2020",
  };
  return known[key] ?? normalized;
}

export function normalizeHdrFormats(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const canonical = normalized
    .replace(/\s+(?:và|and)\s+/gi, ",")
    .split(/[,;|/]+/)
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item))
    .map((item) => {
      const key = item.toLocaleLowerCase("en").replace(/[\s._-]+/g, " ");
      if (/^hdr\s*10\s*\+$/.test(item)) return "HDR10+";
      if (/^hdr\s*10$/i.test(item)) return "HDR10";
      if (key === "dolby vision") return "Dolby Vision";
      if (key === "hlg") return "HLG";
      return item;
    });
  const unique = [...new Set(canonical)];
  const preferredOrder = ["HDR10", "HDR10+", "Dolby Vision", "HLG"];
  return [
    ...preferredOrder.filter((item) => unique.includes(item)),
    ...unique.filter((item) => !preferredOrder.includes(item)),
  ].join(", ");
}

export function normalizeAperture(value?: string | null) {
  const normalized = normalizeText(value)?.replace(/ƒ/g, "f");
  if (!normalized) return undefined;
  const match = normalized.match(/^f\s*\/?\s*(\d+(?:[.,]\d+)?)$/i);
  return match ? `f/${match[1].replace(",", ".")}` : normalized;
}

export function normalizeVideoCapabilities(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  return normalized
    .split(/[,;|]+/)
    .map((item) =>
      item
        .trim()
        .replace(/(\d+)\s*k\s*(?:@|\/|\s)?\s*(\d+)\s*fps\b/gi, "$1K $2 fps")
        .replace(/(\d{3,4})\s*p\s*(?:@|\/|\s)?\s*(\d+)\s*fps\b/gi, "$1p $2 fps")
        .replace(/\bfps\b/gi, "fps"),
    )
    .filter(Boolean)
    .join(", ");
}

export function normalizeChargingProtocol(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  return normalized
    .replace(/\busb\s*[-/]?\s*pd\s*\/?\s*pps\b/gi, "USB PD PPS")
    .replace(/\bpd\s*\/\s*pps\b/gi, "USB PD PPS")
    .replace(/\busb\s*[-/]?\s*pd\b/gi, "USB PD")
    .replace(/\bqi\s*2(?:\.0)?\b/gi, "Qi2")
    .replace(/\bqi\b/gi, "Qi");
}

export function normalizeIngressProtection(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  return normalized.replace(/\bip\s*([0-9]{2})\b/gi, "IP$1");
}

export function normalizeSimType(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  return normalized
    .replace(/\be\s*-?\s*sim\b/gi, "eSIM")
    .replace(/\bnano\s*-?\s*sim\b/gi, "Nano-SIM")
    .replace(/\bmicro\s*-?\s*sim\b/gi, "Micro-SIM")
    .replace(/\bmini\s*-?\s*sim\b/gi, "Mini-SIM");
}

export function normalizeCoolingType(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const key = normalized.toLocaleLowerCase("en").replace(/[\s_-]+/g, " ");
  const known: Record<string, string> = {
    vc: "Vapor chamber",
    "vapor chamber": "Vapor chamber",
    "vapour chamber": "Vapor chamber",
    passive: "Passive",
    fan: "Fan",
  };
  return known[key] ?? normalized;
}

export function normalizeHexColor(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const hex = normalized.startsWith("#") ? normalized : `#${normalized}`;
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : normalized;
}
