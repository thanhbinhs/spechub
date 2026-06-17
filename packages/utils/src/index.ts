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
