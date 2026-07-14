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
  legal_name?: string | null;
  country_code?: string | null;
  founded_year?: number | null;
  website_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DeviceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_category_id?: string | null;
  icon_url?: string | null;
  display_order?: number;
  is_active?: boolean;
  children?: DeviceCategory[];
};

export type ProductFamily = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  cover_image_url?: string | null;
  first_release_year?: number | null;
  last_release_year?: number | null;
  brand_org_id?: string;
  device_category_id?: string;
  is_active?: boolean;
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
  internal_codename?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  announcement_date?: string | null;
  release_date?: string | null;
  end_of_sale_date?: string | null;
  end_of_support_date?: string | null;
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

export type Cpu = {
  id: string;
  name: string;
  slug: string;
  core_count?: number | null;
  thread_count?: number | null;
  big_little?: boolean | null;
  isa_name?: string | null;
  description?: string | null;
  manufacturer?: Organization;
  architecture?: { id: string; name: string; slug: string } | null;
  cpu_clusters?: Array<{
    cluster_name?: string | null;
    core_microarchitecture?: string | null;
    core_count: number;
    clock_ghz?: string | number | null;
    cluster_order?: number | null;
  }>;
};

export type HardwareUsage = {
  _count?: Record<string, number>;
};

export type HardwareModuleKind =
  | "chipset"
  | "cpu"
  | "gpu"
  | "npu"
  | "modem"
  | "memory-standard"
  | "storage-standard"
  | "operating-system"
  | "wireless-standard"
  | "port-standard"
  | "sensor"
  | "camera"
  | "display"
  | "battery";

export type AdminHardwareModuleKind =
  | "chipset"
  | "cpu"
  | "gpu"
  | "npu"
  | "modem"
  | "memory-standard"
  | "storage-standard"
  | "wireless-standard"
  | "port-standard"
  | "operating-system"
  | "sensor";

export type CreateHardwareModuleInput = {
  kind: AdminHardwareModuleKind;
  name: string;
  slug: string;
  description?: string;
  organization_id?: string;
  category?: string;
  model_code?: string;
  supports_64bit?: boolean;
  integrated_5g?: boolean;
  integrated_wifi?: boolean;
  max_ram_gb?: number;
  max_display_resolution?: string;
  max_camera_mp?: number;
  announcement_date?: string;
  release_date?: string;
  core_count?: number;
  thread_count?: number;
  big_little?: boolean;
  isa_name?: string;
  shader_units?: number;
  compute_units?: number;
  clock_mhz?: number;
  fp32_gflops?: number;
  ray_tracing_support?: boolean;
  api_support?: string;
  tops?: number;
  tops_int4?: number;
  tops_fp16?: number;
  max_downlink_mbps?: number;
  max_uplink_mbps?: number;
  supports_mmwave?: boolean;
  supports_satellite?: boolean;
  supported_5g_modes?: string;
  generation?: string;
  max_data_rate_mtps?: number;
  typical_data_rate_mtps?: number;
  voltage?: number;
  bandwidth_gbps?: number;
  channel_width_bits?: number;
  is_mobile?: boolean;
  release_year?: number;
  sequential_read_mbps?: number;
  sequential_write_mbps?: number;
  random_read_iops?: number;
  random_write_iops?: number;
  max_speed_mbps?: number;
  data_speed_gbps?: number;
  power_delivery_w?: number;
  alt_modes?: string;
  kernel_type?: string;
  is_open_source?: boolean;
};

export type CreatedHardwareModule = {
  id: string;
  kind: AdminHardwareModuleKind;
  name: string;
  slug: string;
  description: string | null;
};

export type HardwareDeviceUsage = {
  variant_id: string;
  variant_name: string;
  market_name?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  launch_price?: string | number | null;
  is_default: boolean;
  currency?: Currency | null;
  usage_role?: string;
  details?: Record<string, unknown>;
  device_model: {
    id: string;
    name: string;
    slug: string;
    generation_label?: string | null;
    release_date?: string | null;
    product_family?: {
      id: string;
      name: string;
      slug: string;
      brand_org?: Pick<Organization, "name" | "short_name" | "slug">;
      device_category?: Pick<DeviceCategory, "name" | "slug">;
    };
  };
};

export type HardwareProductLineResearch = {
  family: {
    id: string;
    name: string;
    slug: string;
    brand: Pick<Organization, "name" | "short_name" | "slug">;
    category: Pick<DeviceCategory, "name" | "slug">;
  };
  model_count: number;
  variant_count: number;
  market_count: number;
  usage_roles: string[];
  representative_variant_ids: string[];
  models: Array<{
    id: string;
    name: string;
    slug: string;
    generation_label?: string | null;
    release_date?: string | null;
    variant_count: number;
    representative_variant_id: string;
  }>;
};

export type HardwareModuleDetail = {
  kind: HardwareModuleKind;
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  organization?: Pick<
    Organization,
    "id" | "name" | "slug" | "short_name"
  > | null;
  specs: Record<string, unknown>;
  devices: HardwareDeviceUsage[];
  research: {
    variant_count: number;
    product_count: number;
    brand_count: number;
    category_count: number;
    priced_variant_count: number;
    spec_field_count: number;
    populated_spec_field_count: number;
    completeness_percent: number;
    missing_specs: string[];
    representative_variant_ids: string[];
    product_lines: HardwareProductLineResearch[];
  };
};

export type HardwareResearchFocus =
  | "balanced"
  | "latest"
  | "adoption"
  | "evolution";

export type HardwareEvidenceStatus =
  | "measured"
  | "partial"
  | "insufficient_data";

export type HardwareEvidenceQuality = "strong" | "moderate" | "limited";

