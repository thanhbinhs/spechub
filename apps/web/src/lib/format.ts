import type {
  Currency,
  DeviceModelSummary,
  DeviceVariantSummary,
} from "@spechub/api-client";
import {
  formatCurrency,
  formatDate as formatSharedDate,
  normalizeAperture,
  normalizeChargingProtocol,
  normalizeColorGamut,
  normalizeDisplayTechnology,
  normalizeHdrFormats,
  normalizeIngressProtection,
  normalizeSimType,
  normalizeText,
  parseSpecificationNumber,
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
  return formatSharedDate(value, { fallback: "Chưa xác định", locale: "vi" });
}

export function formatPrice(
  value?: string | number | null,
  currency?: Currency | null,
) {
  return formatCurrency(value, {
    currency: currency?.code ?? "USD",
    maximumFractionDigits: currency?.decimal_digits ?? 0,
    fallback: "Chưa có",
    locale: "vi",
  });
}

export function specText(value: unknown, fallback = "Chưa có") {
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "string") return normalizeText(value) || fallback;
  return toDisplayText(value, fallback);
}

export function formatSpecNumber(value: unknown, maximumFractionDigits = 2) {
  const numeric = parseSpecificationNumber(value);
  if (numeric === undefined) return undefined;
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(
    numeric,
  );
}

export function formatMeasurement(
  value: unknown,
  unit: string,
  maximumFractionDigits = 2,
) {
  const numeric = formatSpecNumber(value, maximumFractionDigits);
  if (numeric === undefined) return undefined;
  return unit === "°" ? `${numeric}°` : `${numeric} ${unit}`;
}

export function formatScreenSize(value: unknown) {
  const numeric = formatSpecNumber(value, 2);
  return numeric === undefined ? undefined : `${numeric}″`;
}

export function formatResolution(width: unknown, height: unknown) {
  const horizontal = formatSpecNumber(width, 0);
  const vertical = formatSpecNumber(height, 0);
  return horizontal && vertical ? `${horizontal} × ${vertical} px` : undefined;
}

export function formatDimensions(
  values: readonly unknown[],
  unit: string,
  maximumFractionDigits = 2,
) {
  const dimensions = values
    .map((value) => formatSpecNumber(value, maximumFractionDigits))
    .filter((value): value is string => Boolean(value));
  return dimensions.length ? `${dimensions.join(" × ")} ${unit}` : undefined;
}

export function formatAperture(value: unknown) {
  return typeof value === "string" ? normalizeAperture(value) : undefined;
}

export function formatIngressProtection(value: unknown) {
  return typeof value === "string"
    ? normalizeIngressProtection(value)
    : undefined;
}

export function formatDisplayTechnology(value: unknown) {
  return typeof value === "string"
    ? normalizeDisplayTechnology(value)
    : undefined;
}

export function formatColorGamut(value: unknown) {
  return typeof value === "string" ? normalizeColorGamut(value) : undefined;
}

export function formatHdrFormats(value: unknown) {
  return typeof value === "string" ? normalizeHdrFormats(value) : undefined;
}

export function formatChargingProtocol(value: unknown) {
  return typeof value === "string"
    ? normalizeChargingProtocol(value)
    : undefined;
}

export function formatSimType(value: unknown) {
  return typeof value === "string" ? normalizeSimType(value) : undefined;
}
