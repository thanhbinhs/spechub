"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  Children,
  isValidElement,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  Gauge,
  ImagePlus,
  ImageOff,
  Layers3,
  ListChecks,
  Link2,
  Link2Off,
  MousePointerClick,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type {
  AdminDashboardOverview,
  AdminHardwareModuleRecord,
  AdminHardwareModuleKind,
  AffiliateLink,
  CatalogDraft,
  CreateDeviceModelInput,
  CreateDeviceVariantInput,
  CreateHardwareModuleInput,
  DataSource,
  DeviceModelSummary,
  DeviceVariantDetail,
  ProductFamily,
} from "@spechub/api-client";
import {
  calculateScorecard,
  normalizeMetric,
  type RawMetricBag,
  type ScoringProfile,
} from "@spechub/scoring-core";
import { normalizeText, parseSpecificationNumber } from "@spechub/utils";
import { useAuth } from "@/components/auth-provider";
import { DeviceArtwork } from "@/components/device-artwork";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { api } from "@/lib/api";
import { calculateConfigurationIndex } from "@/lib/device-benchmark";
import { formatPrice } from "@/lib/format";
import { localizeDeviceCategory, localizeReleaseStatus } from "@/lib/localize";
import { CatalogStudioWizard } from "@/components/catalog-studio-wizard";
import { CatalogQuickIntake } from "@/components/catalog-quick-intake";
import { CatalogEvidencePanel } from "@/components/catalog-evidence-panel";
import { ScoringProfileManager } from "@/components/scoring-profile-manager";
import { SearchableSelect as AppSearchableSelect } from "@/components/searchable-select";

type AdminTab =
  | "overview"
  | "device-management"
  | "users"
  | "catalog"
  | "quick-intake"
  | "evidence"
  | "hardware"
  | "scoring"
  | "affiliates"
  | "subscriptions";

type CatalogWorkspace = "foundations" | "model" | "variant" | "records";
type CatalogManagementSection = "model" | "variants";
type VariantEditorSection = "identity" | "hardware" | "scores" | "details";
type VariantEditMode = "full" | "scores";

type DeviceModelForm = {
  name: string;
  slug: string;
  product_family_id: string;
  release_status_id: string;
  internal_codename: string;
  generation_label: string;
  announcement_date: string;
  release_date: string;
  end_of_sale_date: string;
  end_of_support_date: string;
  cover_image_url: string;
  summary: string;
  description: string;
};

type EditableDeviceModel = DeviceModelForm & { id: string };

type PerformanceResultForm = {
  benchmark_id: string;
  score: string;
  subscore_name: string;
  tested_at: string;
  os_version: string;
  app_version: string;
  power_mode: string;
  ambient_temp_c: string;
  test_environment_note: string;
  is_thermal_throttled: boolean;
};

type BenchmarkDefinition = {
  id: string;
  name: string;
  version?: string | null;
  benchmark_type: string;
  higher_is_better?: boolean;
  unit?: { name?: string; symbol: string } | null;
};

type ScoreMetricInputForm = {
  metric_key: string;
  raw_value: string;
  unit: string;
  normalized_score: string;
  source_label: string;
};

type HardwarePickerItem = {
  id: string;
  name?: string | null;
  slug?: string | null;
  manufacturer?: { name?: string | null } | null;
  organization?: { name?: string | null } | null;
  memory_type?: string | null;
  storage_type?: string | null;
  generation?: string | null;
};

type HardwareAssignmentCatalog = {
  chipsets: HardwarePickerItem[];
  cpus: HardwarePickerItem[];
  gpus: HardwarePickerItem[];
  npus: HardwarePickerItem[];
  modems: HardwarePickerItem[];
  memory: HardwarePickerItem[];
  storage: HardwarePickerItem[];
};

const MODULE_SCORE_FIELDS = [
  {
    kind: "chipset",
    moduleKey: "chipset_id",
    scoreKey: "chipset_score",
    catalogKey: "chipsets",
    label: "Chipset / SoC",
    weight: 20,
  },
  {
    kind: "cpu",
    moduleKey: "cpu_id",
    scoreKey: "cpu_score",
    catalogKey: "cpus",
    label: "CPU",
    weight: 25,
  },
  {
    kind: "gpu",
    moduleKey: "gpu_id",
    scoreKey: "gpu_score",
    catalogKey: "gpus",
    label: "GPU",
    weight: 20,
  },
  {
    kind: "npu",
    moduleKey: "npu_id",
    scoreKey: "npu_score",
    catalogKey: "npus",
    label: "NPU / AI",
    weight: 10,
  },
  {
    kind: "modem",
    moduleKey: "modem_id",
    scoreKey: "modem_score",
    catalogKey: "modems",
    label: "Modem",
    weight: 0,
  },
  {
    kind: "memory-standard",
    moduleKey: "memory_standard_id",
    scoreKey: "memory_score",
    catalogKey: "memory",
    label: "RAM",
    weight: 15,
  },
  {
    kind: "storage-standard",
    moduleKey: "storage_standard_id",
    scoreKey: "storage_score",
    catalogKey: "storage",
    label: "Lưu trữ",
    weight: 10,
  },
] as const;

function isModuleScoreField(key: PropertyKey) {
  return MODULE_SCORE_FIELDS.some((field) => field.scoreKey === key);
}

const catalogWorkspaceSteps: Array<{
  id: CatalogWorkspace;
  label: string;
  description: string;
  icon: typeof Layers3;
}> = [
  {
    id: "foundations",
    label: "Dữ liệu nền",
    description: "Hãng, danh mục, dòng sản phẩm",
    icon: Layers3,
  },
  {
    id: "model",
    label: "Mẫu thiết bị",
    description: "Tên máy và vòng đời",
    icon: Smartphone,
  },
  {
    id: "variant",
    label: "Phiên bản",
    description: "SKU, giá và thông số",
    icon: Database,
  },
  {
    id: "records",
    label: "Quản lý",
    description: "Kiểm tra bản ghi đã tạo",
    icon: ListChecks,
  },
];

const editorTabs: Array<{
  id: Exclude<AdminTab, "users" | "subscriptions" | "hardware">;
  label: string;
  icon: typeof Layers3;
}> = [
  { id: "overview", label: "Tổng quan", icon: Layers3 },
  {
    id: "device-management",
    label: "Quản lý thiết bị",
    icon: ListChecks,
  },
  { id: "catalog", label: "Tạo thiết bị", icon: Smartphone },
  { id: "quick-intake", label: "Nhập nhanh", icon: FileText },
  { id: "evidence", label: "Bằng chứng", icon: ShieldCheck },
  { id: "affiliates", label: "Đối tác", icon: Link2 },
];

const adminOnlyTabs: Array<{
  id: "users" | "subscriptions" | "hardware" | "scoring";
  label: string;
  icon: typeof Users;
}> = [
  { id: "users", label: "Người dùng", icon: Users },
  { id: "hardware", label: "Phần cứng", icon: Cpu },
  { id: "scoring", label: "Công thức điểm", icon: Settings2 },
  { id: "subscriptions", label: "Gói đăng ký", icon: BadgeCheck },
];

const preferredAdminTabOrder: AdminTab[] = [
  "overview",
  "device-management",
  "quick-intake",
  "evidence",
  "catalog",
  "hardware",
  "scoring",
  "affiliates",
  "users",
  "subscriptions",
];

const roles = ["reader", "contributor", "editor", "moderator", "admin"];

const hardwareModuleOptions: Array<{
  value: AdminHardwareModuleKind;
  label: string;
  description: string;
  icon: typeof Cpu;
  categoryLabel?: string;
  categoryPlaceholder?: string;
  categoryRequired?: boolean;
  organizationRequired?: boolean;
}> = [
  {
    value: "chipset",
    label: "Chipset",
    description: "SoC và bộ điều khiển tích hợp",
    icon: Layers3,
    categoryLabel: "Loại chipset",
    categoryPlaceholder: "soc",
    categoryRequired: true,
    organizationRequired: true,
  },
  {
    value: "cpu",
    label: "CPU",
    description: "Nhân xử lý và vi kiến trúc",
    icon: Cpu,
  },
  {
    value: "gpu",
    label: "GPU",
    description: "Đồ họa và API tăng tốc",
    icon: Gauge,
  },
  {
    value: "npu",
    label: "NPU",
    description: "Bộ tăng tốc AI chuyên dụng",
    icon: Sparkles,
  },
  {
    value: "modem",
    label: "Modem",
    description: "Mạng di động và vệ tinh",
    icon: Globe2,
  },
  {
    value: "memory-standard",
    label: "RAM",
    description: "RAM, tốc độ và băng thông",
    icon: Database,
    categoryLabel: "Loại bộ nhớ",
    categoryPlaceholder: "LPDDR",
  },
  {
    value: "storage-standard",
    label: "Lưu trữ",
    description: "UFS, eMMC và giao tiếp lưu trữ",
    icon: Database,
    categoryLabel: "Loại bộ nhớ trong",
    categoryPlaceholder: "UFS",
  },
];

type HardwareModuleForm = {
  kind: AdminHardwareModuleKind;
  name: string;
  slug: string;
  organization_id: string;
  category: string;
  description: string;
  image_url: string;
  image_source_url: string;
  model_code: string;
  supports_64bit: string;
  integrated_5g: string;
  integrated_wifi: string;
  max_ram_gb: string;
  max_display_resolution: string;
  max_camera_mp: string;
  announcement_date: string;
  release_date: string;
  cpu_id: string;
  gpu_id: string;
  npu_id: string;
  modem_id: string;
  modem_is_integrated: string;
  chipset_cpu_name: string;
  chipset_cpu_isa: string;
  chipset_cpu_microarchitecture: string;
  chipset_cpu_core_count: string;
  chipset_cpu_max_frequency_mhz: string;
  chipset_cpu_cluster_1_name: string;
  chipset_cpu_cluster_1_architecture: string;
  chipset_cpu_cluster_1_core_count: string;
  chipset_cpu_cluster_1_clock_ghz: string;
  chipset_cpu_cluster_2_name: string;
  chipset_cpu_cluster_2_architecture: string;
  chipset_cpu_cluster_2_core_count: string;
  chipset_cpu_cluster_2_clock_ghz: string;
  chipset_cpu_cluster_3_name: string;
  chipset_cpu_cluster_3_architecture: string;
  chipset_cpu_cluster_3_core_count: string;
  chipset_cpu_cluster_3_clock_ghz: string;
  chipset_gpu_name: string;
  chipset_gpu_generation: string;
  chipset_gpu_clock_mhz: string;
  chipset_gpu_api_support: string;
  chipset_gpu_opengl_version: string;
  chipset_gpu_opencl_version: string;
  chipset_gpu_vulkan_version: string;
  chipset_gpu_ray_tracing: string;
  chipset_npu_name: string;
  chipset_npu_tops: string;
  chipset_npu_ai_engine_version: string;
  chipset_npu_dsp_name: string;
  chipset_npu_tensor_accelerator: string;
  chipset_npu_supports_int8: string;
  chipset_npu_supports_fp16: string;
  chipset_npu_quantization: string;
  core_count: string;
  thread_count: string;
  big_little: string;
  isa_name: string;
  microarchitecture: string;
  core_type: string;
  max_frequency_mhz: string;
  min_frequency_mhz: string;
  l1_instruction_cache: string;
  l1_data_cache: string;
  l2_cache: string;
  l3_cache: string;
  simd_extension: string;
  virtualization: string;
  out_of_order: string;
  smt: string;
  shader_units: string;
  compute_units: string;
  clock_mhz: string;
  fp32_gflops: string;
  ray_tracing_support: string;
  api_support: string;
  gpu_generation: string;
  opengl_version: string;
  opencl_version: string;
  vulkan_version: string;
  directx_feature_level: string;
  metal_support: string;
  cuda_support: string;
  video_decode_codecs: string;
  video_encode_codecs: string;
  tops: string;
  tops_int8: string;
  tops_int4: string;
  tops_fp16: string;
  dedicated_npu: string;
  dsp_name: string;
  ai_engine_version: string;
  tensor_accelerator: string;
  supports_int8: string;
  supports_fp16: string;
  supports_fp32: string;
  quantization: string;
  max_downlink_mbps: string;
  max_uplink_mbps: string;
  supports_mmwave: string;
  supports_satellite: string;
  supported_5g_modes: string;
  lte_category: string;
  supports_5g_nr: string;
  carrier_aggregation: string;
  volte: string;
  vonr: string;
  dual_sim_capability: string;
  supported_technologies: string;
  generation: string;
  max_data_rate_mtps: string;
  typical_data_rate_mtps: string;
  jedec_standard: string;
  prefetch: string;
  ecc: string;
  dual_channel: string;
  voltage: string;
  bandwidth_gbps: string;
  channel_width_bits: string;
  maximum_capacity_gb: string;
  is_mobile: string;
  release_year: string;
  interface: string;
  half_duplex: string;
  full_duplex: string;
  command_queue: string;
  boot_partition: string;
  rpmb: string;
  trim: string;
  secure_erase: string;
  hs200: string;
  hs400: string;
  kernel_type: string;
  kernel_name: string;
  license_name: string;
  is_open_source: string;
  initial_release_date: string;
  os_type: string;
  supported_architectures: string;
};

type HardwareDetailKey = Exclude<
  keyof HardwareModuleForm,
  | "kind"
  | "name"
  | "slug"
  | "organization_id"
  | "category"
  | "description"
  | "image_url"
  | "image_source_url"
  | "cpu_id"
  | "gpu_id"
  | "npu_id"
  | "modem_id"
  | "modem_is_integrated"
>;

type HardwareDetailField = {
  key: HardwareDetailKey;
  label: string;
  type?: "text" | "number" | "date" | "boolean";
  min?: number;
  step?: string;
  placeholder?: string;
};

const hardwareDetailFields: Record<
  AdminHardwareModuleKind,
  HardwareDetailField[]
> = {
  chipset: [
    { key: "model_code", label: "Mã mẫu" },
    { key: "supports_64bit", label: "Hỗ trợ 64-bit", type: "boolean" },
    { key: "integrated_5g", label: "Tích hợp 5G", type: "boolean" },
    { key: "integrated_wifi", label: "Tích hợp Wi-Fi", type: "boolean" },
    { key: "max_ram_gb", label: "RAM tối đa (GB)", type: "number", min: 0 },
    { key: "max_display_resolution", label: "Độ phân giải màn hình tối đa" },
    {
      key: "max_camera_mp",
      label: "Máy ảnh tối đa (MP)",
      type: "number",
      min: 0,
    },
    { key: "announcement_date", label: "Ngày công bố", type: "date" },
    { key: "release_date", label: "Ngày ra mắt", type: "date" },
  ],
  cpu: [
    {
      key: "core_count",
      label: "Tổng số nhân",
      type: "number",
      min: 0,
      placeholder: "8",
    },
    { key: "isa_name", label: "Tập lệnh", placeholder: "ARMv9-A" },
    {
      key: "microarchitecture",
      label: "Vi kiến trúc",
      placeholder: "Cortex-X2 / Cortex-A710 / Cortex-A510",
    },
    {
      key: "max_frequency_mhz",
      label: "Xung tối đa (MHz)",
      type: "number",
      min: 0,
      placeholder: "3000",
    },
    { key: "supports_64bit", label: "Hỗ trợ 64-bit", type: "boolean" },
  ],
  gpu: [
    { key: "gpu_generation", label: "Thế hệ", placeholder: "Adreno 7" },
    { key: "clock_mhz", label: "Xung (MHz)", type: "number", min: 0 },
    { key: "opengl_version", label: "OpenGL" },
    { key: "opencl_version", label: "OpenCL" },
    { key: "vulkan_version", label: "Vulkan" },
    { key: "ray_tracing_support", label: "Hỗ trợ dò tia", type: "boolean" },
  ],
  npu: [
    {
      key: "tops",
      label: "Hiệu năng (TOPS)",
      type: "number",
      min: 0,
      step: "any",
    },
    {
      key: "ai_engine_version",
      label: "Thế hệ AI engine",
      placeholder: "7th Gen Qualcomm AI Engine",
    },
    { key: "dsp_name", label: "DSP", placeholder: "Qualcomm Hexagon" },
    { key: "tensor_accelerator", label: "Tensor accelerator" },
    { key: "supports_int8", label: "Hỗ trợ INT8", type: "boolean" },
    { key: "supports_fp16", label: "Hỗ trợ FP16", type: "boolean" },
  ],
  modem: [
    {
      key: "max_downlink_mbps",
      label: "Tải xuống tối đa (Mbps)",
      type: "number",
      min: 0,
    },
    {
      key: "max_uplink_mbps",
      label: "Tải lên tối đa (Mbps)",
      type: "number",
      min: 0,
    },
    { key: "supports_5g_nr", label: "Hỗ trợ 5G NR", type: "boolean" },
    {
      key: "supported_5g_modes",
      label: "Chế độ 5G",
      placeholder: "SA, NSA",
    },
    { key: "lte_category", label: "LTE Category", placeholder: "Cat 24" },
    { key: "supports_mmwave", label: "Hỗ trợ mmWave", type: "boolean" },
    {
      key: "carrier_aggregation",
      label: "Gộp sóng mang",
      type: "boolean",
    },
    {
      key: "dual_sim_capability",
      label: "Chế độ hai SIM",
      placeholder: "DSDS, DSDA",
    },
    { key: "volte", label: "Hỗ trợ VoLTE", type: "boolean" },
    { key: "vonr", label: "Hỗ trợ VoNR", type: "boolean" },
    { key: "supports_satellite", label: "Hỗ trợ vệ tinh", type: "boolean" },
  ],
  "memory-standard": [
    { key: "generation", label: "Thế hệ" },
    { key: "jedec_standard", label: "Tiêu chuẩn JEDEC" },
    {
      key: "max_data_rate_mtps",
      label: "Tốc độ dữ liệu tối đa (MT/s)",
      type: "number",
      min: 0,
    },
    {
      key: "channel_width_bits",
      label: "Độ rộng kênh (bit)",
      type: "number",
      min: 0,
    },
    { key: "ecc", label: "Hỗ trợ ECC", type: "boolean" },
    { key: "release_year", label: "Năm ra mắt", type: "number", min: 1800 },
  ],
  "storage-standard": [
    { key: "generation", label: "Thế hệ" },
    { key: "jedec_standard", label: "Tiêu chuẩn JEDEC" },
    { key: "interface", label: "Giao tiếp" },
    { key: "full_duplex", label: "Hỗ trợ full-duplex", type: "boolean" },
    { key: "command_queue", label: "Hàng đợi lệnh", type: "boolean" },
    { key: "rpmb", label: "Vùng bảo mật RPMB", type: "boolean" },
    { key: "trim", label: "Hỗ trợ TRIM", type: "boolean" },
    { key: "secure_erase", label: "Xóa an toàn", type: "boolean" },
    { key: "release_year", label: "Năm ra mắt", type: "number", min: 1800 },
  ],
  "operating-system": [
    { key: "kernel_type", label: "Loại nhân hệ điều hành" },
    { key: "kernel_name", label: "Tên nhân hệ điều hành" },
    { key: "license_name", label: "Giấy phép" },
    { key: "is_open_source", label: "Mã nguồn mở", type: "boolean" },
    {
      key: "initial_release_date",
      label: "Ngày phát hành đầu tiên",
      type: "date",
    },
    { key: "os_type", label: "Loại hệ điều hành" },
    {
      key: "supported_architectures",
      label: "Kiến trúc được hỗ trợ",
      placeholder: "ARM64, x86-64",
    },
  ],
};

const standaloneChipsetComponentKinds = ["cpu", "gpu", "npu", "modem"] as const;
type StandaloneChipsetComponentKind =
  (typeof standaloneChipsetComponentKinds)[number];

const standaloneChipsetComponentConfig: Record<
  StandaloneChipsetComponentKind,
  {
    title: string;
    description: string;
    primaryLegend: string;
    primaryKeys: HardwareDetailKey[];
  }
> = {
  cpu: {
    title: "Thông tin CPU dùng trong chipset",
    description:
      "Các trường chính và cụm nhân khớp với CPU được khai báo trong luồng tạo chipset. Dữ liệu này sẽ được hiển thị khi CPU được tìm và liên kết vào một SoC.",
    primaryLegend: "Cấu hình CPU và cụm nhân",
    primaryKeys: [
      "isa_name",
      "core_count",
      "max_frequency_mhz",
      "microarchitecture",
      "supports_64bit",
    ],
  },
  gpu: {
    title: "Thông tin GPU dùng trong chipset",
    description:
      "Tên trường, đơn vị và khả năng đồ họa khớp với GPU trong luồng tạo chipset, giúp một bản ghi có thể được liên kết lại mà không cần nhập lại thông số.",
    primaryLegend: "Cấu hình GPU tích hợp",
    primaryKeys: [
      "gpu_generation",
      "clock_mhz",
      "opengl_version",
      "opencl_version",
      "vulkan_version",
      "ray_tracing_support",
    ],
  },
  npu: {
    title: "Thông tin NPU dùng trong chipset",
    description:
      "Các trường AI engine khớp với NPU trong luồng tạo chipset và được tái sử dụng nguyên vẹn khi liên kết NPU này với SoC.",
    primaryLegend: "Cấu hình NPU / AI engine",
    primaryKeys: [
      "tops",
      "ai_engine_version",
      "dsp_name",
      "tensor_accelerator",
      "supports_int8",
      "supports_fp16",
    ],
  },
  modem: {
    title: "Thông tin modem dùng trong chipset",
    description:
      "Các trường nhận diện chính được dùng ngay trong bộ chọn modem của chipset; thông tin mạng nâng cao vẫn được lưu trên cùng bản ghi liên kết.",
    primaryLegend: "Nhận diện modem khi liên kết",
    primaryKeys: [
      "max_downlink_mbps",
      "max_uplink_mbps",
      "supports_5g_nr",
      "supported_5g_modes",
      "lte_category",
      "supports_mmwave",
      "carrier_aggregation",
      "dual_sim_capability",
      "volte",
      "vonr",
      "supports_satellite",
    ],
  },
};

function isStandaloneChipsetComponentKind(
  kind: AdminHardwareModuleKind,
): kind is StandaloneChipsetComponentKind {
  return standaloneChipsetComponentKinds.includes(
    kind as StandaloneChipsetComponentKind,
  );
}

export function AdminConsole() {
  const { user, tokens, isLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [catalogDraftToResume, setCatalogDraftToResume] = useState<
    string | undefined
  >();
  const [hardwareDraftToResume, setHardwareDraftToResume] = useState<
    string | undefined
  >();
  const accessToken = tokens?.access_token;
  const isAdmin = user?.role === "admin";
  const canOperate = isAdmin || user?.role === "editor";

  if (isLoading) return <LoadingPanel label="Đang tải không gian quản trị" />;

  if (!canOperate || !accessToken) {
    return (
      <div className="app-page mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Cần quyền quản trị"
        />
      </div>
    );
  }

  const availableTabs = [...editorTabs, ...adminOnlyTabs];
  const tabs = isAdmin
    ? preferredAdminTabOrder.map(
        (tabId) => availableTabs.find((item) => item.id === tabId)!,
      )
    : editorTabs;
  return (
    <div className="app-page mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Quản trị
        </h1>
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShieldCheck size={16} />
          </span>
          <span className="min-w-0">
            <span className="block max-w-48 truncate text-sm font-semibold text-slate-900">
              {user.display_name || user.username || user.email}
            </span>
            <span className="block text-[11px] text-slate-500">
              {roleLabel(user.role)}
            </span>
          </span>
        </div>
      </header>

      <nav
        className="sticky top-16 z-20 -mx-4 flex gap-1.5 overflow-x-auto border-y border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-2.5"
        aria-label="Khu vực quản trị"
        role="tablist"
      >
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              role="tab"
              aria-selected={active}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                active
                  ? "bg-slate-950 text-white shadow-sm ring-1 ring-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tab === "overview" ? (
        <Overview
          accessToken={accessToken}
          isAdmin={isAdmin}
          onSelectTab={setTab}
        />
      ) : null}
      {tab === "users" && isAdmin ? (
        <UsersPanel accessToken={accessToken} />
      ) : null}
      {tab === "device-management" ? (
        <CatalogPanel
          key="device-management"
          accessToken={accessToken}
          initialWorkspace="records"
          showWorkflow={false}
          onCreateDevice={() => setTab("catalog")}
        />
      ) : null}
      {tab === "catalog" ? (
        <CatalogStudioWizard
          key={catalogDraftToResume ?? "new-device"}
          accessToken={accessToken}
          initialDraftId={catalogDraftToResume}
        />
      ) : null}
      {tab === "quick-intake" ? (
        <CatalogQuickIntake
          accessToken={accessToken}
          canCreateHardware={isAdmin}
          onContinueDevice={(draftId) => {
            setCatalogDraftToResume(draftId);
            setTab("catalog");
          }}
          onContinueHardware={(draftId) => {
            setHardwareDraftToResume(draftId);
            setTab("hardware");
          }}
        />
      ) : null}
      {tab === "evidence" ? (
        <CatalogEvidencePanel accessToken={accessToken} />
      ) : null}
      {tab === "hardware" && isAdmin ? (
        <HardwareModulesPanel
          key={hardwareDraftToResume ?? "new-hardware"}
          accessToken={accessToken}
          initialDraftId={hardwareDraftToResume}
        />
      ) : null}
      {tab === "scoring" && isAdmin ? (
        <ScoringProfileManager accessToken={accessToken} />
      ) : null}
      {tab === "affiliates" ? (
        <AffiliatesPanel accessToken={accessToken} />
      ) : null}
      {tab === "subscriptions" && isAdmin ? (
        <SubscriptionsPanel accessToken={accessToken} />
      ) : null}
    </div>
  );
}