export type HardwareResearchResponse = {
  data: {
    module: Pick<HardwareModuleDetail, "kind" | "id" | "name" | "slug">;
    question: string | null;
    assessment_status: HardwareEvidenceStatus;
    methodology: {
      label: string;
      description: string;
      criteria: Array<{
        key: string;
        label: string;
        requirement: string;
      }>;
    };
    summary: string;
    coverage: {
      linked_device_count: number;
      benchmarked_device_count: number;
      comparable_device_count: number;
      benchmark_result_count: number;
      comparable_metric_count: number;
    };
    device_assessments: Array<{
      rank: number | null;
      status: HardwareEvidenceStatus;
      effectiveness_score: number | null;
      evidence_quality: HardwareEvidenceQuality;
      device: {
        variant_id: string;
        variant_name: string;
        id: string;
        name: string;
        slug: string;
        generation_label?: string | null;
        release_date?: string | null;
        product_line: {
          id: string;
          name: string;
          slug: string;
          brand: {
            name: string;
            short_name: string | null;
            slug: string;
          };
        } | null;
      };
      metrics: {
        benchmark_count: number;
        comparable_metric_count: number;
        throttled_result_count: number;
        undocumented_condition_count: number;
      };
      benchmark_results: Array<{
        id: string;
        benchmark: {
          name: string;
          slug: string;
          type: string;
          version: string | null;
          subscore_name: string | null;
          unit: { name: string; symbol: string } | null;
          higher_is_better: boolean;
        };
        score: number;
        relative_score: number | null;
        comparable: boolean;
        comparison_size: number;
        tested_at: string | null;
        conditions: {
          recorded: boolean;
          environment_note: string | null;
          ambient_temp_c: number | null;
          os_version: string | null;
          app_version: string | null;
          driver_version: string | null;
          power_mode: string | null;
          thermal_throttled: boolean | null;
        };
        source: {
          id: string;
          name: string;
          type: string;
          trust_level: number;
          url: string | null;
          citation_title: string | null;
        } | null;
      }>;
      assessment: string;
      trade_offs: string[];
    }>;
    compare_variant_ids: string[];
    evidence: AiCitation[];
    missing_data: string[];
    disclaimer: string;
  };
  meta: {
    source: "structured_benchmarks";
    scoring_version: string;
    generated_by: "rule_engine" | "hybrid";
    rag_provider: string;
    model_name: string;
  };
};

export type Gpu = {
  id: string;
  name: string;
  slug: string;
  shader_units?: number | null;
  compute_units?: number | null;
  clock_mhz?: number | null;
  fp32_gflops?: string | number | null;
  ray_tracing_support?: boolean | null;
  api_support?: string | null;
  manufacturer?: Organization;
  architecture?: { id: string; name: string; slug: string } | null;
};

export type Npu = {
  id: string;
  name: string;
  slug: string;
  tops?: string | number | null;
  tops_int4?: string | number | null;
  tops_fp16?: string | number | null;
  manufacturer?: Organization;
  architecture?: { id: string; name: string; slug: string } | null;
};

export type Modem = {
  id: string;
  name: string;
  slug: string;
  max_downlink_mbps?: number | null;
  max_uplink_mbps?: number | null;
  supports_mmwave?: boolean | null;
  supports_satellite?: boolean | null;
  supported_5g_modes?: string | null;
  manufacturer?: Organization;
};

export type MemoryConfig = {
  capacity_gb: number;
  speed_mhz?: number | null;
  bandwidth_gbps?: string | number | null;
  channel_count?: number | null;
  is_primary?: boolean | null;
  notes?: string | null;
  memory_standard: {
    id: string;
    name: string;
    slug: string;
    memory_type?: string | null;
    generation?: string | null;
    max_data_rate_mtps?: number | null;
    typical_data_rate_mtps?: number | null;
    bandwidth_gbps?: string | number | null;
    channel_width_bits?: number | null;
  };
};

export type StorageConfig = {
  total_capacity_gb: number;
  module_count?: number | null;
  is_expandable: boolean;
  expansion_max_gb?: number | null;
  storage_standard: {
    id: string;
    name: string;
    slug: string;
    storage_type?: string | null;
    generation?: string | null;
    sequential_read_mbps?: number | null;
    sequential_write_mbps?: number | null;
  };
};

