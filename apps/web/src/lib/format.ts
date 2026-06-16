import type {
  Currency,
  DeviceModelSummary,
  DeviceVariantSummary,
} from "@spechub/api-client";

export function primaryVariant(
  model?: DeviceModelSummary | null,
): DeviceVariantSummary | undefined {
  return (
    model?.device_variants?.find((variant) => variant.is_default) ??
    model?.device_variants?.[0]
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatPrice(
  value?: string | number | null,
  currency?: Currency | null,
) {
  if (value === undefined || value === null) return "N/A";
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return "N/A";

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency?.code ?? "USD",
    maximumFractionDigits: currency?.decimal_digits ?? 0,
  }).format(amount);
}

export function specText(value: unknown, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