function Overview({
  accessToken,
  isAdmin,
  onSelectTab,
}: {
  accessToken: string;
  isAdmin: boolean;
  onSelectTab: (tab: AdminTab) => void;
}) {
  const overview = useQuery({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: () => api.getAdminDashboardOverview(accessToken),
    refetchInterval: 60_000,
  });
  const rebuildKnowledge = useMutation({
    mutationFn: () => api.indexAiKnowledgeBase(accessToken),
    onSuccess: () => overview.refetch(),
  });

  if (overview.isLoading) {
    return <DashboardSkeleton />;
  }

  if (overview.error || !overview.data) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-rose-900">
              <AlertTriangle size={18} />
              Chưa tải được báo cáo quản trị
            </div>
            <p className="mt-2 text-sm leading-6 text-rose-800/80">
              Hãy kiểm tra dịch vụ API rồi thử tải lại. Các khu vực quản lý khác
              vẫn có thể sử dụng bình thường.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void overview.refetch()}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            <RefreshCw size={15} />
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  const data = overview.data;
  const kpis = [
    {
      label: "Mẫu thiết bị",
      value: data.kpis.device_models,
      detail: `${data.kpis.device_variants} phiên bản đang quản lý`,
      icon: <Smartphone size={18} />,
      tone: "blue" as const,
    },
    {
      label: "Độ phủ bảng điểm",
      value: `${formatAdminNumber(data.kpis.benchmark_coverage_percent)}%`,
      detail: `${data.score_health.fully_scored}/${data.score_health.total_variants} phiên bản đủ 100%`,
      icon: <Gauge size={18} />,
      tone:
        data.kpis.benchmark_coverage_percent >= 100
          ? ("emerald" as const)
          : ("amber" as const),
    },
    {
      label: "Wiki đã xuất bản",
      value: data.kpis.published_wiki,
      detail: `${data.engagement.wiki_views.toLocaleString("vi-VN")} lượt đọc`,
      icon: <BookOpen size={18} />,
      tone: "violet" as const,
    },
    {
      label: isAdmin ? "Người dùng hoạt động" : "Mô-đun phần cứng",
      value: isAdmin
        ? (data.kpis.active_users ?? 0)
        : data.inventory.hardware_modules,
      detail: isAdmin
        ? `${data.engagement.active_subscriptions} gói đang hoạt động`
        : `${data.inventory.hardware_by_kind.length} nhóm phần cứng`,
      icon: isAdmin ? <Users size={18} /> : <Cpu size={18} />,
      tone: "cyan" as const,
    },
    {
      label: "Kho AI",
      value: data.inventory.ai_chunks,
      detail: `${data.inventory.indexed_device_models} mẫu máy · ${data.inventory.indexed_knowledge_records} bản ghi tri thức`,
      icon: <Sparkles size={18} />,
      tone: "slate" as const,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="app-section-label">Báo cáo trực tiếp</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-slate-950">
            Toàn cảnh hệ thống
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Cập nhật lúc {formatAdminDateTime(data.generated_at)} · tự làm mới
            mỗi phút
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <button
            type="button"
            onClick={() => rebuildKnowledge.mutate()}
            disabled={rebuildKnowledge.isPending}
            className="app-button-secondary h-10 px-3.5"
          >
            <Sparkles
              size={15}
              className={rebuildKnowledge.isPending ? "animate-pulse" : ""}
            />
            {rebuildKnowledge.isPending
              ? "Đang đồng bộ kho AI..."
              : rebuildKnowledge.isError
                ? "Thử đồng bộ lại"
                : "Đồng bộ kho AI"}
          </button>
          <button
            type="button"
            onClick={() => void overview.refetch()}
            disabled={overview.isFetching}
            className="app-button-secondary h-10 px-3.5"
          >
            <RefreshCw
              size={15}
              className={overview.isFetching ? "animate-spin" : ""}
            />
            Làm mới báo cáo
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((item) => (
          <DashboardKpi key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <DashboardCard
          className="xl:col-span-8"
          eyebrow="Xu hướng 6 tháng"
          title="Hoạt động nội dung và danh mục"
          description="Số mẫu thiết bị, bài Wiki và tài khoản mới theo từng tháng."
          action={
            <ChartLegend
              items={[
                { label: "Thiết bị", color: "bg-rose-500" },
                { label: "Wiki", color: "bg-violet-500" },
                ...(isAdmin
                  ? [{ label: "Người dùng", color: "bg-sky-500" }]
                  : []),
              ]}
            />
          }
        >
          <MonthlyActivityChart
            data={data.monthly_activity}
            showUsers={isAdmin}
          />
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-4"
          eyebrow="Sức khỏe bảng điểm"
          title="Độ phủ benchmark"
          description="Tỷ lệ phiên bản có scorecard đủ toàn bộ chỉ số bắt buộc."
        >
          <ScoreHealthCard data={data.score_health} />
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-5"
          eyebrow="Cơ cấu danh mục"
          title="Thiết bị theo loại"
          description="Phân bố mẫu máy hiện có trong danh mục."
          action={
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {data.kpis.device_models} mẫu
            </span>
          }
        >
          <CategoryDistribution data={data.catalog_by_category} />
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-7"
          eyebrow="Chất lượng dữ liệu"
          title="Độ phủ theo mô-đun điểm"
          description="Giá trị trung bình trên scorecard mới nhất của mỗi phiên bản."
        >
          <ModuleCoverageChart data={data.module_coverage} />
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-5"
          eyebrow="Luồng nội dung"
          title="Trạng thái Wiki"
          description="Theo dõi bài đã xuất bản, lưu trữ và bản nháp."
        >
          <ContentPipeline data={data.content_statuses} />
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-7"
          eyebrow="Tương tác & tài nguyên"
          title="Chỉ số vận hành"
          description="Tín hiệu sử dụng và quy mô dữ liệu đang phục vụ hệ thống."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CompactStat
              icon={<Search size={17} />}
              label="Tìm kiếm 30 ngày"
              value={data.engagement.searches_30d}
            />
            <CompactStat
              icon={<MousePointerClick size={17} />}
              label="Nhấp đối tác 30 ngày"
              value={data.engagement.affiliate_clicks_30d}
            />
            <CompactStat
              icon={<BarChart3 size={17} />}
              label="Kết quả benchmark"
              value={data.inventory.benchmark_results}
            />
            <CompactStat
              icon={<Link2 size={17} />}
              label="Đối tác hoạt động"
              value={data.inventory.active_partners}
            />
          </div>
          <HardwareInventory data={data.inventory.hardware_by_kind} />
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-6"
          eyebrow="Cần chú ý"
          title="Việc nên xử lý tiếp"
          description="Ưu tiên được tạo trực tiếp từ độ phủ điểm và dữ liệu danh mục."
        >
          <AttentionList
            items={data.attention_items}
            onSelectTab={onSelectTab}
          />
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-6"
          eyebrow="Nhật ký gần đây"
          title="Hoạt động mới nhất"
          description="Các thay đổi gần nhất ở thiết bị, điểm số và Wiki."
        >
          <RecentActivity
            items={data.recent_activity}
            onSelectTab={onSelectTab}
          />
        </DashboardCard>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-semibold">Thao tác nhanh</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
            Thêm mẫu mới theo quy trình có hướng dẫn hoặc kiểm tra lại dữ liệu
            đang thiếu ngay từ dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectTab("catalog")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            <Plus size={15} />
            Tạo thiết bị
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("device-management")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Quản lý danh mục
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

type DashboardKpiTone =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "cyan"
  | "slate";

function DashboardKpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone: DashboardKpiTone;
}) {
  const tones: Record<
    DashboardKpiTone,
    { icon: string; accent: string; wash: string }
  > = {
    blue: {
      icon: "bg-blue-50 text-blue-700",
      accent: "bg-blue-500",
      wash: "from-blue-50/70",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-500",
      wash: "from-emerald-50/70",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      accent: "bg-amber-500",
      wash: "from-amber-50/70",
    },
    rose: {
      icon: "bg-rose-50 text-rose-700",
      accent: "bg-rose-500",
      wash: "from-rose-50/70",
    },
    violet: {
      icon: "bg-violet-50 text-violet-700",
      accent: "bg-violet-500",
      wash: "from-violet-50/70",
    },
    cyan: {
      icon: "bg-cyan-50 text-cyan-700",
      accent: "bg-cyan-500",
      wash: "from-cyan-50/70",
    },
    slate: {
      icon: "bg-slate-100 text-slate-700",
      accent: "bg-slate-500",
      wash: "from-slate-50",
    },
  };
  const style = tones[tone];

  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br ${style.wash} to-white p-4 shadow-sm`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${style.accent}`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          </p>
        </div>
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${style.icon}`}
        >
          {icon}
        </span>
      </div>
    </article>
  );
}

function DashboardCard({
  eyebrow,
  title,
  action,
  className = "",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </article>
  );
}

function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"
        >
          <span className={`size-2 rounded-full ${item.color}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function MonthlyActivityChart({
  data,
  showUsers,
}: {
  data: AdminDashboardOverview["monthly_activity"];
  showUsers: boolean;
}) {
  const max = Math.max(
    1,
    ...data.flatMap((item) => [
      item.device_models,
      item.wiki_articles,
      ...(showUsers ? [item.users] : []),
    ]),
  );

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[560px]">
        <div className="relative h-52 border-b border-slate-200">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {[100, 75, 50, 25].map((mark) => (
              <div
                key={mark}
                className="border-t border-dashed border-slate-100"
              />
            ))}
          </div>
          <div className="absolute inset-0 grid grid-cols-6 gap-3 px-2">
            {data.map((item) => (
              <div
                key={item.month}
                className="flex items-end justify-center gap-1.5"
              >
                <ChartBar
                  value={item.device_models}
                  max={max}
                  label={`${item.device_models} mẫu thiết bị`}
                  color="bg-rose-500"
                />
                <ChartBar
                  value={item.wiki_articles}
                  max={max}
                  label={`${item.wiki_articles} bài Wiki`}
                  color="bg-violet-500"
                />
                {showUsers ? (
                  <ChartBar
                    value={item.users}
                    max={max}
                    label={`${item.users} người dùng`}
                    color="bg-sky-500"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-6 gap-3 px-2">
          {data.map((item) => (
            <div
              key={item.month}
              className="text-center text-xs font-semibold text-slate-500"
            >
              {formatAdminMonth(item.month)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartBar({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const height = value === 0 ? 3 : Math.max(10, (value / max) * 100);
  return (
    <span
      className={`w-3.5 rounded-t-md transition-all sm:w-4 ${color}`}
      style={{ height: `${height}%` }}
      title={label}
      aria-label={label}
    />
  );
}

function ScoreHealthCard({
  data,
}: {
  data: AdminDashboardOverview["score_health"];
}) {
  const coverage =
    data.total_variants > 0
      ? Math.round((data.fully_scored / data.total_variants) * 1000) / 10
      : 0;
  const healthy = coverage >= 100;

  return (
    <div>
      <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
        <div
          className="relative grid size-36 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(${healthy ? "#10b981" : "#f59e0b"} ${Math.min(100, coverage) * 3.6}deg, #f1f5f9 0deg)`,
          }}
          aria-label={`${formatAdminNumber(coverage)} phần trăm phiên bản đủ điểm`}
        >
          <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-slate-950">
                {formatAdminNumber(coverage)}%
              </div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Đủ dữ liệu
              </div>
            </div>
          </div>
        </div>
        <div className="grid w-full flex-1 grid-cols-2 gap-2">
          <ScoreHealthStat
            label="Đủ 100%"
            value={data.fully_scored}
            tone="text-emerald-700"
          />
          <ScoreHealthStat
            label="Chưa đủ"
            value={data.partial_scored}
            tone="text-amber-700"
          />
          <ScoreHealthStat
            label="Chưa có điểm"
            value={data.missing_scorecards}
            tone="text-rose-700"
          />
          <ScoreHealthStat
            label="Điểm trung bình"
            value={formatAdminNumber(data.average_score)}
            tone="text-slate-950"
          />
        </div>
      </div>
      <div
        className={`mt-5 flex items-start gap-2 rounded-xl p-3 text-sm leading-5 ${
          healthy
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {healthy ? (
          <CircleCheckBig className="mt-0.5 shrink-0" size={16} />
        ) : (
          <AlertTriangle className="mt-0.5 shrink-0" size={16} />
        )}
        <span>
          {healthy
            ? "Toàn bộ phiên bản có scorecard đầy đủ."
            : `Độ phủ trung bình hiện tại ${formatAdminNumber(data.average_coverage)}%.`}
        </span>
      </div>
    </div>
  );
}

function ScoreHealthStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className={`text-lg font-semibold tracking-tight ${tone}`}>{value}</p>
      <p className="mt-0.5 text-xs leading-4 text-slate-500">{label}</p>
    </div>
  );
}

function CategoryDistribution({
  data,
}: {
  data: AdminDashboardOverview["catalog_by_category"];
}) {
  if (!data.length) return <DashboardEmpty label="Chưa có mẫu thiết bị." />;
  const max = Math.max(1, ...data.map((item) => item.count));

  return (
    <div className="space-y-4">
      {data.slice(0, 8).map((item, index) => (
        <div key={item.slug}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">
              {localizeDashboardCategory(item.slug, item.label)}
            </span>
            <span className="shrink-0 font-semibold text-slate-950">
              {item.count}
              <span className="ml-1 font-normal text-slate-400">
                · {formatAdminNumber(item.percent)}%
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                [
                  "bg-rose-500",
                  "bg-violet-500",
                  "bg-sky-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                ][index % 5]
              }`}
              style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ModuleCoverageChart({
  data,
}: {
  data: AdminDashboardOverview["module_coverage"];
}) {
  if (!data.length) {
    return <DashboardEmpty label="Chưa có dữ liệu mô-đun điểm." />;
  }

  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {data.map((item) => {
        const complete = item.coverage >= 99.95;
        return (
          <div key={item.key}>
            <div className="mb-1.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">
                  {item.device_count} thiết bị · điểm TB{" "}
                  {formatAdminNumber(item.average_score)}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  complete ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {formatAdminNumber(item.coverage)}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  complete ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, item.coverage)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContentPipeline({
  data,
}: {
  data: AdminDashboardOverview["content_statuses"];
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors: Record<string, { bar: string; dot: string; text: string }> = {
    published: {
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
      text: "text-emerald-700",
    },
    in_review: {
      bar: "bg-amber-500",
      dot: "bg-amber-500",
      text: "text-amber-700",
    },
    draft: {
      bar: "bg-sky-500",
      dot: "bg-sky-500",
      text: "text-sky-700",
    },
    archived: {
      bar: "bg-slate-400",
      dot: "bg-slate-400",
      text: "text-slate-600",
    },
  };

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {data
          .filter((item) => item.count > 0)
          .map((item) => (
            <div
              key={item.status}
              className={colors[item.status]?.bar ?? "bg-slate-400"}
              style={{
                width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
              }}
              title={`${item.label}: ${item.count}`}
            />
          ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {data.map((item) => {
          const style = colors[item.status] ?? colors.archived;
          return (
            <div key={item.status} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`size-2 rounded-full ${style.dot}`} />
                {item.label}
              </div>
              <p className={`mt-2 text-xl font-semibold ${style.text}`}>
                {item.count.toLocaleString("vi-VN")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompactStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="text-rose-700">{icon}</span>
        <span className="text-xs font-medium leading-4">{label}</span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

function HardwareInventory({
  data,
}: {
  data: AdminDashboardOverview["inventory"]["hardware_by_kind"];
}) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          Kho mô-đun phần cứng
        </p>
        <span className="text-xs text-slate-400">{data.length} nhóm</span>
      </div>
      <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {data.map((item) => (
          <div
            key={item.key}
            className="grid grid-cols-[84px_1fr_auto] items-center gap-2"
          >
            <span className="truncate text-xs font-medium text-slate-500">
              {item.label}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-slate-700"
                style={{
                  width: `${Math.max(4, (item.count / max) * 100)}%`,
                }}
              />
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttentionList({
  items,
  onSelectTab,
}: {
  items: AdminDashboardOverview["attention_items"];
  onSelectTab: (tab: AdminTab) => void;
}) {
  const styles = {
    danger: {
      icon: "bg-rose-50 text-rose-700",
      count: "bg-rose-100 text-rose-800",
    },
    warning: {
      icon: "bg-amber-50 text-amber-700",
      count: "bg-amber-100 text-amber-800",
    },
    info: {
      icon: "bg-sky-50 text-sky-700",
      count: "bg-sky-100 text-sky-800",
    },
    success: {
      icon: "bg-emerald-50 text-emerald-700",
      count: "bg-emerald-100 text-emerald-800",
    },
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const style = styles[item.tone];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.tab)}
            className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-rose-200 hover:bg-rose-50/30"
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-lg ${style.icon}`}
            >
              {item.tone === "success" ? (
                <CircleCheckBig size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                {item.detail}
              </span>
            </span>
            {item.count > 0 ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.count}`}
              >
                {item.count}
              </span>
            ) : null}
            <ArrowRight
              className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-rose-600"
              size={16}
            />
          </button>
        );
      })}
    </div>
  );
}

function RecentActivity({
  items,
  onSelectTab,
}: {
  items: AdminDashboardOverview["recent_activity"];
  onSelectTab: (tab: AdminTab) => void;
}) {
  const icons = {
    device: <Smartphone size={15} />,
    wiki: <BookOpen size={15} />,
    score: <Gauge size={15} />,
  };

  if (!items.length) {
    return <DashboardEmpty label="Chưa có hoạt động gần đây." />;
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectTab(item.tab)}
          className="group flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-rose-50 group-hover:text-rose-700">
            {icons[item.type]}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-800">
              {item.label}
            </span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {item.detail}
            </span>
          </span>
          <span className="shrink-0 text-xs text-slate-400">
            {formatAdminRelativeTime(item.occurred_at)}
          </span>
        </button>
      ))}
    </div>
  );
}

function DashboardEmpty({ label }: { label: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      {label}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="space-y-5" aria-label="Đang tải báo cáo quản trị">
      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-8" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-4" />
      </div>
    </section>
  );
}

function formatAdminNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatAdminDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatAdminMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return `T${month}/${String(year).slice(-2)}`;
}

function formatAdminRelativeTime(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function localizeDashboardCategory(slug: string, fallback: string) {
  const labels: Record<string, string> = {
    smartphone: "Điện thoại",
    phone: "Điện thoại",
    laptop: "Máy tính xách tay",
    tablet: "Máy tính bảng",
    smartwatch: "Đồng hồ thông minh",
    desktop: "Máy tính để bàn",
    monitor: "Màn hình",
    camera: "Máy ảnh",
    headphones: "Tai nghe",
    "gaming-console": "Máy chơi game",
  };
  return labels[slug] ?? fallback;
}

function UsersPanel({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.listUsers({ page: 1, pageSize: 100 }, accessToken),
  });
  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.updateUserRole(id, role, accessToken),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
  const updateActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.setUserActive(id, isActive, accessToken),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <Panel
      title="Quyền truy cập người dùng"
      description="Thay đổi vai trò vận hành, bật hoặc tạm ngưng tài khoản mà không xóa lịch sử."
    >
      <PanelError
        error={users.error ?? updateRole.error ?? updateActive.error}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Người dùng</th>
              <th className="px-3 py-3">Vai trò</th>
              <th className="px-3 py-3">Đăng nhập gần nhất</th>
              <th className="px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.data?.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3">
                  <p className="font-medium text-slate-900">
                    {item.display_name ?? item.username ?? item.email}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.email}</p>
                </td>
                <td className="px-3 py-3">
                  <AppSearchableSelect
                    label={`Vai trò của ${item.email}`}
                    labelClassName="sr-only"
                    controlClassName="h-9 rounded-md"
                    value={item.role}
                    onChange={(role) =>
                      updateRole.mutate({
                        id: item.id,
                        role,
                      })
                    }
                    disabled={updateRole.isPending}
                    clearable={false}
                    options={roles.map((role) => ({
                      value: role,
                      label: roleLabel(role),
                    }))}
                  />
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.last_login_at
                    ? new Date(item.last_login_at).toLocaleDateString("vi-VN")
                    : "Chưa từng"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {item.is_active ? "Đang hoạt động" : "Tạm ngưng"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      updateActive.mutate({
                        id: item.id,
                        isActive: !item.is_active,
                      })
                    }
                    disabled={updateActive.isPending}
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
                  >
                    {item.is_active ? "Tạm ngưng" : "Kích hoạt"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users.data?.items.length && !users.isLoading ? (
        <EmptyRow label="Không tìm thấy người dùng." />
      ) : null}
    </Panel>
  );
}

function CatalogFoundationsPanel({
  accessToken,
  onFamilyCreated,
}: {
  accessToken: string;
  onFamilyCreated: (id: string, name: string) => void;
}) {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<
    "organization" | "category" | "family"
  >("organization");
  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    slug: "",
    short_name: "",
    legal_name: "",
    country_code: "",
    founded_year: "",
    website_url: "",
    logo_url: "",
    description: "",
    is_active: true,
  });
  const [organizationLogoFile, setOrganizationLogoFile] = useState<File | null>(
    null,
  );
  const [organizationNotice, setOrganizationNotice] = useState<{
    tone: "success" | "warning";
    message: string;
  } | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    parent_category_id: "",
    description: "",
    icon_url: "",
    display_order: "0",
    is_active: true,
  });
  const [familyForm, setFamilyForm] = useState(createInitialFamilyForm);
  const [familySearch, setFamilySearch] = useState("");
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [familyToRemove, setFamilyToRemove] = useState<ProductFamily | null>(
    null,
  );
  const organizations = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => api.listOrganizations({ page: 1, pageSize: 100 }),
  });
  const categories = useQuery({
    queryKey: ["admin", "device-categories"],
    queryFn: () => api.listDeviceCategories({ page: 1, pageSize: 100 }),
  });
  const families = useQuery({
    queryKey: ["admin", "foundation-product-families", familySearch],
    queryFn: () =>
      api.listProductFamilies({
        page: 1,
        pageSize: 24,
        q: familySearch.trim() || undefined,
        include_inactive: true,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });
  const createOrganization = useMutation({
    mutationFn: async () => {
      const created = await api.createOrganization(
        {
          name: organizationForm.name,
          slug: organizationForm.slug,
          short_name: optionalText(organizationForm.short_name),
          legal_name: optionalText(organizationForm.legal_name),
          country_code: optionalText(
            organizationForm.country_code,
          )?.toUpperCase(),
          founded_year: optionalInteger(organizationForm.founded_year),
          website_url: optionalText(organizationForm.website_url),
          logo_url: optionalText(organizationForm.logo_url),
          description: organizationForm.description.trim(),
          is_active: organizationForm.is_active,
        },
        accessToken,
      );

      if (!organizationLogoFile) {
        return { organization: created.data, logoWarning: null };
      }

      try {
        const upload = await api.createMediaUpload(
          {
            filename: organizationLogoFile.name,
            mime_type: organizationLogoFile.type,
            asset_type: "image",
            file_size_bytes: organizationLogoFile.size,
            entity_table: "organizations",
            entity_id: created.data.id,
            role: "logo",
            alt_text: `Logo ${created.data.name}`,
            is_primary: true,
          },
          accessToken,
        );
        const uploaded = await fetch(upload.data.upload_url, {
          method: "PUT",
          body: organizationLogoFile,
          headers: { "Content-Type": organizationLogoFile.type },
        });
        if (!uploaded.ok) {
          throw new Error(`Kho ảnh trả về mã ${uploaded.status}.`);
        }
        await api.completeMediaUpload(upload.data.id, undefined, accessToken);
        if (!upload.data.public_url) {
          throw new Error(
            "Kho ảnh chưa có địa chỉ công khai để hiển thị logo.",
          );
        }
        await api.updateOrganization(
          created.data.id,
          { logo_url: upload.data.public_url },
          accessToken,
        );
        return { organization: created.data, logoWarning: null };
      } catch (error) {
        return {
          organization: created.data,
          logoWarning:
            error instanceof Error
              ? error.message
              : "Không thể tải logo lên kho ảnh.",
        };
      }
    },
    onMutate: () => {
      setOrganizationNotice(null);
    },
    onSuccess: ({ organization, logoWarning }) => {
      setOrganizationForm({
        name: "",
        slug: "",
        short_name: "",
        legal_name: "",
        country_code: "",
        founded_year: "",
        website_url: "",
        logo_url: "",
        description: "",
        is_active: true,
      });
      setOrganizationLogoFile(null);
      setOrganizationNotice(
        logoWarning
          ? {
              tone: "warning",
              message: `Đã tạo ${organization.name}, nhưng logo chưa được lưu. ${logoWarning}`,
            }
          : {
              tone: "success",
              message: `Đã tạo ${organization.name}${organizationLogoFile ? " và tải logo thành công" : ""}.`,
            },
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "organizations"],
      });
    },
  });
  const createCategory = useMutation({
    mutationFn: () =>
      api.createDeviceCategory(
        {
          name: categoryForm.name,
          slug: categoryForm.slug,
          parent_category_id: optionalText(categoryForm.parent_category_id),
          description: optionalText(categoryForm.description),
          icon_url: optionalText(categoryForm.icon_url),
          display_order: optionalInteger(categoryForm.display_order),
          is_active: categoryForm.is_active,
        },
        accessToken,
      ),
    onSuccess: () => {
      setCategoryForm({
        name: "",
        slug: "",
        parent_category_id: "",
        description: "",
        icon_url: "",
        display_order: "0",
        is_active: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "device-categories"],
      });
    },
  });
  const saveFamily = useMutation({
    mutationFn: () => {
      const payload = buildProductFamilyPayload(familyForm);
      return editingFamilyId
        ? api.updateProductFamily(editingFamilyId, payload, accessToken)
        : api.createProductFamily(payload, accessToken);
    },
    onSuccess: (result) => {
      const wasCreating = !editingFamilyId;
      setFamilyForm(createInitialFamilyForm());
      setEditingFamilyId(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "product-families"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "foundation-product-families"],
      });
      if (wasCreating) {
        onFamilyCreated(result.data.id, result.data.name);
      }
    },
  });
  const deleteFamily = useMutation({
    mutationFn: (id: string) => api.deleteProductFamily(id, accessToken),
    onSuccess: () => {
      setFamilyToRemove(null);
      if (editingFamilyId) {
        setEditingFamilyId(null);
        setFamilyForm(createInitialFamilyForm());
      }
      void queryClient.invalidateQueries({
        queryKey: ["admin", "product-families"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "foundation-product-families"],
      });
    },
  });

  return (
    <Panel
      title="Bước 1 · Chuẩn bị dữ liệu nền"
      description="Chỉ tạo mục còn thiếu. Một mẫu thiết bị cần thuộc đúng dòng sản phẩm, thương hiệu và danh mục trước khi nhập thông số."
    >
      <div className="mb-6 grid gap-2 rounded-xl bg-slate-100 p-1.5 sm:grid-cols-3">
        {[
          ["organization", "Tổ chức"],
          ["category", "Danh mục thiết bị"],
          ["family", "Dòng sản phẩm"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setSection(value as "organization" | "category" | "family")
            }
            className={`min-h-10 rounded-lg px-3 text-sm font-medium transition ${section === value ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/70 hover:text-slate-950"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "organization" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createOrganization.mutate();
          }}
        >
          <PanelError error={createOrganization.error} />
          {organizationNotice ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm leading-6 ${
                organizationNotice.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
              role="status"
            >
              {organizationNotice.message}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TextInput
              label="Tên"
              value={organizationForm.name}
              onChange={(name) =>
                setOrganizationForm((current) => ({
                  ...current,
                  name,
                  slug: syncSlug(current.name, current.slug, name),
                }))
              }
              required
            />
            <TextInput
              label="Đường dẫn định danh (slug)"
              placeholder="apple"
              hint="Được tự điền theo tên; bạn vẫn có thể chỉnh trước khi lưu."
              value={organizationForm.slug}
              onChange={(slug) =>
                setOrganizationForm((current) => ({ ...current, slug }))
              }
              required
            />
            <TextInput
              label="Tên ngắn"
              value={organizationForm.short_name}
              onChange={(short_name) =>
                setOrganizationForm((current) => ({ ...current, short_name }))
              }
            />
            <TextInput
              label="Tên pháp lý"
              value={organizationForm.legal_name}
              onChange={(legal_name) =>
                setOrganizationForm((current) => ({ ...current, legal_name }))
              }
            />
            <TextInput
              label="Mã quốc gia"
              placeholder="US"
              maxLength={2}
              value={organizationForm.country_code}
              onChange={(country_code) =>
                setOrganizationForm((current) => ({
                  ...current,
                  country_code: country_code.toUpperCase(),
                }))
              }
            />
            <TextInput
              label="Năm thành lập"
              type="number"
              min="1800"
              max="2200"
              value={organizationForm.founded_year}
              onChange={(founded_year) =>
                setOrganizationForm((current) => ({ ...current, founded_year }))
              }
            />
            <TextInput
              label="URL website"
              type="url"
              value={organizationForm.website_url}
              onChange={(website_url) =>
                setOrganizationForm((current) => ({ ...current, website_url }))
              }
            />
          </div>
          <CatalogImageInput
            file={organizationLogoFile}
            url={organizationForm.logo_url}
            disabled={createOrganization.isPending}
            onFileChange={(file) => {
              setOrganizationLogoFile(file);
              if (file) {
                setOrganizationForm((current) => ({
                  ...current,
                  logo_url: "",
                }));
              }
            }}
            onUrlChange={(logo_url) => {
              setOrganizationForm((current) => ({ ...current, logo_url }));
              if (logo_url.trim()) setOrganizationLogoFile(null);
            }}
          />
          <TextAreaInput
            label="Mô tả tổ chức"
            hint={`${organizationForm.description.trim().length}/80 ký tự tối thiểu · Nêu lĩnh vực, vai trò, sản phẩm và công nghệ nổi bật.`}
            minLength={80}
            rows={5}
            value={organizationForm.description}
            onChange={(description) =>
              setOrganizationForm((current) => ({ ...current, description }))
            }
            required
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CheckboxInput
              label="Tổ chức đang hoạt động"
              checked={organizationForm.is_active}
              onChange={(is_active) =>
                setOrganizationForm((current) => ({ ...current, is_active }))
              }
            />
            <PrimaryButton
              disabled={
                createOrganization.isPending ||
                !organizationForm.name ||
                !organizationForm.slug ||
                organizationForm.description.trim().length < 80
              }
              pending={createOrganization.isPending}
            >
              Tạo tổ chức
            </PrimaryButton>
          </div>
        </form>
      ) : null}

      {section === "category" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createCategory.mutate();
          }}
        >
          <PanelError error={createCategory.error ?? categories.error} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TextInput
              label="Tên"
              value={categoryForm.name}
              onChange={(name) =>
                setCategoryForm((current) => ({
                  ...current,
                  name,
                  slug: syncSlug(current.name, current.slug, name),
                }))
              }
              required
            />
            <TextInput
              label="Đường dẫn định danh (slug)"
              placeholder="smartphone"
              hint="Được tự điền theo tên; bạn vẫn có thể chỉnh trước khi lưu."
              value={categoryForm.slug}
              onChange={(slug) =>
                setCategoryForm((current) => ({ ...current, slug }))
              }
              required
            />
            <SearchableSelect
              label="Danh mục cha"
              value={categoryForm.parent_category_id}
              onChange={(parent_category_id) =>
                setCategoryForm((current) => ({
                  ...current,
                  parent_category_id,
                }))
              }
              placeholder="Không có (danh mục cấp cao nhất)"
              options={(categories.data?.data ?? []).map((category) => ({
                value: category.id,
                label: localizeDeviceCategory(category),
                meta: category.slug,
              }))}
            />
            <TextInput
              label="Thứ tự hiển thị"
              type="number"
              min="0"
              value={categoryForm.display_order}
              onChange={(display_order) =>
                setCategoryForm((current) => ({ ...current, display_order }))
              }
            />
            <TextInput
              label="URL biểu tượng"
              type="url"
              value={categoryForm.icon_url}
              onChange={(icon_url) =>
                setCategoryForm((current) => ({ ...current, icon_url }))
              }
            />
          </div>
          <TextAreaInput
            label="Mô tả"
            value={categoryForm.description}
            onChange={(description) =>
              setCategoryForm((current) => ({ ...current, description }))
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CheckboxInput
              label="Danh mục đang hoạt động"
              checked={categoryForm.is_active}
              onChange={(is_active) =>
                setCategoryForm((current) => ({ ...current, is_active }))
              }
            />
            <PrimaryButton
              disabled={
                createCategory.isPending ||
                !categoryForm.name ||
                !categoryForm.slug
              }
              pending={createCategory.isPending}
            >
              Tạo danh mục
            </PrimaryButton>
          </div>
        </form>
      ) : null}

      {section === "family" ? (
        <div className="space-y-6">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveFamily.mutate();
            }}
          >
            <PanelError
              error={
                saveFamily.error ??
                deleteFamily.error ??
                organizations.error ??
                categories.error ??
                families.error
              }
            />
            {editingFamilyId ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-950">
                  Đang chỉnh sửa “{familyForm.name}”
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFamilyId(null);
                    setFamilyForm(createInitialFamilyForm());
                  }}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-950"
                >
                  Hủy chỉnh sửa
                </button>
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectInput
                label="Tổ chức sở hữu thương hiệu"
                value={familyForm.brand_org_id}
                onChange={(brand_org_id) =>
                  setFamilyForm((current) => ({ ...current, brand_org_id }))
                }
                required
              >
                <option value="">Chọn tổ chức</option>
                {organizations.data?.data.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </SelectInput>
              <SearchableSelect
                label="Danh mục thiết bị"
                value={familyForm.device_category_id}
                onChange={(device_category_id) =>
                  setFamilyForm((current) => ({
                    ...current,
                    device_category_id,
                  }))
                }
                required
                placeholder="Tìm và chọn danh mục"
                options={(categories.data?.data ?? []).map((category) => ({
                  value: category.id,
                  label: localizeDeviceCategory(category),
                  meta: category.slug,
                }))}
              />
              <TextInput
                label="Tên dòng sản phẩm"
                value={familyForm.name}
                onChange={(name) =>
                  setFamilyForm((current) => ({
                    ...current,
                    name,
                    slug: syncSlug(current.name, current.slug, name),
                  }))
                }
                required
              />
              <TextInput
                label="Đường dẫn định danh (slug)"
                placeholder="iphone-16-series"
                hint="Được tự điền theo tên; bạn vẫn có thể chỉnh trước khi lưu."
                value={familyForm.slug}
                onChange={(slug) =>
                  setFamilyForm((current) => ({ ...current, slug }))
                }
                required
              />
              <TextInput
                label="Năm ra mắt đầu tiên"
                type="number"
                min="1800"
                max="2200"
                value={familyForm.first_release_year}
                onChange={(first_release_year) =>
                  setFamilyForm((current) => ({
                    ...current,
                    first_release_year,
                  }))
                }
              />
              <TextInput
                label="Năm ra mắt gần nhất"
                type="number"
                min="1800"
                max="2200"
                value={familyForm.last_release_year}
                onChange={(last_release_year) =>
                  setFamilyForm((current) => ({
                    ...current,
                    last_release_year,
                  }))
                }
              />
              <TextInput
                label="URL ảnh bìa"
                type="url"
                value={familyForm.cover_image_url}
                onChange={(cover_image_url) =>
                  setFamilyForm((current) => ({ ...current, cover_image_url }))
                }
              />
            </div>
            <TextAreaInput
              label="Mô tả dòng sản phẩm"
              hint={`${familyForm.description.trim().length}/80 ký tự tối thiểu · Nêu định vị, người dùng, đặc điểm và phạm vi thế hệ.`}
              minLength={80}
              rows={5}
              value={familyForm.description}
              onChange={(description) =>
                setFamilyForm((current) => ({ ...current, description }))
              }
              required
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CheckboxInput
                label="Dòng sản phẩm đang hoạt động"
                checked={familyForm.is_active}
                onChange={(is_active) =>
                  setFamilyForm((current) => ({ ...current, is_active }))
                }
              />
              <PrimaryButton
                disabled={
                  saveFamily.isPending ||
                  !familyForm.brand_org_id ||
                  !familyForm.device_category_id ||
                  !familyForm.name ||
                  !familyForm.slug ||
                  familyForm.description.trim().length < 80
                }
                pending={saveFamily.isPending}
                pendingLabel={
                  editingFamilyId
                    ? "Đang lưu dòng sản phẩm…"
                    : "Đang tạo dòng sản phẩm…"
                }
              >
                {editingFamilyId ? "Lưu dòng sản phẩm" : "Tạo dòng sản phẩm"}
              </PrimaryButton>
            </div>
          </form>

          <section className="border-t border-slate-200 pt-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Các dòng sản phẩm hiện có
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tìm, sửa hoặc gỡ một dòng trước khi tiếp tục tạo mẫu máy.
                </p>
              </div>
              <label className="relative block w-full sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="search"
                  aria-label="Tìm dòng sản phẩm"
                  value={familySearch}
                  onChange={(event) => setFamilySearch(event.target.value)}
                  placeholder="Tìm tên, slug hoặc mô tả..."
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            {familyToRemove ? (
              <div
                className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <div>
                  <p className="text-sm font-semibold text-rose-950">
                    Gỡ dòng “{familyToRemove.name}”?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-rose-800">
                    Dòng sản phẩm sẽ ngừng xuất hiện trong danh sách chọn mới.
                    Các mẫu máy đã có vẫn được giữ trong lịch sử.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setFamilyToRemove(null)}
                    className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-slate-700"
                  >
                    Giữ lại
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFamily.mutate(familyToRemove.id)}
                    disabled={deleteFamily.isPending}
                    className="h-9 rounded-lg bg-rose-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {deleteFamily.isPending ? "Đang gỡ…" : "Xác nhận gỡ"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {families.data?.data.map((family) => (
                <article
                  key={family.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate font-semibold text-slate-950">
                          {family.name}
                        </h4>
                        {!family.is_active ? (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Đã ẩn
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {family.brand_org?.name ?? "Chưa có hãng"} ·{" "}
                        {localizeDeviceCategory(family.device_category)}
                      </p>
                      <p className="mt-2 truncate font-mono text-[11px] text-slate-400">
                        {family.slug}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFamilyToRemove(null);
                          setEditingFamilyId(family.id);
                          setFamilyForm(familyFormFromItem(family));
                        }}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setFamilyToRemove(family)}
                        className="grid size-8 place-items-center rounded-md border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                        aria-label={`Gỡ ${family.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {(families.data?.meta.total ?? 0) >
            (families.data?.data.length ?? 0) ? (
              <p className="mt-3 text-xs text-slate-500">
                Đang hiển thị {families.data?.data.length}/
                {families.data?.meta.total} dòng. Nhập từ khóa để tìm trong toàn
                bộ danh sách.
              </p>
            ) : null}
            {!families.data?.data.length && !families.isLoading ? (
              <EmptyRow label="Không tìm thấy dòng sản phẩm phù hợp." />
            ) : null}
          </section>
        </div>
      ) : null}
    </Panel>
  );
}

function CatalogPanel({
  accessToken,
  initialWorkspace = "foundations",
  showWorkflow = true,
  onCreateDevice,
}: {
  accessToken: string;
  initialWorkspace?: CatalogWorkspace;
  showWorkflow?: boolean;
  onCreateDevice?: () => void;
}) {
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] =
    useState<CatalogWorkspace>(initialWorkspace);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recordSearch, setRecordSearch] = useState("");
  const [debouncedRecordSearch, setDebouncedRecordSearch] = useState("");
  const [recordPage, setRecordPage] = useState(1);
  const [recordCategory, setRecordCategory] = useState("");
  const [recordStatus, setRecordStatus] = useState("");
  const [recordSort, setRecordSort] = useState("updated_at-desc");
  const [showRecordFiltersOnMobile, setShowRecordFiltersOnMobile] =
    useState(false);
  const [showRecordListOnMobile, setShowRecordListOnMobile] = useState(false);
  const [selectedRecordModelId, setSelectedRecordModelId] = useState<
    string | null
  >(null);
  const [managementSection, setManagementSection] =
    useState<CatalogManagementSection>("model");
  const [editingModel, setEditingModel] = useState<EditableDeviceModel | null>(
    null,
  );
  const [modelToRemove, setModelToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingVariantMode, setEditingVariantMode] =
    useState<VariantEditMode>("full");
  const [editingVariantForm, setEditingVariantForm] =
    useState<DeviceVariantForm | null>(null);
  const [variantToRemove, setVariantToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [modelForm, setModelForm] = useState<DeviceModelForm>(() =>
    createInitialDeviceModelForm(),
  );
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [variantForm, setVariantForm] = useState(createInitialVariantForm);
  const [variantEditorSection, setVariantEditorSection] =
    useState<VariantEditorSection>("identity");
  const [recordSortBy, recordSortOrder] = recordSort.split("-") as [
    string,
    "asc" | "desc",
  ];
  const recordPageSize = 24;
  const models = useQuery({
    queryKey: [
      "admin",
      "models",
      recordPage,
      debouncedRecordSearch,
      recordCategory,
      recordStatus,
      recordSort,
    ],
    queryFn: () =>
      api.listDeviceModels({
        page: recordPage,
        pageSize: recordPageSize,
        q: debouncedRecordSearch || undefined,
        category_slug: recordCategory || undefined,
        release_status: recordStatus || undefined,
        sortBy: recordSortBy,
        sortOrder: recordSortOrder,
      }),
  });
  const modelChoices = useQuery({
    queryKey: ["admin", "models", "choices"],
    queryFn: () =>
      api.listDeviceModels({
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });
  const selectedRecordModelDetail = useQuery({
    queryKey: ["admin", "model-detail", selectedRecordModelId],
    queryFn: () =>
      api
        .getDeviceModelById(selectedRecordModelId!)
        .then((result) => result.data),
    enabled: Boolean(selectedRecordModelId),
  });
  const managedVariants = useQuery({
    queryKey: ["admin", "variants", selectedRecordModelId],
    queryFn: () =>
      api.listDeviceVariants({
        page: 1,
        pageSize: 100,
        device_model_id: selectedRecordModelId,
      }),
    enabled: Boolean(selectedRecordModelId),
  });
  const editingVariantDetail = useQuery({
    queryKey: ["admin", "variant-detail", editingVariantId],
    queryFn: () =>
      api.getDeviceVariant(editingVariantId!).then((result) => result.data),
    enabled: Boolean(editingVariantId),
  });
  const families = useQuery({
    queryKey: ["admin", "product-families"],
    queryFn: () => api.listProductFamilies({ page: 1, pageSize: 100 }),
  });
  const categories = useQuery({
    queryKey: ["admin", "device-categories"],
    queryFn: () =>
      api.listDeviceCategories({
        page: 1,
        pageSize: 100,
        sortBy: "display_order",
        sortOrder: "asc",
      }),
  });
  const releaseStatuses = useQuery({
    queryKey: ["release-statuses"],
    queryFn: () => api.listReleaseStatuses(),
  });
  const currencies = useQuery({
    queryKey: ["currencies"],
    queryFn: () => api.listCurrencies(),
  });
  const benchmarks = useQuery({
    queryKey: ["benchmarks"],
    queryFn: () => api.listBenchmarks(),
  });
  const scoringProfiles = useQuery({
    queryKey: ["scoring-profiles"],
    queryFn: () => api.listScoringProfiles<ScoringProfile>(),
  });
  const hardwareChipsets = useQuery({
    queryKey: ["admin", "variant-hardware", "chipsets"],
    queryFn: () => api.listChipsets({ page: 1, pageSize: 100 }),
  });
  const hardwareCpus = useQuery({
    queryKey: ["admin", "variant-hardware", "cpus"],
    queryFn: () => api.listHardwareCpus({ page: 1, pageSize: 100 }),
  });
  const hardwareGpus = useQuery({
    queryKey: ["admin", "variant-hardware", "gpus"],
    queryFn: () => api.listHardwareGpus({ page: 1, pageSize: 100 }),
  });
  const hardwareNpus = useQuery({
    queryKey: ["admin", "variant-hardware", "npus"],
    queryFn: () => api.listHardwareNpus({ page: 1, pageSize: 100 }),
  });
  const hardwareModems = useQuery({
    queryKey: ["admin", "variant-hardware", "modems"],
    queryFn: () => api.listHardwareModems({ page: 1, pageSize: 100 }),
  });
  const memoryStandards = useQuery({
    queryKey: ["admin", "variant-hardware", "memory"],
    queryFn: () => api.listMemoryStandards({ page: 1, pageSize: 100 }),
  });
  const storageStandards = useQuery({
    queryKey: ["admin", "variant-hardware", "storage"],
    queryFn: () => api.listStorageStandards({ page: 1, pageSize: 100 }),
  });
  const hardwareCatalog: HardwareAssignmentCatalog = {
    chipsets: normalizeHardwarePickerItems(hardwareChipsets.data?.data),
    cpus: normalizeHardwarePickerItems(hardwareCpus.data?.data),
    gpus: normalizeHardwarePickerItems(hardwareGpus.data?.data),
    npus: normalizeHardwarePickerItems(hardwareNpus.data?.data),
    modems: normalizeHardwarePickerItems(hardwareModems.data?.data),
    memory: normalizeHardwarePickerItems(memoryStandards.data?.data),
    storage: normalizeHardwarePickerItems(storageStandards.data?.data),
  };
  const hardwareCatalogError =
    hardwareChipsets.error ??
    hardwareCpus.error ??
    hardwareGpus.error ??
    hardwareNpus.error ??
    hardwareModems.error ??
    memoryStandards.error ??
    storageStandards.error;
  const modelRequiredItems = [
    { label: "Tên mẫu máy", complete: Boolean(modelForm.name.trim()) },
    { label: "Slug", complete: Boolean(modelForm.slug.trim()) },
    {
      label: "Dòng sản phẩm",
      complete: Boolean(modelForm.product_family_id),
    },
    {
      label: "Trạng thái phát hành",
      complete: Boolean(modelForm.release_status_id),
    },
    {
      label: "Tóm tắt",
      complete: modelForm.summary.trim().length >= 80,
    },
    {
      label: "Mô tả chi tiết",
      complete: modelForm.description.trim().length >= 240,
    },
  ];
  const modelRequiredCount = modelRequiredItems.filter(
    (item) => item.complete,
  ).length;
  const modelOptionalCount = [
    modelForm.internal_codename,
    modelForm.generation_label,
    modelForm.announcement_date,
    modelForm.release_date,
    modelForm.end_of_sale_date,
    modelForm.end_of_support_date,
    modelForm.cover_image_url,
  ].filter(Boolean).length;
  const selectedHardwareCount = MODULE_SCORE_FIELDS.filter(({ moduleKey }) =>
    Boolean(variantForm[moduleKey]),
  ).length;
  const selectedVariantProfile = scoringProfileForModel(
    variantForm.device_model_id,
    modelChoices.data?.data,
    scoringProfiles.data,
  );
  const variantRequiredItems = [
    {
      label: "Mẫu thiết bị",
      complete: Boolean(variantForm.device_model_id),
    },
    {
      label: "Định danh phần cứng",
      complete: Boolean(
        variantForm.market_name.trim() || variantForm.sku_code.trim(),
      ),
    },
    {
      label: "Trạng thái phát hành",
      complete: Boolean(variantForm.release_status_id),
    },
  ];
  const variantRequiredCount = variantRequiredItems.filter(
    (item) => item.complete,
  ).length;
  const canCreateVariant =
    variantRequiredCount === variantRequiredItems.length &&
    hasCompleteHardwareAssignments(variantForm);

  useEffect(() => {
    if (!editingVariantDetail.data) return;
    setEditingVariantForm(variantFormFromDetail(editingVariantDetail.data));
  }, [editingVariantDetail.data]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedRecordSearch(recordSearch.trim());
      setRecordPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [recordSearch]);
  useEffect(() => {
    if (!selectedRecordModelDetail.data) return;
    setEditingModel((current) =>
      current?.id === selectedRecordModelDetail.data.id
        ? current
        : deviceModelFormFromSummary(selectedRecordModelDetail.data),
    );
  }, [selectedRecordModelDetail.data]);
  useEffect(() => {
    const totalPages = models.data?.meta.totalPages;
    if (totalPages && recordPage > totalPages) {
      setRecordPage(totalPages);
    }
  }, [models.data?.meta.totalPages, recordPage]);
  useEffect(() => {
    const firstModel = models.data?.data[0];
    if (
      workspace !== "records" ||
      selectedRecordModelId ||
      !firstModel ||
      editingModel
    ) {
      return;
    }
    setSelectedRecordModelId(firstModel.id);
    setEditingModel(deviceModelFormFromSummary(firstModel));
  }, [editingModel, models.data?.data, selectedRecordModelId, workspace]);
  const createModel = useMutation({
    mutationFn: () =>
      api.createDeviceModel(buildDeviceModelPayload(modelForm), accessToken),
    onSuccess: (result) => {
      const createdModel = result.data;
      setModelForm(createInitialDeviceModelForm());
      setShowModelDetails(false);
      setVariantForm((current) => ({
        ...current,
        device_model_id: createdModel.id,
      }));
      setSuccessMessage(
        `Đã tạo ${createdModel.name}. Tiếp tục thêm phiên bản thương mại và thông số.`,
      );
      setVariantEditorSection("identity");
      setWorkspace("variant");
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    },
  });
  const createVariant = useMutation({
    mutationFn: () =>
      api.createDeviceVariant(buildVariantPayload(variantForm), accessToken),
    onSuccess: (result) => {
      const createdVariant = result.data;
      const createdForModelId = variantForm.device_model_id;
      setVariantForm(createInitialVariantForm());
      setVariantEditorSection("identity");
      setSuccessMessage(
        `Đã tạo phiên bản ${createdVariant.variant_name}. Bản ghi đã sẵn sàng để kiểm tra.`,
      );
      setSelectedRecordModelId(createdForModelId);
      setManagementSection("variants");
      setWorkspace("records");
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "variants"] });
    },
  });
  const updateModel = useMutation({
    mutationFn: ({ id, ...form }: EditableDeviceModel) =>
      api.updateDeviceModel(id, buildDeviceModelPayload(form), accessToken),
    onSuccess: (result) => {
      setEditingModel(deviceModelFormFromSummary(result.data));
      setSuccessMessage(`Đã cập nhật ${result.data.name}.`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "model-detail", result.data.id],
      });
    },
  });
  const deleteModel = useMutation({
    mutationFn: (id: string) => api.deleteDeviceModel(id, accessToken),
    onSuccess: () => {
      setModelToRemove(null);
      setSelectedRecordModelId(null);
      setEditingModel(null);
      if ((models.data?.data.length ?? 0) === 1 && recordPage > 1) {
        setRecordPage((current) => Math.max(1, current - 1));
      }
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    },
  });
  const updateVariant = useMutation({
    mutationFn: () =>
      api.updateDeviceVariant(
        editingVariantId!,
        buildVariantPayload(editingVariantForm!),
        accessToken,
      ),
    onSuccess: (result) => {
      setEditingVariantForm(variantFormFromDetail(result.data));
      setSuccessMessage(`Đã cập nhật phiên bản ${result.data.variant_name}.`);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "variants", selectedRecordModelId],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    },
  });
  const deleteVariant = useMutation({
    mutationFn: (id: string) => api.deleteDeviceVariant(id, accessToken),
    onSuccess: () => {
      setVariantToRemove(null);
      setEditingVariantId(null);
      setEditingVariantForm(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "variants", selectedRecordModelId],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    },
  });

  const filteredModels = models.data?.data ?? [];
  const selectedRecordModel =
    models.data?.data.find((model) => model.id === selectedRecordModelId) ??
    selectedRecordModelDetail.data;
  const selectedModelVariant = selectedRecordModel?.device_variants?.[0];
  const selectedModelScorecard = selectedModelVariant?.variant_scorecards?.[0];
  const selectedModelConfiguration = calculateConfigurationIndex(
    selectedModelVariant?.variant_module_scores,
  );
  const selectedModelCoverage = selectedModelScorecard
    ? Number(selectedModelScorecard.coverage_percent)
    : (selectedModelConfiguration?.coverage ?? 0);
  const visibleVariantCount = filteredModels.reduce(
    (total, model) => total + (model._count?.device_variants ?? 0),
    0,
  );
  const fullyScoredVisibleCount = filteredModels.filter((model) => {
    const variant = model.device_variants?.[0];
    const scorecard = variant?.variant_scorecards?.[0];
    const coverage = scorecard
      ? Number(scorecard.coverage_percent)
      : (calculateConfigurationIndex(variant?.variant_module_scores)
          ?.coverage ?? 0);
    return coverage >= 100;
  }).length;
  const missingImageVisibleCount = filteredModels.filter(
    (model) => !model.cover_image_url?.trim(),
  ).length;
  const hasActiveRecordFilters = Boolean(
    recordSearch || recordCategory || recordStatus,
  );
  const hasUnsavedModelChanges = Boolean(
    selectedRecordModel &&
      editingModel &&
      JSON.stringify(deviceModelFormFromSummary(selectedRecordModel)) !==
        JSON.stringify(editingModel),
  );
  const updateEditingModelField = (key: keyof DeviceModelForm, value: string) =>
    setEditingModel((current) =>
      current ? { ...current, [key]: value } : current,
    );
  const updateEditingVariantField = (
    key: keyof DeviceVariantForm,
    value: string | boolean,
  ) =>
    setEditingVariantForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
            module_scores_dirty:
              current.module_scores_dirty || isModuleScoreField(key),
          }
        : current,
    );
  const openManagedModel = (model: DeviceModelSummary) => {
    if (
      hasUnsavedModelChanges &&
      !window.confirm(
        "Bạn đang có thay đổi chưa lưu. Chuyển sang thiết bị khác và bỏ các thay đổi này?",
      )
    ) {
      return;
    }
    setSelectedRecordModelId(model.id);
    setEditingModel(deviceModelFormFromSummary(model));
    setShowRecordListOnMobile(false);
    setManagementSection("model");
    setModelToRemove(null);
    setEditingVariantId(null);
    setEditingVariantForm(null);
    setVariantToRemove(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {showWorkflow ? (
        <CatalogWorkflowNav
          value={workspace}
          onChange={(nextWorkspace) => {
            setSuccessMessage(null);
            setWorkspace(nextWorkspace);
          }}
          modelCount={models.data?.meta.total}
          familyCount={families.data?.meta.total}
        />
      ) : null}

      {successMessage ? (
        <div
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          <span className="flex min-w-0 items-start gap-3">
            <BadgeCheck className="mt-0.5 shrink-0" size={18} />
            <span className="leading-6">{successMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Đóng thông báo"
            className="grid size-7 shrink-0 place-items-center rounded-md text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-950"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      {workspace === "foundations" ? (
        <CatalogFoundationsPanel
          accessToken={accessToken}
          onFamilyCreated={(id, name) => {
            setModelForm((current) => ({
              ...current,
              product_family_id: id,
            }));
            setSuccessMessage(
              `Đã tạo dòng sản phẩm ${name}. Tiếp tục tạo mẫu thiết bị.`,
            );
            setWorkspace("model");
          }}
        />
      ) : null}

      {workspace === "model" ? (
        <Panel
          title="Bước 2 · Tạo mẫu thiết bị"
          description="Xác định mẫu máy trong danh mục. Sau khi lưu, hệ thống sẽ chuyển thẳng sang bước tạo phiên bản."
        >
          <PanelError
            error={createModel.error ?? families.error ?? releaseStatuses.error}
          />
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              createModel.mutate();
            }}
          >
            <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-blue-950">
                    Mức sẵn sàng của mẫu máy
                  </p>
                  <span className="text-xs font-semibold text-blue-800">
                    {modelRequiredCount}/{modelRequiredItems.length} bắt buộc
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${(modelRequiredCount / modelRequiredItems.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {modelRequiredItems.map((item) => (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.complete
                          ? "bg-white text-emerald-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {item.complete ? (
                        <CheckCircle2 size={13} aria-hidden="true" />
                      ) : (
                        <Clock3 size={13} aria-hidden="true" />
                      )}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <p className="max-w-sm text-xs leading-5 text-blue-800">
                Hoàn tất đầy đủ nhận diện, tóm tắt và mô tả chi tiết để mọi
                thiết bị cùng một chuẩn nội dung.
              </p>
            </div>

            <FormSection
              title="Nhận diện cơ bản"
              description="Các trường có dấu * giúp mẫu máy xuất hiện đúng trong danh mục."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <TextInput
                  label="Tên mẫu máy"
                  value={modelForm.name}
                  onChange={(name) =>
                    setModelForm((current) => ({
                      ...current,
                      name,
                      slug: syncSlug(current.name, current.slug, name),
                    }))
                  }
                  required
                />
                <TextInput
                  label="Đường dẫn định danh (slug)"
                  placeholder="iphone-16-pro"
                  hint="Dùng chữ thường, số và dấu gạch ngang; không thay đổi sau khi đã chia sẻ đường dẫn."
                  value={modelForm.slug}
                  onChange={(slug) =>
                    setModelForm((current) => ({ ...current, slug }))
                  }
                  required
                />
                <SearchableSelect
                  label="Dòng sản phẩm"
                  value={modelForm.product_family_id}
                  onChange={(product_family_id) =>
                    setModelForm((current) => ({
                      ...current,
                      product_family_id,
                    }))
                  }
                  options={productFamilyPickerOptions(families.data?.data)}
                  placeholder="Tìm theo dòng, hãng, danh mục hoặc slug..."
                  hint="Có thể gõ tên hãng hoặc danh mục để tìm nhanh."
                  required
                />
                <SelectInput
                  label="Trạng thái phát hành"
                  value={modelForm.release_status_id}
                  onChange={(release_status_id) =>
                    setModelForm((current) => ({
                      ...current,
                      release_status_id,
                    }))
                  }
                  required
                >
                  <option value="">Chọn trạng thái</option>
                  {releaseStatuses.data?.map((status) => (
                    <option key={status.id} value={status.id}>
                      {localizeReleaseStatus(status)}
                    </option>
                  ))}
                </SelectInput>
                {showModelDetails ? (
                  <>
                    <TextInput
                      label="Tên mã nội bộ"
                      value={modelForm.internal_codename}
                      onChange={(internal_codename) =>
                        setModelForm((current) => ({
                          ...current,
                          internal_codename,
                        }))
                      }
                    />
                    <TextInput
                      label="Nhãn thế hệ"
                      placeholder="16 Pro"
                      value={modelForm.generation_label}
                      onChange={(generation_label) =>
                        setModelForm((current) => ({
                          ...current,
                          generation_label,
                        }))
                      }
                    />
                  </>
                ) : null}
              </div>
            </FormSection>

            <FormSection
              title="Nội dung thiết bị"
              description="Viết nội dung có cấu trúc, chính xác và đủ để người đọc hiểu thiết bị mà không phải rời trang."
            >
              <div className="space-y-4">
                <TextAreaInput
                  label="Tóm tắt"
                  hint={`${modelForm.summary.trim().length}/80–600 ký tự · Dùng cho card, tìm kiếm và phần mở đầu.`}
                  minLength={80}
                  maxLength={600}
                  rows={3}
                  value={modelForm.summary}
                  onChange={(summary) =>
                    setModelForm((current) => ({ ...current, summary }))
                  }
                  required
                />
                <TextAreaInput
                  label="Mô tả chi tiết"
                  hint={`${modelForm.description.trim().length}/240 ký tự tối thiểu · Nên có: điểm nổi bật, thiết kế, hiệu năng, camera, pin, phần mềm, hạn chế và đối tượng phù hợp.`}
                  minLength={240}
                  rows={9}
                  value={modelForm.description}
                  onChange={(description) =>
                    setModelForm((current) => ({ ...current, description }))
                  }
                  required
                />
              </div>
            </FormSection>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Vòng đời và nội dung công khai
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {modelOptionalCount
                    ? `Đã nhập ${modelOptionalCount}/7 mục bổ sung.`
                    : "Không bắt buộc khi tạo mẫu; có thể cập nhật sau."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModelDetails((current) => !current)}
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 sm:mt-0 sm:w-auto"
                aria-expanded={showModelDetails}
              >
                <Settings2 size={15} aria-hidden="true" />
                {showModelDetails
                  ? "Thu gọn phần bổ sung"
                  : modelOptionalCount
                    ? "Xem dữ liệu đã nhập"
                    : "Thêm dữ liệu bổ sung"}
              </button>
            </div>

            {showModelDetails ? (
              <>
                <FormSection
                  title="Vòng đời sản phẩm"
                  description="Các mốc chưa được xác nhận có thể để trống và bổ sung sau."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <TextInput
                      label="Ngày công bố"
                      type="date"
                      value={modelForm.announcement_date}
                      onChange={(announcement_date) =>
                        setModelForm((current) => ({
                          ...current,
                          announcement_date,
                        }))
                      }
                    />
                    <TextInput
                      label="Ngày ra mắt"
                      type="date"
                      value={modelForm.release_date}
                      onChange={(release_date) =>
                        setModelForm((current) => ({
                          ...current,
                          release_date,
                        }))
                      }
                    />
                    <TextInput
                      label="Ngày kết thúc bán"
                      type="date"
                      value={modelForm.end_of_sale_date}
                      onChange={(end_of_sale_date) =>
                        setModelForm((current) => ({
                          ...current,
                          end_of_sale_date,
                        }))
                      }
                    />
                    <TextInput
                      label="Ngày kết thúc hỗ trợ"
                      type="date"
                      value={modelForm.end_of_support_date}
                      onChange={(end_of_support_date) =>
                        setModelForm((current) => ({
                          ...current,
                          end_of_support_date,
                        }))
                      }
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Nội dung công khai"
                  description="Ảnh bìa giúp người dùng nhận diện mẫu máy trong danh mục và kết quả tìm kiếm."
                >
                  <TextInput
                    label="URL ảnh bìa"
                    type="url"
                    hint="Ưu tiên ảnh sản phẩm nền sáng, tỷ lệ vuông và nguồn ổn định."
                    value={modelForm.cover_image_url}
                    onChange={(cover_image_url) =>
                      setModelForm((current) => ({
                        ...current,
                        cover_image_url,
                      }))
                    }
                  />
                </FormSection>
              </>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {modelRequiredCount === modelRequiredItems.length
                  ? "Đã đủ dữ liệu bắt buộc."
                  : `Còn thiếu ${modelRequiredItems.length - modelRequiredCount} mục bắt buộc.`}
              </p>
              <PrimaryButton
                disabled={
                  createModel.isPending ||
                  !modelForm.name ||
                  !modelForm.slug ||
                  !modelForm.product_family_id ||
                  !modelForm.release_status_id ||
                  modelForm.summary.trim().length < 80 ||
                  modelForm.description.trim().length < 240
                }
                pending={createModel.isPending}
                pendingLabel="Đang tạo mẫu máy…"
              >
                Tạo mẫu và tiếp tục
              </PrimaryButton>
            </div>
          </form>
        </Panel>
      ) : null}

      {workspace === "variant" ? (
        <Panel
          title="Bước 3 · Tạo biến thể phần cứng"
          description="Giữ nguyên tên thiết bị; chỉ tách biến thể khi thị trường, mã model hoặc mô-đun phần cứng khác nhau."
        >
          <PanelError
            error={
              createVariant.error ??
              modelChoices.error ??
              releaseStatuses.error ??
              currencies.error ??
              benchmarks.error ??
              scoringProfiles.error ??
              hardwareCatalogError
            }
          />
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              createVariant.mutate();
            }}
          >
            <VariantEditorNav
              value={variantEditorSection}
              onChange={setVariantEditorSection}
              identityProgress={`${variantRequiredCount}/3 bắt buộc`}
              hardwareProgress={`${selectedHardwareCount} đã gán`}
              scoreProgress="Tự động sau khi lưu"
            />

            <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-blue-950">
                    Mức sẵn sàng để tạo
                  </p>
                  <span className="text-xs font-semibold text-blue-800">
                    {variantRequiredCount}/3 trường bắt buộc
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${(variantRequiredCount / variantRequiredItems.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variantRequiredItems.map((item) => (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.complete
                          ? "bg-white text-emerald-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {item.complete ? (
                        <CheckCircle2 size={13} aria-hidden="true" />
                      ) : (
                        <Clock3 size={13} aria-hidden="true" />
                      )}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <p className="max-w-sm text-xs leading-5 text-blue-800">
                Thiết bị không được tách theo RAM, bộ nhớ hay màu sắc. Score
                được tính tự động sau khi lưu các mô-đun và thông số.
              </p>
            </div>

            {variantEditorSection === "identity" ? (
              <FormSection
                title="Định danh theo thị trường"
                description="Tên biến thể được tạo từ thị trường và mã model; không dùng RAM, bộ nhớ hay màu sắc làm định danh."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <SearchableSelect
                    label="Mẫu thiết bị"
                    value={variantForm.device_model_id}
                    onChange={(device_model_id) =>
                      setVariantForm((current) => ({
                        ...current,
                        device_model_id,
                      }))
                    }
                    options={(modelChoices.data?.data ?? []).map((model) => ({
                      value: model.id,
                      label: model.name,
                      meta: [
                        model.product_family?.brand_org?.name,
                        model.product_family?.name,
                        model.slug,
                      ]
                        .filter(Boolean)
                        .join(" · "),
                    }))}
                    placeholder="Tìm tên mẫu, hãng hoặc dòng sản phẩm..."
                    required
                  />
                  <SelectInput
                    label="Trạng thái phát hành"
                    value={variantForm.release_status_id}
                    onChange={(release_status_id) =>
                      setVariantForm((current) => ({
                        ...current,
                        release_status_id,
                      }))
                    }
                    required
                  >
                    <option value="">Chọn trạng thái</option>
                    {releaseStatuses.data?.map((status) => (
                      <option key={status.id} value={status.id}>
                        {localizeReleaseStatus(status)}
                      </option>
                    ))}
                  </SelectInput>
                  <TextInput
                    label="Mã model phần cứng"
                    placeholder="SM-S931N"
                    value={variantForm.sku_code}
                    onChange={(sku_code) =>
                      setVariantForm((current) => ({ ...current, sku_code }))
                    }
                  />
                  <TextInput
                    label="Thị trường / khu vực"
                    placeholder="Hàn Quốc, Hoa Kỳ, Toàn cầu..."
                    value={variantForm.market_name}
                    onChange={(market_name) =>
                      setVariantForm((current) => ({ ...current, market_name }))
                    }
                  />
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 xl:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Tên biến thể tự động
                    </p>
                    <p className="mt-1 text-sm font-semibold text-blue-950">
                      {hardwareVariantLabel(
                        variantForm.market_name,
                        variantForm.sku_code,
                      )}
                    </p>
                  </div>
                  <TextInput
                    label="Ngày ra mắt"
                    type="date"
                    value={variantForm.launch_date}
                    onChange={(launch_date) =>
                      setVariantForm((current) => ({ ...current, launch_date }))
                    }
                  />
                  <TextInput
                    label="Ngày kết thúc bán"
                    type="date"
                    value={variantForm.end_of_sale_date}
                    onChange={(end_of_sale_date) =>
                      setVariantForm((current) => ({
                        ...current,
                        end_of_sale_date,
                      }))
                    }
                  />
                  <TextInput
                    label="Giá ra mắt"
                    type="number"
                    min="0"
                    step="0.01"
                    value={variantForm.launch_price}
                    onChange={(launch_price) =>
                      setVariantForm((current) => ({
                        ...current,
                        launch_price,
                      }))
                    }
                  />
                  <SelectInput
                    label="Tiền tệ"
                    value={variantForm.currency_id}
                    onChange={(currency_id) =>
                      setVariantForm((current) => ({ ...current, currency_id }))
                    }
                  >
                    <option value="">Không có tiền tệ cho giá ra mắt</option>
                    {currencies.data?.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code}
                        {currency.symbol ? ` (${currency.symbol})` : ""}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-start">
                  <TextAreaInput
                    label="Ghi chú khác biệt phần cứng"
                    rows={3}
                    value={variantForm.notes}
                    onChange={(notes) =>
                      setVariantForm((current) => ({ ...current, notes }))
                    }
                  />
                  <CheckboxInput
                    label="Đặt làm phiên bản mặc định của mẫu máy này"
                    checked={variantForm.is_default}
                    onChange={(is_default) =>
                      setVariantForm((current) => ({ ...current, is_default }))
                    }
                  />
                </div>
              </FormSection>
            ) : null}

            {variantEditorSection === "hardware" ? (
              <HardwareAssignmentsEditor
                form={variantForm}
                catalog={hardwareCatalog}
                onChange={(key, value) =>
                  setVariantForm((current) => ({
                    ...current,
                    [key]: value,
                    module_scores_dirty:
                      current.module_scores_dirty || isModuleScoreField(key),
                  }))
                }
              />
            ) : null}

            {variantEditorSection === "scores" ? (
              <VariantScoreWorkspace
                profile={selectedVariantProfile}
                onOpenFullEditor={() => setVariantEditorSection("hardware")}
              />
            ) : null}

            {variantEditorSection === "details" ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Thông số bổ sung
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Mở từng nhóm khi có dữ liệu đã kiểm chứng. Điểm số đã được
                    tách thành mục riêng ở phía trên để luôn dễ nhìn thấy.
                  </p>
                </div>

                <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900 after:text-lg after:text-slate-400 after:content-['+'] group-open:after:content-['−']">
                    Thiết kế và hoàn thiện
                  </summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextInput
                      label="Chiều cao (mm)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.height_mm}
                      onChange={(height_mm) =>
                        setVariantForm((current) => ({ ...current, height_mm }))
                      }
                    />
                    <TextInput
                      label="Chiều rộng (mm)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.width_mm}
                      onChange={(width_mm) =>
                        setVariantForm((current) => ({ ...current, width_mm }))
                      }
                    />
                    <TextInput
                      label="Độ dày (mm)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.thickness_mm}
                      onChange={(thickness_mm) =>
                        setVariantForm((current) => ({
                          ...current,
                          thickness_mm,
                        }))
                      }
                    />
                    <TextInput
                      label="Khối lượng (g)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.weight_g}
                      onChange={(weight_g) =>
                        setVariantForm((current) => ({ ...current, weight_g }))
                      }
                    />
                    <TextInput
                      label="Độ dày tối thiểu (mm)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.thickness_min_mm}
                      onChange={(thickness_min_mm) =>
                        setVariantForm((current) => ({
                          ...current,
                          thickness_min_mm,
                        }))
                      }
                    />
                    <TextInput
                      label="Độ dày tối đa (mm)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.thickness_max_mm}
                      onChange={(thickness_max_mm) =>
                        setVariantForm((current) => ({
                          ...current,
                          thickness_max_mm,
                        }))
                      }
                    />
                    <TextInput
                      label="Thể tích (cm³)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.volume_cm3}
                      onChange={(volume_cm3) =>
                        setVariantForm((current) => ({
                          ...current,
                          volume_cm3,
                        }))
                      }
                    />
                    <TextInput
                      label="Kháng bụi nước"
                      placeholder="IP68"
                      value={variantForm.ingress_protection}
                      onChange={(ingress_protection) =>
                        setVariantForm((current) => ({
                          ...current,
                          ingress_protection,
                        }))
                      }
                    />
                    <TextInput
                      label="Chất liệu khung"
                      value={variantForm.frame_material}
                      onChange={(frame_material) =>
                        setVariantForm((current) => ({
                          ...current,
                          frame_material,
                        }))
                      }
                    />
                    <TextInput
                      label="Chất liệu mặt lưng"
                      value={variantForm.back_material}
                      onChange={(back_material) =>
                        setVariantForm((current) => ({
                          ...current,
                          back_material,
                        }))
                      }
                    />
                    <TextInput
                      label="Kính mặt trước"
                      value={variantForm.front_glass}
                      onChange={(front_glass) =>
                        setVariantForm((current) => ({
                          ...current,
                          front_glass,
                        }))
                      }
                    />
                  </div>
                  <TextAreaInput
                    className="mt-3"
                    label="Ghi chú ngoại hình"
                    value={variantForm.physical_notes}
                    onChange={(physical_notes) =>
                      setVariantForm((current) => ({
                        ...current,
                        physical_notes,
                      }))
                    }
                  />
                </details>
                <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900 after:text-lg after:text-slate-400 after:content-['+'] group-open:after:content-['−']">
                    I/O và kết nối cơ bản
                  </summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextInput
                      label="Số khe SIM"
                      type="number"
                      min="0"
                      value={variantForm.sim_slots}
                      onChange={(sim_slots) =>
                        setVariantForm((current) => ({ ...current, sim_slots }))
                      }
                    />
                    <TextInput
                      label="Loại SIM"
                      placeholder="Nano-SIM"
                      value={variantForm.sim_type}
                      onChange={(sim_type) =>
                        setVariantForm((current) => ({ ...current, sim_type }))
                      }
                    />
                    <BooleanInput
                      label="Hỗ trợ eSIM"
                      value={variantForm.esim_supported}
                      onChange={(esim_supported) =>
                        setVariantForm((current) => ({
                          ...current,
                          esim_supported,
                        }))
                      }
                    />
                    <TextInput
                      label="Số eSIM"
                      type="number"
                      min="0"
                      value={variantForm.esim_count}
                      onChange={(esim_count) =>
                        setVariantForm((current) => ({
                          ...current,
                          esim_count,
                        }))
                      }
                    />
                    <BooleanInput
                      label="Loa stereo"
                      value={variantForm.stereo_speakers}
                      onChange={(stereo_speakers) =>
                        setVariantForm((current) => ({
                          ...current,
                          stereo_speakers,
                        }))
                      }
                    />
                    <TextInput
                      label="Số loa"
                      type="number"
                      min="0"
                      value={variantForm.speaker_count}
                      onChange={(speaker_count) =>
                        setVariantForm((current) => ({
                          ...current,
                          speaker_count,
                        }))
                      }
                    />
                    <TextInput
                      label="Tinh chỉnh âm thanh"
                      value={variantForm.audio_brand_tuning}
                      onChange={(audio_brand_tuning) =>
                        setVariantForm((current) => ({
                          ...current,
                          audio_brand_tuning,
                        }))
                      }
                    />
                    <BooleanInput
                      label="Cổng tai nghe"
                      value={variantForm.headphone_jack}
                      onChange={(headphone_jack) =>
                        setVariantForm((current) => ({
                          ...current,
                          headphone_jack,
                        }))
                      }
                    />
                    <TextInput
                      label="Kích thước cổng (mm)"
                      type="number"
                      min="0"
                      step="0.1"
                      value={variantForm.headphone_jack_size_mm}
                      onChange={(headphone_jack_size_mm) =>
                        setVariantForm((current) => ({
                          ...current,
                          headphone_jack_size_mm,
                        }))
                      }
                    />
                    <BooleanInput
                      label="Khe microSD"
                      value={variantForm.has_microsd_slot}
                      onChange={(has_microsd_slot) =>
                        setVariantForm((current) => ({
                          ...current,
                          has_microsd_slot,
                        }))
                      }
                    />
                    <TextInput
                      label="microSD tối đa (GB)"
                      type="number"
                      min="0"
                      value={variantForm.microsd_max_capacity_gb}
                      onChange={(microsd_max_capacity_gb) =>
                        setVariantForm((current) => ({
                          ...current,
                          microsd_max_capacity_gb,
                        }))
                      }
                    />
                    <BooleanInput
                      label="Mắt hồng ngoại"
                      value={variantForm.has_ir_blaster}
                      onChange={(has_ir_blaster) =>
                        setVariantForm((current) => ({
                          ...current,
                          has_ir_blaster,
                        }))
                      }
                    />
                    <BooleanInput
                      label="Đèn LED thông báo"
                      value={variantForm.has_notification_led}
                      onChange={(has_notification_led) =>
                        setVariantForm((current) => ({
                          ...current,
                          has_notification_led,
                        }))
                      }
                    />
                  </div>
                  <TextAreaInput
                    className="mt-3"
                    label="Ghi chú I/O"
                    value={variantForm.io_notes}
                    onChange={(io_notes) =>
                      setVariantForm((current) => ({ ...current, io_notes }))
                    }
                  />
                </details>
                <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900 after:text-lg after:text-slate-400 after:content-['+'] group-open:after:content-['−']">
                    Thiết kế tản nhiệt
                  </summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <TextInput
                      label="Loại tản nhiệt"
                      placeholder="Buồng hơi"
                      value={variantForm.cooling_type}
                      onChange={(cooling_type) =>
                        setVariantForm((current) => ({
                          ...current,
                          cooling_type,
                        }))
                      }
                    />
                    <TextInput
                      label="Diện tích buồng hơi (mm²)"
                      type="number"
                      min="0"
                      value={variantForm.vc_area_mm2}
                      onChange={(vc_area_mm2) =>
                        setVariantForm((current) => ({
                          ...current,
                          vc_area_mm2,
                        }))
                      }
                    />
                    <BooleanInput
                      label="Tản nhiệt chủ động"
                      value={variantForm.has_active_cooling}
                      onChange={(has_active_cooling) =>
                        setVariantForm((current) => ({
                          ...current,
                          has_active_cooling,
                        }))
                      }
                    />
                  </div>
                  <TextAreaInput
                    className="mt-3"
                    label="Ghi chú tản nhiệt"
                    value={variantForm.thermal_notes}
                    onChange={(thermal_notes) =>
                      setVariantForm((current) => ({
                        ...current,
                        thermal_notes,
                      }))
                    }
                  />
                </details>
              </>
            ) : null}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  const previousSection =
                    previousVariantEditorSection(variantEditorSection);
                  if (previousSection) {
                    setVariantEditorSection(previousSection);
                  } else {
                    setWorkspace("model");
                  }
                }}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {variantEditorSection === "identity"
                  ? "Quay lại mẫu thiết bị"
                  : "Quay lại"}
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                {variantEditorSection !== "details" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVariantEditorSection(
                        nextVariantEditorSection(variantEditorSection),
                      )
                    }
                    className="app-button-secondary px-4"
                  >
                    Tiếp tục:{" "}
                    {variantEditorSection === "identity"
                      ? "Gán phần cứng"
                      : variantEditorSection === "hardware"
                        ? "Xem quy chuẩn score"
                        : "Thông số nâng cao"}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                ) : null}
                <PrimaryButton
                  disabled={createVariant.isPending || !canCreateVariant}
                  pending={createVariant.isPending}
                  pendingLabel="Đang tạo và tính score…"
                >
                  Tạo phiên bản
                </PrimaryButton>
              </div>
            </div>
          </form>
        </Panel>
      ) : null}

      {workspace === "records" ? (
        <Panel
          title="Quản lý thiết bị đã lưu"
          description="Tìm một mẫu thiết bị, cập nhật đầy đủ thông tin và quản lý từng phiên bản thương mại trong cùng một không gian làm việc."
        >
          <PanelError
            error={
              models.error ??
              categories.error ??
              selectedRecordModelDetail.error ??
              managedVariants.error ??
              editingVariantDetail.error ??
              updateModel.error ??
              deleteModel.error ??
              updateVariant.error ??
              deleteVariant.error ??
              hardwareCatalogError
            }
          />
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_minmax(160px,.8fr)_minmax(150px,.75fr)_minmax(160px,.75fr)_auto]">
              <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2 md:block">
                <label
                  className="relative block min-w-0"
                  htmlFor="device-record-search"
                >
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <input
                    id="device-record-search"
                    type="search"
                    value={recordSearch}
                    onChange={(event) => {
                      setRecordSearch(event.target.value);
                      setShowRecordListOnMobile(true);
                    }}
                    placeholder="Tên, slug, hãng, dòng sản phẩm..."
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {recordSearch ? (
                    <button
                      type="button"
                      onClick={() => setRecordSearch("")}
                      aria-label="Xóa nội dung tìm kiếm"
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={15} />
                    </button>
                  ) : null}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setShowRecordFiltersOnMobile((current) => !current)
                  }
                  aria-label="Hiện bộ lọc thiết bị"
                  aria-expanded={showRecordFiltersOnMobile}
                  className={`grid size-10 place-items-center rounded-lg border md:hidden ${showRecordFiltersOnMobile || hasActiveRecordFilters ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-600"}`}
                >
                  <Settings2 size={16} />
                </button>
              </div>
              <AppSearchableSelect
                label="Lọc theo loại thiết bị"
                labelClassName="sr-only"
                controlClassName="h-10 rounded-lg"
                value={recordCategory}
                onChange={(value) => {
                  setRecordCategory(value);
                  setRecordPage(1);
                  setShowRecordListOnMobile(true);
                }}
                placeholder="Mọi loại thiết bị"
                searchPlaceholder="Tìm loại thiết bị..."
                className={`md:block ${showRecordFiltersOnMobile ? "block" : "hidden"}`}
                options={(categories.data?.data ?? []).map((category) => ({
                  value: category.slug,
                  label: localizeDeviceCategory(category),
                  meta: category.slug,
                }))}
              />
              <AppSearchableSelect
                label="Lọc theo trạng thái phát hành"
                labelClassName="sr-only"
                controlClassName="h-10 rounded-lg"
                value={recordStatus}
                onChange={(value) => {
                  setRecordStatus(value);
                  setRecordPage(1);
                  setShowRecordListOnMobile(true);
                }}
                placeholder="Mọi trạng thái"
                className={`md:block ${showRecordFiltersOnMobile ? "block" : "hidden"}`}
                options={(releaseStatuses.data ?? []).map((status) => ({
                  value: status.code,
                  label: localizeReleaseStatus(status),
                }))}
              />
              <AppSearchableSelect
                label="Sắp xếp thiết bị"
                labelClassName="sr-only"
                controlClassName="h-10 rounded-lg"
                value={recordSort}
                onChange={(value) => {
                  setRecordSort(value);
                  setRecordPage(1);
                }}
                className={`md:block ${showRecordFiltersOnMobile ? "block" : "hidden"}`}
                clearable={false}
                options={[
                  { value: "updated_at-desc", label: "Mới cập nhật" },
                  { value: "release_date-desc", label: "Mới phát hành" },
                  { value: "name-asc", label: "Tên A–Z" },
                  { value: "name-desc", label: "Tên Z–A" },
                ]}
              />
              <button
                type="button"
                onClick={() =>
                  onCreateDevice ? onCreateDevice() : setWorkspace("model")
                }
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 md:col-span-2 xl:col-span-1"
              >
                <Plus size={17} />
                Thêm thiết bị
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 px-1 pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <Smartphone size={13} />
                {models.data?.meta.total ?? 0} thiết bị
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers3 size={13} />
                {visibleVariantCount} phiên bản
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Gauge size={13} />
                {fullyScoredVisibleCount}/{filteredModels.length} đủ điểm
              </span>
              {missingImageVisibleCount ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <ImageOff size={13} />
                  {missingImageVisibleCount} thiếu ảnh
                </span>
              ) : null}
              {hasActiveRecordFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setRecordSearch("");
                    setDebouncedRecordSearch("");
                    setRecordCategory("");
                    setRecordStatus("");
                    setRecordPage(1);
                  }}
                  className="ml-auto text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  Xóa bộ lọc
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white xl:sticky xl:top-24">
              <div className="flex h-11 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() =>
                    setShowRecordListOnMobile((current) => !current)
                  }
                  aria-expanded={showRecordListOnMobile}
                  className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-md px-1.5 font-semibold text-slate-700 hover:bg-white xl:pointer-events-none"
                >
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition xl:hidden ${showRecordListOnMobile ? "rotate-90" : ""}`}
                  />
                  <span className="truncate xl:hidden">
                    {selectedRecordModel && !showRecordListOnMobile
                      ? selectedRecordModel.name
                      : `${models.data?.meta.total ?? 0} thiết bị`}
                  </span>
                  <span className="hidden truncate xl:inline">
                    {models.data?.meta.total ?? 0} thiết bị
                  </span>
                  <span className="hidden font-normal text-slate-400 sm:inline">
                    · {models.data?.meta.page ?? recordPage}/
                    {Math.max(1, models.data?.meta.totalPages ?? 1)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void models.refetch()}
                  disabled={models.isFetching}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
                >
                  <RefreshCw
                    className={models.isFetching ? "animate-spin" : ""}
                    size={13}
                  />
                  {models.isFetching ? "Đang tải" : "Làm mới"}
                </button>
              </div>
              <div
                className={`max-h-[300px] divide-y divide-slate-100 overflow-y-auto sm:max-h-[420px] xl:block xl:max-h-[620px] ${selectedRecordModel && !showRecordListOnMobile ? "hidden" : ""}`}
              >
                {models.isLoading
                  ? Array.from({ length: 9 }, (_, index) => (
                      <div
                        key={index}
                        className="h-[62px] animate-pulse bg-slate-50"
                      />
                    ))
                  : null}
                {filteredModels.map((model) => {
                  const isSelected = selectedRecordModelId === model.id;
                  const primaryVariant = model.device_variants?.[0];
                  const scorecard = primaryVariant?.variant_scorecards?.[0];
                  const configuration = calculateConfigurationIndex(
                    primaryVariant?.variant_module_scores,
                  );
                  const score = scorecard
                    ? Number(scorecard.overall_score)
                    : configuration?.score;
                  const coverage = scorecard
                    ? Number(scorecard.coverage_percent)
                    : (configuration?.coverage ?? 0);
                  const hasScore = score !== undefined;
                  const releaseStatus = localizeReleaseStatus(
                    model.release_status,
                    "Chưa cập nhật",
                  );
                  return (
                    <div
                      key={model.id}
                      className={`group flex min-h-[62px] items-stretch transition ${
                        isSelected
                          ? "bg-blue-50 shadow-[inset_3px_0_0_#2563eb]"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openManagedModel(model)}
                        aria-pressed={isSelected}
                        className="min-w-0 flex-1 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                      >
                        <span className="flex min-w-0 items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={`size-2 shrink-0 rounded-full ${
                                coverage >= 100
                                  ? "bg-emerald-500"
                                  : hasScore
                                    ? "bg-amber-500"
                                    : "bg-slate-300"
                              }`}
                            />
                            <span className="truncate text-sm font-semibold text-slate-950">
                              {model.name}
                            </span>
                            {!model.cover_image_url?.trim() ? (
                              <ImageOff
                                aria-label="Thiếu ảnh bìa"
                                className="shrink-0 text-amber-500"
                                size={13}
                              />
                            ) : null}
                          </span>
                          <span
                            title={
                              scorecard
                                ? `${formatAdminNumber(coverage)}% dữ liệu điểm`
                                : configuration
                                  ? `${formatAdminNumber(coverage)}% điểm mô-đun`
                                  : "Chưa có bảng điểm"
                            }
                            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                              hasScore
                                ? coverage >= 100
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {hasScore ? formatAdminNumber(score) : "—"}
                          </span>
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="truncate">
                            {model.product_family?.brand_org?.name ??
                              "Chưa có hãng"}
                            {model.product_family?.name
                              ? ` · ${model.product_family.name}`
                              : ""}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="shrink-0">
                            {model._count?.device_variants ?? 0} PB
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className="max-w-24 shrink-0 truncate"
                            title={releaseStatus}
                          >
                            {releaseStatus}
                          </span>
                        </span>
                      </button>
                      <a
                        href={`/devices/${model.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Mở trang công khai của ${model.name}`}
                        title="Mở trang công khai"
                        className="grid w-9 shrink-0 place-items-center border-l border-transparent text-slate-300 outline-none transition hover:border-slate-200 hover:bg-white hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  );
                })}
                {!filteredModels.length && !models.isLoading ? (
                  <div className="px-4 py-8 text-center">
                    <Search className="mx-auto text-slate-300" size={28} />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Không tìm thấy thiết bị phù hợp.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordSearch("");
                        setDebouncedRecordSearch("");
                        setRecordCategory("");
                        setRecordStatus("");
                      }}
                      className="mt-3 text-xs font-semibold text-blue-700"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                ) : null}
              </div>
              {(models.data?.meta.totalPages ?? 0) > 1 ? (
                <div
                  className={`items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 p-2 xl:flex ${selectedRecordModel && !showRecordListOnMobile ? "hidden" : "flex"}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setRecordPage((current) => Math.max(1, current - 1))
                    }
                    disabled={!models.data?.meta.hasPrev || models.isFetching}
                    aria-label="Trang thiết bị trước"
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Trước
                  </button>
                  <span className="text-xs font-medium text-slate-500">
                    {models.data?.meta.page}/{models.data?.meta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecordPage((current) => current + 1)}
                    disabled={!models.data?.meta.hasNext || models.isFetching}
                    aria-label="Trang thiết bị sau"
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight size={15} />
                  </button>
                </div>
              ) : null}
            </aside>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white">
              {!selectedRecordModel || !editingModel ? (
                <div className="grid min-h-[520px] place-items-center p-6 text-center">
                  <div className="max-w-sm">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                      <Smartphone size={24} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-950">
                      Chọn một thiết bị để quản lý
                    </h3>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="border-b border-slate-200 p-3 sm:p-4">
                    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[104px_minmax(0,1fr)]">
                      <DeviceArtwork
                        compact
                        className="h-20 w-full sm:h-24"
                        brand={
                          selectedRecordModel.product_family?.brand_org?.name
                        }
                        name={selectedRecordModel.name}
                        category={localizeDeviceCategory(
                          selectedRecordModel.product_family?.device_category,
                        )}
                        imageUrl={editingModel.cover_image_url}
                        accent={
                          selectedRecordModel.device_variants?.[0]?.color_hex
                        }
                      />
                      <div className="flex min-w-0 flex-col justify-between gap-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                                {selectedRecordModel.name}
                              </h3>
                              {hasUnsavedModelChanges ? (
                                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                                  Chưa lưu
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {selectedRecordModel.product_family?.brand_org
                                ?.name ?? "Chưa có hãng"}
                              {selectedRecordModel.product_family?.name
                                ? ` · ${selectedRecordModel.product_family.name}`
                                : ""}
                            </p>
                          </div>
                          <a
                            href={`/devices/${selectedRecordModel.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                          >
                            Xem trang
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5">
                            <span className="text-[11px] text-slate-500">
                              Trạng thái:
                            </span>
                            <span className="truncate text-xs font-semibold text-slate-800">
                              {localizeReleaseStatus(
                                selectedRecordModel.release_status,
                                "Chưa cập nhật",
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5">
                            <span className="text-[11px] text-slate-500">
                              Điểm:
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {selectedModelScorecard
                                ? `${formatAdminNumber(Number(selectedModelScorecard.overall_score))}/100`
                                : selectedModelConfiguration
                                  ? `${formatAdminNumber(selectedModelConfiguration.score)}/100`
                                  : "Chưa có"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5">
                            <span className="text-[11px] text-slate-500">
                              Độ phủ:
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                selectedModelCoverage >= 100
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {selectedModelScorecard
                                ? `${formatAdminNumber(Number(selectedModelScorecard.coverage_percent))}%`
                                : selectedModelConfiguration
                                  ? `${formatAdminNumber(selectedModelConfiguration.coverage)}% điểm mô-đun`
                                  : "Chưa có bảng điểm"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:max-w-96">
                        <button
                          type="button"
                          onClick={() => setManagementSection("model")}
                          className={`h-9 rounded-md px-3 text-sm font-semibold transition ${managementSection === "model" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Thông tin mẫu
                        </button>
                        <button
                          type="button"
                          onClick={() => setManagementSection("variants")}
                          className={`h-9 rounded-md px-3 text-sm font-semibold transition ${managementSection === "variants" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Phiên bản ({managedVariants.data?.meta.total ?? 0})
                        </button>
                      </div>
                      {selectedRecordModel.updated_at ? (
                        <span className="hidden text-xs text-slate-400 md:inline">
                          Cập nhật{" "}
                          {formatAdminDateTime(selectedRecordModel.updated_at)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {managementSection === "model" ? (
                    <form
                      className="space-y-5 p-4 sm:p-5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        updateModel.mutate(editingModel);
                      }}
                    >
                      <FormSection
                        title="Thông tin cơ bản"
                        description="Tên và slug xuất hiện trên danh mục công khai. Thay đổi slug sẽ làm thay đổi URL đã chia sẻ."
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <TextInput
                            label="Tên mẫu máy"
                            value={editingModel.name}
                            onChange={(value) =>
                              updateEditingModelField("name", value)
                            }
                            required
                          />
                          <TextInput
                            label="Slug"
                            value={editingModel.slug}
                            onChange={(value) =>
                              updateEditingModelField("slug", value)
                            }
                            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                            required
                          />
                          <SearchableSelect
                            label="Dòng sản phẩm"
                            value={editingModel.product_family_id}
                            onChange={(value) =>
                              updateEditingModelField(
                                "product_family_id",
                                value,
                              )
                            }
                            options={productFamilyPickerOptions(
                              families.data?.data,
                            )}
                            placeholder="Tìm dòng sản phẩm..."
                            required
                          />
                          <SelectInput
                            label="Trạng thái phát hành"
                            value={editingModel.release_status_id}
                            onChange={(value) =>
                              updateEditingModelField(
                                "release_status_id",
                                value,
                              )
                            }
                            required
                          >
                            <option value="">Chọn trạng thái</option>
                            {releaseStatuses.data?.map((status) => (
                              <option key={status.id} value={status.id}>
                                {localizeReleaseStatus(status)}
                              </option>
                            ))}
                          </SelectInput>
                          <TextInput
                            label="Tên mã nội bộ"
                            value={editingModel.internal_codename}
                            onChange={(value) =>
                              updateEditingModelField(
                                "internal_codename",
                                value,
                              )
                            }
                          />
                          <TextInput
                            label="Nhãn thế hệ"
                            value={editingModel.generation_label}
                            onChange={(value) =>
                              updateEditingModelField("generation_label", value)
                            }
                          />
                        </div>
                      </FormSection>

                      <FormSection title="Mốc thời gian">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <TextInput
                            label="Ngày công bố"
                            type="date"
                            value={editingModel.announcement_date}
                            onChange={(value) =>
                              updateEditingModelField(
                                "announcement_date",
                                value,
                              )
                            }
                          />
                          <TextInput
                            label="Ngày phát hành"
                            type="date"
                            value={editingModel.release_date}
                            onChange={(value) =>
                              updateEditingModelField("release_date", value)
                            }
                          />
                          <TextInput
                            label="Kết thúc bán"
                            type="date"
                            value={editingModel.end_of_sale_date}
                            onChange={(value) =>
                              updateEditingModelField("end_of_sale_date", value)
                            }
                          />
                          <TextInput
                            label="Kết thúc hỗ trợ"
                            type="date"
                            value={editingModel.end_of_support_date}
                            onChange={(value) =>
                              updateEditingModelField(
                                "end_of_support_date",
                                value,
                              )
                            }
                          />
                        </div>
                      </FormSection>

                      <FormSection title="Nội dung hiển thị">
                        <TextInput
                          label="URL ảnh bìa"
                          type="url"
                          value={editingModel.cover_image_url}
                          onChange={(value) =>
                            updateEditingModelField("cover_image_url", value)
                          }
                        />
                        <TextAreaInput
                          className="mt-4"
                          label="Tóm tắt"
                          hint={`${editingModel.summary.trim().length}/80–600 ký tự`}
                          minLength={80}
                          maxLength={600}
                          value={editingModel.summary}
                          onChange={(value) =>
                            updateEditingModelField("summary", value)
                          }
                          rows={3}
                          required
                        />
                        <TextAreaInput
                          className="mt-4"
                          label="Mô tả chi tiết"
                          hint={`${editingModel.description.trim().length}/240 ký tự tối thiểu · Nêu điểm nổi bật, thiết kế, hiệu năng, camera, pin, phần mềm, hạn chế và đối tượng phù hợp.`}
                          minLength={240}
                          value={editingModel.description}
                          onChange={(value) =>
                            updateEditingModelField("description", value)
                          }
                          rows={9}
                          required
                        />
                      </FormSection>

                      {modelToRemove ? (
                        <div
                          className="flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                          role="alert"
                        >
                          <div>
                            <p className="text-sm font-semibold text-rose-950">
                              Gỡ “{modelToRemove.name}” khỏi danh mục?
                            </p>
                            <p className="mt-1 text-sm leading-6 text-rose-800">
                              Đây là xóa mềm; dữ liệu lịch sử vẫn được giữ lại.
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => setModelToRemove(null)}
                              className="h-10 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-slate-700"
                            >
                              Giữ lại
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteModel.mutate(modelToRemove.id)
                              }
                              disabled={deleteModel.isPending}
                              className="h-10 rounded-lg bg-rose-700 px-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"
                            >
                              {deleteModel.isPending
                                ? "Đang gỡ…"
                                : "Xác nhận gỡ"}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 -mx-2 flex flex-col-reverse gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
                        <button
                          type="button"
                          onClick={() =>
                            setModelToRemove({
                              id: editingModel.id,
                              name: editingModel.name,
                            })
                          }
                          className="inline-flex h-11 items-center justify-center rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Gỡ mẫu thiết bị
                        </button>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingModel(
                                deviceModelFormFromSummary(selectedRecordModel),
                              )
                            }
                            disabled={
                              updateModel.isPending || !hasUnsavedModelChanges
                            }
                            className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Hoàn tác thay đổi
                          </button>
                          <PrimaryButton
                            disabled={
                              updateModel.isPending ||
                              !hasUnsavedModelChanges ||
                              !editingModel.name.trim() ||
                              !editingModel.slug.trim() ||
                              !editingModel.product_family_id ||
                              !editingModel.release_status_id ||
                              editingModel.summary.trim().length < 80 ||
                              editingModel.description.trim().length < 240
                            }
                            pending={updateModel.isPending}
                            pendingLabel="Đang lưu…"
                          >
                            Lưu thông tin mẫu
                          </PrimaryButton>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 sm:p-5">
                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setVariantForm({
                              ...createInitialVariantForm(),
                              device_model_id: selectedRecordModel.id,
                            });
                            setWorkspace("variant");
                          }}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Plus size={15} />
                          Thêm phiên bản
                        </button>
                      </div>

                      {variantToRemove ? (
                        <div
                          className="mb-4 flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                          role="alert"
                        >
                          <div>
                            <p className="text-sm font-semibold text-rose-950">
                              Gỡ phiên bản “{variantToRemove.name}”?
                            </p>
                            <p className="mt-1 text-sm text-rose-800">
                              Phiên bản sẽ không còn xuất hiện trong danh mục.
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => setVariantToRemove(null)}
                              className="h-10 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-slate-700"
                            >
                              Giữ lại
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteVariant.mutate(variantToRemove.id)
                              }
                              disabled={deleteVariant.isPending}
                              className="h-10 rounded-lg bg-rose-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {deleteVariant.isPending
                                ? "Đang gỡ…"
                                : "Xác nhận gỡ"}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {editingVariantId ? (
                        editingVariantDetail.isLoading ||
                        !editingVariantForm ? (
                          <LoadingPanel label="Đang tải phiên bản cần chỉnh sửa..." />
                        ) : (
                          <form
                            className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                            onSubmit={(event) => {
                              event.preventDefault();
                              updateVariant.mutate();
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-950">
                                  {editingVariantMode === "scores"
                                    ? "Quy chuẩn score tự động"
                                    : "Chỉnh sửa biến thể phần cứng"}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {editingVariantForm.variant_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVariantId(null);
                                    setEditingVariantForm(null);
                                  }}
                                  aria-label="Đóng trình chỉnh sửa phiên bản"
                                  className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-950"
                                >
                                  <X size={17} />
                                </button>
                              </div>
                            </div>

                            {editingVariantMode === "scores" ? (
                              <VariantScoreWorkspace
                                profile={scoringProfileForModel(
                                  editingVariantForm.device_model_id,
                                  modelChoices.data?.data,
                                  scoringProfiles.data,
                                  editingVariantDetail.data?.device_model
                                    ?.product_family?.device_category?.slug,
                                )}
                                onOpenFullEditor={() =>
                                  setEditingVariantMode("full")
                                }
                              />
                            ) : (
                              <>
                                <FormSection
                                  title="Định danh biến thể phần cứng"
                                  description="Tên được tạo từ thị trường và mã model; màu và dung lượng không phải biến thể."
                                >
                                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <TextInput
                                      label="Mã model phần cứng"
                                      placeholder="SM-S931N"
                                      value={editingVariantForm.sku_code}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "sku_code",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Thị trường / khu vực"
                                      placeholder="Hàn Quốc, Hoa Kỳ, Toàn cầu..."
                                      value={editingVariantForm.market_name}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "market_name",
                                          value,
                                        )
                                      }
                                    />
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                      <p className="text-xs font-semibold text-blue-700">
                                        Tên tự động
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-blue-950">
                                        {hardwareVariantLabel(
                                          editingVariantForm.market_name,
                                          editingVariantForm.sku_code,
                                        )}
                                      </p>
                                    </div>
                                    <SelectInput
                                      label="Trạng thái"
                                      value={
                                        editingVariantForm.release_status_id
                                      }
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "release_status_id",
                                          value,
                                        )
                                      }
                                      required
                                    >
                                      <option value="">Chọn trạng thái</option>
                                      {releaseStatuses.data?.map((status) => (
                                        <option
                                          key={status.id}
                                          value={status.id}
                                        >
                                          {localizeReleaseStatus(status)}
                                        </option>
                                      ))}
                                    </SelectInput>
                                    <TextInput
                                      label="Ngày phát hành"
                                      type="date"
                                      value={editingVariantForm.launch_date}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "launch_date",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Ngày kết thúc bán"
                                      type="date"
                                      value={
                                        editingVariantForm.end_of_sale_date
                                      }
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "end_of_sale_date",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Giá ra mắt"
                                      type="number"
                                      min="0"
                                      value={editingVariantForm.launch_price}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "launch_price",
                                          value,
                                        )
                                      }
                                    />
                                    <SelectInput
                                      label="Tiền tệ"
                                      value={editingVariantForm.currency_id}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "currency_id",
                                          value,
                                        )
                                      }
                                    >
                                      <option value="">Chưa chọn</option>
                                      {currencies.data?.map((currency) => (
                                        <option
                                          key={currency.id}
                                          value={currency.id}
                                        >
                                          {currency.code}
                                        </option>
                                      ))}
                                    </SelectInput>
                                  </div>
                                  <div className="mt-4">
                                    <CheckboxInput
                                      label="Đặt làm phiên bản mặc định"
                                      checked={editingVariantForm.is_default}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "is_default",
                                          value,
                                        )
                                      }
                                    />
                                  </div>
                                  <TextAreaInput
                                    className="mt-4"
                                    label="Ghi chú"
                                    value={editingVariantForm.notes}
                                    onChange={(value) =>
                                      updateEditingVariantField("notes", value)
                                    }
                                  />
                                </FormSection>

                                <VariantPurchaseLinksEditor
                                  variantId={editingVariantId}
                                  accessToken={accessToken}
                                />

                                <HardwareAssignmentsEditor
                                  form={editingVariantForm}
                                  catalog={hardwareCatalog}
                                  onChange={(key, value) =>
                                    updateEditingVariantField(key, value)
                                  }
                                />

                                <VariantScoreWorkspace
                                  profile={scoringProfileForModel(
                                    editingVariantForm.device_model_id,
                                    modelChoices.data?.data,
                                    scoringProfiles.data,
                                    editingVariantDetail.data?.device_model
                                      ?.product_family?.device_category?.slug,
                                  )}
                                />

                                <details
                                  className="rounded-xl border border-slate-200 bg-white p-4"
                                  open
                                >
                                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                    Kích thước và vật liệu
                                  </summary>
                                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {[
                                      ["height_mm", "Chiều cao (mm)"],
                                      ["width_mm", "Chiều rộng (mm)"],
                                      ["thickness_mm", "Độ dày (mm)"],
                                      ["weight_g", "Khối lượng (g)"],
                                      ["volume_cm3", "Thể tích (cm³)"],
                                    ].map(([key, label]) => (
                                      <TextInput
                                        key={key}
                                        label={label}
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={
                                          editingVariantForm[
                                            key as keyof DeviceVariantForm
                                          ] as string
                                        }
                                        onChange={(value) =>
                                          updateEditingVariantField(
                                            key as keyof DeviceVariantForm,
                                            value,
                                          )
                                        }
                                      />
                                    ))}
                                    <TextInput
                                      label="Vật liệu khung"
                                      value={editingVariantForm.frame_material}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "frame_material",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Vật liệu mặt lưng"
                                      value={editingVariantForm.back_material}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "back_material",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Kính mặt trước"
                                      value={editingVariantForm.front_glass}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "front_glass",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Kháng bụi/nước"
                                      value={
                                        editingVariantForm.ingress_protection
                                      }
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "ingress_protection",
                                          value,
                                        )
                                      }
                                    />
                                  </div>
                                </details>

                                <details className="rounded-xl border border-slate-200 bg-white p-4">
                                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                    SIM, âm thanh và mở rộng
                                  </summary>
                                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    <TextInput
                                      label="Số khe SIM"
                                      type="number"
                                      min="0"
                                      value={editingVariantForm.sim_slots}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "sim_slots",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Loại SIM"
                                      value={editingVariantForm.sim_type}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "sim_type",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Số eSIM"
                                      type="number"
                                      min="0"
                                      value={editingVariantForm.esim_count}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "esim_count",
                                          value,
                                        )
                                      }
                                    />
                                    <BooleanInput
                                      label="Hỗ trợ eSIM"
                                      value={editingVariantForm.esim_supported}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "esim_supported",
                                          value,
                                        )
                                      }
                                    />
                                    <BooleanInput
                                      label="Loa stereo"
                                      value={editingVariantForm.stereo_speakers}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "stereo_speakers",
                                          value,
                                        )
                                      }
                                    />
                                    <BooleanInput
                                      label="Cổng tai nghe"
                                      value={editingVariantForm.headphone_jack}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "headphone_jack",
                                          value,
                                        )
                                      }
                                    />
                                    <BooleanInput
                                      label="Khe thẻ nhớ"
                                      value={
                                        editingVariantForm.has_microsd_slot
                                      }
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "has_microsd_slot",
                                          value,
                                        )
                                      }
                                    />
                                    <BooleanInput
                                      label="Cổng hồng ngoại"
                                      value={editingVariantForm.has_ir_blaster}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "has_ir_blaster",
                                          value,
                                        )
                                      }
                                    />
                                    <BooleanInput
                                      label="Đèn thông báo"
                                      value={
                                        editingVariantForm.has_notification_led
                                      }
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "has_notification_led",
                                          value,
                                        )
                                      }
                                    />
                                  </div>
                                </details>

                                <details className="rounded-xl border border-slate-200 bg-white p-4">
                                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                    Tản nhiệt
                                  </summary>
                                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                    <TextInput
                                      label="Loại tản nhiệt"
                                      value={editingVariantForm.cooling_type}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "cooling_type",
                                          value,
                                        )
                                      }
                                    />
                                    <TextInput
                                      label="Diện tích buồng hơi (mm²)"
                                      type="number"
                                      min="0"
                                      value={editingVariantForm.vc_area_mm2}
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "vc_area_mm2",
                                          value,
                                        )
                                      }
                                    />
                                    <BooleanInput
                                      label="Tản nhiệt chủ động"
                                      value={
                                        editingVariantForm.has_active_cooling
                                      }
                                      onChange={(value) =>
                                        updateEditingVariantField(
                                          "has_active_cooling",
                                          value,
                                        )
                                      }
                                    />
                                  </div>
                                </details>
                              </>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVariantId(null);
                                  setEditingVariantForm(null);
                                }}
                                className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                              >
                                Hủy
                              </button>
                              <PrimaryButton
                                disabled={
                                  updateVariant.isPending ||
                                  (!editingVariantForm.market_name.trim() &&
                                    !editingVariantForm.sku_code.trim()) ||
                                  !editingVariantForm.release_status_id ||
                                  (editingVariantMode === "full" &&
                                    !hasCompleteHardwareAssignments(
                                      editingVariantForm,
                                    ))
                                }
                                pending={updateVariant.isPending}
                                pendingLabel={
                                  editingVariantMode === "scores"
                                    ? "Đang tính lại…"
                                    : "Đang lưu…"
                                }
                              >
                                {editingVariantMode === "scores"
                                  ? "Tính lại score"
                                  : "Lưu biến thể"}
                              </PrimaryButton>
                            </div>
                          </form>
                        )
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {managedVariants.data?.data.map((variant) => {
                            const scorecard = variant.variant_scorecards?.[0];
                            const configuration = calculateConfigurationIndex(
                              variant.variant_module_scores,
                            );
                            const displayedScore = scorecard
                              ? Number(scorecard.overall_score)
                              : configuration?.score;
                            const scoreCoverage = scorecard
                              ? Number(scorecard.coverage_percent)
                              : (configuration?.coverage ?? 0);
                            return (
                              <article
                                key={variant.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h5 className="font-semibold text-slate-950">
                                        {variant.variant_name}
                                      </h5>
                                      {variant.is_default ? (
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                          Mặc định
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {variant.sku_code || "Chưa có SKU"}
                                      {variant.market_name
                                        ? ` · ${variant.market_name}`
                                        : ""}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-xs font-medium text-slate-500">
                                    {localizeReleaseStatus(
                                      variant.release_status,
                                      "-",
                                    )}
                                  </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                                  <span className="text-slate-500">
                                    {variant.color_name ?? "Chưa có màu"}
                                  </span>
                                  <span className="font-semibold text-slate-800">
                                    {variant.launch_price != null
                                      ? formatPrice(
                                          variant.launch_price,
                                          variant.currency,
                                        )
                                      : "Chưa có giá"}
                                  </span>
                                </div>
                                <div className="mt-2 grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50 px-1 py-2">
                                  <div className="px-2">
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                      Điểm tổng
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                      {displayedScore !== undefined
                                        ? formatAdminNumber(displayedScore)
                                        : "—"}
                                    </p>
                                  </div>
                                  <div className="px-2">
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                      Độ phủ
                                    </p>
                                    <p
                                      className={`mt-1 text-sm font-bold ${
                                        scoreCoverage >= 100
                                          ? "text-emerald-700"
                                          : "text-amber-700"
                                      }`}
                                    >
                                      {scorecard || configuration
                                        ? `${formatAdminNumber(scoreCoverage)}%`
                                        : "0%"}
                                    </p>
                                  </div>
                                  <div className="px-2">
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                      Benchmark
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                      {variant.device_variant_benchmarks
                                        ?.length ?? 0}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_36px_36px] gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVariantToRemove(null);
                                      setEditingVariantForm(null);
                                      setEditingVariantMode("scores");
                                      setEditingVariantId(variant.id);
                                    }}
                                    className="inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                  >
                                    <Gauge size={14} />
                                    {scorecard
                                      ? "Tính lại score"
                                      : "Tạo score tự động"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVariantToRemove(null);
                                      setEditingVariantForm(null);
                                      setEditingVariantMode("full");
                                      setEditingVariantId(variant.id);
                                    }}
                                    className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                                    aria-label={`Chỉnh sửa ${variant.variant_name}`}
                                    title="Chỉnh sửa phiên bản"
                                  >
                                    <Settings2 size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVariantToRemove({
                                        id: variant.id,
                                        name: variant.variant_name,
                                      })
                                    }
                                    className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-700 transition hover:bg-rose-50"
                                    aria-label={`Gỡ ${variant.variant_name}`}
                                    title="Gỡ phiên bản"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                          {!managedVariants.data?.data.length &&
                          !managedVariants.isLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center md:col-span-2">
                              <Database
                                className="mx-auto text-slate-300"
                                size={30}
                              />
                              <p className="mt-3 text-sm font-semibold text-slate-800">
                                Mẫu thiết bị chưa có phiên bản
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Thêm phiên bản đầu tiên để nhập giá và thông số.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function HardwareModulesPanel({
  accessToken,
  initialDraftId,
}: {
  accessToken: string;
  initialDraftId?: string;
}) {
  const queryClient = useQueryClient();
  const appliedQuickDraftId = useRef<string | null>(null);
  const [form, setForm] = useState<HardwareModuleForm>(
    createInitialHardwareModuleForm,
  );
  const [chipsetBenchmarkResults, setChipsetBenchmarkResults] = useState<
    PerformanceResultForm[]
  >([createEmptyPerformanceResult()]);
  const [showHardwareDetails, setShowHardwareDetails] = useState(false);
  const [showHardwareEditor, setShowHardwareEditor] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleToRemove, setModuleToRemove] =
    useState<AdminHardwareModuleRecord | null>(null);
  const [hardwareImageFile, setHardwareImageFile] = useState<File | null>(null);
  const [moduleNotice, setModuleNotice] = useState<{
    name: string;
    wasEditing: boolean;
    imageWarning: string | null;
  } | null>(null);
  const [activeQuickDraftId, setActiveQuickDraftId] = useState(initialDraftId);
  const [requestedQuickDraftId, setRequestedQuickDraftId] =
    useState(initialDraftId);
  const quickDraft = useQuery({
    queryKey: ["catalog-studio", "quick-hardware-draft", requestedQuickDraftId],
    queryFn: () => api.getCatalogDraft(requestedQuickDraftId!, accessToken),
    enabled: Boolean(requestedQuickDraftId),
  });
  const quickHardwareDrafts = useQuery({
    queryKey: ["catalog-studio", "quick-hardware-drafts"],
    queryFn: () => api.listCatalogDrafts(accessToken),
  });
  const organizations = useQuery({
    queryKey: ["admin", "hardware-organizations"],
    queryFn: () => api.listOrganizations({ page: 1, pageSize: 100 }),
  });
  const modules = useQuery({
    queryKey: ["admin", "hardware-modules", form.kind, moduleSearch],
    queryFn: () =>
      api.listAdminHardwareModules(form.kind, {
        page: 1,
        pageSize: 24,
        q: moduleSearch.trim() || undefined,
      }),
  });
  const duplicateLookup = useDeferredValue(
    form.slug.trim() || form.name.trim(),
  );
  const duplicateModules = useQuery({
    queryKey: ["admin", "hardware-module-identity", form.kind, duplicateLookup],
    queryFn: () =>
      api.listAdminHardwareModules(form.kind, {
        page: 1,
        pageSize: 10,
        q: duplicateLookup,
      }),
    enabled: duplicateLookup.length >= 2,
    staleTime: 30_000,
  });
  const hardwareCpus = useQuery({
    queryKey: ["admin", "hardware-relations", "cpus"],
    queryFn: () => api.listHardwareCpus({ page: 1, pageSize: 100 }),
    enabled: form.kind === "chipset" && showHardwareEditor,
  });
  const hardwareGpus = useQuery({
    queryKey: ["admin", "hardware-relations", "gpus"],
    queryFn: () => api.listHardwareGpus({ page: 1, pageSize: 100 }),
    enabled: form.kind === "chipset" && showHardwareEditor,
  });
  const hardwareNpus = useQuery({
    queryKey: ["admin", "hardware-relations", "npus"],
    queryFn: () => api.listHardwareNpus({ page: 1, pageSize: 100 }),
    enabled: form.kind === "chipset" && showHardwareEditor,
  });
  const hardwareModems = useQuery({
    queryKey: ["admin", "hardware-relations", "modems"],
    queryFn: () => api.listHardwareModems({ page: 1, pageSize: 100 }),
    enabled: form.kind === "chipset",
  });
  const chipsetBenchmarks = useQuery({
    queryKey: ["admin", "hardware-benchmarks", "chipset"],
    queryFn: () => api.listHardwareBenchmarks("chipset", accessToken),
    enabled: form.kind === "chipset" && showHardwareEditor,
  });
  const selectedOption =
    hardwareModuleOptions.find((option) => option.value === form.kind) ??
    hardwareModuleOptions[0];
  const SelectedModuleIcon = selectedOption.icon;
  const selectedDetailFields = hardwareDetailFields[form.kind];
  const selectedValueFields = selectedDetailFields.filter(
    (field) => field.type !== "boolean",
  );
  const selectedCapabilityFields = selectedDetailFields.filter(
    (field) => field.type === "boolean",
  );
  const enteredCpuClusterCount =
    form.kind === "cpu"
      ? ([1, 2, 3] as const).filter(
          (cluster) =>
            form[`chipset_cpu_cluster_${cluster}_architecture`].trim() &&
            form[`chipset_cpu_cluster_${cluster}_core_count`].trim(),
        ).length
      : 0;
  const enteredDetailCount =
    selectedDetailFields.filter((field) => form[field.key] !== "").length +
    enteredCpuClusterCount;
  const technicalFieldTotal =
    selectedDetailFields.length + (form.kind === "cpu" ? 3 : 0);
  const selectedOrganization = organizations.data?.data.find(
    (organization) => organization.id === form.organization_id,
  );

  useEffect(() => {
    if (
      !requestedQuickDraftId ||
      !quickDraft.data ||
      appliedQuickDraftId.current === requestedQuickDraftId ||
      quickDraft.data.draft_type !== "hardware-module"
    ) {
      return;
    }
    const imported = hardwareModuleFormFromQuickDraft(quickDraft.data);
    if (!imported) return;
    const requestedOrganization = quickDraftOrganizationName(quickDraft.data);
    const organization = requestedOrganization
      ? organizations.data?.data.find(
          (item) =>
            normalizeCatalogIdentity(item.name) ===
            normalizeCatalogIdentity(requestedOrganization),
        )
      : undefined;
    appliedQuickDraftId.current = requestedQuickDraftId;
    setActiveQuickDraftId(requestedQuickDraftId);
    setEditingModuleId(null);
    setHardwareImageFile(null);
    setShowHardwareDetails(true);
    setShowHardwareEditor(true);
    setForm({
      ...imported,
      organization_id: organization?.id ?? imported.organization_id,
    });
    window.requestAnimationFrame(() => {
      document.getElementById("hardware-module-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [organizations.data?.data, quickDraft.data, requestedQuickDraftId]);

  const openQuickHardwareDraft = (draft: CatalogDraft) => {
    appliedQuickDraftId.current = null;
    setRequestedQuickDraftId(draft.id);
  };
  const pendingQuickHardwareDrafts = (quickHardwareDrafts.data ?? []).filter(
    (draft) =>
      draft.draft_type === "hardware-module" && draft.status !== "published",
  );
  const normalizedModuleName = normalizeCatalogIdentity(form.name);
  const normalizedModuleSlug = form.slug.trim().toLocaleLowerCase();
  const duplicateModule = duplicateModules.data?.data.find(
    (module) =>
      module.id !== editingModuleId &&
      ((normalizedModuleSlug &&
        module.slug.toLocaleLowerCase() === normalizedModuleSlug) ||
        (normalizedModuleName &&
          normalizeCatalogIdentity(module.name) === normalizedModuleName)),
  );
  const moduleRequiredItems = [
    { label: "Tên mô-đun", complete: Boolean(form.name.trim()) },
    { label: "Slug", complete: Boolean(form.slug.trim()) },
    {
      label: "Mô tả chuẩn hóa",
      complete: form.description.trim().length >= 120,
    },
    ...(selectedOption.organizationRequired
      ? [
          {
            label: "Nhà sản xuất",
            complete: Boolean(form.organization_id),
          },
        ]
      : []),
    ...(selectedOption.categoryRequired
      ? [
          {
            label: selectedOption.categoryLabel ?? "Phân loại",
            complete: Boolean(form.category.trim()),
          },
        ]
      : []),
    ...(form.kind === "chipset" && !editingModuleId
      ? [
          {
            label: "CPU tích hợp",
            complete: Boolean(form.cpu_id || form.chipset_cpu_name.trim()),
          },
          {
            label: "GPU tích hợp",
            complete: Boolean(form.gpu_id || form.chipset_gpu_name.trim()),
          },
          {
            label: "NPU / AI engine",
            complete: Boolean(form.npu_id || form.chipset_npu_name.trim()),
          },
        ]
      : []),
    ...(form.name.trim() && form.slug.trim()
      ? [
          {
            label: "Không trùng mô-đun đã có",
            complete: !duplicateModule,
          },
        ]
      : []),
  ];
  const completedModuleRequiredItems = moduleRequiredItems.filter(
    (item) => item.complete,
  ).length;
  const missingModuleRequiredItems =
    moduleRequiredItems.length - completedModuleRequiredItems;
  const updateField = (
    key: Exclude<keyof HardwareModuleForm, "kind">,
    value: string,
  ) => setForm((current) => ({ ...current, [key]: value }));
  const changeModuleKind = (kind: AdminHardwareModuleKind) => {
    if (editingModuleId || kind === form.kind) return;
    setModuleToRemove(null);
    setModuleNotice(null);
    setShowHardwareDetails(false);
    setHardwareImageFile(null);
    setModuleSearch("");
    setChipsetBenchmarkResults([createEmptyPerformanceResult()]);
    setForm({
      ...createInitialHardwareModuleForm(),
      kind,
    });
  };
  const cancelModuleEdit = () => {
    setEditingModuleId(null);
    setShowHardwareEditor(false);
    setShowHardwareDetails(false);
    setHardwareImageFile(null);
    setChipsetBenchmarkResults([createEmptyPerformanceResult()]);
    setForm((current) => ({
      ...createInitialHardwareModuleForm(),
      kind: current.kind,
    }));
  };
  const beginModuleEdit = (module: AdminHardwareModuleRecord) => {
    setModuleToRemove(null);
    setEditingModuleId(module.id);
    setHardwareImageFile(null);
    setChipsetBenchmarkResults(chipsetBenchmarkFormsFromRecord(module));
    setForm(hardwareModuleFormFromRecord(form.kind, module));
    setShowHardwareEditor(true);
    setShowHardwareDetails(true);
    window.requestAnimationFrame(() => {
      document.getElementById("hardware-module-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const startModuleCreate = () => {
    setEditingModuleId(null);
    setModuleToRemove(null);
    setShowHardwareDetails(false);
    setHardwareImageFile(null);
    setModuleNotice(null);
    setChipsetBenchmarkResults([createEmptyPerformanceResult()]);
    setForm((current) => ({
      ...createInitialHardwareModuleForm(),
      kind: current.kind,
    }));
    setShowHardwareEditor(true);
    window.requestAnimationFrame(() => {
      document.getElementById("hardware-module-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const saveModule = useMutation({
    mutationFn: async () => {
      const payload = buildHardwareModulePayload(form, chipsetBenchmarkResults);
      const wasEditing = Boolean(editingModuleId);
      const completingDraftId = !wasEditing ? activeQuickDraftId : undefined;
      if (completingDraftId) {
        const evidence = await api.getCatalogEvidenceCoverage(
          { catalog_draft_id: completingDraftId },
          accessToken,
        );
        if (evidence.summary.conflicts) {
          throw new Error(
            `Còn ${evidence.summary.conflicts} claim xung đột. Hãy xử lý trong mục Bằng chứng trước khi xuất bản mô-đun.`,
          );
        }
      }
      let savedModule;
      if (editingModuleId) {
        const { kind, ...updatePayload } = payload;
        void kind;
        savedModule = await api.updateHardwareModule(
          form.kind,
          editingModuleId,
          updatePayload,
          accessToken,
        );
      } else {
        savedModule = await api.createHardwareModule(payload, accessToken);
      }

      let imageWarning: string | null = null;
      if (hardwareImageFile) {
        try {
          const upload = await api.createMediaUpload(
            {
              filename: hardwareImageFile.name,
              mime_type: hardwareImageFile.type,
              asset_type: "image",
              file_size_bytes: hardwareImageFile.size,
              entity_table: hardwareModuleMediaTable(savedModule.kind),
              entity_id: savedModule.id,
              role: "hero",
              alt_text: `Hình ảnh ${savedModule.name}`,
              is_primary: true,
            },
            accessToken,
          );
          const uploaded = await fetch(upload.data.upload_url, {
            method: "PUT",
            body: hardwareImageFile,
            headers: { "Content-Type": hardwareImageFile.type },
          });
          if (!uploaded.ok) {
            throw new Error(`Kho ảnh trả về mã ${uploaded.status}.`);
          }
          await api.completeMediaUpload(upload.data.id, undefined, accessToken);
          if (!upload.data.public_url) {
            throw new Error(
              "Kho ảnh chưa có địa chỉ công khai để hiển thị hình ảnh.",
            );
          }
          await api.updateHardwareModule(
            savedModule.kind,
            savedModule.id,
            { image_url: upload.data.public_url },
            accessToken,
          );
          savedModule = {
            ...savedModule,
            image_url: upload.data.public_url,
          };
        } catch (error) {
          imageWarning =
            error instanceof Error
              ? error.message
              : "Không thể tải hình ảnh mô-đun lên kho ảnh.";
        }
      }

      if (completingDraftId) {
        await api.completeCatalogDraft(
          completingDraftId,
          hardwareModuleMediaTable(savedModule.kind),
          savedModule.id,
          accessToken,
        );
      }

      return { savedModule, wasEditing, imageWarning, completingDraftId };
    },
    onMutate: () => setModuleNotice(null),
    onSuccess: ({
      savedModule,
      wasEditing,
      imageWarning,
      completingDraftId,
    }) => {
      setModuleNotice({ name: savedModule.name, wasEditing, imageWarning });
      setEditingModuleId(null);
      setShowHardwareEditor(false);
      setShowHardwareDetails(false);
      setHardwareImageFile(null);
      setChipsetBenchmarkResults([createEmptyPerformanceResult()]);
      if (completingDraftId) {
        setActiveQuickDraftId(undefined);
        setRequestedQuickDraftId(undefined);
        void queryClient.invalidateQueries({
          queryKey: ["catalog-studio", "drafts"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["catalog-studio", "quick-hardware-drafts"],
        });
      }
      setForm((current) => ({
        ...createInitialHardwareModuleForm(),
        kind: current.kind,
      }));
      void queryClient.invalidateQueries({
        queryKey: ["admin", "hardware-modules", savedModule.kind],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "hardware-relations"],
      });
    },
  });
  const deleteModule = useMutation({
    mutationFn: (module: AdminHardwareModuleRecord) =>
      api.deleteHardwareModule(form.kind, module.id, accessToken),
    onSuccess: (module) => {
      setModuleToRemove(null);
      if (editingModuleId === module.id) {
        setEditingModuleId(null);
        setShowHardwareEditor(false);
        setShowHardwareDetails(false);
        setHardwareImageFile(null);
        setForm((current) => ({
          ...createInitialHardwareModuleForm(),
          kind: current.kind,
        }));
      }
      void queryClient.invalidateQueries({
        queryKey: ["admin", "hardware-modules", form.kind],
      });
    },
  });
  const canSubmit =
    Boolean(form.name.trim()) &&
    Boolean(form.slug.trim()) &&
    form.description.trim().length >= 120 &&
    !duplicateModule &&
    (!selectedOption.organizationRequired || Boolean(form.organization_id)) &&
    (!selectedOption.categoryRequired || Boolean(form.category.trim())) &&
    (form.kind !== "chipset" ||
      Boolean(editingModuleId) ||
      (Boolean(form.cpu_id || form.chipset_cpu_name.trim()) &&
        Boolean(form.gpu_id || form.chipset_gpu_name.trim()) &&
        Boolean(form.npu_id || form.chipset_npu_name.trim())));

  return (
    <div className="space-y-5">
      <section className="app-panel p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div
            className="grid grid-cols-3 gap-1.5 sm:grid-cols-7"
            role="radiogroup"
            aria-label="Loại mô-đun phần cứng"
          >
            {hardwareModuleOptions.map((option) => {
              const Icon = option.icon;
              const active = option.value === form.kind;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={Boolean(editingModuleId)}
                  onClick={() => changeModuleKind(option.value)}
                  className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={startModuleCreate}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Tạo {selectedOption.label}
          </button>
        </div>
      </section>

      {moduleNotice ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm leading-6 ${
            moduleNotice.imageWarning
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          Đã {moduleNotice.wasEditing ? "lưu" : "tạo"} {moduleNotice.name}
          {moduleNotice.imageWarning
            ? `, nhưng hình ảnh chưa được tải lên. ${moduleNotice.imageWarning}`
            : "."}
        </p>
      ) : null}

      {pendingQuickHardwareDrafts.length ? (
        <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-blue-950">
                Bản nháp phần cứng từ Nhập nhanh
              </h2>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                Chọn một bản nháp để rà soát thông số và tạo mô-đun. Bản nháp
                chỉ hoàn tất sau khi lưu thành công.
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
              {pendingQuickHardwareDrafts.length} đang chờ
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingQuickHardwareDrafts.map((draft) => (
              <button
                key={draft.id}
                type="button"
                onClick={() => openQuickHardwareDraft(draft)}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                  activeQuickDraftId === draft.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-blue-200 bg-white text-blue-800 hover:border-blue-400"
                }`}
              >
                {draft.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {showHardwareEditor ? (
        <div
          id="hardware-module-editor"
          className="scroll-mt-32 grid gap-5 xl:grid-cols-[minmax(0,1fr)_336px]"
        >
          <Panel
            title={
              editingModuleId
                ? `Chỉnh sửa ${selectedOption.label}`
                : "Tạo mô-đun phần cứng"
            }
            description="Hoàn tất thông tin bắt buộc trước, sau đó bổ sung ảnh và thông số đã được xác minh."
          >
            <PanelError
              error={
                saveModule.error ??
                deleteModule.error ??
                modules.error ??
                organizations.error ??
                quickDraft.error ??
                hardwareCpus.error ??
                hardwareGpus.error ??
                hardwareNpus.error ??
                hardwareModems.error ??
                chipsetBenchmarks.error
              }
            />
            <form
              id="hardware-module-form"
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                setModuleNotice(null);
                saveModule.mutate();
              }}
            >
              {duplicateModule ? (
                <div
                  className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  role="alert"
                >
                  <div>
                    <p className="text-sm font-semibold text-amber-950">
                      “{duplicateModule.name}” đã có trong catalog
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Tên hoặc slug đang trùng. Hãy dùng bản hiện có để tránh
                      tách dữ liệu thiết bị thành nhiều mô-đun.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => beginModuleEdit(duplicateModule)}
                    className="h-10 shrink-0 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    Chỉnh sửa bản đã có
                  </button>
                </div>
              ) : duplicateModules.isFetching && duplicateLookup.length >= 2 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Đang kiểm tra mô-đun trùng tên hoặc slug…
                </p>
              ) : null}
              <FormSection
                title="Thông tin chính"
                description="Tên và mô tả rõ ràng giúp tránh tạo trùng, đồng thời làm dữ liệu dễ tìm kiếm và tái sử dụng."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label={`Tên ${selectedOption.label}`}
                    placeholder={`Ví dụ: ${hardwareModuleNameExample(form.kind)}`}
                    value={form.name}
                    onChange={(name) =>
                      setForm((current) => ({
                        ...current,
                        name,
                        slug: syncSlug(current.name, current.slug, name),
                      }))
                    }
                    required
                  />
                  <SearchableSelect
                    label={
                      selectedOption.organizationRequired
                        ? "Nhà sản xuất hoặc tổ chức"
                        : "Nhà sản xuất hoặc tổ chức (không bắt buộc)"
                    }
                    value={form.organization_id}
                    onChange={(organization_id) =>
                      updateField("organization_id", organization_id)
                    }
                    options={(organizations.data?.data ?? []).map(
                      (organization) => ({
                        value: organization.id,
                        label: organization.name,
                        meta: organization.slug,
                      }),
                    )}
                    placeholder="Tìm tên tổ chức hoặc slug..."
                    required={selectedOption.organizationRequired}
                  />
                  <TextInput
                    label="Đường dẫn định danh (slug)"
                    placeholder={slugify(hardwareModuleNameExample(form.kind))}
                    hint="Tự tạo theo tên; chỉ sửa khi cần giữ một đường dẫn đặc biệt."
                    value={form.slug}
                    onChange={(slug) => updateField("slug", slug)}
                    required
                  />
                  {selectedOption.categoryLabel ? (
                    <TextInput
                      label={`${selectedOption.categoryLabel}${selectedOption.categoryRequired ? "" : " (không bắt buộc)"}`}
                      placeholder={selectedOption.categoryPlaceholder}
                      value={form.category}
                      onChange={(category) => updateField("category", category)}
                      required={selectedOption.categoryRequired}
                    />
                  ) : null}
                  <div className="md:col-span-2">
                    <TextAreaInput
                      label="Mô tả chuẩn hóa"
                      hint={`${form.description.trim().length}/120 ký tự tối thiểu · Nêu vai trò, thế hệ, thông số chính, khả năng tương thích và giới hạn.`}
                      minLength={120}
                      rows={5}
                      value={form.description}
                      onChange={(description) =>
                        updateField("description", description)
                      }
                      required
                    />
                  </div>
                </div>
              </FormSection>

              {form.kind === "chipset" && !editingModuleId ? (
                <ChipsetCompositionEditor
                  form={form}
                  onChange={updateField}
                  cpus={hardwareCpus.data?.data ?? []}
                  gpus={hardwareGpus.data?.data ?? []}
                  npus={hardwareNpus.data?.data ?? []}
                  modems={hardwareModems.data?.data ?? []}
                />
              ) : null}

              {form.kind === "chipset" && editingModuleId ? (
                <FormSection
                  title="Thành phần chipset"
                  description="Đổi liên kết thành phần của chipset hiện có. Luồng tạo mới cũng ưu tiên nối CPU, GPU và NPU đã có bằng ID."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <SearchableSelect
                      label="CPU chính"
                      value={form.cpu_id}
                      onChange={(cpu_id) => updateField("cpu_id", cpu_id)}
                      options={(hardwareCpus.data?.data ?? []).map((cpu) => ({
                        value: cpu.id,
                        label: cpu.name,
                        meta: [
                          cpu.microarchitecture,
                          cpu.core_count ? `${cpu.core_count} nhân` : null,
                          cpu.max_frequency_mhz
                            ? `${cpu.max_frequency_mhz} MHz`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      }))}
                      placeholder="Tìm CPU theo tên hoặc thông số..."
                      emptyLabel="Chưa có CPU phù hợp. Hãy tạo CPU trước."
                      hint="CPU được đánh dấu là thành phần chính của chipset."
                    />
                    <SearchableSelect
                      label="GPU chính"
                      value={form.gpu_id}
                      onChange={(gpu_id) => updateField("gpu_id", gpu_id)}
                      options={(hardwareGpus.data?.data ?? []).map((gpu) => ({
                        value: gpu.id,
                        label: gpu.name,
                        meta: [
                          gpu.gpu_generation,
                          gpu.compute_units
                            ? `${gpu.compute_units} đơn vị tính toán`
                            : null,
                          gpu.clock_mhz ? `${gpu.clock_mhz} MHz` : null,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      }))}
                      placeholder="Tìm GPU theo tên hoặc thế hệ..."
                      emptyLabel="Chưa có GPU phù hợp. Hãy tạo GPU trước."
                      hint="GPU được đánh dấu là thành phần đồ họa chính."
                    />
                    <SearchableSelect
                      label="NPU chính"
                      value={form.npu_id}
                      onChange={(npu_id) => updateField("npu_id", npu_id)}
                      options={(hardwareNpus.data?.data ?? []).map((npu) => ({
                        value: npu.id,
                        label: npu.name,
                        meta: [
                          npu.ai_engine_version,
                          npu.tops ? `${npu.tops} TOPS` : null,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      }))}
                      placeholder="Tìm NPU theo tên hoặc hiệu năng..."
                      emptyLabel="Chưa có NPU phù hợp. Hãy tạo NPU trước."
                      hint="Để trống nếu chipset không có NPU riêng."
                    />
                    <SearchableSelect
                      label="Modem chính"
                      value={form.modem_id}
                      onChange={(modem_id) =>
                        setForm((current) => ({
                          ...current,
                          modem_id,
                          modem_is_integrated: modem_id
                            ? current.modem_is_integrated || "true"
                            : "",
                        }))
                      }
                      options={(hardwareModems.data?.data ?? []).map(
                        (modem) => ({
                          value: modem.id,
                          label: modem.name,
                          meta: [
                            modem.supports_5g_nr ? "5G NR" : null,
                            modem.lte_category,
                            modem.max_downlink_mbps
                              ? `${modem.max_downlink_mbps} Mbps tải xuống`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · "),
                        }),
                      )}
                      placeholder="Tìm modem theo tên hoặc chuẩn mạng..."
                      emptyLabel="Chưa có modem phù hợp. Hãy tạo modem trước."
                      hint="Chọn modem được dùng làm liên kết chính của chipset."
                    />
                  </div>
                  {form.modem_id ? (
                    <div className="mt-4 max-w-md">
                      <BooleanInput
                        label="Modem được tích hợp trong chipset"
                        value={form.modem_is_integrated}
                        onChange={(modem_is_integrated) =>
                          updateField(
                            "modem_is_integrated",
                            modem_is_integrated,
                          )
                        }
                      />
                    </div>
                  ) : null}
                </FormSection>
              ) : null}

              {form.kind === "chipset" ? (
                <FormSection
                  title="Benchmark của chipset"
                  description="Lưu AnTuTu, Geekbench và các phép đo hiệu năng ở cấp SoC. Luôn chọn đúng phiên bản benchmark; với AnTuTu có thể thêm các dòng overall, CPU, GPU, memory và UX."
                >
                  <PerformanceResultsEditor
                    benchmarks={chipsetBenchmarks.data ?? []}
                    results={chipsetBenchmarkResults}
                    onChange={setChipsetBenchmarkResults}
                  />
                </FormSection>
              ) : null}

              {isStandaloneChipsetComponentKind(form.kind) ? (
                <StandaloneChipsetComponentEditor
                  kind={form.kind}
                  form={form}
                  onChange={updateField}
                />
              ) : null}

              {!isStandaloneChipsetComponentKind(form.kind) &&
              selectedDetailFields.length ? (
                <div
                  className={`rounded-xl border p-4 transition sm:flex sm:items-center sm:justify-between sm:gap-4 ${
                    showHardwareDetails
                      ? "border-blue-200 bg-blue-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                        showHardwareDetails
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Settings2 size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Thông số kỹ thuật
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {enteredDetailCount
                          ? `Đã nhập ${enteredDetailCount}/${selectedDetailFields.length} thông số.`
                          : "Không bắt buộc; chỉ nhập dữ liệu đã được xác minh."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowHardwareDetails((current) => !current)
                    }
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 sm:mt-0 sm:w-auto"
                    aria-expanded={showHardwareDetails}
                    aria-controls="hardware-technical-fields"
                  >
                    {showHardwareDetails
                      ? "Thu gọn"
                      : enteredDetailCount
                        ? "Xem dữ liệu"
                        : `Thêm ${selectedDetailFields.length} trường`}
                    <ChevronRight
                      size={15}
                      aria-hidden="true"
                      className={`transition-transform ${
                        showHardwareDetails ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
              ) : null}

              {showHardwareDetails &&
              !isStandaloneChipsetComponentKind(form.kind) &&
              selectedDetailFields.length ? (
                <div
                  id="hardware-technical-fields"
                  className="space-y-5 rounded-xl border border-slate-200 bg-surface-soft p-4 sm:p-5"
                >
                  {selectedValueFields.length ? (
                    <fieldset>
                      <legend className="text-sm font-semibold text-slate-950">
                        Giá trị và định danh kỹ thuật
                      </legend>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {selectedValueFields.map((field) => (
                          <TextInput
                            key={field.key}
                            label={field.label}
                            type={field.type ?? "text"}
                            min={field.min}
                            step={field.step}
                            placeholder={field.placeholder}
                            value={form[field.key]}
                            onChange={(value) => updateField(field.key, value)}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {selectedCapabilityFields.length ? (
                    <fieldset
                      className={
                        selectedValueFields.length
                          ? "border-t border-slate-200 pt-5"
                          : undefined
                      }
                    >
                      <legend className="text-sm font-semibold text-slate-950">
                        Khả năng hỗ trợ
                      </legend>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {selectedCapabilityFields.map((field) => (
                          <BooleanInput
                            key={field.key}
                            label={field.label}
                            value={form[field.key]}
                            onChange={(value) => updateField(field.key, value)}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                </div>
              ) : null}

              <FormSection
                title="Hình ảnh và nguồn"
                description="Bổ sung sau khi thông số đã hoàn tất. Có thể tải ảnh lên kho nội bộ hoặc dùng một URL công khai."
              >
                <CatalogImageInput
                  file={hardwareImageFile}
                  url={form.image_url}
                  disabled={saveModule.isPending}
                  title={`Ảnh ${selectedOption.label}`}
                  description="Chọn JPG, PNG, WebP hoặc SVG, tối đa 8 MB. Nên dùng ảnh sản phẩm rõ nét, nền đơn giản."
                  previewAlt={`Xem trước ảnh ${selectedOption.label}`}
                  urlLabel="Hoặc dùng URL hình ảnh"
                  urlHint="Nếu chọn tệp, SpecHub sẽ tải ảnh lên kho nội bộ sau khi lưu mô-đun."
                  onFileChange={(file) => {
                    setHardwareImageFile(file);
                    if (file) updateField("image_url", "");
                  }}
                  onUrlChange={(image_url) => {
                    updateField("image_url", image_url);
                    if (image_url.trim()) setHardwareImageFile(null);
                  }}
                />
                <div className="mt-4">
                  <TextInput
                    label="URL nguồn ảnh (không bắt buộc)"
                    type="url"
                    placeholder="https://..."
                    hint="Trang gốc dùng để xác minh hoặc ghi nhận nguồn hình ảnh."
                    disabled={saveModule.isPending}
                    value={form.image_source_url}
                    onChange={(image_source_url) =>
                      updateField("image_source_url", image_source_url)
                    }
                  />
                </div>
              </FormSection>

              <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 -mx-2 flex flex-col-reverse gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end xl:hidden">
                <button
                  type="button"
                  onClick={cancelModuleEdit}
                  className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {editingModuleId ? "Hủy chỉnh sửa" : "Đóng"}
                </button>
                <PrimaryButton
                  disabled={saveModule.isPending || !canSubmit}
                  pending={saveModule.isPending}
                  pendingLabel={
                    editingModuleId ? "Đang lưu mô-đun…" : "Đang tạo mô-đun…"
                  }
                >
                  {editingModuleId
                    ? "Lưu thay đổi"
                    : `Tạo ${selectedOption.label}`}
                </PrimaryButton>
              </div>
            </form>
          </Panel>

          <aside className="xl:sticky xl:top-32 xl:self-start">
            <Panel
              title="Xem trước và hoàn tất"
              description="Theo dõi dữ liệu bắt buộc và lưu mô-đun từ đây."
            >
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                      <SelectedModuleIcon size={21} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                        {selectedOption.label}
                      </p>
                      <p className="mt-1 truncate text-base font-semibold text-slate-950">
                        {form.name.trim() || "Mô-đun chưa đặt tên"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {selectedOrganization?.name ??
                          (selectedOption.organizationRequired
                            ? "Chưa chọn nhà sản xuất"
                            : "Không yêu cầu nhà sản xuất")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                    <p className="truncate font-mono text-[11px] text-slate-500">
                      /hardware/{form.kind}/{form.slug || "slug-mô-đun"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-slate-200 bg-slate-50">
                  <div className="border-r border-slate-200 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Hình ảnh
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {hardwareImageFile || form.image_url.trim()
                        ? "Đã chọn"
                        : "Chưa có"}
                    </p>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Thông số
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {enteredDetailCount}/{technicalFieldTotal} trường
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 rounded-xl border p-4 ${
                  canSubmit
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
                role="status"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      canSubmit ? "text-emerald-950" : "text-amber-950"
                    }`}
                  >
                    {canSubmit
                      ? "Sẵn sàng lưu"
                      : `Còn ${missingModuleRequiredItems} mục bắt buộc`}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      canSubmit ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    {completedModuleRequiredItems}/{moduleRequiredItems.length}
                  </span>
                </div>
                <div
                  className={`mt-2 h-2 overflow-hidden rounded-full ${
                    canSubmit ? "bg-emerald-100" : "bg-amber-100"
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      canSubmit ? "bg-emerald-600" : "bg-amber-500"
                    }`}
                    style={{
                      width: `${
                        moduleRequiredItems.length
                          ? (completedModuleRequiredItems /
                              moduleRequiredItems.length) *
                            100
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {moduleRequiredItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    {item.complete ? (
                      <CheckCircle2
                        size={17}
                        className="text-emerald-600"
                        aria-label="Đã hoàn thành"
                      />
                    ) : (
                      <span className="text-xs font-medium text-amber-700">
                        Còn thiếu
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 hidden space-y-2 xl:block">
                <button
                  type="submit"
                  form="hardware-module-form"
                  disabled={saveModule.isPending || !canSubmit}
                  aria-busy={saveModule.isPending}
                  className="app-button-primary w-full px-5"
                >
                  {saveModule.isPending
                    ? editingModuleId
                      ? "Đang lưu mô-đun…"
                      : "Đang tạo mô-đun…"
                    : editingModuleId
                      ? "Lưu thay đổi"
                      : `Tạo ${selectedOption.label}`}
                </button>
                <button
                  type="button"
                  onClick={cancelModuleEdit}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {editingModuleId ? "Hủy chỉnh sửa" : "Đóng"}
                </button>
              </div>
            </Panel>
          </aside>
        </div>
      ) : null}

      <Panel
        title={`Quản lý ${selectedOption.label}`}
        description="Tìm nhanh mô-đun đã có, chỉnh sửa thông số hoặc xóa mô-đun không còn được sử dụng."
      >
        <PanelError error={modules.error ?? deleteModule.error} />
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="search"
              aria-label={`Tìm ${selectedOption.label}`}
              value={moduleSearch}
              onChange={(event) => setModuleSearch(event.target.value)}
              placeholder={`Tìm ${selectedOption.label.toLocaleLowerCase("vi")}...`}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <span className="text-sm text-slate-500">
            {modules.data?.meta.total ?? 0} mô-đun
          </span>
        </div>

        {moduleToRemove ? (
          <div
            className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <div>
              <p className="text-sm font-semibold text-rose-950">
                Xóa “{moduleToRemove.name}”?
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-800">
                Chỉ mô-đun chưa được chipset hoặc thiết bị sử dụng mới có thể
                xóa.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setModuleToRemove(null)}
                className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-slate-700"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={() => deleteModule.mutate(moduleToRemove)}
                disabled={deleteModule.isPending}
                className="h-9 rounded-lg bg-rose-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleteModule.isPending ? "Đang xóa…" : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {modules.data?.data.map((module) => (
            <article
              key={module.id}
              className="flex flex-col gap-3 p-3 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-400">
                  {module.image_url ? (
                    // Administrator-managed module images may use a configured external URL.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={module.image_url}
                      alt=""
                      className="size-full object-contain p-1.5"
                    />
                  ) : (
                    <Cpu size={19} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="truncate text-sm font-semibold text-slate-950">
                      {module.name}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {hardwareModuleUsageCount(module)} liên kết
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {hardwareModuleOrganizationName(module) ??
                      "Chưa có nhà sản xuất"}
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {module.slug}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2">
                <button
                  type="button"
                  onClick={() => beginModuleEdit(module)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => setModuleToRemove(module)}
                  className="grid size-9 place-items-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  aria-label={`Xóa ${module.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {(modules.data?.meta.total ?? 0) > (modules.data?.data.length ?? 0) ? (
          <p className="mt-3 text-xs text-slate-500">
            Đang hiển thị {modules.data?.data.length}/{modules.data?.meta.total}{" "}
            mô-đun. Nhập từ khóa để tìm trong toàn bộ danh sách.
          </p>
        ) : null}
        {!modules.data?.data.length && !modules.isLoading ? (
          <EmptyRow label="Không tìm thấy mô-đun phù hợp." />
        ) : null}
      </Panel>
    </div>
  );
}

type VariantAffiliateLinkForm = {
  partner_id: string;
  region_code: string;
  product_url: string;
  current_price: string;
  currency_code: string;
  in_stock: boolean;
};

function createVariantAffiliateLinkForm(): VariantAffiliateLinkForm {
  return {
    partner_id: "",
    region_code: "VN",
    product_url: "",
    current_price: "",
    currency_code: "VND",
    in_stock: true,
  };
}

function VariantPurchaseLinksEditor({
  variantId,
  accessToken,
}: {
  variantId: string;
  accessToken: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VariantAffiliateLinkForm>(
    createVariantAffiliateLinkForm,
  );
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<AffiliateLink | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const partners = useQuery({
    queryKey: ["admin", "affiliate-partners"],
    queryFn: () => api.listAffiliatePartners().then((result) => result.data),
  });
  const links = useQuery({
    queryKey: ["admin", "affiliate-links", variantId],
    queryFn: () =>
      api
        .listAffiliateLinks({ device_variant_id: variantId })
        .then((result) => result.data),
  });

  useEffect(() => {
    if (form.partner_id || !partners.data?.length) return;
    const preferred =
      partners.data.find((partner) => partner.is_active) ?? partners.data[0];
    if (preferred) {
      setForm((current) => ({ ...current, partner_id: preferred.id }));
    }
  }, [form.partner_id, partners.data]);

  function refreshLinks() {
    void queryClient.invalidateQueries({
      queryKey: ["admin", "affiliate-links"],
    });
  }

  function resetForm() {
    setEditingLinkId(null);
    setForm(() => {
      const next = createVariantAffiliateLinkForm();
      next.partner_id =
        partners.data?.find((partner) => partner.is_active)?.id ??
        partners.data?.[0]?.id ??
        "";
      return next;
    });
  }

  function formPayload() {
    return {
      partner_id: form.partner_id,
      device_variant_id: variantId,
      region_code: form.region_code.trim().toUpperCase(),
      product_url: form.product_url.trim(),
      current_price: form.current_price.trim()
        ? Number(form.current_price)
        : undefined,
      currency_code: form.currency_code.trim().toUpperCase(),
      in_stock: form.in_stock,
    };
  }

  const createLink = useMutation({
    mutationFn: () => api.createAffiliateLink(formPayload(), accessToken),
    onSuccess: () => {
      resetForm();
      setMessage("Đã thêm liên kết mua hàng.");
      refreshLinks();
    },
  });
  const updateLink = useMutation({
    mutationFn: () =>
      api.updateAffiliateLink(editingLinkId!, formPayload(), accessToken),
    onSuccess: () => {
      resetForm();
      setMessage("Đã cập nhật liên kết mua hàng.");
      refreshLinks();
    },
  });
  const deleteLink = useMutation({
    mutationFn: (id: string) => api.deleteAffiliateLink(id, accessToken),
    onSuccess: (_, deletedId) => {
      if (editingLinkId === deletedId) resetForm();
      setLinkToDelete(null);
      setMessage("Đã xóa liên kết mua hàng.");
      refreshLinks();
    },
  });
  const syncLink = useMutation({
    mutationFn: (id: string) => api.syncAffiliateLink(id, accessToken),
    onSuccess: () => {
      setMessage("Đã đọc lại giá và tình trạng hàng.");
      refreshLinks();
    },
  });

  const parsedPrice = form.current_price.trim()
    ? Number(form.current_price)
    : undefined;
  const canSave = Boolean(
    form.partner_id &&
      form.product_url.trim() &&
      form.region_code.trim().length === 2 &&
      form.currency_code.trim().length === 3 &&
      (parsedPrice === undefined ||
        (Number.isFinite(parsedPrice) && parsedPrice >= 0)),
  );
  const isSaving = createLink.isPending || updateLink.isPending;

  function saveLink() {
    if (!canSave || isSaving) return;
    setMessage(null);
    if (editingLinkId) updateLink.mutate();
    else createLink.mutate();
  }

  function beginEditing(link: AffiliateLink) {
    setEditingLinkId(link.id);
    setLinkToDelete(null);
    setMessage(null);
    setForm({
      partner_id: link.partner_id,
      region_code: link.region_code,
      product_url: link.product_url,
      current_price:
        link.current_price == null ? "" : String(link.current_price),
      currency_code: link.currency_code,
      in_stock: link.in_stock,
    });
  }

  const error =
    partners.error ??
    links.error ??
    createLink.error ??
    updateLink.error ??
    deleteLink.error ??
    syncLink.error;

  return (
    <FormSection title="Liên kết mua hàng">
      <div
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            event.target instanceof HTMLInputElement &&
            event.target.type !== "checkbox"
          ) {
            event.preventDefault();
            saveLink();
          }
        }}
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Thêm nơi bán cho phiên bản này. Hệ thống có thể đọc giá và tình
            trạng hàng từ URL sản phẩm.
          </p>
          {editingLinkId ? (
            <button
              type="button"
              onClick={resetForm}
              className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              Hủy sửa
            </button>
          ) : null}
        </div>

        {message ? (
          <p
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            role="status"
          >
            {message}
          </p>
        ) : null}
        <PanelError error={error} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SelectInput
            label="Nơi bán"
            value={form.partner_id}
            onChange={(partner_id) =>
              setForm((current) => ({ ...current, partner_id }))
            }
            required
          >
            <option value="">Chọn nơi bán</option>
            {partners.data?.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
                {partner.is_active ? "" : " (đã tắt)"}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Khu vực"
            value={form.region_code}
            maxLength={2}
            onChange={(region_code) =>
              setForm((current) => ({
                ...current,
                region_code: region_code.toUpperCase(),
              }))
            }
            required
          />
          <TextInput
            label="Giá hiện tại"
            type="number"
            min="0"
            value={form.current_price}
            onChange={(current_price) =>
              setForm((current) => ({ ...current, current_price }))
            }
          />
          <TextInput
            label="Tiền tệ"
            value={form.currency_code}
            maxLength={3}
            onChange={(currency_code) =>
              setForm((current) => ({
                ...current,
                currency_code: currency_code.toUpperCase(),
              }))
            }
            required
          />
          <div className="md:col-span-2 xl:col-span-3">
            <TextInput
              label="URL sản phẩm"
              type="url"
              value={form.product_url}
              onChange={(product_url) =>
                setForm((current) => ({ ...current, product_url }))
              }
              required
            />
          </div>
          <div className="flex items-end">
            <CheckboxInput
              label="Đang còn hàng"
              checked={form.in_stock}
              onChange={(in_stock) =>
                setForm((current) => ({ ...current, in_stock }))
              }
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveLink}
            disabled={!canSave || isSaving || !partners.data?.length}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {editingLinkId ? <Settings2 size={15} /> : <Plus size={15} />}
            {isSaving
              ? "Đang lưu…"
              : editingLinkId
                ? "Lưu liên kết"
                : "Thêm liên kết"}
          </button>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          {links.isLoading ? (
            <p className="py-4 text-center text-sm text-slate-500">
              Đang tải liên kết mua hàng…
            </p>
          ) : links.data?.length ? (
            <div className="space-y-2">
              {links.data.map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {link.partner?.name ?? "Nơi bán"}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            link.in_stock
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {link.in_stock ? "Còn hàng" : "Hết hàng"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {link.region_code}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {link.current_price != null
                          ? formatPrice(link.current_price, {
                              code: link.currency_code,
                              symbol:
                                link.currency_code === "VND" ? "₫" : undefined,
                            })
                          : "Chưa có giá"}
                      </p>
                      <a
                        href={link.product_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-blue-700 hover:underline"
                      >
                        <span className="truncate">{link.product_url}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => syncLink.mutate(link.id)}
                        disabled={
                          syncLink.isPending && syncLink.variables === link.id
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={13}
                          className={
                            syncLink.isPending && syncLink.variables === link.id
                              ? "animate-spin"
                              : ""
                          }
                        />
                        Đọc lại
                      </button>
                      <button
                        type="button"
                        onClick={() => beginEditing(link)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        <Settings2 size={13} /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkToDelete(link)}
                        aria-label={`Xóa liên kết của ${link.partner?.name ?? "nơi bán"}`}
                        className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {linkToDelete?.id === link.id ? (
                    <div
                      className="mt-3 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      role="alert"
                    >
                      <p className="text-sm text-rose-800">
                        Xóa liên kết này cùng lịch sử giá và lượt nhấp?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLinkToDelete(null)}
                          className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-slate-700"
                        >
                          Giữ lại
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLink.mutate(link.id)}
                          disabled={deleteLink.isPending}
                          className="h-9 rounded-lg bg-rose-700 px-3 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {deleteLink.isPending ? "Đang xóa…" : "Xóa liên kết"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
              <Link2 className="mx-auto text-slate-300" size={24} />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Chưa có liên kết mua hàng
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Điền thông tin phía trên để thêm nơi bán đầu tiên.
              </p>
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
}

function AffiliatesPanel({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    base_url: "",
    logo_url: "",
    description: "",
    commission_rate: "0",
    is_trusted: false,
  });
  const [linkForm, setLinkForm] = useState({
    partner_id: "",
    device_variant_id: "",
    region_code: "VN",
    product_url: "",
    current_price: "",
    currency_code: "VND",
  });
  const partners = useQuery({
    queryKey: ["admin", "affiliate-partners"],
    queryFn: () => api.listAffiliatePartners().then((result) => result.data),
  });
  const createPartner = useMutation({
    mutationFn: () =>
      api.createAffiliatePartner(
        {
          ...form,
          logo_url: form.logo_url.trim() || undefined,
          description: form.description.trim() || undefined,
          commission_rate: Number(form.commission_rate),
        },
        accessToken,
      ),
    onSuccess: () => {
      setForm({
        name: "",
        slug: "",
        base_url: "",
        logo_url: "",
        description: "",
        commission_rate: "0",
        is_trusted: false,
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate-partners"],
      });
    },
  });
  const updatePartner = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.updateAffiliatePartner(id, { is_active }, accessToken),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate-partners"],
      }),
  });
  const links = useQuery({
    queryKey: ["admin", "affiliate-links"],
    queryFn: () => api.listAffiliateLinks().then((result) => result.data),
  });
  const variants = useQuery({
    queryKey: ["admin", "affiliate-variants"],
    queryFn: () => api.listDeviceVariants({ page: 1, pageSize: 100 }),
  });
  const createLink = useMutation({
    mutationFn: () =>
      api.createAffiliateLink(
        {
          partner_id: linkForm.partner_id,
          device_variant_id: linkForm.device_variant_id,
          region_code: linkForm.region_code,
          product_url: linkForm.product_url,
          current_price: linkForm.current_price
            ? Number(linkForm.current_price)
            : undefined,
          currency_code: linkForm.currency_code,
        },
        accessToken,
      ),
    onSuccess: () => {
      setLinkForm({
        partner_id: "",
        device_variant_id: "",
        region_code: "VN",
        product_url: "",
        current_price: "",
        currency_code: "VND",
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate-links"],
      });
    },
  });
  const updateLink = useMutation({
    mutationFn: ({
      id,
      in_stock,
      current_price,
    }: {
      id: string;
      in_stock?: boolean;
      current_price?: number;
    }) => api.updateAffiliateLink(id, { in_stock, current_price }, accessToken),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate-links"],
      }),
  });
  const syncPrices = useMutation({
    mutationFn: () => api.syncAllAffiliateLinks(accessToken),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate-links"],
      }),
  });
  const syncLink = useMutation({
    mutationFn: (id: string) => api.syncAffiliateLink(id, accessToken),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate-links"],
      }),
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <Panel
          title="Thêm đối tác"
          description="Đăng ký đối tác bán lẻ trước khi tạo liên kết mua hàng theo khu vực."
        >
          <PanelError error={createPartner.error} />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createPartner.mutate();
            }}
          >
            <TextInput
              label="Tên đối tác"
              value={form.name}
              onChange={(name) =>
                setForm((current) => ({
                  ...current,
                  name,
                  slug: syncSlug(current.name, current.slug, name),
                }))
              }
              required
            />
            <TextInput
              label="Đường dẫn định danh (slug)"
              value={form.slug}
              onChange={(slug) => setForm((current) => ({ ...current, slug }))}
              required
            />
            <TextInput
              label="URL gốc"
              type="url"
              value={form.base_url}
              onChange={(base_url) =>
                setForm((current) => ({ ...current, base_url }))
              }
              required
            />
            <TextInput
              label="URL logo"
              type="url"
              value={form.logo_url}
              onChange={(logo_url) =>
                setForm((current) => ({ ...current, logo_url }))
              }
            />
            <TextAreaInput
              label="Giới thiệu đối tác"
              rows={3}
              value={form.description}
              onChange={(description) =>
                setForm((current) => ({ ...current, description }))
              }
            />
            <TextInput
              label="Hoa hồng (%)"
              type="number"
              min="0"
              value={form.commission_rate}
              onChange={(commission_rate) =>
                setForm((current) => ({ ...current, commission_rate }))
              }
              required
            />
            <CheckboxInput
              label="Đánh dấu là đối tác uy tín"
              checked={form.is_trusted}
              onChange={(is_trusted) =>
                setForm((current) => ({ ...current, is_trusted }))
              }
            />
            <button
              type="submit"
              disabled={createPartner.isPending}
              className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Tạo đối tác
            </button>
          </form>
        </Panel>
        <Panel
          title="Thêm liên kết mua hàng"
          description="Chỉ cần chọn phiên bản và dán link sản phẩm. Hệ thống sẽ tự đọc ảnh, giá, giảm giá và tình trạng hàng; giá nhập tay chỉ dùng dự phòng."
        >
          <PanelError error={createLink.error} />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createLink.mutate();
            }}
          >
            <SelectInput
              label="Đối tác"
              value={linkForm.partner_id}
              onChange={(partner_id) =>
                setLinkForm((current) => ({ ...current, partner_id }))
              }
              required
            >
              <option value="">Chọn đối tác</option>
              {partners.data?.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              label="Phiên bản"
              value={linkForm.device_variant_id}
              onChange={(device_variant_id) =>
                setLinkForm((current) => ({ ...current, device_variant_id }))
              }
              required
            >
              <option value="">Chọn phiên bản</option>
              {variants.data?.data.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.device_model?.name ?? "Thiết bị"} -{" "}
                  {variant.variant_name}
                </option>
              ))}
            </SelectInput>
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Khu vực"
                value={linkForm.region_code}
                maxLength={2}
                onChange={(region_code) =>
                  setLinkForm((current) => ({
                    ...current,
                    region_code: region_code.toUpperCase(),
                  }))
                }
                required
              />
              <TextInput
                label="Tiền tệ"
                value={linkForm.currency_code}
                maxLength={3}
                onChange={(currency_code) =>
                  setLinkForm((current) => ({
                    ...current,
                    currency_code: currency_code.toUpperCase(),
                  }))
                }
                required
              />
            </div>
            <TextInput
              label="URL sản phẩm"
              type="url"
              value={linkForm.product_url}
              onChange={(product_url) =>
                setLinkForm((current) => ({ ...current, product_url }))
              }
              required
            />
            <TextInput
              label="Giá hiện tại"
              type="number"
              min="0"
              value={linkForm.current_price}
              onChange={(current_price) =>
                setLinkForm((current) => ({ ...current, current_price }))
              }
            />
            <button
              type="submit"
              disabled={
                createLink.isPending ||
                !linkForm.partner_id ||
                !linkForm.device_variant_id
              }
              className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {createLink.isPending
                ? "Đang đọc dữ liệu…"
                : "Tạo và đọc dữ liệu nơi bán"}
            </button>
          </form>
        </Panel>
      </div>
      <div className="flex flex-col gap-5">
        <Panel
          title="Đối tác bán lẻ"
          description="Tắt đối tác để ngừng hiển thị liên kết mua hàng công khai mà vẫn giữ lịch sử giá và lượt nhấp."
        >
          <PanelError error={partners.error ?? updatePartner.error} />
          <div className="divide-y divide-slate-100">
            {partners.data?.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-wrap items-center justify-between gap-3 px-1 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-400">
                    {partner.logo_url ? (
                      // Partner logos use administrator-managed remote URLs.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={partner.logo_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="size-full object-contain p-1"
                      />
                    ) : (
                      <Store size={17} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {partner.name}
                      </p>
                      {partner.is_trusted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          <BadgeCheck size={11} />
                          Đối tác uy tín
                        </span>
                      ) : null}
                    </div>
                    {partner.description ? (
                      <p className="mt-0.5 line-clamp-2 max-w-xl text-xs leading-5 text-slate-500">
                        {partner.description}
                      </p>
                    ) : null}
                    <a
                      href={partner.base_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-blue-700 hover:underline"
                    >
                      {partner.base_url}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">
                    {partner.commission_rate}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePartner.mutate({
                        id: partner.id,
                        is_active: !partner.is_active,
                      })
                    }
                    disabled={updatePartner.isPending}
                    className={`h-9 rounded-md border px-3 text-sm font-medium transition ${partner.is_active ? "border-emerald-200 text-emerald-700 hover:border-emerald-400" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                  >
                    {partner.is_active ? "Đang hoạt động" : "Đã tắt"}
                  </button>
                </div>
              </div>
            ))}
            {!partners.data?.length && !partners.isLoading ? (
              <EmptyRow label="Chưa có đối tác liên kết." />
            ) : null}
          </div>
        </Panel>
        <Panel
          title="Liên kết mua hàng"
          description="Đồng bộ giá qua API đối tác hoặc metadata Product/Offer; mỗi thay đổi đều được lưu vào lịch sử."
        >
          <PanelError
            error={
              links.error ??
              updateLink.error ??
              syncPrices.error ??
              syncLink.error
            }
          />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
            <p className="text-xs leading-5 text-slate-600">
              {syncPrices.data
                ? `${syncPrices.data.data.updated}/${syncPrices.data.data.checked} liên kết đã cập nhật; ${syncPrices.data.data.failed} lỗi.`
                : "Làm mới tối đa 100 liên kết cũ nhất trong một lượt."}
            </p>
            <button
              type="button"
              onClick={() => syncPrices.mutate()}
              disabled={syncPrices.isPending || !links.data?.length}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={syncPrices.isPending ? "animate-spin" : ""}
              />
              Đồng bộ giá
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {links.data?.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-300">
                    {link.image_url ? (
                      // Offer images are cached metadata from verified partners.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={link.image_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="size-full object-contain p-1"
                      />
                    ) : (
                      <ImageOff size={19} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-slate-900">
                        {link.product_title ??
                          `${link.device_variant?.device_model?.name ?? "Thiết bị"} - ${link.device_variant?.variant_name ?? "Phiên bản"}`}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          link.sync_status === "synced"
                            ? "bg-emerald-50 text-emerald-700"
                            : link.sync_status === "unavailable"
                              ? "bg-slate-100 text-slate-600"
                              : link.sync_status === "error"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {link.sync_status === "synced" ? (
                          <CheckCircle2 size={10} />
                        ) : link.sync_status === "unavailable" ? (
                          <Link2Off size={10} />
                        ) : link.sync_status === "error" ? (
                          <AlertTriangle size={10} />
                        ) : (
                          <Clock3 size={10} />
                        )}
                        {link.sync_status === "synced"
                          ? "Đã đồng bộ"
                          : link.sync_status === "unavailable"
                            ? "Hết hiệu lực"
                            : link.sync_status === "error"
                              ? "Cần đọc lại"
                              : "Chờ đồng bộ"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {link.partner?.name ?? "Đối tác"} · {link.region_code} ·{" "}
                      {link.current_price != null
                        ? formatPrice(link.current_price, {
                            code: link.currency_code,
                            symbol:
                              link.currency_code === "VND" ? "₫" : undefined,
                          })
                        : "Chưa đọc được giá"}
                    </p>
                    {link.sync_error ? (
                      <p
                        className="mt-1 max-w-xl truncate text-[11px] text-amber-700"
                        title={link.sync_error}
                      >
                        {link.sync_error}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => syncLink.mutate(link.id)}
                    disabled={
                      syncLink.isPending && syncLink.variables === link.id
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-blue-200 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={13}
                      className={
                        syncLink.isPending && syncLink.variables === link.id
                          ? "animate-spin"
                          : ""
                      }
                    />
                    Đọc lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const value = window.prompt(
                        "Giá hiện tại",
                        String(link.current_price ?? ""),
                      );
                      const current_price =
                        value === null ? NaN : Number(value);
                      if (Number.isFinite(current_price) && current_price >= 0)
                        updateLink.mutate({ id: link.id, current_price });
                    }}
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    Giá
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateLink.mutate({
                        id: link.id,
                        in_stock: !link.in_stock,
                      })
                    }
                    className={`h-9 rounded-md border px-3 text-sm font-medium transition ${link.in_stock ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-600"}`}
                  >
                    {link.in_stock ? "Còn hàng" : "Hết hàng"}
                  </button>
                </div>
              </div>
            ))}
            {!links.data?.length && !links.isLoading ? (
              <EmptyRow label="Chưa có liên kết mua hàng." />
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SubscriptionsPanel({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const [assignment, setAssignment] = useState({
    user_id: "",
    plan_id: "",
    billing_cycle: "monthly",
  });
  const [planForm, setPlanForm] = useState({
    code: "",
    name: "",
    price_monthly: "0",
    price_yearly: "0",
    currency_code: "USD",
    features: "{}",
  });
  const plans = useQuery({
    queryKey: ["admin", "subscription-plans"],
    queryFn: () =>
      api.listAllSubscriptionPlans(accessToken).then((result) => result.data),
  });
  const users = useQuery({
    queryKey: ["admin", "users", "subscriptions"],
    queryFn: () => api.listUsers({ page: 1, pageSize: 100 }, accessToken),
  });
  const audit = useQuery({
    queryKey: ["admin", "billing-audit"],
    queryFn: () =>
      api
        .listBillingAudit({ limit: 20 }, accessToken)
        .then((result) => result.data),
  });
  const assign = useMutation({
    mutationFn: () =>
      api.assignUserSubscription(
        assignment.user_id,
        {
          plan_id: assignment.plan_id,
          billing_cycle: assignment.billing_cycle as
            | "monthly"
            | "yearly"
            | "manual",
        },
        accessToken,
      ),
    onSuccess: () => {
      setAssignment({ user_id: "", plan_id: "", billing_cycle: "monthly" });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "billing-audit"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "me"] }),
      ]);
    },
  });
  const updatePlan = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.updateSubscriptionPlan(id, { is_active }, accessToken),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["admin", "subscription-plans"],
      }),
  });
  const createPlan = useMutation({
    mutationFn: () => {
      const features: unknown = JSON.parse(planForm.features);
      if (
        !features ||
        typeof features !== "object" ||
        Array.isArray(features)
      ) {
        throw new Error("Tính năng phải là một đối tượng JSON");
      }

      return api.createSubscriptionPlan(
        {
          code: planForm.code,
          name: planForm.name,
          price_monthly: Number(planForm.price_monthly),
          price_yearly: Number(planForm.price_yearly),
          currency_code: planForm.currency_code,
          features: features as Record<string, unknown>,
        },
        accessToken,
      );
    },
    onSuccess: () => {
      setPlanForm({
        code: "",
        name: "",
        price_monthly: "0",
        price_yearly: "0",
        currency_code: "USD",
        features: "{}",
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "subscription-plans"],
      });
    },
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <Panel
          title="Gán quyền gói dịch vụ"
          description="Việc gán thủ công sẽ thay thế gói từ nhà cung cấp hiện tại và được ghi lại để kiểm tra."
        >
          <PanelError error={assign.error} />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              assign.mutate();
            }}
          >
            <SelectInput
              label="Người dùng"
              value={assignment.user_id}
              onChange={(user_id) =>
                setAssignment((current) => ({ ...current, user_id }))
              }
              required
            >
              <option value="">Chọn người dùng</option>
              {users.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.email}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              label="Gói dịch vụ"
              value={assignment.plan_id}
              onChange={(plan_id) =>
                setAssignment((current) => ({ ...current, plan_id }))
              }
              required
            >
              <option value="">Chọn gói dịch vụ</option>
              {plans.data?.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              label="Chu kỳ thanh toán"
              value={assignment.billing_cycle}
              onChange={(billing_cycle) =>
                setAssignment((current) => ({ ...current, billing_cycle }))
              }
            >
              <option value="monthly">Hàng tháng</option>
              <option value="yearly">Hàng năm</option>
              <option value="manual">Thủ công</option>
            </SelectInput>
            <button
              type="submit"
              disabled={
                assign.isPending || !assignment.user_id || !assignment.plan_id
              }
              className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Gán gói
            </button>
          </form>
        </Panel>
        <Panel
          title="Tạo gói dịch vụ"
          description="Thêm gói thanh toán và quyền sử dụng mới với các cờ tính năng lưu dưới dạng JSON."
        >
          <PanelError error={createPlan.error} />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createPlan.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Mã"
                value={planForm.code}
                onChange={(code) =>
                  setPlanForm((current) => ({
                    ...current,
                    code: code.toLowerCase(),
                  }))
                }
                required
              />
              <TextInput
                label="Tên"
                value={planForm.name}
                onChange={(name) =>
                  setPlanForm((current) => ({ ...current, name }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Hàng tháng"
                type="number"
                min="0"
                value={planForm.price_monthly}
                onChange={(price_monthly) =>
                  setPlanForm((current) => ({ ...current, price_monthly }))
                }
                required
              />
              <TextInput
                label="Hàng năm"
                type="number"
                min="0"
                value={planForm.price_yearly}
                onChange={(price_yearly) =>
                  setPlanForm((current) => ({ ...current, price_yearly }))
                }
                required
              />
            </div>
            <TextInput
              label="Tiền tệ"
              maxLength={3}
              value={planForm.currency_code}
              onChange={(currency_code) =>
                setPlanForm((current) => ({
                  ...current,
                  currency_code: currency_code.toUpperCase(),
                }))
              }
              required
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                JSON tính năng
              </span>
              <textarea
                value={planForm.features}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    features: event.target.value,
                  }))
                }
                className="min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-950 outline-none transition focus:border-blue-500"
              />
            </label>
            <button
              type="submit"
              disabled={
                createPlan.isPending || !planForm.code || !planForm.name
              }
              className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Tạo gói dịch vụ
            </button>
          </form>
        </Panel>
      </div>
      <div className="flex flex-col gap-5">
        <Panel
          title="Gói dịch vụ"
          description="Bật hoặc tắt khả dụng công khai mà không thay đổi các bản ghi đăng ký hiện có."
        >
          <PanelError error={plans.error ?? updatePlan.error} />
          <div className="divide-y divide-slate-100">
            {plans.data?.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatPrice(plan.price_monthly, {
                      code: plan.currency_code,
                      decimal_digits: 2,
                    })}
                    /tháng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePlan.mutate({
                      id: plan.id,
                      is_active: !plan.is_active,
                    })
                  }
                  disabled={updatePlan.isPending}
                  className={`h-9 rounded-md border px-3 text-sm font-medium transition ${plan.is_active ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-600"}`}
                >
                  {plan.is_active ? "Đang hoạt động" : "Đã tắt"}
                </button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Nhật ký thanh toán"
          description="Các sự kiện mới nhất từ nhà cung cấp, quyền gán thủ công và thao tác thanh toán."
        >
          <PanelError error={audit.error} />
          <div className="divide-y divide-slate-100">
            {audit.data?.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium capitalize text-slate-900">
                    {billingActionLabel(entry.action)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(entry.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                  {subscriptionStatusLabel(entry.status)}
                </span>
              </div>
            ))}
            {!audit.data?.length && !audit.isLoading ? (
              <EmptyRow label="Chưa có mục nhật ký thanh toán." />
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

type ModerationWorkspace = "queue" | "sources";
type ReviewContentTab = "raw" | "parsed";

type ModerationSourceForm = {
  name: string;
  slug: string;
  base_url: string;
  reliability: string;
  seed_urls: string;
  allowed_paths: string;
  discover_links: boolean;
  max_pages_per_run: string;
  rate_limit_ms: string;
  preserved_config: Record<string, unknown>;
};

// The legacy implementation stays unmounted while ingestion API clients are
// retained for backward compatibility; it is no longer part of the admin UI.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ModerationPanel({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] = useState<ModerationWorkspace>("queue");
  const [source, setSource] = useState<ModerationSourceForm>(() =>
    createDefaultSourceForm(),
  );
  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceFeedback, setSourceFeedback] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueSearch, setQueueSearch] = useState("");
  const [deviceModelId, setDeviceModelId] = useState("");
  const [parsedData, setParsedData] = useState("{}");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewContentTab, setReviewContentTab] =
    useState<ReviewContentTab>("raw");
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const queue = useQuery({
    queryKey: ["admin", "review-queue"],
    queryFn: () => api.listReviewQueue({ page: 1, pageSize: 50 }, accessToken),
  });
  const selectedPage = useQuery({
    queryKey: ["admin", "raw-page", selectedId],
    queryFn: () =>
      api.getRawPage(selectedId!, accessToken).then((result) => result.data),
    enabled: Boolean(selectedId),
  });
  const models = useQuery({
    queryKey: ["admin", "models", "review-targets"],
    queryFn: () => api.listDeviceModels({ page: 1, pageSize: 100 }),
  });
  const sources = useQuery({
    queryKey: ["admin", "data-sources"],
    queryFn: () =>
      api.listDataSources(accessToken).then((result) => result.data),
  });

  useEffect(() => {
    if (!selectedPage.data) return;
    setDeviceModelId(selectedPage.data.device_model_id ?? "");
    setParsedData(JSON.stringify(selectedPage.data.parsed_data ?? {}, null, 2));
    setReviewNote("");
    setReviewContentTab("raw");
  }, [selectedPage.data]);

  const normalizedSearch = queueSearch.trim().toLocaleLowerCase("vi");
  const filteredQueue = (queue.data?.data ?? []).filter((page) => {
    if (!normalizedSearch) return true;
    return [page.url, page.source?.name, page.device_model?.name]
      .filter(Boolean)
      .some((value) =>
        value?.toLocaleLowerCase("vi").includes(normalizedSearch),
      );
  });
  const parsedDataError = getReviewJsonError(parsedData);
  const activeSourceCount =
    sources.data?.filter((item) => item.is_active).length ?? 0;

  const review = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) =>
      api.reviewRawPage(
        id,
        status === "approved"
          ? {
              status,
              ...(deviceModelId ? { device_model_id: deviceModelId } : {}),
              parsed_data: parseReviewJson(parsedData),
            }
          : {
              status,
              ...(reviewNote.trim()
                ? { error_message: reviewNote.trim() }
                : {}),
            },
        accessToken,
      ),
    onSuccess: (_, variables) => {
      const reviewedUrl = selectedPage.data?.url ?? "bản ghi";
      const nextPage = filteredQueue.find((page) => page.id !== variables.id);
      setReviewFeedback(
        variables.status === "approved"
          ? `Đã duyệt ${reviewedUrl}.`
          : `Đã từ chối ${reviewedUrl}.`,
      );
      setSelectedId(nextPage?.id ?? null);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "review-queue"],
      });
    },
  });
  const saveSource = useMutation({
    mutationFn: () => {
      const payload = {
        name: source.name,
        slug: source.slug,
        base_url: source.base_url,
        reliability: Number(source.reliability),
        crawl_config: buildCrawlerConfig(source),
      };
      return editingSourceId
        ? api.updateDataSource(editingSourceId, payload, accessToken)
        : api.createDataSource(payload, accessToken);
    },
    onSuccess: () => {
      setSourceFeedback(
        editingSourceId
          ? "Đã lưu cấu hình nguồn dữ liệu."
          : "Đã tạo nguồn dữ liệu mới.",
      );
      setEditingSourceId(null);
      setSource(createDefaultSourceForm());
      setSourceFormOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "data-sources"],
      });
    },
  });
  const updateSource = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.updateDataSource(id, { is_active }, accessToken),
    onSuccess: (_, variables) => {
      setSourceFeedback(
        variables.is_active
          ? "Đã bật nguồn dữ liệu."
          : "Đã tạm dừng nguồn dữ liệu.",
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "data-sources"],
      });
    },
  });

  const closeSourceForm = () => {
    setEditingSourceId(null);
    setSource(createDefaultSourceForm());
    setSourceFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <ModerationStat
          label="Nguồn đang hoạt động"
          value={activeSourceCount}
          icon={<Globe2 size={18} />}
        />
        <ModerationStat
          label="Bản ghi chờ duyệt"
          value={queue.data?.meta.total ?? 0}
          icon={<Clock3 size={18} />}
        />
        <ModerationStat
          label="Đang xem xét"
          value={selectedId ? 1 : 0}
          icon={<FileText size={18} />}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setWorkspace("queue")}
            aria-pressed={workspace === "queue"}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${workspace === "queue" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
          >
            <ListChecks size={17} />
            Hàng đợi duyệt
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${workspace === "queue" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {queue.data?.meta.total ?? 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setWorkspace("sources")}
            aria-pressed={workspace === "sources"}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${workspace === "sources" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
          >
            <Settings2 size={17} />
            Quản lý nguồn
          </button>
        </div>
      </div>

      {workspace === "queue" ? (
        <Panel
          title="Hàng đợi kiểm duyệt"
          description="Chọn một bản ghi, so sánh nội dung gốc với dữ liệu đã phân tích rồi ra quyết định. Sau khi xử lý, hệ thống tự chuyển sang bản ghi tiếp theo."
        >
          <PanelError
            error={queue.error ?? selectedPage.error ?? review.error}
          />
          {reviewFeedback ? (
            <div
              className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              <span className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
                {reviewFeedback}
              </span>
              <button
                type="button"
                onClick={() => setReviewFeedback(null)}
                aria-label="Đóng thông báo"
                className="text-emerald-700 hover:text-emerald-950"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <label className="relative block" htmlFor="review-queue-search">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  id="review-queue-search"
                  type="search"
                  value={queueSearch}
                  onChange={(event) => setQueueSearch(event.target.value)}
                  placeholder="Tìm URL, nguồn hoặc thiết bị..."
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-500">
                <span>{filteredQueue.length} bản ghi đang hiển thị</span>
                {queue.data?.meta.hasNext ? (
                  <span>Hiển thị 50 mục đầu</span>
                ) : null}
              </div>

              <div className="mt-2 max-h-[700px] space-y-2 overflow-y-auto pr-1">
                {filteredQueue.map((page) => {
                  const isSelected = selectedId === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setSelectedId(page.id)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? "border-blue-300 bg-blue-50 shadow-sm ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isSelected ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}
                        >
                          {page.source?.name ?? "Không rõ nguồn"}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {new Date(page.crawled_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 break-all text-sm font-semibold leading-5 text-slate-900">
                        {page.url}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>{page.attempts} lần thử</span>
                        <span>
                          {page.device_model?.name ?? "Chưa gắn thiết bị"}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {!filteredQueue.length && !queue.isLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <CheckCircle2
                      className="mx-auto text-slate-300"
                      size={28}
                    />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {queueSearch
                        ? "Không tìm thấy bản ghi phù hợp."
                        : "Không có dữ liệu nào đang chờ duyệt."}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {queueSearch
                        ? "Thử từ khóa ngắn hơn hoặc xóa bộ lọc tìm kiếm."
                        : "Bản ghi mới sẽ xuất hiện sau khi worker thu thập dữ liệu."}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white">
              {!selectedId ? (
                <div className="grid min-h-[460px] place-items-center p-6 text-center">
                  <div className="max-w-sm">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                      <ShieldCheck size={24} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-950">
                      Chọn một bản ghi để bắt đầu
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Nội dung gốc, dữ liệu JSON, mẫu thiết bị và khu vực ra
                      quyết định sẽ hiển thị tại đây.
                    </p>
                  </div>
                </div>
              ) : selectedPage.isLoading ? (
                <div className="min-h-[460px] p-5">
                  <LoadingPanel label="Đang tải nội dung cần kiểm duyệt..." />
                </div>
              ) : selectedPage.data ? (
                <div>
                  <div className="border-b border-slate-200 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            {reviewStatusLabel(selectedPage.data.status)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {selectedPage.data.source?.name ??
                              "Nguồn không xác định"}
                          </span>
                        </div>
                        <h3 className="mt-3 break-all text-base font-semibold leading-6 text-slate-950">
                          {selectedPage.data.url}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Thu thập lúc{" "}
                            {new Date(
                              selectedPage.data.crawled_at,
                            ).toLocaleString("vi-VN")}
                          </span>
                          <span>{selectedPage.data.attempts} lần thử</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={selectedPage.data.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Mở trang nguồn"
                          className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          type="button"
                          onClick={() => setSelectedId(null)}
                          aria-label="Đóng bản ghi"
                          className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <SelectInput
                        label="Gắn dữ liệu với mẫu thiết bị"
                        value={deviceModelId}
                        onChange={setDeviceModelId}
                        hint="Không bắt buộc. Chọn đúng mẫu máy giúp truy vết và tái sử dụng dữ liệu dễ hơn."
                      >
                        <option value="">Chưa gắn với mẫu thiết bị</option>
                        {models.data?.data.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </SelectInput>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 lg:hidden">
                      <button
                        type="button"
                        onClick={() => setReviewContentTab("raw")}
                        className={`h-9 rounded-md text-sm font-semibold transition ${reviewContentTab === "raw" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                      >
                        Nội dung gốc
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewContentTab("parsed")}
                        className={`h-9 rounded-md text-sm font-semibold transition ${reviewContentTab === "parsed" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                      >
                        Dữ liệu JSON
                      </button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div
                        className={
                          reviewContentTab === "raw"
                            ? "block"
                            : "hidden lg:block"
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            1. Đối chiếu nội dung gốc
                          </p>
                          <span className="text-xs text-slate-400">
                            Chỉ đọc
                          </span>
                        </div>
                        <pre className="max-h-[430px] min-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                          {selectedPage.data.raw_text ??
                            "Chưa thu thập được văn bản thô."}
                        </pre>
                      </div>
                      <div
                        className={
                          reviewContentTab === "parsed"
                            ? "block"
                            : "hidden lg:block"
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            2. Kiểm tra dữ liệu JSON
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${parsedDataError ? "text-rose-600" : "text-emerald-700"}`}
                          >
                            {parsedDataError ? (
                              "JSON chưa hợp lệ"
                            ) : (
                              <>
                                <CheckCircle2 size={13} /> JSON hợp lệ
                              </>
                            )}
                          </span>
                        </div>
                        <textarea
                          value={parsedData}
                          onChange={(event) =>
                            setParsedData(event.target.value)
                          }
                          aria-invalid={Boolean(parsedDataError)}
                          spellCheck={false}
                          className={`min-h-72 w-full resize-y rounded-xl border bg-white px-4 py-3 font-mono text-xs leading-6 text-slate-800 outline-none transition lg:min-h-[430px] ${parsedDataError ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100" : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"}`}
                        />
                        {parsedDataError ? (
                          <p className="mt-2 text-xs leading-5 text-rose-600">
                            {parsedDataError}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                      <TextAreaInput
                        label="Ghi chú khi từ chối (không bắt buộc)"
                        value={reviewNote}
                        onChange={setReviewNote}
                        rows={2}
                        placeholder="Ví dụ: thiếu tên model, dữ liệu mâu thuẫn với trang nguồn..."
                        hint="Ghi chú giúp người xử lý sau hiểu lý do bản ghi chưa đạt."
                      />
                      <div className="flex flex-col-reverse gap-2 sm:flex-row lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            review.mutate({
                              id: selectedPage.data.id,
                              status: "rejected",
                            })
                          }
                          disabled={review.isPending}
                          className="inline-flex h-11 items-center justify-center rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Từ chối bản ghi
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            review.mutate({
                              id: selectedPage.data.id,
                              status: "approved",
                            })
                          }
                          disabled={
                            review.isPending || Boolean(parsedDataError)
                          }
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 size={17} />
                          {review.isPending ? "Đang xử lý..." : "Duyệt bản ghi"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Duyệt sẽ lưu JSON và liên kết mẫu thiết bị (nếu có). Thao
                      tác này không tự động cập nhật thông số công khai.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>
      ) : (
        <Panel
          title="Quản lý nguồn dữ liệu"
          description="Bật, tạm dừng hoặc cấu hình phạm vi thu thập. Các trường thông dụng được trình bày trực tiếp để không phải chỉnh JSON thủ công."
        >
          <PanelError
            error={sources.error ?? saveSource.error ?? updateSource.error}
          />
          {sourceFeedback ? (
            <div
              className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              <span className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
                {sourceFeedback}
              </span>
              <button
                type="button"
                onClick={() => setSourceFeedback(null)}
                aria-label="Đóng thông báo"
                className="text-emerald-700 hover:text-emerald-950"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
                <Globe2 size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {sources.data?.length ?? 0} nguồn đã khai báo ·{" "}
                  {activeSourceCount} đang hoạt động
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Worker chỉ thu thập nguồn đang bật và tuân theo đường dẫn cho
                  phép bên dưới.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSourceId(null);
                setSource(createDefaultSourceForm());
                setSourceFormOpen(true);
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Globe2 size={16} />
              Thêm nguồn mới
            </button>
          </div>

          {sourceFormOpen ? (
            <form
              className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
              onSubmit={(event) => {
                event.preventDefault();
                saveSource.mutate();
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {editingSourceId
                      ? "Chỉnh sửa nguồn dữ liệu"
                      : "Thêm nguồn dữ liệu"}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Điền thông tin nguồn trước, sau đó giới hạn phạm vi worker
                    được phép thu thập.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSourceForm}
                  aria-label="Đóng biểu mẫu nguồn dữ liệu"
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-950"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <FormSection
                  title="1. Thông tin nhận diện"
                  description="Thông tin dùng để nhận biết và đánh giá độ tin cậy của nguồn."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput
                      label="Tên nguồn"
                      value={source.name}
                      onChange={(name) =>
                        setSource((current) => ({
                          ...current,
                          name,
                          slug: syncSlug(current.name, current.slug, name),
                        }))
                      }
                      placeholder="Ví dụ: GSMArena"
                      required
                    />
                    <TextInput
                      label="Slug"
                      value={source.slug}
                      onChange={(slug) =>
                        setSource((current) => ({ ...current, slug }))
                      }
                      placeholder="gsmarena"
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      hint="Chỉ dùng chữ thường, số và dấu gạch ngang."
                      required
                    />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <TextInput
                      label="URL gốc"
                      type="url"
                      value={source.base_url}
                      onChange={(base_url) =>
                        setSource((current) => ({ ...current, base_url }))
                      }
                      placeholder="https://www.example.com"
                      hint="Mặc định worker chỉ chấp nhận HTTPS và URL cùng tên miền."
                      required
                    />
                    <TextInput
                      label="Độ tin cậy"
                      type="number"
                      min="1"
                      max="100"
                      value={source.reliability}
                      onChange={(reliability) =>
                        setSource((current) => ({ ...current, reliability }))
                      }
                      hint="Từ 1 đến 100."
                      required
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="2. Phạm vi thu thập"
                  description="Mỗi dòng là một URL hoặc đường dẫn. Giới hạn càng rõ thì quá trình thu thập càng an toàn."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextAreaInput
                      label="URL bắt đầu"
                      value={source.seed_urls}
                      onChange={(seed_urls) =>
                        setSource((current) => ({ ...current, seed_urls }))
                      }
                      rows={4}
                      placeholder={"/phones\n/brands/apple"}
                      hint="Để trống để bắt đầu từ đường dẫn được phép đầu tiên."
                    />
                    <TextAreaInput
                      label="Đường dẫn được phép"
                      value={source.allowed_paths}
                      onChange={(allowed_paths) =>
                        setSource((current) => ({ ...current, allowed_paths }))
                      }
                      rows={4}
                      placeholder={"/phones\n/brands"}
                      hint="Dùng / để cho phép toàn bộ đường dẫn cùng tên miền."
                      required
                    />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextInput
                      label="Số trang tối đa mỗi lượt"
                      type="number"
                      min="1"
                      max="50"
                      value={source.max_pages_per_run}
                      onChange={(max_pages_per_run) =>
                        setSource((current) => ({
                          ...current,
                          max_pages_per_run,
                        }))
                      }
                      hint="Từ 1 đến 50 trang."
                      required
                    />
                    <TextInput
                      label="Khoảng nghỉ giữa hai trang"
                      type="number"
                      min="0"
                      max="60000"
                      step="100"
                      value={source.rate_limit_ms}
                      onChange={(rate_limit_ms) =>
                        setSource((current) => ({
                          ...current,
                          rate_limit_ms,
                        }))
                      }
                      hint="Đơn vị mili giây; mặc định 1000 ms."
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <CheckboxInput
                      label="Tự tìm liên kết mới trong phạm vi cho phép"
                      checked={source.discover_links}
                      onChange={(discover_links) =>
                        setSource((current) => ({
                          ...current,
                          discover_links,
                        }))
                      }
                    />
                  </div>
                </FormSection>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeSourceForm}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveSource.isPending}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saveSource.isPending
                    ? "Đang lưu..."
                    : editingSourceId
                      ? "Lưu thay đổi"
                      : "Tạo nguồn dữ liệu"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {sources.data?.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">
                        {item.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {item.is_active ? "Đang hoạt động" : "Đã tạm dừng"}
                      </span>
                    </div>
                    <a
                      href={item.base_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-sm text-blue-700 hover:underline"
                    >
                      <span className="truncate">
                        {displayHostname(item.base_url)}
                      </span>
                      <ExternalLink className="shrink-0" size={13} />
                    </a>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                    Tin cậy {item.reliability}/100
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
                  <div>
                    <dt className="text-slate-500">Thu thập gần nhất</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {item.last_crawled_at
                        ? new Date(item.last_crawled_at).toLocaleString("vi-VN")
                        : "Chưa chạy"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Giới hạn mỗi lượt</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {readConfigNumber(
                        item.crawl_config.max_pages_per_run,
                        10,
                      )}{" "}
                      trang
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSourceId(item.id);
                      setSource(sourceFormFromDataSource(item));
                      setSourceFormOpen(true);
                      setSourceFeedback(null);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    <Settings2 size={15} />
                    Chỉnh cấu hình
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSource.mutate({
                        id: item.id,
                        is_active: !item.is_active,
                      })
                    }
                    disabled={updateSource.isPending}
                    className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold transition disabled:opacity-50 ${item.is_active ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                  >
                    {item.is_active ? "Tạm dừng" : "Bật nguồn"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!sources.data?.length && !sources.isLoading ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <Globe2 className="mx-auto text-slate-300" size={30} />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Chưa có nguồn dữ liệu
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Thêm nguồn đầu tiên để worker bắt đầu thu thập nội dung.
              </p>
            </div>
          ) : null}
        </Panel>
      )}
    </div>
  );
}

function ModerationStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
          {value}
        </p>
      </div>
      <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </span>
    </div>
  );
}

function parseReviewJson(value: string): Record<string, unknown> {
  if (!value.trim()) {
    throw new Error("Dữ liệu đã phân tích không được để trống.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Dữ liệu đã phân tích phải là JSON hợp lệ.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Dữ liệu đã phân tích phải là một đối tượng JSON.");
  }

  return parsed as Record<string, unknown>;
}

function getReviewJsonError(value: string) {
  try {
    parseReviewJson(value);
    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Dữ liệu đã phân tích chưa hợp lệ.";
  }
}

function createDefaultSourceForm(): ModerationSourceForm {
  return {
    name: "",
    slug: "",
    base_url: "",
    reliability: "50",
    seed_urls: "",
    allowed_paths: "/",
    discover_links: false,
    max_pages_per_run: "10",
    rate_limit_ms: "1000",
    preserved_config: {},
  };
}

function sourceFormFromDataSource(item: DataSource): ModerationSourceForm {
  const config = item.crawl_config ?? {};
  const preservedConfig = { ...config };
  for (const key of [
    "seed_urls",
    "allowed_paths",
    "discover_links",
    "max_pages_per_run",
    "rate_limit_ms",
  ]) {
    delete preservedConfig[key];
  }

  return {
    name: item.name,
    slug: item.slug,
    base_url: item.base_url,
    reliability: String(item.reliability),
    seed_urls: readConfigStringList(config.seed_urls, []),
    allowed_paths: readConfigStringList(config.allowed_paths, ["/"]),
    discover_links: config.discover_links === true,
    max_pages_per_run: String(readConfigNumber(config.max_pages_per_run, 10)),
    rate_limit_ms: String(readConfigNumber(config.rate_limit_ms, 1000)),
    preserved_config: preservedConfig,
  };
}

function buildCrawlerConfig(
  source: ModerationSourceForm,
): Record<string, unknown> {
  const seedUrls = splitConfigLines(source.seed_urls);
  const allowedPaths = splitConfigLines(source.allowed_paths);
  const invalidPath = allowedPaths.find((path) => !path.startsWith("/"));
  if (invalidPath) {
    throw new Error(
      `Đường dẫn được phép phải bắt đầu bằng "/": ${invalidPath}`,
    );
  }

  const maxPages = Number(source.max_pages_per_run);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 50) {
    throw new Error("Số trang tối đa mỗi lượt phải là số nguyên từ 1 đến 50.");
  }

  const rateLimit = Number(source.rate_limit_ms);
  if (!Number.isInteger(rateLimit) || rateLimit < 0 || rateLimit > 60_000) {
    throw new Error(
      "Khoảng nghỉ giữa hai trang phải là số nguyên từ 0 đến 60000 ms.",
    );
  }

  return {
    ...source.preserved_config,
    seed_urls: seedUrls,
    allowed_paths: allowedPaths.length ? allowedPaths : ["/"],
    discover_links: source.discover_links,
    max_pages_per_run: maxPages,
    rate_limit_ms: rateLimit,
  };
}

function splitConfigLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readConfigStringList(value: unknown, fallback: string[]) {
  const items = Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && Boolean(item),
      )
    : [];
  return (items.length ? items : fallback).join("\n");
}

function readConfigNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function displayHostname(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    reader: "Người xem",
    contributor: "Cộng tác viên",
    editor: "Biên tập viên",
    moderator: "Kiểm duyệt viên",
    admin: "Quản trị viên",
  };
  return labels[role] ?? role;
}

function subscriptionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Đang hoạt động",
    canceled: "Đã hủy",
    incomplete: "Chưa hoàn tất",
    past_due: "Quá hạn thanh toán",
    paused: "Tạm dừng",
    pending: "Đang chờ",
    succeeded: "Thành công",
    failed: "Thất bại",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

function billingActionLabel(action: string) {
  const labels: Record<string, string> = {
    checkout_created: "Đã tạo yêu cầu thanh toán",
    subscription_created: "Đã tạo gói đăng ký",
    subscription_cancelled: "Đã hủy gói đăng ký",
    subscription_resumed: "Đã tiếp tục gói đăng ký",
    payment_retry: "Đã thử lại thanh toán",
  };
  return labels[action] ?? action.replaceAll("_", " ");
}

function reviewStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Đang chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
    parsed: "Đã phân tích",
    failed: "Thất bại",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

const variantEditorSteps: Array<{
  id: VariantEditorSection;
  label: string;
  description: string;
  icon: typeof Layers3;
}> = [
  {
    id: "identity",
    label: "Thông tin chính",
    description: "Tên, trạng thái và thị trường",
    icon: Smartphone,
  },
  {
    id: "hardware",
    label: "Phần cứng",
    description: "CPU, GPU, RAM và lưu trữ",
    icon: Cpu,
  },
  {
    id: "scores",
    label: "Score tự động",
    description: "Quy chuẩn và trọng số",
    icon: Gauge,
  },
  {
    id: "details",
    label: "Nâng cao",
    description: "Thiết kế, I/O và tản nhiệt",
    icon: Settings2,
  },
];

function nextVariantEditorSection(
  current: VariantEditorSection,
): VariantEditorSection {
  const index = variantEditorSteps.findIndex((step) => step.id === current);
  return variantEditorSteps[Math.min(index + 1, variantEditorSteps.length - 1)]
    .id;
}

function previousVariantEditorSection(
  current: VariantEditorSection,
): VariantEditorSection | null {
  const index = variantEditorSteps.findIndex((step) => step.id === current);
  return index > 0 ? variantEditorSteps[index - 1].id : null;
}

function VariantEditorNav({
  value,
  onChange,
  identityProgress,
  hardwareProgress,
  scoreProgress,
}: {
  value: VariantEditorSection;
  onChange: (value: VariantEditorSection) => void;
  identityProgress: string;
  hardwareProgress: string;
  scoreProgress: string;
}) {
  const progressLabels: Record<VariantEditorSection, string> = {
    identity: identityProgress,
    hardware: hardwareProgress,
    scores: scoreProgress,
    details: "Không bắt buộc",
  };

  return (
    <div
      className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2 xl:grid-cols-4"
      role="tablist"
      aria-label="Các phần của phiên bản thiết bị"
    >
      {variantEditorSteps.map((step, index) => {
        const Icon = step.icon;
        const active = value === step.id;
        return (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(step.id)}
            className={`flex min-h-20 items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${
              active
                ? "border-blue-300 bg-white shadow-sm"
                : "border-transparent hover:border-slate-200 hover:bg-white"
            }`}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Phần {index + 1}
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-slate-950">
                {step.label}
              </span>
              <span className="mt-1 block truncate text-[11px] text-slate-500">
                {progressLabels[step.id]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CatalogWorkflowNav({
  value,
  onChange,
  modelCount,
  familyCount,
}: {
  value: CatalogWorkspace;
  onChange: (value: CatalogWorkspace) => void;
  modelCount?: number;
  familyCount?: number;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Danh mục thiết bị
          </h2>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {familyCount ?? "–"} dòng · {modelCount ?? "–"} mẫu máy
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist">
        {catalogWorkspaceSteps.map((step, index) => {
          const Icon = step.icon;
          const active = value === step.id;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(step.id)}
              className={`group flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition ${
                active
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-semibold ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                <span className="sr-only">Bước {index + 1}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold text-slate-500">
                  BƯỚC {index + 1}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-950">
                  {step.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="app-panel p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-surface-soft p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-slate-950">
        {title}
      </legend>
      {description ? (
        <p className="mb-4 text-xs leading-5 text-slate-500">{description}</p>
      ) : null}
      {children}
    </fieldset>
  );
}

function PanelError({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <p
      className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800"
      role="alert"
    >
      {error.message}
    </p>
  );
}

const CATALOG_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);
const CATALOG_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

function CatalogImageInput({
  file,
  url,
  disabled,
  title = "Ảnh đại diện / logo",
  description = "Chọn JPG, PNG, WebP hoặc SVG, tối đa 8 MB. Nên dùng ảnh vuông, nền trong suốt.",
  previewAlt = "Xem trước hình ảnh",
  urlLabel = "Hoặc dùng URL hình ảnh",
  urlHint = "Nếu chọn tệp ảnh, SpecHub sẽ tự tải ảnh lên kho nội bộ.",
  onFileChange,
  onUrlChange,
}: {
  file: File | null;
  url: string;
  disabled?: boolean;
  title?: string;
  description?: string;
  previewAlt?: string;
  urlLabel?: string;
  urlHint?: string;
  onFileChange: (file: File | null) => void;
  onUrlChange: (url: string) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const previewUrl = objectUrl ?? url.trim();

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const nextObjectUrl = URL.createObjectURL(file);
    setObjectUrl(nextObjectUrl);
    return () => URL.revokeObjectURL(nextObjectUrl);
  }, [file]);

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div className="grid aspect-square w-28 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
          {previewUrl && !previewFailed ? (
            // The preview can use an administrator-selected local file.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={previewAlt}
              className="size-full object-contain p-3"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <ImageOff size={28} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label
              className={`inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition ${
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:border-blue-400 hover:text-blue-700"
              }`}
            >
              <ImagePlus size={16} />
              {file ? "Chọn ảnh khác" : "Chọn ảnh"}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                className="sr-only"
                disabled={disabled}
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (!selected) return;
                  if (!CATALOG_IMAGE_TYPES.has(selected.type)) {
                    setValidationError(
                      "Định dạng ảnh chưa được hỗ trợ. Hãy chọn JPG, PNG, WebP hoặc SVG.",
                    );
                    return;
                  }
                  if (selected.size > CATALOG_IMAGE_MAX_BYTES) {
                    setValidationError("Ảnh vượt quá dung lượng tối đa 8 MB.");
                    return;
                  }
                  setValidationError(null);
                  onFileChange(selected);
                }}
              />
            </label>
            {file ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setValidationError(null);
                  onFileChange(null);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 size={15} />
                Bỏ ảnh
              </button>
            ) : null}
          </div>
          {file ? (
            <p className="mt-2 truncate text-xs text-slate-600">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          ) : null}
          {validationError ? (
            <p className="mt-2 text-xs leading-5 text-rose-700" role="alert">
              {validationError}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 border-t border-slate-200 pt-4">
        <TextInput
          label={urlLabel}
          type="url"
          placeholder="https://..."
          hint={urlHint}
          disabled={disabled}
          value={url}
          onChange={onUrlChange}
        />
      </div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="py-5 text-sm text-slate-500">{label}</p>;
}

function TextInput({
  label,
  onChange,
  hint,
  required,
  className,
  labelClassName,
  ...props
}: {
  label: string;
  hint?: string;
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "className">) {
  return (
    <label className={`block min-w-0 ${className ?? ""}`}>
      <span
        className={`mb-1.5 block text-sm font-medium text-slate-700 ${labelClassName ?? ""}`}
      >
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      <input
        {...props}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="form-control min-w-0 max-w-full disabled:bg-slate-100 disabled:text-slate-500"
      />
      {hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function SelectInput({
  label,
  onChange,
  children,
  hint,
  required,
  className,
  labelClassName,
  ...props
}: {
  label: string;
  hint?: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "className">) {
  const optionItems = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => ({
      value: String((child.props as { value?: string | number }).value ?? ""),
      label: reactNodeText((child.props as { children?: ReactNode }).children),
    }));
  const emptyOption = optionItems.find((option) => option.value === "");

  return (
    <AppSearchableSelect
      label={label}
      value={String(props.value ?? "")}
      onChange={onChange}
      options={optionItems.filter((option) => option.value !== "")}
      placeholder={
        emptyOption?.label || `Chọn ${label.toLocaleLowerCase("vi")}`
      }
      searchPlaceholder={`Tìm ${label.toLocaleLowerCase("vi")}...`}
      hint={hint}
      required={required}
      disabled={props.disabled}
      className={className}
      labelClassName={labelClassName}
      clearable={!required && Boolean(emptyOption)}
      name={props.name}
    />
  );
}

function reactNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(reactNodeText).join("");
  if (isValidElement(node)) {
    return reactNodeText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Tìm và chọn...",
  emptyLabel = "Không có kết quả phù hợp",
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder?: string;
  emptyLabel?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <AppSearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={placeholder}
      emptyLabel={emptyLabel}
      hint={hint}
      required={required}
    />
  );
}

function TextAreaInput({
  label,
  onChange,
  className,
  hint,
  required,
  ...props
}: {
  label: string;
  hint?: string;
  onChange: (value: string) => void;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange">) {
  return (
    <label className={className ?? "block"}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      <textarea
        {...props}
        required={required}
        rows={props.rows ?? 4}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
      />
      {hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function CheckboxInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-surface-soft px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}

function BooleanInput({
  label,
  value,
  onChange,
  className,
  labelClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <SelectInput
      label={label}
      value={value}
      onChange={onChange}
      className={className}
      labelClassName={labelClassName}
    >
      <option value="">Chưa xác định</option>
      <option value="true">Có</option>
      <option value="false">Không</option>
    </SelectInput>
  );
}

function PrimaryButton({
  children,
  disabled,
  pending,
  pendingLabel = "Đang xử lý…",
}: {
  children: ReactNode;
  disabled?: boolean;
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={pending}
      className="app-button-primary px-5"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function syncSlug(previousName: string, currentSlug: string, nextName: string) {
  if (!currentSlug || currentSlug === slugify(previousName)) {
    return slugify(nextName);
  }
  return currentSlug;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCatalogIdentity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function optionalText(value: string) {
  return normalizeText(value) || undefined;
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  return parseSpecificationNumber(value);
}

function optionalInteger(value: string) {
  const parsed = optionalNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}

function hardwareVariantLabel(marketName: string, skuCode: string) {
  return (
    [marketName.trim(), skuCode.trim().toUpperCase()]
      .filter(Boolean)
      .join(" · ") || "Cấu hình tiêu chuẩn"
  );
}

function parseAdminCapacityOptions(value: string) {
  return [
    ...new Set(
      value
        .split(/[,;\n/]+/)
        .map((item) => parseSpecificationNumber(item.replace(/\s*gb\s*$/i, "")))
        .filter(
          (item): item is number =>
            item !== undefined && Number.isInteger(item) && item > 0,
        ),
    ),
  ].sort((left, right) => left - right);
}

function optionalBoolean(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function gpuApiSummary(
  openglVersion: string,
  openclVersion: string,
  vulkanVersion: string,
) {
  const entries = [
    ["OpenGL", openglVersion],
    ["OpenCL", openclVersion],
    ["Vulkan", vulkanVersion],
  ]
    .flatMap(([label, value]) => {
      const normalized = optionalText(value);
      if (!normalized) return [];
      return normalized
        .toLocaleLowerCase()
        .startsWith(label.toLocaleLowerCase())
        ? [normalized]
        : [`${label} ${normalized}`];
    })
    .join(", ");
  return optionalText(entries);
}

function npuPrecisionSummary(int8: string, fp16: string) {
  const entries = [
    optionalBoolean(int8) === true ? "INT8" : null,
    optionalBoolean(fp16) === true ? "FP16" : null,
  ]
    .filter(Boolean)
    .join(", ");
  return optionalText(entries);
}

function withValues<T extends Record<string, unknown>>(value: T) {
  return Object.values(value).some((item) => item !== undefined)
    ? value
    : undefined;
}

function createInitialFamilyForm() {
  return {
    brand_org_id: "",
    device_category_id: "",
    name: "",
    slug: "",
    description: "",
    cover_image_url: "",
    first_release_year: "",
    last_release_year: "",
    is_active: true,
  };
}

function buildProductFamilyPayload(
  form: ReturnType<typeof createInitialFamilyForm>,
) {
  return {
    brand_org_id: form.brand_org_id,
    device_category_id: form.device_category_id,
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    cover_image_url: optionalText(form.cover_image_url),
    first_release_year: optionalInteger(form.first_release_year),
    last_release_year: optionalInteger(form.last_release_year),
    is_active: form.is_active,
  };
}

function familyFormFromItem(family: ProductFamily) {
  return {
    brand_org_id: family.brand_org_id ?? family.brand_org?.id ?? "",
    device_category_id:
      family.device_category_id ?? family.device_category?.id ?? "",
    name: family.name,
    slug: family.slug,
    description: family.description ?? "",
    cover_image_url: family.cover_image_url ?? "",
    first_release_year:
      family.first_release_year == null
        ? ""
        : String(family.first_release_year),
    last_release_year:
      family.last_release_year == null ? "" : String(family.last_release_year),
    is_active: family.is_active ?? true,
  };
}

function productFamilyPickerOptions(families?: ProductFamily[]) {
  return (families ?? []).map((family) => ({
    value: family.id,
    label: family.name,
    meta: [
      family.brand_org?.name,
      localizeDeviceCategory(family.device_category, ""),
      family.slug,
    ]
      .filter(Boolean)
      .join(" · "),
  }));
}

function createInitialDeviceModelForm(): DeviceModelForm {
  return {
    name: "",
    slug: "",
    product_family_id: "",
    release_status_id: "",
    internal_codename: "",
    generation_label: "",
    announcement_date: "",
    release_date: "",
    end_of_sale_date: "",
    end_of_support_date: "",
    cover_image_url: "",
    summary: "",
    description: "",
  };
}

function buildDeviceModelPayload(
  form: DeviceModelForm,
): CreateDeviceModelInput {
  return {
    name: form.name,
    slug: form.slug,
    product_family_id: form.product_family_id,
    release_status_id: Number(form.release_status_id),
    internal_codename: optionalText(form.internal_codename),
    generation_label: optionalText(form.generation_label),
    announcement_date: optionalText(form.announcement_date),
    release_date: optionalText(form.release_date),
    end_of_sale_date: optionalText(form.end_of_sale_date),
    end_of_support_date: optionalText(form.end_of_support_date),
    cover_image_url: optionalText(form.cover_image_url),
    summary: form.summary.trim(),
    description: form.description.trim(),
  };
}

function deviceModelFormFromSummary(
  model: DeviceModelSummary,
): EditableDeviceModel {
  return {
    id: model.id,
    name: model.name,
    slug: model.slug,
    product_family_id:
      model.product_family_id ?? model.product_family?.id ?? "",
    release_status_id: model.release_status?.id
      ? String(model.release_status.id)
      : "",
    internal_codename: model.internal_codename ?? "",
    generation_label: model.generation_label ?? "",
    announcement_date: dateInputValue(model.announcement_date),
    release_date: dateInputValue(model.release_date),
    end_of_sale_date: dateInputValue(model.end_of_sale_date),
    end_of_support_date: dateInputValue(model.end_of_support_date),
    cover_image_url: model.cover_image_url ?? "",
    summary: model.summary ?? "",
    description: model.description ?? "",
  };
}

function variantFormFromDetail(
  variant: DeviceVariantDetail,
): DeviceVariantForm {
  const physical = variant.variant_physical_specs;
  const io = variant.variant_io_specs;
  const thermal = variant.variant_thermal_specs;
  const performanceResults = (variant.device_variant_benchmarks ?? []).map(
    (result) => ({
      benchmark_id: result.benchmark.id,
      score: String(result.score),
      subscore_name: result.subscore_name ?? "",
      tested_at: dateInputValue(result.tested_at),
      os_version: result.benchmark_run?.os_version ?? "",
      app_version: result.benchmark_run?.app_version ?? "",
      power_mode: result.benchmark_run?.power_mode ?? "",
      ambient_temp_c:
        result.benchmark_run?.ambient_temp_c == null
          ? ""
          : String(result.benchmark_run.ambient_temp_c),
      test_environment_note: result.benchmark_run?.test_environment_note ?? "",
      is_thermal_throttled: Boolean(result.benchmark_run?.is_thermal_throttled),
    }),
  );
  const chipsetId = variant.variant_chipsets?.[0]?.chipset.id ?? "";
  const cpuId = variant.variant_cpus?.[0]?.cpu.id ?? "";
  const gpuId = variant.variant_gpus?.[0]?.gpu.id ?? "";
  const npuId = variant.variant_npus?.[0]?.npu.id ?? "";
  const modemId = variant.variant_modems?.[0]?.modem.id ?? "";
  const memoryStandardId =
    variant.variant_memory_configs?.[0]?.memory_standard.id ?? "";
  const storageStandardId =
    variant.variant_storage_configs?.[0]?.storage_standard.id ?? "";
  const moduleScores = new Map(
    (variant.variant_module_scores ?? []).map((item) => [
      `${item.module_kind}:${item.module_id}`,
      String(item.score),
    ]),
  );
  const moduleScore = (kind: string, id: string) =>
    id ? (moduleScores.get(`${kind}:${id}`) ?? "") : "";
  const scoreMetricInputs = (variant.variant_score_metric_inputs ?? []).map(
    (input) => ({
      metric_key: input.metric_key,
      raw_value: String(input.raw_value),
      unit: input.unit ?? "",
      normalized_score:
        input.normalized_score == null ? "" : String(input.normalized_score),
      source_label: input.source_label ?? "",
    }),
  );

  return {
    ...createInitialVariantForm(),
    device_model_id: variant.device_model_id ?? variant.device_model?.id ?? "",
    variant_name: variant.variant_name,
    release_status_id: variant.release_status?.id
      ? String(variant.release_status.id)
      : "",
    sku_code: variant.sku_code ?? "",
    market_name: variant.market_name ?? "",
    color_name: variant.color_name ?? "",
    color_hex: variant.color_hex ?? "",
    launch_date: dateInputValue(variant.launch_date),
    end_of_sale_date: dateInputValue(variant.end_of_sale_date),
    launch_price:
      variant.launch_price == null ? "" : String(variant.launch_price),
    currency_id: variant.currency?.id ? String(variant.currency.id) : "",
    is_default: Boolean(variant.is_default),
    notes: variant.notes ?? "",
    chipset_id: chipsetId,
    cpu_id: cpuId,
    gpu_id: gpuId,
    npu_id: npuId,
    modem_id: modemId,
    memory_standard_id: memoryStandardId,
    memory_capacity_gb:
      variant.variant_memory_configs
        ?.map((item) => Number(item.capacity_gb))
        .filter((item) => Number.isFinite(item) && item > 0)
        .sort((left, right) => left - right)
        .join(", ") ?? "",
    memory_speed_mhz:
      variant.variant_memory_configs?.[0]?.speed_mhz == null
        ? ""
        : String(variant.variant_memory_configs[0].speed_mhz),
    storage_standard_id: storageStandardId,
    storage_capacity_gb:
      variant.variant_storage_configs
        ?.map((item) => Number(item.total_capacity_gb))
        .filter((item) => Number.isFinite(item) && item > 0)
        .sort((left, right) => left - right)
        .join(", ") ?? "",
    chipset_score: moduleScore("chipset", chipsetId),
    cpu_score: moduleScore("cpu", cpuId),
    gpu_score: moduleScore("gpu", gpuId),
    npu_score: moduleScore("npu", npuId),
    modem_score: moduleScore("modem", modemId),
    memory_score: moduleScore("memory-standard", memoryStandardId),
    storage_score: moduleScore("storage-standard", storageStandardId),
    score_metric_inputs: scoreMetricInputs,
    height_mm: recordValue(physical, "height_mm"),
    width_mm: recordValue(physical, "width_mm"),
    thickness_mm: recordValue(physical, "thickness_mm"),
    thickness_min_mm: recordValue(physical, "thickness_min_mm"),
    thickness_max_mm: recordValue(physical, "thickness_max_mm"),
    weight_g: recordValue(physical, "weight_g"),
    volume_cm3: recordValue(physical, "volume_cm3"),
    frame_material: recordValue(physical, "frame_material"),
    back_material: recordValue(physical, "back_material"),
    front_glass: recordValue(physical, "front_glass"),
    ingress_protection: recordValue(physical, "ingress_protection"),
    physical_notes: recordValue(physical, "notes"),
    sim_slots: recordValue(io, "sim_slots"),
    sim_type: recordValue(io, "sim_type"),
    esim_supported: recordBooleanValue(io, "esim_supported"),
    esim_count: recordValue(io, "esim_count"),
    stereo_speakers: recordBooleanValue(io, "stereo_speakers"),
    speaker_count: recordValue(io, "speaker_count"),
    audio_brand_tuning: recordValue(io, "audio_brand_tuning"),
    headphone_jack: recordBooleanValue(io, "headphone_jack"),
    headphone_jack_size_mm: recordValue(io, "headphone_jack_size_mm"),
    has_microsd_slot: recordBooleanValue(io, "has_microsd_slot"),
    microsd_max_capacity_gb: recordValue(io, "microsd_max_capacity_gb"),
    has_ir_blaster: recordBooleanValue(io, "has_ir_blaster"),
    has_notification_led: recordBooleanValue(io, "has_notification_led"),
    io_notes: recordValue(io, "notes"),
    cooling_type: recordValue(thermal, "cooling_type"),
    vc_area_mm2: recordValue(thermal, "vc_area_mm2"),
    has_active_cooling: recordBooleanValue(thermal, "has_active_cooling"),
    thermal_notes: recordValue(thermal, "notes"),
    performance_results: performanceResults.length
      ? performanceResults
      : [createEmptyPerformanceResult()],
  };
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function recordValue(
  record: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = record?.[key];
  return value == null ? "" : String(value);
}

function recordBooleanValue(
  record: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = record?.[key];
  return typeof value === "boolean" ? String(value) : "";
}

function createInitialVariantForm() {
  return {
    device_model_id: "",
    variant_name: "",
    release_status_id: "",
    sku_code: "",
    market_name: "",
    color_name: "",
    color_hex: "",
    launch_date: "",
    end_of_sale_date: "",
    launch_price: "",
    currency_id: "",
    is_default: false,
    notes: "",
    chipset_id: "",
    cpu_id: "",
    gpu_id: "",
    npu_id: "",
    modem_id: "",
    memory_standard_id: "",
    memory_capacity_gb: "",
    memory_speed_mhz: "",
    storage_standard_id: "",
    storage_capacity_gb: "",
    chipset_score: "",
    cpu_score: "",
    gpu_score: "",
    npu_score: "",
    modem_score: "",
    memory_score: "",
    storage_score: "",
    module_scores_dirty: false,
    score_metric_inputs: [] as ScoreMetricInputForm[],
    score_metric_inputs_dirty: false,
    height_mm: "",
    width_mm: "",
    thickness_mm: "",
    thickness_min_mm: "",
    thickness_max_mm: "",
    weight_g: "",
    volume_cm3: "",
    frame_material: "",
    back_material: "",
    front_glass: "",
    ingress_protection: "",
    physical_notes: "",
    sim_slots: "",
    sim_type: "",
    esim_supported: "",
    esim_count: "",
    stereo_speakers: "",
    speaker_count: "",
    audio_brand_tuning: "",
    headphone_jack: "",
    headphone_jack_size_mm: "",
    has_microsd_slot: "",
    microsd_max_capacity_gb: "",
    has_ir_blaster: "",
    has_notification_led: "",
    io_notes: "",
    cooling_type: "",
    vc_area_mm2: "",
    has_active_cooling: "",
    thermal_notes: "",
    performance_results: [
      createEmptyPerformanceResult(),
    ] as PerformanceResultForm[],
  };
}

type DeviceVariantForm = ReturnType<typeof createInitialVariantForm>;

function hasCompleteHardwareAssignments(form: DeviceVariantForm) {
  return (
    (!form.memory_standard_id ||
      Boolean(parseAdminCapacityOptions(form.memory_capacity_gb).length)) &&
    (!form.storage_standard_id ||
      Boolean(parseAdminCapacityOptions(form.storage_capacity_gb).length))
  );
}

function buildVariantPayload(
  form: DeviceVariantForm,
): CreateDeviceVariantInput {
  return {
    device_model_id: form.device_model_id,
    variant_name: hardwareVariantLabel(form.market_name, form.sku_code),
    release_status_id: Number(form.release_status_id),
    sku_code: optionalText(form.sku_code),
    market_name: optionalText(form.market_name),
    launch_date: optionalText(form.launch_date),
    end_of_sale_date: optionalText(form.end_of_sale_date),
    launch_price: optionalNumber(form.launch_price),
    currency_id: optionalInteger(form.currency_id),
    is_default: form.is_default,
    notes: optionalText(form.notes),
    hardware_components: {
      chipsets: form.chipset_id
        ? [{ module_id: form.chipset_id, role: "main", is_primary: true }]
        : [],
      cpus:
        !form.chipset_id && form.cpu_id
          ? [{ module_id: form.cpu_id, role: "main", is_primary: true }]
          : [],
      gpus:
        !form.chipset_id && form.gpu_id
          ? [{ module_id: form.gpu_id, role: "main", is_primary: true }]
          : [],
      npus:
        !form.chipset_id && form.npu_id
          ? [{ module_id: form.npu_id, role: "main", is_primary: true }]
          : [],
      modems:
        !form.chipset_id && form.modem_id
          ? [{ module_id: form.modem_id, role: "main", is_primary: true }]
          : [],
      memory:
        form.memory_standard_id &&
        parseAdminCapacityOptions(form.memory_capacity_gb).length
          ? parseAdminCapacityOptions(form.memory_capacity_gb).map(
              (capacity_gb, index) => ({
                memory_standard_id: form.memory_standard_id,
                capacity_gb,
                is_primary: index === 0,
              }),
            )
          : [],
      storage:
        form.storage_standard_id &&
        parseAdminCapacityOptions(form.storage_capacity_gb).length
          ? parseAdminCapacityOptions(form.storage_capacity_gb).map(
              (total_capacity_gb) => ({
                storage_standard_id: form.storage_standard_id,
                total_capacity_gb,
                is_expandable: false,
              }),
            )
          : [],
    },
    physical_specs: withValues({
      height_mm: optionalNumber(form.height_mm),
      width_mm: optionalNumber(form.width_mm),
      thickness_mm: optionalNumber(form.thickness_mm),
      thickness_min_mm: optionalNumber(form.thickness_min_mm),
      thickness_max_mm: optionalNumber(form.thickness_max_mm),
      weight_g: optionalNumber(form.weight_g),
      volume_cm3: optionalNumber(form.volume_cm3),
      frame_material: optionalText(form.frame_material),
      back_material: optionalText(form.back_material),
      front_glass: optionalText(form.front_glass),
      ingress_protection: optionalText(form.ingress_protection),
      notes: optionalText(form.physical_notes),
    }),
    io_specs: withValues({
      sim_slots: optionalInteger(form.sim_slots),
      sim_type: optionalText(form.sim_type),
      esim_supported: optionalBoolean(form.esim_supported),
      esim_count: optionalInteger(form.esim_count),
      stereo_speakers: optionalBoolean(form.stereo_speakers),
      speaker_count: optionalInteger(form.speaker_count),
      audio_brand_tuning: optionalText(form.audio_brand_tuning),
      headphone_jack: optionalBoolean(form.headphone_jack),
      headphone_jack_size_mm: optionalNumber(form.headphone_jack_size_mm),
      has_microsd_slot: optionalBoolean(form.has_microsd_slot),
      microsd_max_capacity_gb: optionalInteger(form.microsd_max_capacity_gb),
      has_ir_blaster: optionalBoolean(form.has_ir_blaster),
      has_notification_led: optionalBoolean(form.has_notification_led),
      notes: optionalText(form.io_notes),
    }),
    thermal_specs: withValues({
      cooling_type: optionalText(form.cooling_type),
      vc_area_mm2: optionalInteger(form.vc_area_mm2),
      has_active_cooling: optionalBoolean(form.has_active_cooling),
      notes: optionalText(form.thermal_notes),
    }),
  };
}

function HardwareAssignmentsEditor({
  form,
  catalog,
  onChange,
}: {
  form: DeviceVariantForm;
  catalog: HardwareAssignmentCatalog;
  onChange: (key: keyof DeviceVariantForm, value: string) => void;
}) {
  const updateAssignment = (
    moduleKey: (typeof MODULE_SCORE_FIELDS)[number]["moduleKey"],
    scoreKey: (typeof MODULE_SCORE_FIELDS)[number]["scoreKey"],
    value: string,
  ) => {
    if (form[moduleKey] !== value) onChange(scoreKey, "");
    onChange(moduleKey, value);
  };

  return (
    <FormSection
      title="Cấu hình phần cứng"
      description="Gán mô-đun cho biến thể theo thị trường. Các mức RAM và lưu trữ là tùy chọn trong cùng biến thể, không tạo thêm phiên bản."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SearchableSelect
          label="Chipset / SoC"
          value={form.chipset_id}
          onChange={(value) =>
            updateAssignment("chipset_id", "chipset_score", value)
          }
          options={hardwarePickerOptions(catalog.chipsets)}
          placeholder="Tìm chipset..."
        />
        {form.chipset_id ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900 md:col-span-1 xl:col-span-2">
            CPU, GPU, NPU và modem tích hợp được kế thừa từ SoC. Chỉ gán trực
            tiếp các linh kiện này khi thiết bị không dùng SoC đã khai báo.
          </div>
        ) : (
          <>
            <SearchableSelect
              label="CPU"
              value={form.cpu_id}
              onChange={(value) =>
                updateAssignment("cpu_id", "cpu_score", value)
              }
              options={hardwarePickerOptions(catalog.cpus)}
              placeholder="Tìm CPU..."
            />
            <SearchableSelect
              label="GPU"
              value={form.gpu_id}
              onChange={(value) =>
                updateAssignment("gpu_id", "gpu_score", value)
              }
              options={hardwarePickerOptions(catalog.gpus)}
              placeholder="Tìm GPU..."
            />
            <SearchableSelect
              label="NPU"
              value={form.npu_id}
              onChange={(value) =>
                updateAssignment("npu_id", "npu_score", value)
              }
              options={hardwarePickerOptions(catalog.npus)}
              placeholder="Tìm NPU..."
            />
            <SearchableSelect
              label="Modem"
              value={form.modem_id}
              onChange={(value) =>
                updateAssignment("modem_id", "modem_score", value)
              }
              options={hardwarePickerOptions(catalog.modems)}
              placeholder="Tìm modem..."
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:grid-cols-2 xl:grid-cols-4">
        <SearchableSelect
          label="Chuẩn RAM"
          value={form.memory_standard_id}
          onChange={(value) =>
            updateAssignment("memory_standard_id", "memory_score", value)
          }
          options={hardwarePickerOptions(catalog.memory)}
          placeholder="Tìm LPDDR, DDR..."
        />
        <TextInput
          label="Các mức RAM (GB)"
          placeholder="8, 12, 16"
          value={form.memory_capacity_gb}
          onChange={(value) => onChange("memory_capacity_gb", value)}
          required={Boolean(form.memory_standard_id)}
          hint={
            form.memory_standard_id && !form.memory_capacity_gb
              ? "Cần ít nhất một mức dung lượng."
              : "Phân tách bằng dấu phẩy; hệ thống lưu chung trong một biến thể."
          }
        />
        <SearchableSelect
          label="Chuẩn lưu trữ"
          value={form.storage_standard_id}
          onChange={(value) =>
            updateAssignment("storage_standard_id", "storage_score", value)
          }
          options={hardwarePickerOptions(catalog.storage)}
          placeholder="Tìm UFS, NVMe..."
        />
        <TextInput
          label="Các mức lưu trữ (GB)"
          placeholder="128, 256, 512"
          value={form.storage_capacity_gb}
          onChange={(value) => onChange("storage_capacity_gb", value)}
          required={Boolean(form.storage_standard_id)}
          hint={
            form.storage_standard_id && !form.storage_capacity_gb
              ? "Cần ít nhất một mức dung lượng."
              : "Không dùng dung lượng để đặt tên hoặc tách biến thể."
          }
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Không thấy mô-đun cần dùng? Tạo mô-đun trong mục “Phần cứng”, sau đó
        quay lại và tải lại danh sách.
      </p>
    </FormSection>
  );
}

function VariantScoreWorkspace({
  profile,
  onOpenFullEditor,
}: {
  profile?: ScoringProfile;
  onOpenFullEditor?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-start">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
          <Gauge size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-blue-950">
            Score thiết bị được tính tự động
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Không nhập điểm 0–100 tại thiết bị. Sau khi lưu, hệ thống đọc
            benchmark của chipset/module, màn hình, camera, pin, phần mềm, kết
            nối và hoàn thiện để tạo scorecard tổng thể theo loại máy.
          </p>
        </div>
        {onOpenFullEditor ? (
          <button
            type="button"
            onClick={onOpenFullEditor}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-blue-200 bg-white text-blue-700 transition hover:border-blue-400 sm:flex sm:w-auto sm:gap-2 sm:px-3"
            aria-label="Sửa cấu hình phần cứng"
            title="Sửa cấu hình phần cứng"
          >
            <Settings2 size={16} />
            <span className="hidden text-xs font-semibold sm:inline">
              Phần cứng
            </span>
          </button>
        ) : null}
      </div>
      {profile ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Quy chuẩn {profile.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Benchmark xác minh → thông số catalog → giá trị suy ra → mốc
                trung tính khi thiếu dữ liệu.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Không cần nhập tay
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {profile.modules.map((module) => (
              <div
                key={module.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"
              >
                <span className="text-xs font-medium text-slate-700">
                  {module.label}
                </span>
                <strong className="text-xs text-slate-950">
                  {module.weight}%
                </strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          Hồ sơ trọng số sẽ được chọn tự động từ loại thiết bị sau khi lưu.
        </div>
      )}
    </div>
  );
}

// Legacy-only renderer retained for reading archived manual score payloads.
// It is intentionally not exposed by the current device workflow.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ModuleScoresEditor({
  form,
  catalog,
  onChange,
}: {
  form: DeviceVariantForm;
  catalog: HardwareAssignmentCatalog;
  onChange: (key: keyof DeviceVariantForm, value: string) => void;
}) {
  const selectedModules = MODULE_SCORE_FIELDS.flatMap((field) => {
    const moduleId = form[field.moduleKey];
    if (!moduleId) return [];
    const selectedModule = catalog[field.catalogKey].find(
      (candidate) => candidate.id === moduleId,
    );
    return [{ ...field, moduleId, selectedModule }];
  });
  const scoredWeight = MODULE_SCORE_FIELDS.reduce(
    (total, field) =>
      form[field.moduleKey] && form[field.scoreKey] !== ""
        ? total + field.weight
        : total,
    0,
  );
  const weightedScore = MODULE_SCORE_FIELDS.reduce((total, field) => {
    const score = Number(form[field.scoreKey]);
    return form[field.moduleKey] &&
      form[field.scoreKey] !== "" &&
      Number.isFinite(score)
      ? total + score * field.weight
      : total;
  }, 0);
  const configurationScore =
    scoredWeight > 0 ? weightedScore / scoredWeight : null;
  const scoredModuleCount = selectedModules.filter(
    (field) => form[field.scoreKey] !== "",
  ).length;

  return (
    <section aria-labelledby="module-score-title">
      <h3
        id="module-score-title"
        className="mb-2 px-1 text-sm font-semibold text-slate-950"
      >
        Điểm mô-đun
      </h3>
      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <span>
              {scoredModuleCount}/{selectedModules.length} mô-đun đã có điểm
            </span>
            <span>{scoredWeight}% độ phủ</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(100, scoredWeight)}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-baseline gap-1 rounded-lg bg-slate-950 px-3 py-2 text-white">
          <strong className="text-xl">
            {configurationScore == null
              ? "—"
              : formatAdminNumber(configurationScore)}
          </strong>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>

      {selectedModules.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {selectedModules.map((field) => {
            const moduleName =
              field.selectedModule?.name ||
              field.selectedModule?.slug ||
              "Mô-đun đã chọn";
            const score = form[field.scoreKey];
            const numericScore = Number(score);
            const invalid =
              score !== "" &&
              (!Number.isFinite(numericScore) ||
                numericScore < 0 ||
                numericScore > 100);
            return (
              <div
                key={field.kind}
                className={`grid gap-3 border-b border-slate-100 p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_90px_132px] sm:items-center ${
                  score === "" ? "bg-amber-50/35" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {field.label}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {field.weight ? `${field.weight}%` : "Tham khảo"}
                    </span>
                  </div>
                  <p
                    className="mt-1 truncate text-sm font-semibold text-slate-950"
                    title={moduleName}
                  >
                    {moduleName}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold sm:text-right ${
                    score === ""
                      ? "text-amber-700"
                      : invalid
                        ? "text-rose-700"
                        : "text-emerald-700"
                  }`}
                >
                  {score === ""
                    ? "Còn thiếu"
                    : invalid
                      ? "Chưa hợp lệ"
                      : "Đã nhập"}
                </span>
                <label className="relative block">
                  <span className="sr-only">Điểm {field.label}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="0–100"
                    value={score}
                    onChange={(event) =>
                      onChange(field.scoreKey, event.target.value)
                    }
                    className={`form-control pr-11 text-right text-base font-bold ${
                      invalid ? "border-rose-400 focus:border-rose-500" : ""
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    /100
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-5 text-sm font-medium text-amber-900">
          Phiên bản chưa được gán phần cứng. Mở “Sửa phần cứng” trước khi nhập
          điểm mô-đun.
        </div>
      )}
    </section>
  );
}

// Legacy-only renderer retained for reading archived manual score payloads.
// It is intentionally not exposed by the current device workflow.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DetailedScorecardEditor({
  profile,
  inputs,
  onChange,
}: {
  profile?: ScoringProfile;
  inputs: ScoreMetricInputForm[];
  onChange: (inputs: ScoreMetricInputForm[]) => void;
}) {
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [missingMetricKeys, setMissingMetricKeys] = useState<string[]>([]);

  if (!profile) {
    return (
      <section aria-labelledby="detail-score-title">
        <h3
          id="detail-score-title"
          className="mb-2 px-1 text-sm font-semibold text-slate-950"
        >
          Chỉ số chi tiết
        </h3>
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          Chưa có hồ sơ chấm điểm phù hợp với danh mục thiết bị.
        </div>
      </section>
    );
  }

  const rawMetrics: RawMetricBag = {};
  for (const input of inputs) {
    const rawValue = Number(input.raw_value);
    if (!Number.isFinite(rawValue)) continue;
    const normalizedScore =
      input.normalized_score === ""
        ? undefined
        : Number(input.normalized_score);
    rawMetrics[input.metric_key] = {
      value: rawValue,
      unit: input.unit.trim() || undefined,
      source: "manual",
      sourceLabel:
        input.source_label.trim() ||
        "Giá trị do quản trị viên nhập trong hồ sơ thiết bị",
      normalizedScore: Number.isFinite(normalizedScore)
        ? normalizedScore
        : undefined,
    };
  }
  const preview = calculateScorecard(profile, rawMetrics);
  const enteredCount = Object.keys(rawMetrics).length;
  const totalMetricCount = profile.modules.reduce(
    (total, module) => total + module.metrics.length,
    0,
  );
  const missingCount = Math.max(0, totalMetricCount - enteredCount);

  function updateMetric(
    metricKey: string,
    patch: Partial<Omit<ScoreMetricInputForm, "metric_key">>,
  ) {
    const current = inputs.find((input) => input.metric_key === metricKey);
    if (patch.raw_value === "") {
      onChange(inputs.filter((input) => input.metric_key !== metricKey));
      return;
    }
    if (!current && patch.raw_value === undefined) return;
    const next: ScoreMetricInputForm = {
      metric_key: metricKey,
      raw_value: "",
      unit: "",
      normalized_score: "",
      source_label: "",
      ...current,
      ...patch,
    };
    onChange(
      current
        ? inputs.map((input) => (input.metric_key === metricKey ? next : input))
        : [...inputs, next],
    );
  }

  return (
    <section aria-labelledby="detail-score-title">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h3
          id="detail-score-title"
          className="text-sm font-semibold text-slate-950"
        >
          Chỉ số chi tiết
        </h3>
        <span className="truncate text-xs text-slate-500">{profile.label}</span>
      </div>
      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-3 rounded-lg bg-slate-950 px-4 py-3 text-white">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Điểm dự kiến
            </p>
            <p className="mt-0.5 text-2xl font-bold">
              {formatAdminNumber(preview.overallScore)}
              <span className="ml-1 text-xs text-slate-400">/100</span>
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <span>
              {enteredCount}/{totalMetricCount} chỉ số đã nhập
            </span>
            <span>{missingCount} còn thiếu</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${totalMetricCount ? (enteredCount / totalMetricCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setShowMissingOnly(false)}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
              !showMissingOnly
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => {
              setMissingMetricKeys(
                profile.modules.flatMap((module) =>
                  module.metrics
                    .filter((metric) => !rawMetrics[metric.key])
                    .map((metric) => metric.key),
                ),
              );
              setShowMissingOnly(true);
            }}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
              showMissingOnly
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Còn thiếu ({missingCount})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {profile.modules.map((module, moduleIndex) => {
          const visibleMetrics = showMissingOnly
            ? module.metrics.filter((metric) =>
                missingMetricKeys.includes(metric.key),
              )
            : module.metrics;
          if (!visibleMetrics.length) return null;
          const modulePreview = preview.modules.find(
            (item) => item.key === module.key,
          );
          const enteredInModule = module.metrics.filter(
            (metric) => rawMetrics[metric.key],
          ).length;
          return (
            <details
              key={module.key}
              className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
              open={showMissingOnly || moduleIndex === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {module.label}
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      Trọng số {module.weight}%
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {enteredInModule}/{module.metrics.length} chỉ số đã nhập
                  </p>
                </div>
                <span className="text-right">
                  <strong className="block text-lg text-slate-950">
                    {formatAdminNumber(modulePreview?.score ?? 50)}
                  </strong>
                  <span className="text-[11px] text-slate-500">/100</span>
                </span>
              </summary>
              <div className="min-w-0 border-t border-slate-100">
                <div className="hidden grid-cols-[minmax(0,1fr)_150px_100px_84px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
                  <span>Chỉ số</span>
                  <span>Giá trị</span>
                  <span>Đơn vị</span>
                  <span className="text-right">Điểm</span>
                </div>
                {visibleMetrics.map((metric) => {
                  const input = inputs.find(
                    (item) => item.metric_key === metric.key,
                  );
                  const rawValue = Number(input?.raw_value);
                  const automaticScore = Number.isFinite(rawValue)
                    ? normalizeMetric(rawValue, metric)
                    : 50;
                  const displayedScore =
                    input?.normalized_score &&
                    Number.isFinite(Number(input.normalized_score))
                      ? Number(input.normalized_score)
                      : automaticScore;
                  return (
                    <div
                      key={metric.key}
                      className={`grid min-w-0 gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_150px_100px_84px] sm:items-center ${
                        input ? "" : "bg-amber-50/25"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {metric.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {metric.weight}% · mốc {metric.min}–{metric.max}
                          {metric.scale === "log" ? " · thang log" : ""}
                          {metric.direction === "lower"
                            ? " · thấp hơn tốt hơn"
                            : ""}
                        </p>
                      </div>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-500 sm:sr-only">
                          Giá trị
                        </span>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={input?.raw_value ?? ""}
                          onChange={(event) =>
                            updateMetric(metric.key, {
                              raw_value: event.target.value,
                            })
                          }
                          placeholder="Nhập giá trị"
                          className="form-control"
                          aria-label={`Giá trị ${metric.label}`}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-500 sm:sr-only">
                          Đơn vị
                        </span>
                        <input
                          value={input?.unit ?? ""}
                          onChange={(event) =>
                            updateMetric(metric.key, {
                              unit: event.target.value,
                            })
                          }
                          placeholder="điểm…"
                          disabled={!input}
                          className="form-control disabled:bg-slate-100"
                          aria-label={`Đơn vị ${metric.label}`}
                        />
                      </label>
                      <div className="text-left sm:text-right">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1.5 text-sm font-bold ${
                            input
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {formatAdminNumber(displayedScore)}
                        </span>
                      </div>
                      {input ? (
                        <details className="sm:col-span-4">
                          <summary className="cursor-pointer list-none text-xs font-semibold text-blue-700 hover:text-blue-900">
                            Nguồn và điểm ghi đè
                          </summary>
                          <div className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                            <TextInput
                              label="Điểm ghi đè 0–100"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={input.normalized_score}
                              onChange={(normalized_score) =>
                                updateMetric(metric.key, { normalized_score })
                              }
                              placeholder={formatAdminNumber(automaticScore)}
                            />
                            <TextInput
                              label="Nguồn / phương pháp"
                              value={input.source_label}
                              onChange={(source_label) =>
                                updateMetric(metric.key, { source_label })
                              }
                              placeholder="Ví dụ: Geekbench 6"
                            />
                          </div>
                        </details>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function scoringProfileForModel(
  modelId: string,
  models: DeviceModelSummary[] | undefined,
  profiles: ScoringProfile[] | undefined,
  fallbackCategorySlug?: string,
) {
  const categorySlug =
    models?.find((model) => model.id === modelId)?.product_family
      ?.device_category?.slug ?? fallbackCategorySlug;
  return profiles?.find((profile) => profile.categorySlug === categorySlug);
}

function normalizeHardwarePickerItems(items?: unknown[]) {
  return (items ?? []).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      id: String(record.id ?? ""),
      name: typeof record.name === "string" ? record.name : null,
      slug: typeof record.slug === "string" ? record.slug : null,
      manufacturer: isNamedRecord(record.manufacturer),
      organization: isNamedRecord(record.organization),
      memory_type:
        typeof record.memory_type === "string" ? record.memory_type : null,
      storage_type:
        typeof record.storage_type === "string" ? record.storage_type : null,
      generation:
        typeof record.generation === "string" ? record.generation : null,
    };
  });
}

function isNamedRecord(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const name = (value as Record<string, unknown>).name;
  return { name: typeof name === "string" ? name : null };
}

function hardwarePickerOptions(items: HardwarePickerItem[]) {
  return items.map((item) => ({
    value: item.id,
    label: item.name || item.slug || "Mô-đun chưa đặt tên",
    meta: [
      item.manufacturer?.name ?? item.organization?.name,
      item.memory_type ?? item.storage_type,
      item.generation,
      item.slug,
    ]
      .filter(Boolean)
      .join(" · "),
  }));
}

function HardwareTechnicalFieldInput({
  field,
  form,
  onChange,
}: {
  field: HardwareDetailField;
  form: HardwareModuleForm;
  onChange: (
    key: Exclude<keyof HardwareModuleForm, "kind">,
    value: string,
  ) => void;
}) {
  if (field.type === "boolean") {
    return (
      <BooleanInput
        label={field.label}
        labelClassName="text-sm font-medium text-slate-700 lg:min-h-10"
        value={form[field.key]}
        onChange={(value) => onChange(field.key, value)}
      />
    );
  }
  return (
    <TextInput
      label={field.label}
      labelClassName="text-sm font-medium text-slate-700 lg:min-h-10"
      type={field.type ?? "text"}
      min={field.min}
      step={field.step}
      placeholder={field.placeholder}
      value={form[field.key]}
      onChange={(value) => onChange(field.key, value)}
    />
  );
}

function CpuClusterFields({
  form,
  onChange,
}: {
  form: HardwareModuleForm;
  onChange: (
    key: Exclude<keyof HardwareModuleForm, "kind">,
    value: string,
  ) => void;
}) {
  const clusters = [1, 2, 3] as const;
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Cấu hình cụm nhân
        </p>
        <span className="text-[11px] text-slate-400">
          Bỏ trống cụm không áp dụng
        </span>
      </div>
      <div className="space-y-3">
        {clusters.map((cluster) => {
          const nameKey = `chipset_cpu_cluster_${cluster}_name` as Exclude<
            keyof HardwareModuleForm,
            "kind"
          >;
          const architectureKey =
            `chipset_cpu_cluster_${cluster}_architecture` as Exclude<
              keyof HardwareModuleForm,
              "kind"
            >;
          const coreCountKey =
            `chipset_cpu_cluster_${cluster}_core_count` as Exclude<
              keyof HardwareModuleForm,
              "kind"
            >;
          const clockKey =
            `chipset_cpu_cluster_${cluster}_clock_ghz` as Exclude<
              keyof HardwareModuleForm,
              "kind"
            >;
          return (
            <div
              key={cluster}
              className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(130px,.8fr)_minmax(220px,1.35fr)_minmax(110px,.55fr)_minmax(120px,.65fr)]"
            >
              <TextInput
                label={`Cụm ${cluster}`}
                value={form[nameKey]}
                onChange={(value) => onChange(nameKey, value)}
              />
              <TextInput
                label="Kiến trúc nhân"
                placeholder={
                  cluster === 1
                    ? "Cortex-X2"
                    : cluster === 2
                      ? "Cortex-A710"
                      : "Cortex-A510"
                }
                value={form[architectureKey]}
                onChange={(value) => onChange(architectureKey, value)}
              />
              <TextInput
                label="Số nhân"
                type="number"
                min="1"
                value={form[coreCountKey]}
                onChange={(value) => onChange(coreCountKey, value)}
              />
              <TextInput
                label="Xung (GHz)"
                type="number"
                min="0"
                step="0.01"
                value={form[clockKey]}
                onChange={(value) => onChange(clockKey, value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StandaloneChipsetComponentEditor({
  kind,
  form,
  onChange,
}: {
  kind: StandaloneChipsetComponentKind;
  form: HardwareModuleForm;
  onChange: (
    key: Exclude<keyof HardwareModuleForm, "kind">,
    value: string,
  ) => void;
}) {
  const config = standaloneChipsetComponentConfig[kind];
  const allFields = hardwareDetailFields[kind];
  const primaryFields = config.primaryKeys.flatMap((key) => {
    const field = allFields.find((candidate) => candidate.key === key);
    return field ? [field] : [];
  });

  return (
    <FormSection title={config.title} description={config.description}>
      <fieldset>
        <legend className="text-sm font-semibold text-slate-950">
          {config.primaryLegend}
        </legend>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {primaryFields.map((field) => (
            <HardwareTechnicalFieldInput
              key={field.key}
              field={field}
              form={form}
              onChange={onChange}
            />
          ))}
        </div>
        {kind === "cpu" ? (
          <CpuClusterFields form={form} onChange={onChange} />
        ) : null}
      </fieldset>
    </FormSection>
  );
}

function ChipsetCompositionEditor({
  form,
  onChange,
  cpus,
  gpus,
  npus,
  modems,
}: {
  form: HardwareModuleForm;
  onChange: (
    key: Exclude<keyof HardwareModuleForm, "kind">,
    value: string,
  ) => void;
  cpus: Array<{
    id: string;
    name: string;
    microarchitecture?: string | null;
    core_count?: number | null;
    max_frequency_mhz?: number | null;
  }>;
  gpus: Array<{
    id: string;
    name: string;
    gpu_generation?: string | null;
    compute_units?: number | null;
    clock_mhz?: number | null;
  }>;
  npus: Array<{
    id: string;
    name: string;
    ai_engine_version?: string | null;
    tops?: number | string | null;
  }>;
  modems: Array<{
    id: string;
    name: string;
    supports_5g_nr?: boolean | null;
    lte_category?: string | null;
    max_downlink_mbps?: number | null;
  }>;
}) {
  return (
    <FormSection
      title="Liên kết thành phần SoC"
      description="CPU, GPU và NPU là ba liên kết dữ liệu bắt buộc. Ưu tiên chọn bản ghi hiện có; chỉ nhập thông tin để tạo component mới khi catalog chưa có bản phù hợp."
    >
      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {[
          ["01", "Liên kết hoặc tạo CPU"],
          ["02", "Liên kết hoặc tạo GPU"],
          ["03", "Liên kết hoặc tạo NPU"],
        ].map(([step, label]) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {step}
            </span>
            <span className="text-xs font-semibold text-blue-950">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <fieldset className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <legend className="px-2 text-sm font-semibold text-slate-950">
            CPU tích hợp
          </legend>
          <SearchableSelect
            label="Liên kết CPU hiện có"
            value={form.cpu_id}
            onChange={(value) => onChange("cpu_id", value)}
            options={cpus.map((cpu) => ({
              value: cpu.id,
              label: cpu.name,
              meta: [
                cpu.microarchitecture,
                cpu.core_count ? `${cpu.core_count} nhân` : null,
                cpu.max_frequency_mhz ? `${cpu.max_frequency_mhz} MHz` : null,
              ]
                .filter(Boolean)
                .join(" · "),
            }))}
            placeholder="Tìm CPU theo tên hoặc thông số..."
            emptyLabel="Chưa có CPU phù hợp. Nhập thông tin bên dưới để tạo mới."
            hint="Giá trị được lưu bằng ID và liên kết trực tiếp với bản ghi CPU trong catalog."
          />
          {form.cpu_id ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium leading-5 text-emerald-800">
              Đã liên kết với CPU “
              {cpus.find((cpu) => cpu.id === form.cpu_id)?.name ?? "đã chọn"}
              ”. Xóa lựa chọn nếu bạn cần tạo một CPU mới.
            </p>
          ) : (
            <>
              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Tạo CPU mới
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TextInput
                  className="md:col-span-2"
                  label="Tên CPU"
                  placeholder="Kryo CPU (Snapdragon 8 Gen 1)"
                  value={form.chipset_cpu_name}
                  onChange={(value) => onChange("chipset_cpu_name", value)}
                  required
                />
                <TextInput
                  label="Tập lệnh"
                  placeholder="ARMv9-A"
                  value={form.chipset_cpu_isa}
                  onChange={(value) => onChange("chipset_cpu_isa", value)}
                />
                <TextInput
                  label="Tổng số nhân"
                  type="number"
                  min="1"
                  placeholder="8"
                  value={form.chipset_cpu_core_count}
                  onChange={(value) =>
                    onChange("chipset_cpu_core_count", value)
                  }
                />
                <TextInput
                  className="md:col-span-2 xl:col-span-3"
                  label="Vi kiến trúc"
                  placeholder="Cortex-X2 / Cortex-A710 / Cortex-A510"
                  value={form.chipset_cpu_microarchitecture}
                  onChange={(value) =>
                    onChange("chipset_cpu_microarchitecture", value)
                  }
                />
                <TextInput
                  className="md:col-span-2 xl:col-span-1"
                  label="Xung tối đa (MHz)"
                  type="number"
                  min="0"
                  placeholder="3000"
                  value={form.chipset_cpu_max_frequency_mhz}
                  onChange={(value) =>
                    onChange("chipset_cpu_max_frequency_mhz", value)
                  }
                />
              </div>

              <CpuClusterFields form={form} onChange={onChange} />
            </>
          )}
        </fieldset>

        <div className="space-y-5">
          <fieldset className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <legend className="px-2 text-sm font-semibold text-slate-950">
              GPU tích hợp
            </legend>
            <SearchableSelect
              label="Liên kết GPU hiện có"
              value={form.gpu_id}
              onChange={(value) => onChange("gpu_id", value)}
              options={gpus.map((gpu) => ({
                value: gpu.id,
                label: gpu.name,
                meta: [
                  gpu.gpu_generation,
                  gpu.compute_units
                    ? `${gpu.compute_units} đơn vị tính toán`
                    : null,
                  gpu.clock_mhz ? `${gpu.clock_mhz} MHz` : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              placeholder="Tìm GPU theo tên hoặc thế hệ..."
              emptyLabel="Chưa có GPU phù hợp. Nhập thông tin bên dưới để tạo mới."
              hint="Giá trị được lưu bằng ID và liên kết trực tiếp với bản ghi GPU trong catalog."
            />
            {form.gpu_id ? (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium leading-5 text-emerald-800">
                Đã liên kết với GPU “
                {gpus.find((gpu) => gpu.id === form.gpu_id)?.name ?? "đã chọn"}
                ”. Xóa lựa chọn nếu bạn cần tạo một GPU mới.
              </p>
            ) : (
              <>
                <div
                  className="my-5 flex items-center gap-3"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Tạo GPU mới
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <TextInput
                    className="md:col-span-2"
                    label="Tên GPU"
                    placeholder="Adreno 730"
                    value={form.chipset_gpu_name}
                    onChange={(value) => onChange("chipset_gpu_name", value)}
                    required
                  />
                  <TextInput
                    label="Thế hệ"
                    placeholder="Adreno 7"
                    value={form.chipset_gpu_generation}
                    onChange={(value) =>
                      onChange("chipset_gpu_generation", value)
                    }
                  />
                  <TextInput
                    label="Xung (MHz)"
                    type="number"
                    min="0"
                    value={form.chipset_gpu_clock_mhz}
                    onChange={(value) =>
                      onChange("chipset_gpu_clock_mhz", value)
                    }
                  />
                  <TextInput
                    label="OpenGL"
                    value={form.chipset_gpu_opengl_version}
                    onChange={(value) =>
                      onChange("chipset_gpu_opengl_version", value)
                    }
                  />
                  <TextInput
                    label="OpenCL"
                    value={form.chipset_gpu_opencl_version}
                    onChange={(value) =>
                      onChange("chipset_gpu_opencl_version", value)
                    }
                  />
                  <TextInput
                    label="Vulkan"
                    value={form.chipset_gpu_vulkan_version}
                    onChange={(value) =>
                      onChange("chipset_gpu_vulkan_version", value)
                    }
                  />
                  <BooleanInput
                    label="Hỗ trợ dò tia"
                    value={form.chipset_gpu_ray_tracing}
                    onChange={(value) =>
                      onChange("chipset_gpu_ray_tracing", value)
                    }
                  />
                </div>
              </>
            )}
          </fieldset>

          <fieldset className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <legend className="px-2 text-sm font-semibold text-slate-950">
              NPU / AI engine
            </legend>
            <SearchableSelect
              label="Liên kết NPU hiện có"
              value={form.npu_id}
              onChange={(value) => onChange("npu_id", value)}
              options={npus.map((npu) => ({
                value: npu.id,
                label: npu.name,
                meta: [
                  npu.ai_engine_version,
                  npu.tops ? `${npu.tops} TOPS` : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              placeholder="Tìm NPU theo tên hoặc hiệu năng..."
              emptyLabel="Chưa có NPU phù hợp. Nhập thông tin bên dưới để tạo mới."
              hint="Giá trị được lưu bằng ID và liên kết trực tiếp với bản ghi NPU trong catalog."
            />
            {form.npu_id ? (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium leading-5 text-emerald-800">
                Đã liên kết với NPU “
                {npus.find((npu) => npu.id === form.npu_id)?.name ?? "đã chọn"}
                ”. Xóa lựa chọn nếu bạn cần tạo một NPU mới.
              </p>
            ) : (
              <>
                <div
                  className="my-5 flex items-center gap-3"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Tạo NPU mới
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <TextInput
                    className="md:col-span-2"
                    label="Tên NPU / AI engine"
                    placeholder="Hexagon AI Engine"
                    value={form.chipset_npu_name}
                    onChange={(value) => onChange("chipset_npu_name", value)}
                    required
                  />
                  <TextInput
                    label="Hiệu năng (TOPS)"
                    type="number"
                    min="0"
                    step="any"
                    value={form.chipset_npu_tops}
                    onChange={(value) => onChange("chipset_npu_tops", value)}
                  />
                  <TextInput
                    label="Thế hệ AI engine"
                    placeholder="7th Gen Qualcomm AI Engine"
                    value={form.chipset_npu_ai_engine_version}
                    onChange={(value) =>
                      onChange("chipset_npu_ai_engine_version", value)
                    }
                  />
                  <TextInput
                    className="xl:col-span-2"
                    label="DSP"
                    placeholder="Qualcomm Hexagon"
                    value={form.chipset_npu_dsp_name}
                    onChange={(value) =>
                      onChange("chipset_npu_dsp_name", value)
                    }
                  />
                  <TextInput
                    className="xl:col-span-2"
                    label="Tensor accelerator"
                    value={form.chipset_npu_tensor_accelerator}
                    onChange={(value) =>
                      onChange("chipset_npu_tensor_accelerator", value)
                    }
                  />
                  <BooleanInput
                    className="xl:col-span-2"
                    label="Hỗ trợ INT8"
                    value={form.chipset_npu_supports_int8}
                    onChange={(value) =>
                      onChange("chipset_npu_supports_int8", value)
                    }
                  />
                  <BooleanInput
                    className="xl:col-span-2"
                    label="Hỗ trợ FP16"
                    value={form.chipset_npu_supports_fp16}
                    onChange={(value) =>
                      onChange("chipset_npu_supports_fp16", value)
                    }
                  />
                </div>
              </>
            )}
          </fieldset>
        </div>

        <fieldset className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <legend className="px-2 text-sm font-semibold text-slate-950">
            Modem tích hợp (không bắt buộc)
          </legend>
          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect
              label="Modem chính"
              value={form.modem_id}
              onChange={(value) => {
                onChange("modem_id", value);
                onChange("modem_is_integrated", value ? "true" : "");
              }}
              options={modems.map((modem) => ({
                value: modem.id,
                label: modem.name,
                meta: [
                  modem.supports_5g_nr ? "5G NR" : null,
                  modem.lte_category,
                  modem.max_downlink_mbps
                    ? `${modem.max_downlink_mbps} Mbps tải xuống`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              placeholder="Tìm modem theo tên hoặc chuẩn mạng..."
              emptyLabel="Chưa có modem phù hợp. Có thể bổ sung sau."
            />
            {form.modem_id ? (
              <BooleanInput
                label="Modem nằm trong SoC"
                value={form.modem_is_integrated}
                onChange={(value) => onChange("modem_is_integrated", value)}
              />
            ) : null}
          </div>
        </fieldset>
      </div>
    </FormSection>
  );
}

function PerformanceResultsEditor({
  benchmarks,
  results,
  onChange,
}: {
  benchmarks: BenchmarkDefinition[];
  results: PerformanceResultForm[];
  onChange: (results: PerformanceResultForm[]) => void;
}) {
  function update(index: number, patch: Partial<PerformanceResultForm>) {
    onChange(
      results.map((result, currentIndex) =>
        currentIndex === index ? { ...result, ...patch } : result,
      ),
    );
  }

  return (
    <section className="app-connected">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
            <BarChart3 size={18} />
          </span>
          <div>
            <p className="font-semibold text-slate-950">Kết quả benchmark</p>
            <p className="text-xs text-slate-500">
              {
                results.filter(
                  (result) => result.benchmark_id && result.score !== "",
                ).length
              }{" "}
              phép đo đã hoàn tất
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange([...results, createEmptyPerformanceResult()])}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={15} />
          Thêm benchmark
        </button>
      </div>

      {!benchmarks.length ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm leading-6 text-amber-900 sm:px-6">
          Chưa có bộ phép đo chuẩn để chọn. Hãy nạp dữ liệu phép đo nền trước
          khi nhập điểm.
        </div>
      ) : null}

      {results.length ? (
        <div className="divide-y divide-slate-200">
          {results.map((result, index) => {
            const selectedBenchmark = benchmarks.find(
              (benchmark) => benchmark.id === result.benchmark_id,
            );
            const hasValue = Boolean(
              result.benchmark_id ||
                result.score ||
                result.subscore_name ||
                result.tested_at ||
                result.os_version ||
                result.app_version ||
                result.power_mode ||
                result.ambient_temp_c ||
                result.test_environment_note ||
                result.is_thermal_throttled,
            );

            return (
              <div
                key={`${index}-${result.benchmark_id}`}
                className="p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Phép đo {index + 1}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedBenchmark
                        ? `${benchmarkTypeLabel(selectedBenchmark.benchmark_type)} · ${
                            selectedBenchmark.higher_is_better === false
                              ? "điểm thấp hơn tốt hơn"
                              : "điểm cao hơn tốt hơn"
                          }`
                        : "Chưa chọn bộ phép đo"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        results.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
                    aria-label={`Xóa phép đo ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(150px,.55fr)_minmax(180px,.7fr)]">
                  <SelectInput
                    label="Bộ phép đo chuẩn"
                    value={result.benchmark_id}
                    onChange={(benchmark_id) => update(index, { benchmark_id })}
                    required={hasValue}
                  >
                    <option value="">Chọn phép đo</option>
                    {benchmarks.map((benchmark) => (
                      <option key={benchmark.id} value={benchmark.id}>
                        {benchmark.name}
                        {benchmark.version ? ` ${benchmark.version}` : ""}
                      </option>
                    ))}
                  </SelectInput>
                  <TextInput
                    label="Điểm số"
                    type="number"
                    step="0.0001"
                    placeholder="Ví dụ: 2847"
                    hint={
                      selectedBenchmark?.unit
                        ? `Đơn vị: ${
                            selectedBenchmark.unit.symbol ||
                            selectedBenchmark.unit.name
                          }`
                        : undefined
                    }
                    value={result.score}
                    onChange={(score) => update(index, { score })}
                    required={hasValue}
                  />
                  <TextInput
                    label="Hạng mục điểm"
                    placeholder="Ví dụ: điểm tổng, đơn nhân..."
                    value={result.subscore_name}
                    onChange={(subscore_name) =>
                      update(index, { subscore_name })
                    }
                  />
                </div>
                <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70">
                  <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-slate-600 after:float-right after:text-base after:text-slate-400 after:content-['+'] open:after:content-['−']">
                    Điều kiện đo
                  </summary>
                  <div className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-2 xl:grid-cols-4">
                    <TextInput
                      label="Ngày đo"
                      type="date"
                      value={result.tested_at}
                      onChange={(tested_at) => update(index, { tested_at })}
                    />
                    <TextInput
                      label="Hệ điều hành"
                      placeholder="Android 16 / iOS 19"
                      value={result.os_version}
                      onChange={(os_version) => update(index, { os_version })}
                    />
                    <TextInput
                      label="Phiên bản ứng dụng"
                      placeholder="10.2.1"
                      value={result.app_version}
                      onChange={(app_version) => update(index, { app_version })}
                    />
                    <TextInput
                      label="Chế độ nguồn"
                      placeholder="Cân bằng / hiệu năng"
                      value={result.power_mode}
                      onChange={(power_mode) => update(index, { power_mode })}
                    />
                    <TextInput
                      label="Nhiệt độ môi trường (°C)"
                      type="number"
                      step="0.1"
                      value={result.ambient_temp_c}
                      onChange={(ambient_temp_c) =>
                        update(index, { ambient_temp_c })
                      }
                    />
                    <CheckboxInput
                      label="Có giảm xung do nhiệt"
                      checked={result.is_thermal_throttled}
                      onChange={(is_thermal_throttled) =>
                        update(index, { is_thermal_throttled })
                      }
                    />
                    <TextAreaInput
                      className="sm:col-span-2 xl:col-span-4"
                      label="Ghi chú môi trường đo"
                      rows={2}
                      value={result.test_environment_note}
                      onChange={(test_environment_note) =>
                        update(index, { test_environment_note })
                      }
                    />
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="m-4 rounded-lg border border-dashed border-slate-300 bg-surface-soft px-4 py-6 text-center text-sm text-slate-500">
          Chưa có benchmark cho phiên bản này.
        </div>
      )}
    </section>
  );
}

function createEmptyPerformanceResult(): PerformanceResultForm {
  return {
    benchmark_id: "",
    score: "",
    subscore_name: "",
    tested_at: "",
    os_version: "",
    app_version: "",
    power_mode: "",
    ambient_temp_c: "",
    test_environment_note: "",
    is_thermal_throttled: false,
  };
}

function hardwareModuleNameExample(kind: AdminHardwareModuleKind) {
  const examples: Record<AdminHardwareModuleKind, string> = {
    chipset: "Qualcomm Snapdragon 8 Elite",
    cpu: "ARM Cortex-X925",
    gpu: "Qualcomm Adreno 830",
    npu: "Qualcomm Hexagon NPU",
    modem: "Snapdragon X80 5G",
    "memory-standard": "LPDDR5X",
    "storage-standard": "UFS 4.0",
    "operating-system": "Android 16",
  };
  return examples[kind];
}

function benchmarkTypeLabel(type: string) {
  const labels: Record<string, string> = {
    cpu: "CPU",
    gpu: "GPU",
    npu: "AI / NPU",
    battery: "Pin",
    display: "Màn hình",
    camera: "Máy ảnh",
    storage: "Bộ nhớ",
    overall: "Tổng hợp",
    system: "AnTuTu / tổng hợp",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

function createInitialHardwareModuleForm(): HardwareModuleForm {
  return {
    kind: "cpu",
    name: "",
    slug: "",
    organization_id: "",
    category: "",
    description: "",
    image_url: "",
    image_source_url: "",
    model_code: "",
    supports_64bit: "",
    integrated_5g: "",
    integrated_wifi: "",
    max_ram_gb: "",
    max_display_resolution: "",
    max_camera_mp: "",
    announcement_date: "",
    release_date: "",
    cpu_id: "",
    gpu_id: "",
    npu_id: "",
    modem_id: "",
    modem_is_integrated: "",
    chipset_cpu_name: "",
    chipset_cpu_isa: "",
    chipset_cpu_microarchitecture: "",
    chipset_cpu_core_count: "",
    chipset_cpu_max_frequency_mhz: "",
    chipset_cpu_cluster_1_name: "Prime",
    chipset_cpu_cluster_1_architecture: "",
    chipset_cpu_cluster_1_core_count: "",
    chipset_cpu_cluster_1_clock_ghz: "",
    chipset_cpu_cluster_2_name: "Performance",
    chipset_cpu_cluster_2_architecture: "",
    chipset_cpu_cluster_2_core_count: "",
    chipset_cpu_cluster_2_clock_ghz: "",
    chipset_cpu_cluster_3_name: "Efficiency",
    chipset_cpu_cluster_3_architecture: "",
    chipset_cpu_cluster_3_core_count: "",
    chipset_cpu_cluster_3_clock_ghz: "",
    chipset_gpu_name: "",
    chipset_gpu_generation: "",
    chipset_gpu_clock_mhz: "",
    chipset_gpu_api_support: "",
    chipset_gpu_opengl_version: "",
    chipset_gpu_opencl_version: "",
    chipset_gpu_vulkan_version: "",
    chipset_gpu_ray_tracing: "",
    chipset_npu_name: "",
    chipset_npu_tops: "",
    chipset_npu_ai_engine_version: "",
    chipset_npu_dsp_name: "",
    chipset_npu_tensor_accelerator: "",
    chipset_npu_supports_int8: "",
    chipset_npu_supports_fp16: "",
    chipset_npu_quantization: "",
    core_count: "",
    thread_count: "",
    big_little: "",
    isa_name: "",
    microarchitecture: "",
    core_type: "",
    max_frequency_mhz: "",
    min_frequency_mhz: "",
    l1_instruction_cache: "",
    l1_data_cache: "",
    l2_cache: "",
    l3_cache: "",
    simd_extension: "",
    virtualization: "",
    out_of_order: "",
    smt: "",
    shader_units: "",
    compute_units: "",
    clock_mhz: "",
    fp32_gflops: "",
    ray_tracing_support: "",
    api_support: "",
    gpu_generation: "",
    opengl_version: "",
    opencl_version: "",
    vulkan_version: "",
    directx_feature_level: "",
    metal_support: "",
    cuda_support: "",
    video_decode_codecs: "",
    video_encode_codecs: "",
    tops: "",
    tops_int8: "",
    tops_int4: "",
    tops_fp16: "",
    dedicated_npu: "",
    dsp_name: "",
    ai_engine_version: "",
    tensor_accelerator: "",
    supports_int8: "",
    supports_fp16: "",
    supports_fp32: "",
    quantization: "",
    max_downlink_mbps: "",
    max_uplink_mbps: "",
    supports_mmwave: "",
    supports_satellite: "",
    supported_5g_modes: "",
    lte_category: "",
    supports_5g_nr: "",
    carrier_aggregation: "",
    volte: "",
    vonr: "",
    dual_sim_capability: "",
    supported_technologies: "",
    generation: "",
    max_data_rate_mtps: "",
    typical_data_rate_mtps: "",
    jedec_standard: "",
    prefetch: "",
    ecc: "",
    dual_channel: "",
    voltage: "",
    bandwidth_gbps: "",
    channel_width_bits: "",
    maximum_capacity_gb: "",
    is_mobile: "",
    release_year: "",
    interface: "",
    half_duplex: "",
    full_duplex: "",
    command_queue: "",
    boot_partition: "",
    rpmb: "",
    trim: "",
    secure_erase: "",
    hs200: "",
    hs400: "",
    kernel_type: "",
    kernel_name: "",
    license_name: "",
    is_open_source: "",
    initial_release_date: "",
    os_type: "",
    supported_architectures: "",
  };
}

function buildHardwareModulePayload(
  form: HardwareModuleForm,
  chipsetBenchmarkResults: PerformanceResultForm[] = [],
): CreateHardwareModuleInput {
  const cpuClusters = ([1, 2, 3] as const).flatMap((cluster) => {
    const name = form[`chipset_cpu_cluster_${cluster}_name`];
    const architecture = form[`chipset_cpu_cluster_${cluster}_architecture`];
    const coreCount = optionalInteger(
      form[`chipset_cpu_cluster_${cluster}_core_count`],
    );
    if (!architecture.trim() || !coreCount) return [];
    return [
      {
        cluster_name: optionalText(name),
        core_microarchitecture: architecture.trim(),
        core_count: coreCount,
        clock_ghz: optionalNumber(
          form[`chipset_cpu_cluster_${cluster}_clock_ghz`],
        ),
        cluster_order: cluster,
      },
    ];
  });
  const totalClusterCores = cpuClusters.reduce(
    (total, cluster) => total + cluster.core_count,
    0,
  );
  const chipsetGpuApiSupport = gpuApiSummary(
    form.chipset_gpu_opengl_version,
    form.chipset_gpu_opencl_version,
    form.chipset_gpu_vulkan_version,
  );
  const standaloneGpuApiSupport = gpuApiSummary(
    form.opengl_version,
    form.opencl_version,
    form.vulkan_version,
  );
  const chipsetNpuPrecision = npuPrecisionSummary(
    form.chipset_npu_supports_int8,
    form.chipset_npu_supports_fp16,
  );
  const standaloneNpuPrecision = npuPrecisionSummary(
    form.supports_int8,
    form.supports_fp16,
  );
  return {
    kind: form.kind,
    name: form.name,
    slug: form.slug,
    image_url: form.image_url.trim() || null,
    image_source_url: form.image_source_url.trim() || null,
    organization_id: optionalText(form.organization_id),
    category: optionalText(form.category),
    description: form.description.trim(),
    model_code: optionalText(form.model_code),
    supports_64bit: optionalBoolean(form.supports_64bit),
    integrated_5g: optionalBoolean(form.integrated_5g),
    integrated_wifi: optionalBoolean(form.integrated_wifi),
    max_ram_gb: optionalInteger(form.max_ram_gb),
    max_display_resolution: optionalText(form.max_display_resolution),
    max_camera_mp: optionalInteger(form.max_camera_mp),
    announcement_date: optionalText(form.announcement_date),
    release_date: optionalText(form.release_date),
    cpu_id: form.kind === "chipset" ? form.cpu_id || null : undefined,
    gpu_id: form.kind === "chipset" ? form.gpu_id || null : undefined,
    npu_id: form.kind === "chipset" ? form.npu_id || null : undefined,
    modem_id: form.kind === "chipset" ? form.modem_id || null : undefined,
    modem_is_integrated:
      form.kind === "chipset" && form.modem_id
        ? (optionalBoolean(form.modem_is_integrated) ?? true)
        : undefined,
    cpu:
      form.kind === "chipset" && !form.cpu_id && form.chipset_cpu_name.trim()
        ? {
            name: form.chipset_cpu_name.trim(),
            slug: slugify(
              `${form.chipset_cpu_name.trim()} ${form.name.trim()}`,
            ),
            core_count:
              optionalInteger(form.chipset_cpu_core_count) ||
              totalClusterCores ||
              undefined,
            isa_name: optionalText(form.chipset_cpu_isa),
            microarchitecture: optionalText(form.chipset_cpu_microarchitecture),
            max_frequency_mhz: optionalInteger(
              form.chipset_cpu_max_frequency_mhz,
            ),
            supports_64bit: true,
            clusters: cpuClusters.length ? cpuClusters : undefined,
          }
        : undefined,
    gpu:
      form.kind === "chipset" && !form.gpu_id && form.chipset_gpu_name.trim()
        ? {
            name: form.chipset_gpu_name.trim(),
            slug: slugify(
              `${form.chipset_gpu_name.trim()} ${form.name.trim()}`,
            ),
            gpu_generation: optionalText(form.chipset_gpu_generation),
            clock_mhz: optionalInteger(form.chipset_gpu_clock_mhz),
            api_support:
              chipsetGpuApiSupport ||
              optionalText(form.chipset_gpu_api_support),
            opengl_version: optionalText(form.chipset_gpu_opengl_version),
            opencl_version: optionalText(form.chipset_gpu_opencl_version),
            vulkan_version: optionalText(form.chipset_gpu_vulkan_version),
            ray_tracing_support: optionalBoolean(form.chipset_gpu_ray_tracing),
          }
        : undefined,
    npu:
      form.kind === "chipset" && !form.npu_id && form.chipset_npu_name.trim()
        ? {
            name: form.chipset_npu_name.trim(),
            slug: slugify(
              `${form.chipset_npu_name.trim()} ${form.name.trim()}`,
            ),
            dedicated_npu: true,
            tops: optionalNumber(form.chipset_npu_tops),
            ai_engine_version: optionalText(form.chipset_npu_ai_engine_version),
            dsp_name: optionalText(form.chipset_npu_dsp_name),
            tensor_accelerator: optionalText(
              form.chipset_npu_tensor_accelerator,
            ),
            supports_int8: optionalBoolean(form.chipset_npu_supports_int8),
            supports_fp16: optionalBoolean(form.chipset_npu_supports_fp16),
            quantization:
              chipsetNpuPrecision ||
              optionalText(form.chipset_npu_quantization),
          }
        : undefined,
    benchmark_results:
      form.kind === "chipset"
        ? chipsetBenchmarkResults
            .filter((result) => result.benchmark_id && result.score !== "")
            .map((result) => ({
              benchmark_id: result.benchmark_id,
              score: Number(result.score),
              subscore_name: optionalText(result.subscore_name),
              tested_at: optionalText(result.tested_at),
              os_version: optionalText(result.os_version),
              app_version: optionalText(result.app_version),
              power_mode: optionalText(result.power_mode),
              ambient_temp_c: optionalNumber(result.ambient_temp_c),
              test_environment_note: optionalText(result.test_environment_note),
              is_thermal_throttled: result.is_thermal_throttled,
            }))
        : undefined,
    clusters:
      form.kind === "cpu" ? (cpuClusters.length ? cpuClusters : []) : undefined,
    core_count:
      form.kind === "cpu"
        ? optionalInteger(form.core_count) || totalClusterCores || undefined
        : optionalInteger(form.core_count),
    thread_count: optionalInteger(form.thread_count),
    big_little:
      form.kind === "cpu"
        ? (optionalBoolean(form.big_little) ?? cpuClusters.length > 1)
        : optionalBoolean(form.big_little),
    isa_name: optionalText(form.isa_name),
    microarchitecture: optionalText(form.microarchitecture),
    core_type: optionalText(form.core_type),
    max_frequency_mhz: optionalInteger(form.max_frequency_mhz),
    min_frequency_mhz: optionalInteger(form.min_frequency_mhz),
    l1_instruction_cache: optionalText(form.l1_instruction_cache),
    l1_data_cache: optionalText(form.l1_data_cache),
    l2_cache: optionalText(form.l2_cache),
    l3_cache: optionalText(form.l3_cache),
    simd_extension: optionalText(form.simd_extension),
    virtualization: optionalBoolean(form.virtualization),
    out_of_order: optionalBoolean(form.out_of_order),
    smt: optionalBoolean(form.smt),
    shader_units: optionalInteger(form.shader_units),
    compute_units: optionalInteger(form.compute_units),
    clock_mhz: optionalInteger(form.clock_mhz),
    fp32_gflops: optionalNumber(form.fp32_gflops),
    ray_tracing_support: optionalBoolean(form.ray_tracing_support),
    api_support: standaloneGpuApiSupport || optionalText(form.api_support),
    gpu_generation: optionalText(form.gpu_generation),
    opengl_version: optionalText(form.opengl_version),
    opencl_version: optionalText(form.opencl_version),
    vulkan_version: optionalText(form.vulkan_version),
    directx_feature_level: optionalText(form.directx_feature_level),
    metal_support: optionalBoolean(form.metal_support),
    cuda_support: optionalBoolean(form.cuda_support),
    video_decode_codecs: optionalText(form.video_decode_codecs),
    video_encode_codecs: optionalText(form.video_encode_codecs),
    tops: optionalNumber(form.tops),
    tops_int8: optionalNumber(form.tops_int8),
    tops_int4: optionalNumber(form.tops_int4),
    tops_fp16: optionalNumber(form.tops_fp16),
    dedicated_npu: optionalBoolean(form.dedicated_npu),
    dsp_name: optionalText(form.dsp_name),
    ai_engine_version: optionalText(form.ai_engine_version),
    tensor_accelerator: optionalText(form.tensor_accelerator),
    supports_int8: optionalBoolean(form.supports_int8),
    supports_fp16: optionalBoolean(form.supports_fp16),
    supports_fp32: optionalBoolean(form.supports_fp32),
    quantization: standaloneNpuPrecision || optionalText(form.quantization),
    max_downlink_mbps: optionalInteger(form.max_downlink_mbps),
    max_uplink_mbps: optionalInteger(form.max_uplink_mbps),
    supports_mmwave: optionalBoolean(form.supports_mmwave),
    supports_satellite: optionalBoolean(form.supports_satellite),
    supported_5g_modes: optionalText(form.supported_5g_modes),
    lte_category: optionalText(form.lte_category),
    supports_5g_nr: optionalBoolean(form.supports_5g_nr),
    carrier_aggregation: optionalBoolean(form.carrier_aggregation),
    volte: optionalBoolean(form.volte),
    vonr: optionalBoolean(form.vonr),
    dual_sim_capability: optionalText(form.dual_sim_capability),
    supported_technologies: optionalText(form.supported_technologies),
    generation: optionalText(form.generation),
    max_data_rate_mtps: optionalInteger(form.max_data_rate_mtps),
    typical_data_rate_mtps: optionalInteger(form.typical_data_rate_mtps),
    jedec_standard: optionalText(form.jedec_standard),
    prefetch: optionalText(form.prefetch),
    ecc: optionalBoolean(form.ecc),
    dual_channel: optionalBoolean(form.dual_channel),
    voltage: optionalNumber(form.voltage),
    bandwidth_gbps: optionalNumber(form.bandwidth_gbps),
    channel_width_bits: optionalInteger(form.channel_width_bits),
    maximum_capacity_gb: optionalInteger(form.maximum_capacity_gb),
    is_mobile: optionalBoolean(form.is_mobile),
    release_year: optionalInteger(form.release_year),
    interface: optionalText(form.interface),
    half_duplex: optionalBoolean(form.half_duplex),
    full_duplex: optionalBoolean(form.full_duplex),
    command_queue: optionalBoolean(form.command_queue),
    boot_partition: optionalBoolean(form.boot_partition),
    rpmb: optionalBoolean(form.rpmb),
    trim: optionalBoolean(form.trim),
    secure_erase: optionalBoolean(form.secure_erase),
    hs200: optionalBoolean(form.hs200),
    hs400: optionalBoolean(form.hs400),
    kernel_type: optionalText(form.kernel_type),
    kernel_name: optionalText(form.kernel_name),
    license_name: optionalText(form.license_name),
    is_open_source: optionalBoolean(form.is_open_source),
    initial_release_date: optionalText(form.initial_release_date),
    os_type: optionalText(form.os_type),
    supported_architectures: optionalText(form.supported_architectures),
  };
}

function hardwareModuleFormFromRecord(
  kind: AdminHardwareModuleKind,
  module: AdminHardwareModuleRecord,
): HardwareModuleForm {
  const form: HardwareModuleForm = {
    ...createInitialHardwareModuleForm(),
    kind,
    name: module.name,
    slug: module.slug,
    description: module.description ?? "",
    image_url: module.image_url ?? "",
    image_source_url: module.image_source_url ?? "",
    organization_id:
      module.manufacturer_org_id ??
      module.organization_id ??
      module.vendor_org_id ??
      module.manufacturer?.id ??
      module.organization?.id ??
      module.vendor?.id ??
      "",
    category: hardwareModuleCategory(module),
  };
  const record = module as unknown as Record<string, unknown>;

  if (kind === "chipset") {
    const cpuLink =
      module.chipset_cpu_links?.find((link) => link.is_primary) ??
      module.chipset_cpu_links?.[0];
    const gpuLink =
      module.chipset_gpu_links?.find((link) => link.is_primary) ??
      module.chipset_gpu_links?.[0];
    const npuLink =
      module.chipset_npu_links?.find((link) => link.is_primary) ??
      module.chipset_npu_links?.[0];
    const modemLink =
      module.chipset_modem_links?.find((link) => link.is_primary) ??
      module.chipset_modem_links?.[0];

    form.cpu_id = cpuLink?.cpu.id ?? "";
    form.gpu_id = gpuLink?.gpu.id ?? "";
    form.npu_id = npuLink?.npu.id ?? "";
    form.modem_id = modemLink?.modem.id ?? "";
    form.modem_is_integrated = modemLink ? String(modemLink.is_integrated) : "";
  }

  if (kind === "cpu") {
    (module.cpu_clusters ?? []).slice(0, 3).forEach((cluster, index) => {
      const clusterNumber = (
        cluster.cluster_order &&
        cluster.cluster_order >= 1 &&
        cluster.cluster_order <= 3
          ? cluster.cluster_order
          : index + 1
      ) as 1 | 2 | 3;
      const prefix = `chipset_cpu_cluster_${clusterNumber}` as const;
      form[`${prefix}_name`] = cluster.cluster_name ?? "";
      form[`${prefix}_architecture`] = cluster.core_microarchitecture ?? "";
      form[`${prefix}_core_count`] = String(cluster.core_count);
      form[`${prefix}_clock_ghz`] =
        cluster.clock_ghz == null ? "" : String(cluster.clock_ghz);
    });
  }

  for (const field of hardwareDetailFields[kind]) {
    const value = record[field.key];
    if (value === undefined || value === null) continue;
    form[field.key] =
      field.type === "date"
        ? dateInputValue(String(value))
        : typeof value === "boolean"
          ? String(value)
          : String(value);
  }
  return form;
}

function chipsetBenchmarkFormsFromRecord(
  module: AdminHardwareModuleRecord,
): PerformanceResultForm[] {
  const results = module.chipset_benchmarks ?? [];
  if (!results.length) return [createEmptyPerformanceResult()];
  return results.map((result) => ({
    benchmark_id: result.benchmark.id,
    score: String(result.score),
    subscore_name: result.subscore_name ?? "",
    tested_at: dateInputValue(result.tested_at),
    os_version: result.benchmark_run?.os_version ?? "",
    app_version: result.benchmark_run?.app_version ?? "",
    power_mode: result.benchmark_run?.power_mode ?? "",
    ambient_temp_c:
      result.benchmark_run?.ambient_temp_c == null
        ? ""
        : String(result.benchmark_run.ambient_temp_c),
    test_environment_note: result.benchmark_run?.test_environment_note ?? "",
    is_thermal_throttled: Boolean(result.benchmark_run?.is_thermal_throttled),
  }));
}

function hardwareModuleFormFromQuickDraft(draft: {
  payload: Record<string, unknown>;
}): HardwareModuleForm | null {
  const payload = draft.payload;
  const quickModule = payload.hardware_module;
  if (!quickModule || typeof quickModule !== "object") return null;
  const source = quickModule as Record<string, unknown>;
  const kind = source.kind;
  if (!hardwareModuleOptions.some((option) => option.value === kind)) {
    return null;
  }
  const form = {
    ...createInitialHardwareModuleForm(),
    kind: kind as AdminHardwareModuleKind,
  };
  for (const key of Object.keys(form) as Array<keyof HardwareModuleForm>) {
    if (key === "kind") continue;
    const value = source[key];
    if (value !== undefined && value !== null) form[key] = String(value);
  }
  return form;
}

function quickDraftOrganizationName(draft: {
  payload: Record<string, unknown>;
}) {
  const quickModule = draft.payload.hardware_module;
  if (!quickModule || typeof quickModule !== "object") return "";
  const name = (quickModule as Record<string, unknown>).organization_name;
  return typeof name === "string" ? name : "";
}

function hardwareModuleCategory(module: AdminHardwareModuleRecord) {
  return (
    module.chip_kind ??
    module.memory_type ??
    module.storage_type ??
    module.os_family ??
    ""
  );
}

function hardwareModuleMediaTable(
  kind: AdminHardwareModuleKind,
):
  | "chipsets"
  | "cpus"
  | "gpus"
  | "npus"
  | "modems"
  | "memory_standards"
  | "storage_standards"
  | "operating_systems" {
  const tables: Record<
    AdminHardwareModuleKind,
    | "chipsets"
    | "cpus"
    | "gpus"
    | "npus"
    | "modems"
    | "memory_standards"
    | "storage_standards"
    | "operating_systems"
  > = {
    chipset: "chipsets",
    cpu: "cpus",
    gpu: "gpus",
    npu: "npus",
    modem: "modems",
    "memory-standard": "memory_standards",
    "storage-standard": "storage_standards",
    "operating-system": "operating_systems",
  };
  return tables[kind];
}

function hardwareModuleOrganizationName(module: AdminHardwareModuleRecord) {
  return (
    module.manufacturer?.name ??
    module.organization?.name ??
    module.vendor?.name ??
    null
  );
}

function hardwareModuleUsageCount(module: AdminHardwareModuleRecord) {
  return Object.values(module._count ?? {}).reduce(
    (total, count) => total + count,
    0,
  );
}