export type OperatingSystemModule = {
  is_default: boolean;
  is_upgradable_to: boolean;
  promised_major_updates?: number | null;
  promised_security_years?: number | null;
  notes?: string | null;
  os_version: {
    id: string;
    version_name: string;
    codename?: string | null;
    release_date?: string | null;
    api_level?: number | null;
    operating_system: {
      id: string;
      name: string;
      slug: string;
      os_family: string;
      kernel_type?: string | null;
    };
  };
  ui_layer_version?: {
    id: string;
    version_name: string;
    ui_layer: { id: string; name: string; slug: string };
  } | null;
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
  end_of_sale_date?: string | null;
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
  variant_cpus?: Array<{ cpu_role: string; is_primary: boolean; cpu: Cpu }>;
  variant_gpus?: Array<{ gpu_role: string; is_primary: boolean; gpu: Gpu }>;
  variant_npus?: Array<{ npu_role: string; is_primary: boolean; npu: Npu }>;
  variant_modems?: Array<{
    modem_role: string;
    is_primary: boolean;
    modem: Modem;
  }>;
  variant_memory_configs?: MemoryConfig[];
  variant_storage_configs?: StorageConfig[];
  variant_ports?: Array<{
    port_count: number;
    notes?: string | null;
    port_standard: {
      id: string;
      name: string;
      slug: string;
      port_type: string;
      data_speed_gbps?: string | number | null;
      power_delivery_w?: number | null;
      alt_modes?: string | null;
    };
  }>;
  variant_wireless_support?: Array<{
    notes?: string | null;
    wireless_standard: {
      id: string;
      name: string;
      slug: string;
      wireless_type: string;
      max_speed_mbps?: number | null;
    };
  }>;
  variant_wifi_bands?: Array<{
    wifi_band: { id: string; name: string; frequency_range?: string | null };
  }>;
  variant_operating_systems?: OperatingSystemModule[];
  variant_hardware_sensors?: Array<{
    notes?: string | null;
    hardware_sensor: {
      id: string;
      name: string;
      slug: string;
      sensor_category: string;
      description?: string | null;
      manufacturer?: Organization | null;
    };
  }>;
  variant_cellular_band_support?: Array<{
    cellular_band: {
      id: string;
      name: string;
      band_type?: string | null;
      frequency_range?: string | null;
      is_mmwave?: boolean | null;
    };
  }>;
  variant_camera_systems?: Array<{
    position: string;
    system_name?: string | null;
    notes?: string | null;
    variant_camera_modules?: Array<{
      position: string;
      role: string;
      module_order: number;
      is_primary?: boolean | null;
      usage_type?: string | null;
      notes?: string | null;
      camera_module: {
        id: string;
        name?: string | null;
        slug?: string | null;
        effective_megapixel?: string | number | null;
        aperture?: string | null;
        focal_length_mm_eq?: string | number | null;
        optical_zoom?: string | number | null;
        has_ois?: boolean | null;
        has_af?: boolean | null;
        video_capabilities?: string | null;
      };
    }>;
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

export type AdminUser = AuthUser & {
  email_verified_at?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type AdminUserList = {
  items: AdminUser[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    total_pages: number;
  };
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

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  short_name?: string;
  legal_name?: string;
  country_code?: string;
  founded_year?: number;
  website_url?: string;
  logo_url?: string;
  description?: string;
  is_active?: boolean;
};

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export type CreateDeviceCategoryInput = {
  name: string;
  slug: string;
  parent_category_id?: string;
  description?: string;
  icon_url?: string;
  display_order?: number;
  is_active?: boolean;
};

export type UpdateDeviceCategoryInput = Partial<CreateDeviceCategoryInput>;

export type CreateProductFamilyInput = {
  brand_org_id: string;
  device_category_id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  first_release_year?: number;
  last_release_year?: number;
  is_active?: boolean;
};

export type UpdateProductFamilyInput = Partial<CreateProductFamilyInput>;

export type CreateDeviceModelInput = {
  product_family_id: string;
  name: string;
  slug: string;
  release_status_id: number;
  internal_codename?: string;
  announcement_date?: string;
  release_date?: string;
  end_of_sale_date?: string;
  end_of_support_date?: string;
  generation_label?: string;
  description?: string;
  cover_image_url?: string;
};

export type UpdateDeviceModelInput = Partial<CreateDeviceModelInput>;

export type VariantPhysicalSpecsInput = {
  height_mm?: number;
  width_mm?: number;
  thickness_mm?: number;
  thickness_min_mm?: number;
  thickness_max_mm?: number;
  weight_g?: number;
  volume_cm3?: number;
  frame_material?: string;
  back_material?: string;
  front_glass?: string;
  ingress_protection?: string;
  notes?: string;
};

export type VariantIoSpecsInput = {
  sim_slots?: number;
  sim_type?: string;
  esim_supported?: boolean;
  esim_count?: number;
  stereo_speakers?: boolean;
  speaker_count?: number;
  audio_brand_tuning?: string;
  headphone_jack?: boolean;
  headphone_jack_size_mm?: number;
  has_microsd_slot?: boolean;
  microsd_max_capacity_gb?: number;
  has_ir_blaster?: boolean;
  has_notification_led?: boolean;
  notes?: string;
};

export type VariantThermalSpecsInput = {
  cooling_type?: string;
  vc_area_mm2?: number;
  has_active_cooling?: boolean;
  notes?: string;
};

export type CreateDeviceVariantInput = {
  device_model_id: string;
  variant_name: string;
  release_status_id: number;
  sku_code?: string;
  market_name?: string;
  color_name?: string;
  color_hex?: string;
  launch_date?: string;
  end_of_sale_date?: string;
  launch_price?: number;
  currency_id?: number;
  is_default?: boolean;
  notes?: string;
  physical_specs?: VariantPhysicalSpecsInput;
  io_specs?: VariantIoSpecsInput;
  thermal_specs?: VariantThermalSpecsInput;
};

export type UpdateDeviceVariantInput = Partial<CreateDeviceVariantInput>;

export type DataSource = {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  reliability: number;
  crawl_config: Record<string, unknown>;
  is_active: boolean;
  last_crawled_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RawPageStatus =
  | "pending"
  | "fetched"
  | "parsed"
  | "needs_review"
  | "approved"
  | "rejected"
  | "failed";

export type RawPage = {
  id: string;
  source_id: string;
  url: string;
  raw_html?: string | null;
  raw_text?: string | null;
  parsed_data?: Record<string, unknown> | null;
  status: RawPageStatus;
  device_model_id?: string | null;
  error_message?: string | null;
  attempts: number;
  crawled_at: string;
  parsed_at?: string | null;
  source?: Pick<DataSource, "id" | "name" | "slug" | "reliability">;
  device_model?: Pick<DeviceModelSummary, "id" | "name" | "slug"> | null;
};

export type CreateDataSourceInput = {
  name: string;
  slug: string;
  base_url: string;
  reliability?: number;
  crawl_config?: Record<string, unknown>;
  is_active?: boolean;
};

export type UpdateDataSourceInput = Partial<CreateDataSourceInput>;

export type UpsertRawPageInput = {
  source_id: string;
  url: string;
  raw_html?: string;
  raw_text?: string;
  parsed_data?: Record<string, unknown>;
  status?: RawPageStatus;
  device_model_id?: string;
};

export type ReviewRawPageInput = {
  status: RawPageStatus;
  parsed_data?: Record<string, unknown>;
  device_model_id?: string;
  error_message?: string;
};

export type CitationSource = {
  id: string;
  name: string;
  slug: string;
  source_type: string;
  base_url?: string | null;
  trust_level: number;
  description?: string | null;
};

export type Citation = {
  id: string;
  source_id: string;
  url?: string | null;
  title?: string | null;
  author?: string | null;
  published_at?: string | null;
  retrieved_at?: string | null;
  excerpt?: string | null;
  source?: Pick<
    CitationSource,
    "id" | "name" | "slug" | "source_type" | "trust_level"
  >;
};

export type CreateCitationSourceInput = {
  name: string;
  slug: string;
  source_type: string;
  base_url?: string;
  trust_level?: number;
  description?: string;
};

export type UpdateCitationSourceInput = Partial<CreateCitationSourceInput>;

export type CreateCitationInput = {
  source_id: string;
  url?: string;
  title?: string;
  author?: string;
  published_at?: string;
  retrieved_at?: string;
  excerpt?: string;
};

export type UpdateCitationInput = Partial<CreateCitationInput>;

export type WikiArticleStatus =
  | "draft"
  | "in_review"
  | "published"
  | "archived";

export type WikiCitationLink = {
  anchor_key?: string | null;
  citation: Citation;
};

export type WikiArticle = {
  id: string;
  entity_table: string;
  entity_id: string;
  title: string;
  slug: string;
  summary?: string | null;
  body_markdown?: string | null;
  status: WikiArticleStatus;
  current_revision_id?: string | null;
  view_count: string | number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  language: {
    code: string;
    name: string;
  };
  citations: WikiCitationLink[];
  _count?: {
    revisions?: number;
  };
};

export type WikiRevision = {
  id: string;
  article_id: string;
  revision_number: number;
  title?: string | null;
  body_markdown?: string | null;
  change_summary?: string | null;
  is_published: boolean;
  created_at: string;
  author?: {
    id: string;
    username?: string | null;
    display_name?: string | null;
  } | null;
};

export type WikiCitationLinkInput = {
  citation_id: string;
  anchor_key?: string;
};

export type CreateWikiArticleInput = {
  entity_table: string;
  entity_id: string;
  language_code?: string;
  title: string;
  slug: string;
  summary?: string;
  body_markdown?: string;
  status?: WikiArticleStatus;
  change_summary?: string;
  citations?: WikiCitationLinkInput[];
};

export type UpdateWikiArticleInput = Partial<CreateWikiArticleInput>;

export type SubmitWikiRevisionInput = {
  title?: string;
  body_markdown?: string;
  change_summary?: string;
};

export type ApiKeyMetadata = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_per_minute: number;
  monthly_quota?: number | null;
  is_active: boolean;
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatedApiKey = ApiKeyMetadata & {
  key: string;
};

export type CreateApiKeyInput = {
  name: string;
  scopes?: ["catalog:read"];
  rate_limit_per_minute?: number;
  monthly_quota?: number;
  expires_at?: string;
};

export type WishlistItem = {
  id: string;
  wishlist_id: string;
  device_variant_id: string;
  notes?: string | null;
  added_at: string;
  device_variant?: DeviceVariantSummary;
};

export type Wishlist = {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  items?: WishlistItem[];
  _count?: {
    items?: number;
  };
};

export type CreateWishlistInput = {
  name?: string;
  is_public?: boolean;
};

export type UpdateWishlistInput = Partial<CreateWishlistInput>;

export type AddWishlistItemInput = {
  device_variant_id: string;
  notes?: string;
};

export type AffiliatePartner = {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  logo_url?: string | null;
  commission_rate: string | number;
  is_active: boolean;
  created_at?: string;
};

export type AffiliateLink = {
  id: string;
  partner_id: string;
  device_variant_id: string;
  region_code: string;
  product_url: string;
  current_price?: string | number | null;
  currency_code: string;
  in_stock: boolean;
  last_checked_at: string;
  created_at: string;
  partner?: AffiliatePartner;
  device_variant?: DeviceVariantSummary;
};

export type CreateAffiliatePartnerInput = {
  name: string;
  slug: string;
  base_url: string;
  logo_url?: string;
  commission_rate: number;
  is_active?: boolean;
};

export type UpdateAffiliatePartnerInput = Partial<CreateAffiliatePartnerInput>;

export type CreateAffiliateLinkInput = {
  partner_id: string;
  device_variant_id: string;
  region_code: string;
  product_url: string;
  current_price?: number;
  currency_code: string;
  in_stock?: boolean;
};

export type UpdateAffiliateLinkInput = Partial<CreateAffiliateLinkInput>;

export type TrackAffiliateClickInput = {
  session_id?: string;
  referrer?: string;
};

export type PriceAlert = {
  id: string;
  user_id: string;
  device_variant_id: string;
  target_price: string | number;
  currency_code: string;
  region_code: string;
  is_active: boolean;
  triggered_at?: string | null;
  created_at: string;
  device_variant?: DeviceVariantSummary;
};

export type CreatePriceAlertInput = {
  device_variant_id: string;
  target_price: number;
  currency_code: string;
  region_code: string;
};

export type UpdatePriceAlertInput = Partial<
  Omit<CreatePriceAlertInput, "device_variant_id">
> & {
  is_active?: boolean;
};

export type Notification = {
  id: string;
  user_id: string;
  type: "price_alert_triggered" | "subscription_updated" | "system";
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at: string;
};

export type CreateNotificationInput = {
  user_id: string;
  type: Notification["type"];
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price_monthly: string | number;
  price_yearly: string | number;
  currency_code: string;
  features: Record<string, unknown>;
  is_active: boolean;
  stripe_price_monthly_id?: string | null;
  stripe_price_yearly_id?: string | null;
  created_at: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  provider: string;
  status: string;
  billing_cycle: string;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  ended_at?: string | null;
  last_payment_at?: string | null;
  last_payment_error?: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
};

export type MySubscription = {
  subscription?: UserSubscription | null;
  plan: SubscriptionPlan;
  features: Record<string, unknown>;
};

export type CreateCheckoutInput = {
  plan_code: string;
  billing_cycle: "monthly" | "yearly" | "manual";
};

export type AssignSubscriptionInput = {
  plan_id: string;
  status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  billing_cycle: "monthly" | "yearly" | "manual";
  current_period_end?: string;
  cancel_at_period_end?: boolean;
};

export type CreateSubscriptionPlanInput = {
  code: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  currency_code: string;
  features: Record<string, unknown>;
  stripe_price_monthly_id?: string;
  stripe_price_yearly_id?: string;
  is_active?: boolean;
};

export type UpdateSubscriptionPlanInput = Partial<CreateSubscriptionPlanInput>;

export type BillingAuditLog = {
  id: string;
  subscription_id?: string | null;
  user_id?: string | null;
  provider: string;
  action: string;
  status: string;
  external_event_id?: string | null;
  details?: Record<string, unknown> | null;
  error_message?: string | null;
  created_at: string;
};

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

  async listUsers(
    params: ListParams | undefined,
    accessToken: string,
  ): Promise<AdminUserList> {
    const response = await this.get<EntityResult<AdminUserList>>(
      "/users",
      params,
      this.withAuth(accessToken),
    );
    return this.unwrapData(response);
  }

  updateUserRole(id: string, role: string, accessToken: string) {
    return this.patch<AdminUser>(
      `/users/${id}/role`,
      { role },
      this.withAuth(accessToken),
    );
  }

  setUserActive(id: string, isActive: boolean, accessToken: string) {
    return this.patch<AdminUser>(
      `/users/${id}/active`,
      { is_active: isActive },
      this.withAuth(accessToken),
    );
  }

  listOrganizations(params?: ListParams) {
    return this.get<PaginatedResult<Organization>>("/organizations", params);
  }

  createOrganization(payload: CreateOrganizationInput, accessToken: string) {
    return this.post<EntityResult<Organization>>(
      "/organizations",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateOrganization(
    id: string,
    payload: UpdateOrganizationInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<Organization>>(
      `/organizations/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  deleteOrganization(id: string, accessToken: string) {
    return this.del<EntityResult<Organization>>(
      `/organizations/${id}`,
      this.withAuth(accessToken),
    );
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

  createDeviceCategory(
    payload: CreateDeviceCategoryInput,
    accessToken: string,
  ) {
    return this.post<EntityResult<DeviceCategory>>(
      "/device-categories",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateDeviceCategory(
    id: string,
    payload: UpdateDeviceCategoryInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<DeviceCategory>>(
      `/device-categories/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  deleteDeviceCategory(id: string, accessToken: string) {
    return this.del<EntityResult<DeviceCategory>>(
      `/device-categories/${id}`,
      this.withAuth(accessToken),
    );
  }

  listProductFamilies(params?: ListParams) {
    return this.get<PaginatedResult<ProductFamily>>(
      "/product-families",
      params,
    );
  }

  createProductFamily(payload: CreateProductFamilyInput, accessToken: string) {
    return this.post<EntityResult<ProductFamily>>(
      "/product-families",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateProductFamily(
    id: string,
    payload: UpdateProductFamilyInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<ProductFamily>>(
      `/product-families/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  deleteProductFamily(id: string, accessToken: string) {
    return this.del<EntityResult<ProductFamily>>(
      `/product-families/${id}`,
      this.withAuth(accessToken),
    );
  }

  listDeviceModels(params?: ListParams) {
    return this.get<PaginatedResult<DeviceModelSummary>>(
      "/device-models",
      params,
    );
  }

  async listReleaseStatuses(): Promise<ReleaseStatus[]> {
    const response = await this.get<EntityResult<ReleaseStatus[]>>(
      "/device-models/release-statuses",
    );
    return this.unwrapData(response);
  }

  getDeviceModel(slug: string) {
    return this.get<EntityResult<DeviceModelDetail>>(`/device-models/${slug}`);
  }

  createDeviceModel(payload: CreateDeviceModelInput, accessToken: string) {
    return this.post<EntityResult<DeviceModelDetail>>(
      "/device-models",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateDeviceModel(
    id: string,
    payload: UpdateDeviceModelInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<DeviceModelDetail>>(
      `/device-models/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  deleteDeviceModel(id: string, accessToken: string) {
    return this.del<EntityResult<DeviceModelDetail>>(
      `/device-models/${id}`,
      this.withAuth(accessToken),
    );
  }

  listDeviceVariants(params?: ListParams) {
    return this.get<PaginatedResult<DeviceVariantSummary>>(
      "/device-variants",
      params,
    );
  }

  async listCurrencies(): Promise<Currency[]> {
    const response = await this.get<EntityResult<Currency[]>>(
      "/device-variants/currencies",
    );
    return this.unwrapData(response);
  }

  getDeviceVariant(id: string) {
    return this.get<EntityResult<DeviceVariantDetail>>(
      `/device-variants/${id}/by-id`,
    );
  }

  createDeviceVariant(payload: CreateDeviceVariantInput, accessToken: string) {
    return this.post<EntityResult<DeviceVariantDetail>>(
      "/device-variants",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateDeviceVariant(
    id: string,
    payload: UpdateDeviceVariantInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<DeviceVariantDetail>>(
      `/device-variants/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  deleteDeviceVariant(id: string, accessToken: string) {
    return this.del<EntityResult<DeviceVariantDetail>>(
      `/device-variants/${id}`,
      this.withAuth(accessToken),
    );
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

  listHardwareCpus(params?: ListParams) {
    return this.get<PaginatedResult<Cpu & HardwareUsage>>(
      "/hardware/cpus",
      params,
    );
  }

  getHardwareModule(kind: HardwareModuleKind, slug: string) {
    return this.get<EntityResult<HardwareModuleDetail>>(
      `/hardware/${kind}/${slug}`,
    );
  }

  researchHardwareModule(
    kind: HardwareModuleKind,
    slug: string,
    payload: { question?: string; focus?: HardwareResearchFocus } = {},
  ) {
    return this.post<HardwareResearchResponse>(
      `/ai/research/hardware/${kind}/${slug}`,
      payload,
    );
  }

  async createHardwareModule(
    payload: CreateHardwareModuleInput,
    accessToken: string,
  ): Promise<CreatedHardwareModule> {
    const response = await this.post<EntityResult<CreatedHardwareModule>>(
      "/admin/hardware/modules",
      payload,
      this.withAuth(accessToken),
    );
    return this.unwrapData(response);
  }

  listHardwareGpus(params?: ListParams) {
    return this.get<PaginatedResult<Gpu & HardwareUsage>>(
      "/hardware/gpus",
      params,
    );
  }

  listHardwareNpus(params?: ListParams) {
    return this.get<PaginatedResult<Npu & HardwareUsage>>(
      "/hardware/npus",
      params,
    );
  }

  listHardwareModems(params?: ListParams) {
    return this.get<PaginatedResult<Modem & HardwareUsage>>(
      "/hardware/modems",
      params,
    );
  }

  listMemoryStandards(params?: ListParams) {
    return this.get<
      PaginatedResult<MemoryConfig["memory_standard"] & HardwareUsage>
    >("/hardware/memory-standards", params);
  }

  listStorageStandards(params?: ListParams) {
    return this.get<
      PaginatedResult<StorageConfig["storage_standard"] & HardwareUsage>
    >("/hardware/storage-standards", params);
  }

  listOperatingSystems(params?: ListParams) {
    return this.get<
      PaginatedResult<OperatingSystemModule["os_version"]["operating_system"]>
    >("/hardware/operating-systems", params);
  }

  listWirelessStandards(params?: ListParams) {
    return this.get<
      PaginatedResult<
        NonNullable<
          DeviceVariantDetail["variant_wireless_support"]
        >[number]["wireless_standard"]
      >
    >("/hardware/wireless-standards", params);
  }

  listPortStandards(params?: ListParams) {
    return this.get<
      PaginatedResult<
        NonNullable<
          DeviceVariantDetail["variant_ports"]
        >[number]["port_standard"]
      >
    >("/hardware/port-standards", params);
  }

  listHardwareSensors(params?: ListParams) {
    return this.get<
      PaginatedResult<
        NonNullable<
          DeviceVariantDetail["variant_hardware_sensors"]
        >[number]["hardware_sensor"]
      >
    >("/hardware/sensors", params);
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

  indexDeviceModels(accessToken: string) {
    return this.post<Record<string, unknown>>(
      "/ai/embeddings/index-device-models",
      {},
      this.withAuth(accessToken),
    );
  }

  indexRawPages(accessToken: string) {
    return this.post<Record<string, unknown>>(
      "/ai/embeddings/index-raw-pages",
      {},
      this.withAuth(accessToken),
    );
  }

  listDataSources(accessToken: string) {
    return this.get<EntityResult<DataSource[]>>(
      "/data-ingestion/sources",
      undefined,
      this.withAuth(accessToken),
    );
  }

  createDataSource(payload: CreateDataSourceInput, accessToken: string) {
    return this.post<EntityResult<DataSource>>(
      "/data-ingestion/sources",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateDataSource(
    id: string,
    payload: UpdateDataSourceInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<DataSource>>(
      `/data-ingestion/sources/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  listRawPages(params: ListParams | undefined, accessToken: string) {
    return this.get<PaginatedResult<RawPage>>(
      "/data-ingestion/raw-pages",
      params,
      this.withAuth(accessToken),
    );
  }

  getRawPage(id: string, accessToken: string) {
    return this.get<EntityResult<RawPage>>(
      `/data-ingestion/raw-pages/${id}`,
      undefined,
      this.withAuth(accessToken),
    );
  }

  listReviewQueue(params: ListParams | undefined, accessToken: string) {
    return this.get<PaginatedResult<RawPage>>(
      "/data-ingestion/review-queue",
      params,
      this.withAuth(accessToken),
    );
  }

  upsertRawPage(payload: UpsertRawPageInput, accessToken: string) {
    return this.post<EntityResult<RawPage>>(
      "/data-ingestion/raw-pages",
      payload,
      this.withAuth(accessToken),
    );
  }

  reviewRawPage(id: string, payload: ReviewRawPageInput, accessToken: string) {
    return this.patch<EntityResult<RawPage>>(
      `/data-ingestion/raw-pages/${id}/review`,
      payload,
      this.withAuth(accessToken),
    );
  }

  listCitationSources() {
    return this.get<EntityResult<CitationSource[]>>("/citations/sources");
  }

  createCitationSource(
    payload: CreateCitationSourceInput,
    accessToken: string,
  ) {
    return this.post<EntityResult<CitationSource>>(
      "/citations/sources",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateCitationSource(
    id: string,
    payload: UpdateCitationSourceInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<CitationSource>>(
      `/citations/sources/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  listCitations(params?: ListParams) {
    return this.get<PaginatedResult<Citation>>("/citations", params);
  }

  createCitation(payload: CreateCitationInput, accessToken: string) {
    return this.post<EntityResult<Citation>>(
      "/citations",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateCitation(
    id: string,
    payload: UpdateCitationInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<Citation>>(
      `/citations/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  listWikiArticles(params?: ListParams) {
    return this.get<PaginatedResult<WikiArticle>>("/wiki/articles", params);
  }

  getWikiArticle(slug: string, languageCode?: string) {
    return this.get<EntityResult<WikiArticle>>(
      `/wiki/articles/${encodeURIComponent(slug)}`,
      languageCode ? { language_code: languageCode } : undefined,
    );
  }

  listWikiArticlesForModeration(
    params: ListParams | undefined,
    accessToken: string,
  ) {
    return this.get<PaginatedResult<WikiArticle>>(
      "/wiki/admin/articles",
      params,
      this.withAuth(accessToken),
    );
  }

  createWikiArticle(payload: CreateWikiArticleInput, accessToken: string) {
    return this.post<EntityResult<WikiArticle>>(
      "/wiki/articles",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateWikiArticle(
    id: string,
    payload: UpdateWikiArticleInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<WikiArticle>>(
      `/wiki/articles/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  listWikiRevisions(id: string, accessToken: string) {
    return this.get<EntityResult<WikiRevision[]>>(
      `/wiki/articles/${id}/revisions`,
      undefined,
      this.withAuth(accessToken),
    );
  }

  submitWikiRevision(
    id: string,
    payload: SubmitWikiRevisionInput,
    accessToken: string,
  ) {
    return this.post<EntityResult<WikiRevision>>(
      `/wiki/articles/${id}/revisions`,
      payload,
      this.withAuth(accessToken),
    );
  }

  publishWikiRevision(id: string, revisionId: string, accessToken: string) {
    return this.post<EntityResult<WikiArticle>>(
      `/wiki/articles/${id}/revisions/${revisionId}/publish`,
      {},
      this.withAuth(accessToken),
    );
  }

  archiveWikiArticle(id: string, accessToken: string) {
    return this.del<EntityResult<{ id: string; archived: true }>>(
      `/wiki/articles/${id}`,
      this.withAuth(accessToken),
    );
  }

  listApiKeys(accessToken: string) {
    return this.get<EntityResult<ApiKeyMetadata[]>>(
      "/api-keys",
      undefined,
      this.withAuth(accessToken),
    );
  }

  createApiKey(payload: CreateApiKeyInput, accessToken: string) {
    return this.post<EntityResult<CreatedApiKey>>(
      "/api-keys",
      payload,
      this.withAuth(accessToken),
    );
  }

  rotateApiKey(id: string, accessToken: string) {
    return this.post<EntityResult<CreatedApiKey>>(
      `/api-keys/${id}/rotate`,
      {},
      this.withAuth(accessToken),
    );
  }

  revokeApiKey(id: string, accessToken: string) {
    return this.del<EntityResult<{ id: string; revoked: true }>>(
      `/api-keys/${id}`,
      this.withAuth(accessToken),
    );
  }

  listWishlists(accessToken: string) {
    return this.get<EntityResult<Wishlist[]>>(
      "/wishlists",
      undefined,
      this.withAuth(accessToken),
    );
  }

  createWishlist(payload: CreateWishlistInput, accessToken: string) {
    return this.post<EntityResult<Wishlist>>(
      "/wishlists",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateWishlist(
    id: string,
    payload: UpdateWishlistInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<Wishlist>>(
      `/wishlists/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  deleteWishlist(id: string, accessToken: string) {
    return this.del<EntityResult<{ id: string; deleted: boolean }>>(
      `/wishlists/${id}`,
      this.withAuth(accessToken),
    );
  }

  addWishlistItem(
    wishlistId: string,
    payload: AddWishlistItemInput,
    accessToken: string,
  ) {
    return this.post<EntityResult<WishlistItem>>(
      `/wishlists/${wishlistId}/items`,
      payload,
      this.withAuth(accessToken),
    );
  }

  addDefaultWishlistItem(payload: AddWishlistItemInput, accessToken: string) {
    return this.post<EntityResult<WishlistItem>>(
      "/wishlists/default/items",
      payload,
      this.withAuth(accessToken),
    );
  }

  deleteWishlistItem(wishlistId: string, itemId: string, accessToken: string) {
    return this.del<EntityResult<{ id: string; deleted: boolean }>>(
      `/wishlists/${wishlistId}/items/${itemId}`,
      this.withAuth(accessToken),
    );
  }

  listAffiliatePartners() {
    return this.get<EntityResult<AffiliatePartner[]>>("/affiliate/partners");
  }

  createAffiliatePartner(
    payload: CreateAffiliatePartnerInput,
    accessToken: string,
  ) {
    return this.post<EntityResult<AffiliatePartner>>(
      "/affiliate/partners",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateAffiliatePartner(
    id: string,
    payload: UpdateAffiliatePartnerInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<AffiliatePartner>>(
      `/affiliate/partners/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  listAffiliateLinks(params?: ListParams) {
    return this.get<EntityResult<AffiliateLink[]>>("/affiliate/links", params);
  }

  createAffiliateLink(payload: CreateAffiliateLinkInput, accessToken: string) {
    return this.post<EntityResult<AffiliateLink>>(
      "/affiliate/links",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateAffiliateLink(
    id: string,
    payload: UpdateAffiliateLinkInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<AffiliateLink>>(
      `/affiliate/links/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  trackAffiliateClick(id: string, payload: TrackAffiliateClickInput = {}) {
    return this.post<
      EntityResult<{ affiliate_link_id: string; redirect_url: string }>
    >(`/affiliate/links/${id}/click`, payload);
  }

  listPriceAlerts(accessToken: string) {
    return this.get<EntityResult<PriceAlert[]>>(
      "/alerts",
      undefined,
      this.withAuth(accessToken),
    );
  }

  createPriceAlert(payload: CreatePriceAlertInput, accessToken: string) {
    return this.post<EntityResult<PriceAlert>>(
      "/alerts",
      payload,
      this.withAuth(accessToken),
    );
  }

  updatePriceAlert(
    id: string,
    payload: UpdatePriceAlertInput,
    accessToken: string,
  ) {
    return this.patch<EntityResult<PriceAlert>>(
      `/alerts/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  deletePriceAlert(id: string, accessToken: string) {
    return this.del<EntityResult<PriceAlert>>(
      `/alerts/${id}`,
      this.withAuth(accessToken),
    );
  }

  checkPriceAlerts(accessToken: string) {
    return this.post<EntityResult<{ checked: number; triggered: number }>>(
      "/alerts/check",
      {},
      this.withAuth(accessToken),
    );
  }

  listNotifications(params: ListParams | undefined, accessToken: string) {
    return this.get<PaginatedResult<Notification>>(
      "/notifications",
      params,
      this.withAuth(accessToken),
    );
  }

  getUnreadNotificationCount(accessToken: string) {
    return this.get<EntityResult<{ count: number }>>(
      "/notifications/unread-count",
      undefined,
      this.withAuth(accessToken),
    );
  }

  createNotification(payload: CreateNotificationInput, accessToken: string) {
    return this.post<EntityResult<Notification>>(
      "/notifications",
      payload,
      this.withAuth(accessToken),
    );
  }

  markNotificationRead(id: string, accessToken: string) {
    return this.patch<EntityResult<Notification>>(
      `/notifications/${id}/read`,
      {},
      this.withAuth(accessToken),
    );
  }

  markAllNotificationsRead(accessToken: string) {
    return this.patch<EntityResult<{ updated: number }>>(
      "/notifications/read-all",
      {},
      this.withAuth(accessToken),
    );
  }

  listSubscriptionPlans() {
    return this.get<EntityResult<SubscriptionPlan[]>>("/subscriptions/plans");
  }

  listAllSubscriptionPlans(accessToken: string) {
    return this.get<EntityResult<SubscriptionPlan[]>>(
      "/subscriptions/admin/plans",
      undefined,
      this.withAuth(accessToken),
    );
  }

  createSubscriptionPlan(
    payload: CreateSubscriptionPlanInput,
    accessToken: string,
  ) {
    return this.post<SubscriptionPlan>(
      "/subscriptions/admin/plans",
      payload,
      this.withAuth(accessToken),
    );
  }

  updateSubscriptionPlan(
    id: string,
    payload: UpdateSubscriptionPlanInput,
    accessToken: string,
  ) {
    return this.patch<SubscriptionPlan>(
      `/subscriptions/admin/plans/${id}`,
      payload,
      this.withAuth(accessToken),
    );
  }

  getMySubscription(accessToken: string) {
    return this.get<EntityResult<MySubscription>>(
      "/subscriptions/me",
      undefined,
      this.withAuth(accessToken),
    );
  }

  createCheckout(payload: CreateCheckoutInput, accessToken: string) {
    return this.post<EntityResult<Record<string, unknown>>>(
      "/subscriptions/checkout",
      payload,
      this.withAuth(accessToken),
    );
  }

  cancelMySubscription(accessToken: string) {
    return this.post<UserSubscription>(
      "/subscriptions/me/cancel",
      {},
      this.withAuth(accessToken),
    );
  }

  resumeMySubscription(accessToken: string) {
    return this.post<UserSubscription>(
      "/subscriptions/me/resume",
      {},
      this.withAuth(accessToken),
    );
  }

  retryMySubscriptionPayment(accessToken: string) {
    return this.post<UserSubscription>(
      "/subscriptions/me/retry-payment",
      {},
      this.withAuth(accessToken),
    );
  }

  listMyBillingAudit(params: ListParams | undefined, accessToken: string) {
    return this.get<EntityResult<BillingAuditLog[]>>(
      "/subscriptions/me/audit",
      params,
      this.withAuth(accessToken),
    );
  }

  listBillingAudit(params: ListParams | undefined, accessToken: string) {
    return this.get<EntityResult<BillingAuditLog[]>>(
      "/subscriptions/admin/audit",
      params,
      this.withAuth(accessToken),
    );
  }

  assignUserSubscription(
    userId: string,
    payload: AssignSubscriptionInput,
    accessToken: string,
  ) {
    return this.patch<UserSubscription>(
      `/subscriptions/users/${userId}`,
      payload,
      this.withAuth(accessToken),
    );
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

  async refreshAuthTokens(refreshToken: string) {
    const response = await this.post<EntityResult<AuthTokens> | AuthTokens>(
      "/auth/refresh",
      { refresh_token: refreshToken },
    );
    return this.unwrapData(response);
  }

  logout(accessToken: string) {
    return this.post<null>("/auth/logout", {}, this.withAuth(accessToken));
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

  private async post<T>(
    path: string,
    body: unknown,
    init?: RequestInit,
  ): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      ...init,
      method: "POST",
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: JSON.stringify(body),
    });
  }

  private async patch<T>(
    path: string,
    body: unknown,
    init?: RequestInit,
  ): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      ...init,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: JSON.stringify(body),
    });
  }

  private async del<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      ...init,
      method: "DELETE",
    });
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    let response: Response;

    try {
      response = await this.fetcher(url, {
        ...init,
        headers: {
          Accept: "application/json",
          ...init?.headers,
        },
      });
    } catch (error) {
      const cause = error instanceof Error ? error.message : "Unknown error";

      throw new SpecHubApiError(
        "Unable to connect to the SpecHub API. Check that the API service is running and the configured base URL is reachable.",
        0,
        { url, cause },
      );
    }

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

  private withAuth(accessToken: string): RequestInit {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }
}

export function createSpecHubApiClient(options: ClientOptions) {
  return new SpecHubApiClient(options);
}
