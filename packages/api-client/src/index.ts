export type PaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  query?: string | null;
  source?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type EntityResult<T> = {
  data: T;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  short_name?: string | null;
  logo_url?: string | null;
  description?: string | null;
};

export type DeviceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_category_id?: string | null;
  children?: DeviceCategory[];
};

export type ProductFamily = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  first_release_year?: number | null;
  brand_org?: Organization;
  brand?: Organization;
  device_category?: DeviceCategory;
};

export type Currency = {
  id?: number;
  code: string;
  symbol?: string | null;
  decimal_digits?: number;
};

export type ReleaseStatus = {
  id: number;
  code: string;
  name: string;
};

export type DeviceModelSummary = {
  id: string;
  product_family_id?: string;
  name: string;
  slug: string;
  description?: string | null;
  cover_image_url?: string | null;
  announcement_date?: string | null;
  release_date?: string | null;
  generation_label?: string | null;
  product_family?: ProductFamily & {
    brand_org?: Organization;
    device_category?: DeviceCategory;
  };
  release_status?: ReleaseStatus;
  device_variants?: DeviceVariantSummary[];
  _count?: {
    device_variants?: number;
  };
};

export type Chipset = {
  id: string;
  name: string;
  slug: string;
  chip_kind?: string;
  model_code?: string | null;
  integrated_5g?: boolean | null;
  max_ram_gb?: number | null;
  manufacturer?: Organization;
};

export type DisplayUnit = {
  id: string;
  name?: string | null;
  slug?: string | null;
  size_inch?: string | number | null;
  resolution_width?: number | null;
  resolution_height?: number | null;
  refresh_rate_hz?: number | null;
  brightness_peak_nits?: number | null;
  hdr_formats?: string | null;
  display_technology?: {
    name: string;
    slug: string;
  };
};

export type BatteryUnit = {
  id: string;
  name?: string | null;
  slug?: string | null;
  capacity_mah: number;
  energy_wh?: string | number | null;
  wired_charging_w?: number | null;
  wireless_charging_w?: number | null;
  removable?: boolean;
};

export type DeviceVariantSummary = {
  id: string;
  device_model_id?: string;
  variant_name: string;
  sku_code?: string | null;
  market_name?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  launch_date?: string | null;
  launch_price?: string | number | null;
  is_default?: boolean;
  currency?: Currency | null;
  release_status?: ReleaseStatus;
  device_model?: DeviceModelSummary;
};

export type DeviceVariantDetail = DeviceVariantSummary & {
  notes?: string | null;
  variant_physical_specs?: Record<string, unknown> | null;
  variant_io_specs?: Record<string, unknown> | null;
  variant_thermal_specs?: Record<string, unknown> | null;
  variant_chipsets?: Array<{
    chip_role: string;
    is_primary: boolean;
    chipset: Chipset;
  }>;
  variant_displays?: Array<{
    display_role: string;
    display_order?: number;
    display_unit: DisplayUnit;
  }>;
  variant_batteries?: Array<{
    battery_role: string;
    is_primary?: boolean;
    battery_unit: BatteryUnit;
  }>;
};

export type DeviceModelDetail = Omit<DeviceModelSummary, "device_variants"> & {
  device_variants?: DeviceVariantDetail[];
};

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  role: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type AiCitation = {
  entity_type: string;
  entity_id: string;
  title?: string | null;
  slug?: string | null;
  excerpt: string;
  score?: number | null;
};

export type AiContextChunk = {
  entityType: string;
  entityId: string;
  chunkText: string;
  chunkIndex: number;
  title?: string | null;
  slug?: string | null;
  score?: number | null;
  excerpt?: string;
};

export type AiAskResponse = {
  data: {
    question: string;
    answer: string;
    citations: AiCitation[];
    contexts: AiContextChunk[];
    cached: boolean;
    model_name: string;
  };
  meta: {
    source: string;
    top_k?: number;
    embedding_model?: string;
  };
};

export type AiSearchResponse = {
  data: AiContextChunk[];
  meta: {
    query: string;
    top_k: number;
    source: string;
    embedding_model: string;
  };
};

