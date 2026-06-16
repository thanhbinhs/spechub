import { createSpecHubApiClient } from "@spechub/api-client";
import type { DeviceCategory, EntityResult } from "@spechub/api-client";

const apiFetch: typeof fetch = (input, init) =>
  fetch(input, { cache: "no-store", ...init });

export const api = createSpecHubApiClient({
  baseUrl:
    process.env.NEXT_PUBLIC_SPECHUB_API_URL ?? "http://localhost:4000/api/v1",
  fetcher: apiFetch,
});

export const queryKeys = {
  organizations: (params?: object) => ["organizations", params] as const,
  deviceCategories: (params?: object) => ["device-categories", params] as const,
  categoryTree: () => ["device-categories", "tree"] as const,
  productFamilies: (params?: object) => ["product-families", params] as const,
  deviceModels: (params?: object) => ["device-models", params] as const,
  deviceModel: (slug: string) => ["device-models", slug] as const,
  deviceVariants: (params?: object) => ["device-variants", params] as const,
  compare: (ids: string[]) => ["device-variants", "compare", ids] as const,
  chipsets: (params?: object) => ["chipsets", params] as const,
  search: (params?: object) => ["search", params] as const,
  aiAsk: (params?: object) => ["ai", "ask", params] as const,
  aiSearch: (params?: object) => ["ai", "search", params] as const,
  aiStats: () => ["ai", "embeddings", "stats"] as const,
};

export function categoryTreeData(
  result: EntityResult<DeviceCategory[]> | DeviceCategory[] | undefined,
) {
  if (!result) return [];
  return Array.isArray(result) ? result : result.data;
}
