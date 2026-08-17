import { createSpecHubApiClient } from "@spechub/api-client";
import type { DeviceCategory, EntityResult } from "@spechub/api-client";

const publicApiUrl =
  process.env.NEXT_PUBLIC_SPECHUB_API_URL ?? "http://localhost:4000/api/v1";
const internalApiUrl =
  process.env.SPECHUB_API_INTERNAL_URL ??
  publicApiUrl.replace("://localhost", "://127.0.0.1");

export const api = createSpecHubApiClient({
  baseUrl: typeof window === "undefined" ? internalApiUrl : publicApiUrl,
  fetcher: fetchWithApiRetry,
});

async function fetchWithApiRetry(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  const retryDelays =
    method === "GET" || method === "HEAD" ? [0, 250, 500, 1_000, 1_500] : [0];
  let lastError: unknown;

  for (const delay of retryDelays) {
    if (delay > 0) await wait(delay);
    try {
      return await fetch(input, { cache: "no-store", ...init });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

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
  recommendations: (params?: object) =>
    ["ai", "recommendations", params] as const,
  aiSearch: (params?: object) => ["ai", "search", params] as const,
  aiStats: () => ["ai", "embeddings", "stats"] as const,
};

export function categoryTreeData(
  result: EntityResult<DeviceCategory[]> | DeviceCategory[] | undefined,
) {
  if (!result) return [];
  return Array.isArray(result) ? result : result.data;
}