export type AiEmbeddingStats = {
  data: {
    total_chunks: number;
    indexed_device_models: number;
    device_models: number;
    indexes: Array<{
      model_name: string;
      entity_type: string;
      chunks: number;
    }>;
  };
  meta: {
    embedding_model: string;
  };
};

export type ListParams = Record<
  string,
  string | number | boolean | undefined | null
>;

type ClientOptions = {
  baseUrl: string;
  fetcher?: typeof fetch;
};

export class SpecHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload: unknown,
  ) {
    super(message);
    this.name = "SpecHubApiError";
  }
}

export class SpecHubApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetcher = options.fetcher ?? fetch;
  }

  listOrganizations(params?: ListParams) {
    return this.get<PaginatedResult<Organization>>("/organizations", params);
  }

  listDeviceCategories(params?: ListParams) {
    return this.get<PaginatedResult<DeviceCategory>>(
      "/device-categories",
      params,
    );
  }

  getDeviceCategoryTree() {
    return this.get<EntityResult<DeviceCategory[]> | DeviceCategory[]>(
      "/device-categories/tree",
    );
  }

  listProductFamilies(params?: ListParams) {
    return this.get<PaginatedResult<ProductFamily>>(
      "/product-families",
      params,
    );
  }

  listDeviceModels(params?: ListParams) {
    return this.get<PaginatedResult<DeviceModelSummary>>(
      "/device-models",
      params,
    );
  }

  getDeviceModel(slug: string) {
    return this.get<EntityResult<DeviceModelDetail>>(`/device-models/${slug}`);
  }

  listDeviceVariants(params?: ListParams) {
    return this.get<PaginatedResult<DeviceVariantSummary>>(
      "/device-variants",
      params,
    );
  }

  getDeviceVariant(id: string) {
    return this.get<DeviceVariantDetail>(`/device-variants/${id}/by-id`);
  }

  compareDeviceVariants(ids: string[]) {
    return this.get<EntityResult<DeviceVariantDetail[]>>(
      "/device-variants/compare",
      {
        ids: ids.join(","),
      },
    );
  }

  listChipsets(params?: ListParams) {
    return this.get<PaginatedResult<Chipset>>("/chipsets", params);
  }

  search(params?: ListParams) {
    return this.get<PaginatedResult<DeviceModelSummary>>("/search", params);
  }

  askAi(payload: { question: string; top_k?: number }) {
    return this.post<AiAskResponse>("/ai/ask", payload);
  }

  searchAi(params: { q: string; top_k?: number }) {
    return this.get<AiSearchResponse>("/ai/search", params);
  }

  getAiEmbeddingStats() {
    return this.get<AiEmbeddingStats>("/ai/embeddings/stats");
  }

  async login(payload: { email: string; password: string }) {
    const response = await this.post<EntityResult<AuthResponse> | AuthResponse>(
      "/auth/login",
      payload,
    );
    return this.unwrapData(response);
  }

  async register(payload: {
    email: string;
    password: string;
    username?: string;
    display_name?: string;
  }) {
    const response = await this.post<EntityResult<AuthResponse> | AuthResponse>(
      "/auth/register",
      payload,
    );
    return this.unwrapData(response);
  }

  async getMe(accessToken: string) {
    const response = await this.get<EntityResult<AuthUser> | AuthUser>(
      "/auth/me",
      undefined,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return this.unwrapData(response);
  }

  private async get<T>(
    path: string,
    params?: ListParams,
    init?: RequestInit,
  ): Promise<T> {
    const search = this.toSearchParams(params);
    const url = `${this.baseUrl}${path}${search ? `?${search}` : ""}`;
    return this.request<T>(url, init);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await this.fetcher(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : `SpecHub API request failed with ${response.status}`;
      throw new SpecHubApiError(message, response.status, payload);
    }

    return payload as T;
  }

  private toSearchParams(params?: ListParams): string {
    if (!params) return "";

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      searchParams.set(key, String(value));
    }

    return searchParams.toString();
  }

  private unwrapData<T>(payload: EntityResult<T> | T): T {
    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as EntityResult<T>).data;
    }

    return payload as T;
  }
}

export function createSpecHubApiClient(options: ClientOptions) {
  return new SpecHubApiClient(options);
}
