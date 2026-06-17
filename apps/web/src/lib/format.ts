import type {
  Currency,
  DeviceModelSummary,
  DeviceVariantSummary,
} from "@spechub/api-client";
import {
  formatCurrency,
  formatDate as formatSharedDate,
  toDisplayText,
} from "@spechub/utils";

export function primaryVariant(
  model?: DeviceModelSummary | null,
): DeviceVariantSummary | undefined {
  return (
    model?.device_variants?.find((variant) => variant.is_default) ??
    model?.device_variants?.[0]
  );
}

export function formatDate(value?: string | null) {
  return formatSharedDate(value, { fallback: "TBD", locale: "en" });
}

export function formatPrice(
  value?: string | number | null,
  currency?: Currency | null,
) {
  return formatCurrency(value, {
    currency: currency?.code ?? "USD",
    maximumFractionDigits: currency?.decimal_digits ?? 0,
  });
}

export function specText(value: unknown, fallback = "N/A") {
  return toDisplayText(value, fallback);
}
