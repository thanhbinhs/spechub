import type {
  DeviceModelSummary,
  DeviceVariantSummary,
} from "@spechub/api-client";
import { localizeDeviceCategory } from "@/lib/localize";

export type ResearchDevice = {
  modelId: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string | null;
  accent?: string | null;
  variantId?: string;
  variantName?: string;
};

export function toResearchDevice(
  model: DeviceModelSummary,
  selectedVariant?: DeviceVariantSummary,
): ResearchDevice {
  const variant =
    selectedVariant ??
    model.device_variants?.find((item) => item.is_default) ??
    model.device_variants?.[0];

  return {
    modelId: model.id,
    slug: model.slug,
    name: model.name,
    brand:
      model.product_family?.brand_org?.short_name ??
      model.product_family?.brand_org?.name ??
      "SpecHub",
    category: localizeDeviceCategory(model.product_family?.device_category),
    imageUrl: model.cover_image_url,
    accent: variant?.color_hex,
    variantId: variant?.id,
    variantName: variant?.variant_name,
  };
}
