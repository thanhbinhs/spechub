"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  ExternalLink,
  Flag,
  FileText,
  Globe2,
  Gauge,
  Layers3,
  ListChecks,
  Link2,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type {
  AdminHardwareModuleKind,
  CreateDeviceModelInput,
  CreateDeviceVariantInput,
  CreateHardwareModuleInput,
  DataSource,
  DeviceModelSummary,
  DeviceVariantDetail,
} from "@spechub/api-client";
import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

type AdminTab =
  | "overview"
  | "device-management"
  | "users"
  | "catalog"
  | "hardware"
  | "affiliates"
  | "subscriptions"
  | "moderation";

type CatalogWorkspace = "foundations" | "model" | "variant" | "records";
type CatalogManagementSection = "model" | "variants";

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
  description: string;
};

type EditableDeviceModel = DeviceModelForm & { id: string };

type PerformanceResultForm = {
  benchmark_id: string;
  score: string;
  subscore_name: string;
  tested_at: string;
  app_version: string;
  power_mode: string;
  ambient_temp_c: string;
  test_environment_note: string;
  is_thermal_throttled: boolean;
};

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
  { id: "affiliates", label: "Đối tác", icon: Link2 },
  { id: "moderation", label: "Kiểm duyệt", icon: Flag },
];

const adminOnlyTabs: Array<{
  id: "users" | "subscriptions" | "hardware";
  label: string;
  icon: typeof Users;
}> = [
  { id: "users", label: "Người dùng", icon: Users },
  { id: "hardware", label: "Phần cứng", icon: Cpu },
  { id: "subscriptions", label: "Gói đăng ký", icon: BadgeCheck },
];

const roles = ["reader", "contributor", "editor", "moderator", "admin"];

const hardwareModuleOptions: Array<{
  value: AdminHardwareModuleKind;
  label: string;
  categoryLabel?: string;
  categoryPlaceholder?: string;
  categoryRequired?: boolean;
  organizationRequired?: boolean;
}> = [
  {
    value: "chipset",
    label: "Chipset",
    categoryLabel: "Loại chipset",
    categoryPlaceholder: "soc",
    categoryRequired: true,
    organizationRequired: true,
  },
  { value: "cpu", label: "CPU" },
  { value: "gpu", label: "GPU" },
  { value: "npu", label: "NPU" },
  { value: "modem", label: "Modem" },
  {
    value: "memory-standard",
    label: "Chuẩn bộ nhớ",
    categoryLabel: "Loại bộ nhớ",
    categoryPlaceholder: "LPDDR",
  },
  {
    value: "storage-standard",
    label: "Chuẩn bộ nhớ trong",
    categoryLabel: "Loại bộ nhớ trong",
    categoryPlaceholder: "UFS",
  },
  {
    value: "wireless-standard",
    label: "Chuẩn không dây",
    categoryLabel: "Loại kết nối không dây",
    categoryPlaceholder: "wifi",
    categoryRequired: true,
  },
  {
    value: "port-standard",
    label: "Chuẩn cổng kết nối",
    categoryLabel: "Loại cổng",
    categoryPlaceholder: "usb-c",
    categoryRequired: true,
  },
  {
    value: "operating-system",
    label: "Hệ điều hành",
    categoryLabel: "Họ hệ điều hành",
    categoryPlaceholder: "android",
    categoryRequired: true,
  },
  {
    value: "sensor",
    label: "Cảm biến phần cứng",
    categoryLabel: "Loại cảm biến",
    categoryPlaceholder: "accelerometer",
    categoryRequired: true,
  },
];

type HardwareModuleForm = {
  kind: AdminHardwareModuleKind;
  name: string;
  slug: string;
  organization_id: string;
  category: string;
  description: string;
  model_code: string;
  supports_64bit: string;
  integrated_5g: string;
  integrated_wifi: string;
  max_ram_gb: string;
  max_display_resolution: string;
  max_camera_mp: string;
  announcement_date: string;
  release_date: string;
  core_count: string;
  thread_count: string;
  big_little: string;
  isa_name: string;
  shader_units: string;
  compute_units: string;
  clock_mhz: string;
  fp32_gflops: string;
  ray_tracing_support: string;
  api_support: string;
  tops: string;
  tops_int4: string;
  tops_fp16: string;
  max_downlink_mbps: string;
  max_uplink_mbps: string;
  supports_mmwave: string;
  supports_satellite: string;
  supported_5g_modes: string;
  generation: string;
  max_data_rate_mtps: string;
  typical_data_rate_mtps: string;
  voltage: string;
  bandwidth_gbps: string;
  channel_width_bits: string;
  is_mobile: string;
  release_year: string;
  sequential_read_mbps: string;
  sequential_write_mbps: string;
  random_read_iops: string;
  random_write_iops: string;
  max_speed_mbps: string;
  data_speed_gbps: string;
  power_delivery_w: string;
  alt_modes: string;
  kernel_type: string;
  is_open_source: string;
};

type HardwareDetailKey = Exclude<
  keyof HardwareModuleForm,
  "kind" | "name" | "slug" | "organization_id" | "category" | "description"
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
    { key: "core_count", label: "Số nhân", type: "number", min: 0 },
    { key: "thread_count", label: "Số luồng", type: "number", min: 0 },
    { key: "big_little", label: "Thiết kế Big.LITTLE", type: "boolean" },
    { key: "isa_name", label: "Tập lệnh" },
  ],
  gpu: [
    { key: "shader_units", label: "Số đơn vị đổ bóng", type: "number", min: 0 },
    {
      key: "compute_units",
      label: "Số đơn vị tính toán",
      type: "number",
      min: 0,
    },
    { key: "clock_mhz", label: "Xung nhịp (MHz)", type: "number", min: 0 },
    {
      key: "fp32_gflops",
      label: "FP32 (GFLOPS)",
      type: "number",
      min: 0,
      step: "any",
    },
    { key: "ray_tracing_support", label: "Hỗ trợ dò tia", type: "boolean" },
    {
      key: "api_support",
      label: "API được hỗ trợ",
      placeholder: "Vulkan, OpenGL ES",
    },
  ],
  npu: [
    { key: "tops", label: "TOPS", type: "number", min: 0, step: "any" },
    {
      key: "tops_int4",
      label: "TOPS (INT4)",
      type: "number",
      min: 0,
      step: "any",
    },
    {
      key: "tops_fp16",
      label: "TOPS (FP16)",
      type: "number",
      min: 0,
      step: "any",
    },
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
    { key: "supports_mmwave", label: "Hỗ trợ mmWave", type: "boolean" },
    { key: "supports_satellite", label: "Hỗ trợ vệ tinh", type: "boolean" },
    {
      key: "supported_5g_modes",
      label: "Chế độ 5G được hỗ trợ",
      placeholder: "SA, NSA",
    },
  ],
  "memory-standard": [
    { key: "generation", label: "Thế hệ" },
    {
      key: "max_data_rate_mtps",
      label: "Tốc độ dữ liệu tối đa (MT/s)",
      type: "number",
      min: 0,
    },
    {
      key: "typical_data_rate_mtps",
      label: "Tốc độ dữ liệu thông thường (MT/s)",
      type: "number",
      min: 0,
    },
    {
      key: "voltage",
      label: "Điện áp (V)",
      type: "number",
      min: 0,
      step: "any",
    },
    {
      key: "bandwidth_gbps",
      label: "Băng thông (GB/s)",
      type: "number",
      min: 0,
      step: "any",
    },
    {
      key: "channel_width_bits",
      label: "Độ rộng kênh (bit)",
      type: "number",
      min: 0,
    },
    { key: "is_mobile", label: "Bộ nhớ di động", type: "boolean" },
    { key: "release_year", label: "Năm ra mắt", type: "number", min: 1800 },
  ],
  "storage-standard": [
    { key: "generation", label: "Thế hệ" },
    {
      key: "sequential_read_mbps",
      label: "Đọc tuần tự (MB/s)",
      type: "number",
      min: 0,
    },
    {
      key: "sequential_write_mbps",
      label: "Ghi tuần tự (MB/s)",
      type: "number",
      min: 0,
    },
    {
      key: "random_read_iops",
      label: "Đọc ngẫu nhiên (IOPS)",
      type: "number",
      min: 0,
    },
    {
      key: "random_write_iops",
      label: "Ghi ngẫu nhiên (IOPS)",
      type: "number",
      min: 0,
    },
    { key: "release_year", label: "Năm ra mắt", type: "number", min: 1800 },
  ],
  "wireless-standard": [
    {
      key: "max_speed_mbps",
      label: "Tốc độ tối đa (Mbps)",
      type: "number",
      min: 0,
    },
  ],
  "port-standard": [
    {
      key: "data_speed_gbps",
      label: "Tốc độ dữ liệu (Gbps)",
      type: "number",
      min: 0,
      step: "any",
    },
    {
      key: "power_delivery_w",
      label: "Cấp nguồn (W)",
      type: "number",
      min: 0,
    },
    {
      key: "alt_modes",
      label: "Chế độ thay thế",
      placeholder: "DisplayPort Alt Mode",
    },
  ],
  "operating-system": [
    { key: "kernel_type", label: "Loại nhân hệ điều hành" },
    { key: "is_open_source", label: "Mã nguồn mở", type: "boolean" },
  ],
  sensor: [],
};

export function AdminConsole() {
  const { user, tokens, isLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const accessToken = tokens?.access_token;
  const isAdmin = user?.role === "admin";
  const canOperate = isAdmin || user?.role === "editor";

  if (isLoading) return <LoadingPanel label="Đang tải không gian quản trị" />;

  if (!canOperate || !accessToken) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Cần quyền quản trị"
          description="Không gian này dành cho vai trò biên tập viên và quản trị viên."
        />
      </div>
    );
  }

  const tabs = isAdmin ? [...editorTabs, ...adminOnlyTabs] : editorTabs;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Vận hành"
        title="Không gian quản trị"
        description="Tạo thiết bị và mô-đun phần cứng, quản lý quyền tài khoản, đối tác bán lẻ, gói dịch vụ và dữ liệu nguồn nhập vào."
      />

      <nav
        className="sticky top-16 z-20 -mx-4 flex gap-1 overflow-x-auto border-y border-slate-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-2"
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
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
                active
                  ? "bg-slate-950 text-white shadow-sm"
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
        />
      ) : null}
      {tab === "catalog" ? (
        <CatalogPanel
          key="catalog-create"
          accessToken={accessToken}
          initialWorkspace="foundations"
        />
      ) : null}
      {tab === "hardware" && isAdmin ? (
        <HardwareModulesPanel accessToken={accessToken} />
      ) : null}
      {tab === "affiliates" ? (
        <AffiliatesPanel accessToken={accessToken} />
      ) : null}
      {tab === "subscriptions" && isAdmin ? (
        <SubscriptionsPanel accessToken={accessToken} />
      ) : null}
      {tab === "moderation" ? (
        <ModerationPanel accessToken={accessToken} />
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
  const models = useQuery({
    queryKey: ["admin", "models", "summary"],
    queryFn: () => api.listDeviceModels({ page: 1, pageSize: 1 }),
  });
  const partners = useQuery({
    queryKey: ["admin", "affiliate-partners"],
    queryFn: () => api.listAffiliatePartners().then((result) => result.data),
  });
  const reviewQueue = useQuery({
    queryKey: ["admin", "review-queue", "summary"],
    queryFn: () => api.listReviewQueue({ page: 1, pageSize: 1 }, accessToken),
  });
  const users = useQuery({
    queryKey: ["admin", "users", "summary"],
    queryFn: () => api.listUsers({ page: 1, pageSize: 1 }, accessToken),
    enabled: isAdmin,
  });

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Mẫu thiết bị"
        value={models.data?.meta.total ?? "-"}
        icon={<Database size={18} />}
      />
      <Metric
        label="Đối tác bán lẻ"
        value={partners.data?.length ?? "-"}
        icon={<Link2 size={18} />}
      />
      <Metric
        label="Hàng đợi duyệt"
        value={reviewQueue.data?.meta.total ?? "-"}
        icon={<Flag size={18} />}
      />
      {isAdmin ? (
        <Metric
          label="Người dùng đang hoạt động"
          value={users.data?.meta.total ?? "-"}
          icon={<Users size={18} />}
        />
      ) : null}
      <div className="sm:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50/60 p-5">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Thêm dữ liệu danh mục
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {isAdmin
              ? "Tạo mẫu thiết bị và phiên bản của nó, hoặc đăng ký mô-đun phần cứng có thể dùng lại trước khi gắn vào thông số."
              : "Tạo mẫu thiết bị và phiên bản của nó trước khi thêm thông số hoặc liên kết bán lẻ."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectTab("device-management")}
            className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Quản lý thiết bị
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("catalog")}
            className="h-10 rounded-md border border-rose-200 bg-white px-4 text-sm font-medium text-rose-800 transition hover:border-rose-400"
          >
            Tạo thiết bị
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onSelectTab("hardware")}
              className="h-10 rounded-md border border-rose-200 bg-white px-4 text-sm font-medium text-rose-800 transition hover:border-rose-400"
            >
              Tạo mô-đun phần cứng
            </button>
          ) : null}
        </div>
      </div>
      <div className="sm:col-span-2 xl:col-span-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Sparkles size={17} />
          Lưu ý vận hành
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Giữ dữ liệu chưa công bố trong hàng đợi kiểm duyệt cho đến khi người
          duyệt xác nhận các trường đã trích xuất. Danh mục, giá từ đối tác và
          quyền gói đăng ký đều được bảo vệ bằng kiểm tra vai trò ở API.
        </p>
      </div>
    </section>
  );
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
                  <select
                    aria-label={`Vai trò của ${item.email}`}
                    value={item.role}
                    onChange={(event) =>
                      updateRole.mutate({
                        id: item.id,
                        role: event.target.value,
                      })
                    }
                    disabled={updateRole.isPending}
                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm capitalize text-slate-800"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
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
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    parent_category_id: "",
    description: "",
    icon_url: "",
    display_order: "0",
    is_active: true,
  });
  const [familyForm, setFamilyForm] = useState({
    brand_org_id: "",
    device_category_id: "",
    name: "",
    slug: "",
    description: "",
    cover_image_url: "",
    first_release_year: "",
    last_release_year: "",
    is_active: true,
  });
  const organizations = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => api.listOrganizations({ page: 1, pageSize: 100 }),
  });
  const categories = useQuery({
    queryKey: ["admin", "device-categories"],
    queryFn: () => api.listDeviceCategories({ page: 1, pageSize: 100 }),
  });
  const createOrganization = useMutation({
    mutationFn: () =>
      api.createOrganization(
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
          description: optionalText(organizationForm.description),
          is_active: organizationForm.is_active,
        },
        accessToken,
      ),
    onSuccess: () => {
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
  const createFamily = useMutation({
    mutationFn: () =>
      api.createProductFamily(
        {
          brand_org_id: familyForm.brand_org_id,
          device_category_id: familyForm.device_category_id,
          name: familyForm.name,
          slug: familyForm.slug,
          description: optionalText(familyForm.description),
          cover_image_url: optionalText(familyForm.cover_image_url),
          first_release_year: optionalInteger(familyForm.first_release_year),
          last_release_year: optionalInteger(familyForm.last_release_year),
          is_active: familyForm.is_active,
        },
        accessToken,
      ),
    onSuccess: (result) => {
      onFamilyCreated(result.data.id, result.data.name);
      setFamilyForm({
        brand_org_id: "",
        device_category_id: "",
        name: "",
        slug: "",
        description: "",
        cover_image_url: "",
        first_release_year: "",
        last_release_year: "",
        is_active: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "product-families"],
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
            <TextInput
              label="URL logo"
              type="url"
              value={organizationForm.logo_url}
              onChange={(logo_url) =>
                setOrganizationForm((current) => ({ ...current, logo_url }))
              }
            />
          </div>
          <TextAreaInput
            label="Mô tả"
            value={organizationForm.description}
            onChange={(description) =>
              setOrganizationForm((current) => ({ ...current, description }))
            }
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
                !organizationForm.slug
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
            <SelectInput
              label="Danh mục cha"
              value={categoryForm.parent_category_id}
              onChange={(parent_category_id) =>
                setCategoryForm((current) => ({
                  ...current,
                  parent_category_id,
                }))
              }
            >
              <option value="">Không có (danh mục cấp cao nhất)</option>
              {categories.data?.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectInput>
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
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createFamily.mutate();
          }}
        >
          <PanelError
            error={
              createFamily.error ?? organizations.error ?? categories.error
            }
          />
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
            <SelectInput
              label="Danh mục thiết bị"
              value={familyForm.device_category_id}
              onChange={(device_category_id) =>
                setFamilyForm((current) => ({ ...current, device_category_id }))
              }
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.data?.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectInput>
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
                setFamilyForm((current) => ({ ...current, first_release_year }))
              }
            />
            <TextInput
              label="Năm ra mắt gần nhất"
              type="number"
              min="1800"
              max="2200"
              value={familyForm.last_release_year}
              onChange={(last_release_year) =>
                setFamilyForm((current) => ({ ...current, last_release_year }))
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
            label="Mô tả"
            value={familyForm.description}
            onChange={(description) =>
              setFamilyForm((current) => ({ ...current, description }))
            }
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
                createFamily.isPending ||
                !familyForm.brand_org_id ||
                !familyForm.device_category_id ||
                !familyForm.name ||
                !familyForm.slug
              }
              pending={createFamily.isPending}
            >
              Tạo dòng sản phẩm
            </PrimaryButton>
          </div>
        </form>
      ) : null}
    </Panel>
  );
}

function CatalogPanel({
  accessToken,
  initialWorkspace = "foundations",
  showWorkflow = true,
}: {
  accessToken: string;
  initialWorkspace?: CatalogWorkspace;
  showWorkflow?: boolean;
}) {
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] =
    useState<CatalogWorkspace>(initialWorkspace);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recordSearch, setRecordSearch] = useState("");
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
  const [editingVariantForm, setEditingVariantForm] =
    useState<DeviceVariantForm | null>(null);
  const [variantToRemove, setVariantToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [modelForm, setModelForm] = useState<DeviceModelForm>(() =>
    createInitialDeviceModelForm(),
  );
  const [variantForm, setVariantForm] = useState(createInitialVariantForm);
  const models = useQuery({
    queryKey: ["admin", "models"],
    queryFn: () => api.listDeviceModels({ page: 1, pageSize: 100 }),
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

  useEffect(() => {
    if (!editingVariantDetail.data) return;
    setEditingVariantForm(variantFormFromDetail(editingVariantDetail.data));
  }, [editingVariantDetail.data]);
  const createModel = useMutation({
    mutationFn: () =>
      api.createDeviceModel(buildDeviceModelPayload(modelForm), accessToken),
    onSuccess: (result) => {
      const createdModel = result.data;
      setModelForm(createInitialDeviceModelForm());
      setVariantForm((current) => ({
        ...current,
        device_model_id: createdModel.id,
      }));
      setSuccessMessage(
        `Đã tạo ${createdModel.name}. Tiếp tục thêm phiên bản thương mại và thông số.`,
      );
      setWorkspace("variant");
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    },
  });
  const createVariant = useMutation({
    mutationFn: () =>
      api.createDeviceVariant(buildVariantPayload(variantForm), accessToken),
    onSuccess: (result) => {
      const createdVariant = result.data;
      setVariantForm(createInitialVariantForm());
      setSuccessMessage(
        `Đã tạo phiên bản ${createdVariant.variant_name}. Bản ghi đã sẵn sàng để kiểm tra.`,
      );
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
    },
  });
  const deleteModel = useMutation({
    mutationFn: (id: string) => api.deleteDeviceModel(id, accessToken),
    onSuccess: () => {
      setModelToRemove(null);
      setSelectedRecordModelId(null);
      setEditingModel(null);
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

  const normalizedRecordSearch = recordSearch.trim().toLocaleLowerCase("vi");
  const filteredModels = (models.data?.data ?? []).filter((model) => {
    if (!normalizedRecordSearch) return true;
    return [
      model.name,
      model.slug,
      model.product_family?.name,
      model.product_family?.brand_org?.name,
    ]
      .filter(Boolean)
      .some((value) =>
        value?.toLocaleLowerCase("vi").includes(normalizedRecordSearch),
      );
  });
  const selectedRecordModel = models.data?.data.find(
    (model) => model.id === selectedRecordModelId,
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
      current ? { ...current, [key]: value } : current,
    );
  const openManagedModel = (model: DeviceModelSummary) => {
    setSelectedRecordModelId(model.id);
    setEditingModel(deviceModelFormFromSummary(model));
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
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          <BadgeCheck className="mt-0.5 shrink-0" size={18} />
          <span className="leading-6">{successMessage}</span>
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
            <FormSection
              title="Nhận diện cơ bản"
              description="Bốn trường có dấu * là dữ liệu tối thiểu để mẫu máy xuất hiện đúng trong danh mục."
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
                <SelectInput
                  label="Dòng sản phẩm"
                  value={modelForm.product_family_id}
                  onChange={(product_family_id) =>
                    setModelForm((current) => ({
                      ...current,
                      product_family_id,
                    }))
                  }
                  required
                >
                  <option value="">Chọn dòng sản phẩm</option>
                  {families.data?.data.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </SelectInput>
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
                      {status.name}
                    </option>
                  ))}
                </SelectInput>
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
              </div>
            </FormSection>

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
                    setModelForm((current) => ({ ...current, release_date }))
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
              description="Ảnh và mô tả giúp người dùng nhận diện mẫu máy trong trang danh mục và kết quả tìm kiếm."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TextInput
                  label="URL ảnh bìa"
                  type="url"
                  hint="Ưu tiên ảnh sản phẩm nền sáng, tỷ lệ vuông và nguồn ổn định."
                  value={modelForm.cover_image_url}
                  onChange={(cover_image_url) =>
                    setModelForm((current) => ({ ...current, cover_image_url }))
                  }
                />
                <TextAreaInput
                  label="Mô tả mẫu máy"
                  rows={3}
                  value={modelForm.description}
                  onChange={(description) =>
                    setModelForm((current) => ({ ...current, description }))
                  }
                />
              </div>
            </FormSection>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">* Trường bắt buộc</p>
              <PrimaryButton
                disabled={
                  createModel.isPending ||
                  !modelForm.name ||
                  !modelForm.slug ||
                  !modelForm.product_family_id ||
                  !modelForm.release_status_id
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
          title="Bước 3 · Tạo phiên bản và thông số"
          description="Nhập thông tin thương mại trước; các nhóm thông số chi tiết có thể mở khi cần và để trống nếu chưa xác minh."
        >
          <PanelError
            error={
              createVariant.error ??
              models.error ??
              releaseStatuses.error ??
              currencies.error ??
              benchmarks.error
            }
          />
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              createVariant.mutate();
            }}
          >
            <FormSection
              title="Thông tin thương mại"
              description="Nhập mẫu máy, tên phiên bản và trạng thái trước. SKU, màu, giá và ngày bán có thể bổ sung theo từng thị trường."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SelectInput
                  label="Mẫu thiết bị"
                  value={variantForm.device_model_id}
                  onChange={(device_model_id) =>
                    setVariantForm((current) => ({
                      ...current,
                      device_model_id,
                    }))
                  }
                  required
                >
                  <option value="">Chọn thiết bị</option>
                  {models.data?.data.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  label="Tên phiên bản"
                  placeholder="256GB / Black / Global"
                  value={variantForm.variant_name}
                  onChange={(variant_name) =>
                    setVariantForm((current) => ({ ...current, variant_name }))
                  }
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
                      {status.name}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  label="SKU / số hiệu mẫu"
                  value={variantForm.sku_code}
                  onChange={(sku_code) =>
                    setVariantForm((current) => ({ ...current, sku_code }))
                  }
                />
                <TextInput
                  label="Tên thị trường"
                  value={variantForm.market_name}
                  onChange={(market_name) =>
                    setVariantForm((current) => ({ ...current, market_name }))
                  }
                />
                <TextInput
                  label="Tên màu"
                  value={variantForm.color_name}
                  onChange={(color_name) =>
                    setVariantForm((current) => ({ ...current, color_name }))
                  }
                />
                <TextInput
                  label="Mã màu hex"
                  placeholder="#AAA09B"
                  value={variantForm.color_hex}
                  onChange={(color_hex) =>
                    setVariantForm((current) => ({ ...current, color_hex }))
                  }
                />
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
                    setVariantForm((current) => ({ ...current, launch_price }))
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
                  label="Ghi chú phiên bản"
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

            <div>
              <p className="text-sm font-semibold text-slate-950">
                Thông số chi tiết
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Mở từng nhóm khi có dữ liệu đã kiểm chứng. Các trường chưa rõ có
                thể để trống.
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
                    setVariantForm((current) => ({ ...current, thickness_mm }))
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
                    setVariantForm((current) => ({ ...current, volume_cm3 }))
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
                    setVariantForm((current) => ({ ...current, back_material }))
                  }
                />
                <TextInput
                  label="Kính mặt trước"
                  value={variantForm.front_glass}
                  onChange={(front_glass) =>
                    setVariantForm((current) => ({ ...current, front_glass }))
                  }
                />
              </div>
              <TextAreaInput
                className="mt-3"
                label="Ghi chú ngoại hình"
                value={variantForm.physical_notes}
                onChange={(physical_notes) =>
                  setVariantForm((current) => ({ ...current, physical_notes }))
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
                    setVariantForm((current) => ({ ...current, esim_count }))
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
                    setVariantForm((current) => ({ ...current, speaker_count }))
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
                    setVariantForm((current) => ({ ...current, cooling_type }))
                  }
                />
                <TextInput
                  label="Diện tích buồng hơi (mm²)"
                  type="number"
                  min="0"
                  value={variantForm.vc_area_mm2}
                  onChange={(vc_area_mm2) =>
                    setVariantForm((current) => ({ ...current, vc_area_mm2 }))
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
                  setVariantForm((current) => ({ ...current, thermal_notes }))
                }
              />
            </details>
            <PerformanceResultsEditor
              benchmarks={benchmarks.data ?? []}
              results={variantForm.performance_results}
              onChange={(performance_results) =>
                setVariantForm((current) => ({
                  ...current,
                  performance_results,
                }))
              }
            />
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setWorkspace("model")}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Quay lại mẫu thiết bị
              </button>
              <PrimaryButton
                disabled={
                  createVariant.isPending ||
                  !variantForm.device_model_id ||
                  !variantForm.variant_name ||
                  !variantForm.release_status_id
                }
                pending={createVariant.isPending}
                pendingLabel="Đang tạo phiên bản…"
              >
                Tạo phiên bản và hoàn tất
              </PrimaryButton>
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
              managedVariants.error ??
              editingVariantDetail.error ??
              updateModel.error ??
              deleteModel.error ??
              updateVariant.error ??
              deleteVariant.error
            }
          />
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <label
              className="relative block min-w-0 flex-1"
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
                onChange={(event) => setRecordSearch(event.target.value)}
                placeholder="Tìm theo tên, slug, hãng hoặc dòng sản phẩm..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="button"
              onClick={() => setWorkspace("model")}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Smartphone size={17} />
              Tạo mẫu thiết bị mới
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between px-1 pb-2 text-xs text-slate-500">
                <span>{filteredModels.length} mẫu thiết bị</span>
                {models.data?.meta.hasNext ? <span>100 mục đầu</span> : null}
              </div>
              <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
                {filteredModels.map((model) => {
                  const isSelected = selectedRecordModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => openManagedModel(model)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? "border-blue-300 bg-blue-50 shadow-sm ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isSelected ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}
                        >
                          {model.release_status?.name ?? "Chưa có trạng thái"}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {model._count?.device_variants ?? 0} phiên bản
                        </span>
                      </div>
                      <p className="mt-2 font-semibold leading-5 text-slate-950">
                        {model.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {model.product_family?.brand_org?.name ??
                          "Chưa có hãng"}
                        {model.product_family?.name
                          ? ` · ${model.product_family.name}`
                          : ""}
                      </p>
                      <p className="mt-2 truncate font-mono text-[11px] text-slate-400">
                        /{model.slug}
                      </p>
                    </button>
                  );
                })}
                {!filteredModels.length && !models.isLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <Search className="mx-auto text-slate-300" size={28} />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Không tìm thấy thiết bị phù hợp.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

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
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Bạn có thể sửa thông tin mẫu, xem các phiên bản đã lưu,
                      cập nhật thông số hoặc gỡ mềm bản ghi.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="border-b border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Thiết bị đã lưu
                        </p>
                        <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                          {selectedRecordModel.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
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
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        Xem trang công khai
                        <ExternalLink size={15} />
                      </a>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:w-fit sm:min-w-80">
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
                          <SelectInput
                            label="Dòng sản phẩm"
                            value={editingModel.product_family_id}
                            onChange={(value) =>
                              updateEditingModelField(
                                "product_family_id",
                                value,
                              )
                            }
                            required
                          >
                            <option value="">Chọn dòng sản phẩm</option>
                            {families.data?.data.map((family) => (
                              <option key={family.id} value={family.id}>
                                {family.brand_org?.name ?? "Hãng"} ·{" "}
                                {family.name}
                              </option>
                            ))}
                          </SelectInput>
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
                                {status.name}
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
                          label="Mô tả"
                          value={editingModel.description}
                          onChange={(value) =>
                            updateEditingModelField("description", value)
                          }
                          rows={5}
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

                      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
                        <PrimaryButton
                          disabled={
                            updateModel.isPending ||
                            !editingModel.name.trim() ||
                            !editingModel.slug.trim() ||
                            !editingModel.product_family_id ||
                            !editingModel.release_status_id
                          }
                          pending={updateModel.isPending}
                          pendingLabel="Đang lưu…"
                        >
                          Lưu thông tin mẫu
                        </PrimaryButton>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 sm:p-5">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-950">
                            Phiên bản thương mại
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Quản lý SKU, giá, kích thước, kết nối và tản nhiệt.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVariantForm({
                              ...createInitialVariantForm(),
                              device_model_id: selectedRecordModel.id,
                            });
                            setWorkspace("variant");
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
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
                            className="space-y-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5"
                            onSubmit={(event) => {
                              event.preventDefault();
                              updateVariant.mutate();
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-950">
                                  Chỉnh sửa phiên bản
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {editingVariantForm.variant_name}
                                </p>
                              </div>
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

                            <FormSection title="Thông tin phiên bản">
                              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <TextInput
                                  label="Tên phiên bản"
                                  value={editingVariantForm.variant_name}
                                  onChange={(value) =>
                                    updateEditingVariantField(
                                      "variant_name",
                                      value,
                                    )
                                  }
                                  required
                                />
                                <TextInput
                                  label="SKU / mã máy"
                                  value={editingVariantForm.sku_code}
                                  onChange={(value) =>
                                    updateEditingVariantField("sku_code", value)
                                  }
                                />
                                <TextInput
                                  label="Tên thị trường"
                                  value={editingVariantForm.market_name}
                                  onChange={(value) =>
                                    updateEditingVariantField(
                                      "market_name",
                                      value,
                                    )
                                  }
                                />
                                <TextInput
                                  label="Tên màu"
                                  value={editingVariantForm.color_name}
                                  onChange={(value) =>
                                    updateEditingVariantField(
                                      "color_name",
                                      value,
                                    )
                                  }
                                />
                                <TextInput
                                  label="Mã màu"
                                  type="color"
                                  value={
                                    editingVariantForm.color_hex || "#64748b"
                                  }
                                  onChange={(value) =>
                                    updateEditingVariantField(
                                      "color_hex",
                                      value,
                                    )
                                  }
                                />
                                <SelectInput
                                  label="Trạng thái"
                                  value={editingVariantForm.release_status_id}
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
                                    <option key={status.id} value={status.id}>
                                      {status.name}
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
                                  value={editingVariantForm.end_of_sale_date}
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
                                  value={editingVariantForm.ingress_protection}
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
                                    updateEditingVariantField("sim_type", value)
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
                                  value={editingVariantForm.has_microsd_slot}
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
                                  value={editingVariantForm.has_active_cooling}
                                  onChange={(value) =>
                                    updateEditingVariantField(
                                      "has_active_cooling",
                                      value,
                                    )
                                  }
                                />
                              </div>
                            </details>

                            <div className="flex flex-col-reverse gap-3 border-t border-blue-200 pt-4 sm:flex-row sm:justify-end">
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
                                  !editingVariantForm.variant_name.trim() ||
                                  !editingVariantForm.release_status_id
                                }
                                pending={updateVariant.isPending}
                                pendingLabel="Đang lưu…"
                              >
                                Lưu phiên bản
                              </PrimaryButton>
                            </div>
                          </form>
                        )
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {managedVariants.data?.data.map((variant) => (
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
                                  {variant.release_status?.name ?? "-"}
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
                              <div className="mt-4 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVariantToRemove(null);
                                    setEditingVariantForm(null);
                                    setEditingVariantId(variant.id);
                                  }}
                                  className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                                >
                                  Chỉnh sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVariantToRemove({
                                      id: variant.id,
                                      name: variant.variant_name,
                                    })
                                  }
                                  className="h-9 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                                >
                                  Gỡ
                                </button>
                              </div>
                            </article>
                          ))}
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

function HardwareModulesPanel({ accessToken }: { accessToken: string }) {
  const [form, setForm] = useState<HardwareModuleForm>(
    createInitialHardwareModuleForm,
  );
  const [createdModuleName, setCreatedModuleName] = useState<string | null>(
    null,
  );
  const organizations = useQuery({
    queryKey: ["admin", "hardware-organizations"],
    queryFn: () => api.listOrganizations({ page: 1, pageSize: 100 }),
  });
  const selectedOption =
    hardwareModuleOptions.find((option) => option.value === form.kind) ??
    hardwareModuleOptions[0];
  const updateField = (
    key: Exclude<keyof HardwareModuleForm, "kind">,
    value: string,
  ) => setForm((current) => ({ ...current, [key]: value }));
  const createModule = useMutation({
    mutationFn: () =>
      api.createHardwareModule(buildHardwareModulePayload(form), accessToken),
    onSuccess: (module) => {
      setCreatedModuleName(module.name);
      setForm((current) => ({
        ...createInitialHardwareModuleForm(),
        kind: current.kind,
      }));
    },
  });
  const canSubmit =
    Boolean(form.name.trim()) &&
    Boolean(form.slug.trim()) &&
    (!selectedOption.organizationRequired || Boolean(form.organization_id)) &&
    (!selectedOption.categoryRequired || Boolean(form.category.trim()));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Panel
        title="Tạo mô-đun phần cứng"
        description="Biểu mẫu thay đổi theo loại mô-đun để mỗi bản ghi phần cứng có đủ thông số phù hợp ngay từ đầu."
      >
        <PanelError error={createModule.error ?? organizations.error} />
        {createdModuleName ? (
          <p
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800"
            role="status"
          >
            Đã tạo {createdModuleName} và hiện có thể dùng trong các thông số
            phần cứng.
          </p>
        ) : null}
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setCreatedModuleName(null);
            createModule.mutate();
          }}
        >
          <FormSection
            title="Nhận diện mô-đun"
            description="Loại mô-đun quyết định các trường thông số sẽ xuất hiện ở phần tiếp theo."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectInput
                label="Loại mô-đun"
                value={form.kind}
                onChange={(kind) =>
                  setForm({
                    ...createInitialHardwareModuleForm(),
                    kind: kind as AdminHardwareModuleKind,
                  })
                }
              >
                {hardwareModuleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label={
                  selectedOption.organizationRequired
                    ? "Nhà sản xuất hoặc tổ chức"
                    : "Nhà sản xuất hoặc tổ chức (không bắt buộc)"
                }
                value={form.organization_id}
                onChange={(organization_id) =>
                  updateField("organization_id", organization_id)
                }
                required={selectedOption.organizationRequired}
              >
                <option value="">Chọn tổ chức</option>
                {organizations.data?.data.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </SelectInput>
              <TextInput
                label="Tên"
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
                placeholder="snapdragon-8-elite"
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
            </div>
          </FormSection>

          {hardwareDetailFields[form.kind].length ? (
            <FormSection
              title={`Thông số ${selectedOption.label}`}
              description="Chỉ nhập dữ liệu đã được xác minh; trường chưa rõ có thể để trống."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {hardwareDetailFields[form.kind].map((field) =>
                  field.type === "boolean" ? (
                    <BooleanInput
                      key={field.key}
                      label={field.label}
                      value={form[field.key]}
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ) : (
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
                  ),
                )}
              </div>
            </FormSection>
          ) : null}

          <FormSection title="Ghi chú sử dụng">
            <TextAreaInput
              label="Mô tả"
              rows={3}
              value={form.description}
              onChange={(description) =>
                updateField("description", description)
              }
            />
          </FormSection>
          <div className="flex justify-end border-t border-slate-200 pt-5">
            <PrimaryButton
              disabled={createModule.isPending || !canSubmit}
              pending={createModule.isPending}
              pendingLabel="Đang tạo mô-đun…"
            >
              Tạo mô-đun chi tiết
            </PrimaryButton>
          </div>
        </form>
      </Panel>

      <aside className="xl:sticky xl:top-32 xl:self-start">
        <Panel
          title="Các mô-đun được hỗ trợ"
          description="Chọn đúng loại để biểu mẫu chỉ hiển thị các trường có liên quan."
        >
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {hardwareModuleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setForm({
                    ...createInitialHardwareModuleForm(),
                    kind: option.value,
                  })
                }
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  form.kind === option.value
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                }`}
              >
                <span className="block font-medium text-slate-900">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {option.organizationRequired
                    ? "Cần nhà sản xuất. "
                    : "Nhà sản xuất không bắt buộc. "}
                  {option.categoryLabel
                    ? `${option.categoryLabel}${option.categoryRequired ? " là bắt buộc." : " có thể thêm."}`
                    : "Có bộ thông số riêng theo loại."}
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function AffiliatesPanel({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    base_url: "",
    commission_rate: "0",
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
        { ...form, commission_rate: Number(form.commission_rate) },
        accessToken,
      ),
    onSuccess: () => {
      setForm({ name: "", slug: "", base_url: "", commission_rate: "0" });
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
              label="Hoa hồng (%)"
              type="number"
              min="0"
              value={form.commission_rate}
              onChange={(commission_rate) =>
                setForm((current) => ({ ...current, commission_rate }))
              }
              required
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
          description="Gắn ưu đãi của đối tác vào một phiên bản trong danh mục và khu vực cụ thể."
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
              Tạo liên kết mua hàng
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
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{partner.name}</p>
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
            error={links.error ?? updateLink.error ?? syncPrices.error}
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
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {link.device_variant?.device_model?.name ?? "Thiết bị"} -{" "}
                    {link.device_variant?.variant_name ?? "Phiên bản"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {link.partner?.name ?? "Đối tác"} · {link.region_code} ·{" "}
                    {link.current_price ?? "-"} {link.currency_code}
                  </p>
                </div>
                <div className="flex gap-2">
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(560px,1.2fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              Quy trình kiểm duyệt
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Từ nguồn dữ liệu đến quyết định rõ ràng
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Quản lý nguồn ở một nơi, xử lý hàng đợi ở một nơi và luôn đối
              chiếu nội dung gốc trước khi duyệt.
            </p>
          </div>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["01", "Khai báo nguồn"],
              ["02", "Thu thập"],
              ["03", "Đối chiếu"],
              ["04", "Ra quyết định"],
            ].map(([step, label]) => (
              <li
                key={step}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <span className="text-xs font-semibold text-blue-300">
                  {step}
                </span>
                <p className="mt-1 text-sm font-medium text-white">{label}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

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
        <p className="px-2 pb-1 text-xs leading-5 text-slate-500 sm:pb-0">
          Duyệt xác nhận dữ liệu thu thập; không tự ghi đè thông số thiết bị.
        </p>
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
          <p className="text-xs font-semibold text-blue-700">
            QUY TRÌNH DANH MỤC
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Tạo thiết bị theo từng bước
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Hoàn thành phần cần thiết, sau đó chuyển bước. Dữ liệu đang nhập
            được giữ nguyên khi đổi mục.
          </p>
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
              className={`group flex min-h-24 items-start gap-3 rounded-xl border p-3 text-left transition sm:p-4 ${
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
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {step.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-sm font-medium">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6">{children}</div>
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
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-slate-950">
        {title}
      </legend>
      {description ? (
        <p className="mb-4 text-sm leading-6 text-slate-500">{description}</p>
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

function EmptyRow({ label }: { label: string }) {
  return <p className="py-5 text-sm text-slate-500">{label}</p>;
}

function TextInput({
  label,
  onChange,
  hint,
  required,
  ...props
}: {
  label: string;
  hint?: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      <input
        {...props}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
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
  ...props
}: {
  label: string;
  hint?: string;
  onChange: (value: string) => void;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      <select
        {...props}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
      {hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
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
        className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
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
    <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500"
      />
      {label}
    </label>
  );
}

function BooleanInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SelectInput label={label} value={value} onChange={onChange}>
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
      className="inline-flex h-11 items-center justify-center rounded-lg bg-rose-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-800 disabled:opacity-50"
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

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalInteger(value: string) {
  const parsed = optionalNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}

function optionalBoolean(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function withValues<T extends Record<string, unknown>>(value: T) {
  return Object.values(value).some((item) => item !== undefined)
    ? value
    : undefined;
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
    description: optionalText(form.description),
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
    description: model.description ?? "",
  };
}

function variantFormFromDetail(
  variant: DeviceVariantDetail,
): DeviceVariantForm {
  const physical = variant.variant_physical_specs;
  const io = variant.variant_io_specs;
  const thermal = variant.variant_thermal_specs;

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
    performance_results: (variant.device_variant_benchmarks ?? []).map(
      (result) => ({
        benchmark_id: result.benchmark.id,
        score: String(result.score),
        subscore_name: result.subscore_name ?? "",
        tested_at: dateInputValue(result.tested_at),
        app_version: result.benchmark_run?.app_version ?? "",
        power_mode: result.benchmark_run?.power_mode ?? "",
        ambient_temp_c:
          result.benchmark_run?.ambient_temp_c == null
            ? ""
            : String(result.benchmark_run.ambient_temp_c),
        test_environment_note:
          result.benchmark_run?.test_environment_note ?? "",
        is_thermal_throttled: Boolean(
          result.benchmark_run?.is_thermal_throttled,
        ),
      }),
    ),
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
    performance_results: [] as PerformanceResultForm[],
  };
}

type DeviceVariantForm = ReturnType<typeof createInitialVariantForm>;

function buildVariantPayload(
  form: DeviceVariantForm,
): CreateDeviceVariantInput {
  return {
    device_model_id: form.device_model_id,
    variant_name: form.variant_name,
    release_status_id: Number(form.release_status_id),
    sku_code: optionalText(form.sku_code),
    market_name: optionalText(form.market_name),
    color_name: optionalText(form.color_name),
    color_hex: optionalText(form.color_hex),
    launch_date: optionalText(form.launch_date),
    end_of_sale_date: optionalText(form.end_of_sale_date),
    launch_price: optionalNumber(form.launch_price),
    currency_id: optionalInteger(form.currency_id),
    is_default: form.is_default,
    notes: optionalText(form.notes),
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
    performance_results: form.performance_results
      .filter((result) => result.benchmark_id && result.score !== "")
      .map((result) => ({
        benchmark_id: result.benchmark_id,
        score: Number(result.score),
        subscore_name: optionalText(result.subscore_name),
        tested_at: optionalText(result.tested_at),
        app_version: optionalText(result.app_version),
        power_mode: optionalText(result.power_mode),
        ambient_temp_c: optionalNumber(result.ambient_temp_c),
        test_environment_note: optionalText(result.test_environment_note),
        is_thermal_throttled: result.is_thermal_throttled,
      })),
  };
}

function PerformanceResultsEditor({
  benchmarks,
  results,
  onChange,
}: {
  benchmarks: Array<{
    id: string;
    name: string;
    version?: string | null;
    benchmark_type: string;
    unit?: { symbol: string } | null;
  }>;
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
    <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Gauge size={17} className="text-violet-700" />
            Hiệu năng thực tế
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Nhập kết quả benchmark cùng điều kiện đo. SpecHub chỉ tạo điểm và
            thứ hạng giữa các thiết bị có phép đo tương thích.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...results, createEmptyPerformanceResult()])}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-800 transition hover:border-violet-400"
        >
          <Plus size={15} />
          Thêm phép đo
        </button>
      </div>

      {results.length ? (
        <div className="mt-4 space-y-3">
          {results.map((result, index) => (
            <div
              key={`${index}-${result.benchmark_id}`}
              className="rounded-lg border border-violet-100 bg-white p-4"
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SelectInput
                  label="Bộ benchmark"
                  value={result.benchmark_id}
                  onChange={(benchmark_id) => update(index, { benchmark_id })}
                  required
                >
                  <option value="">Chọn benchmark</option>
                  {benchmarks.map((benchmark) => (
                    <option key={benchmark.id} value={benchmark.id}>
                      {benchmark.name}
                      {benchmark.version ? ` ${benchmark.version}` : ""}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  label="Điểm đo"
                  type="number"
                  step="0.0001"
                  value={result.score}
                  onChange={(score) => update(index, { score })}
                  required
                />
                <TextInput
                  label="Hạng mục / subscore"
                  placeholder="overall, GPU, single-core..."
                  value={result.subscore_name}
                  onChange={(subscore_name) => update(index, { subscore_name })}
                />
                <TextInput
                  label="Ngày đo"
                  type="date"
                  value={result.tested_at}
                  onChange={(tested_at) => update(index, { tested_at })}
                />
                <TextInput
                  label="Phiên bản ứng dụng"
                  placeholder="10.2.1"
                  value={result.app_version}
                  onChange={(app_version) => update(index, { app_version })}
                />
                <TextInput
                  label="Chế độ nguồn"
                  placeholder="balanced / performance"
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
                  label="Có ghi nhận thermal throttling"
                  checked={result.is_thermal_throttled}
                  onChange={(is_thermal_throttled) =>
                    update(index, { is_thermal_throttled })
                  }
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <TextAreaInput
                  label="Mô tả giao thức và môi trường đo"
                  rows={2}
                  value={result.test_environment_note}
                  onChange={(test_environment_note) =>
                    update(index, { test_environment_note })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      results.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Xóa phép đo
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-violet-200 bg-white/70 px-4 py-5 text-sm text-slate-500">
          Chưa có phép đo. Có thể lưu thiết bị trước và bổ sung khi đã có nguồn
          benchmark đáng tin cậy.
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
    app_version: "",
    power_mode: "",
    ambient_temp_c: "",
    test_environment_note: "",
    is_thermal_throttled: false,
  };
}

function createInitialHardwareModuleForm(): HardwareModuleForm {
  return {
    kind: "cpu",
    name: "",
    slug: "",
    organization_id: "",
    category: "",
    description: "",
    model_code: "",
    supports_64bit: "",
    integrated_5g: "",
    integrated_wifi: "",
    max_ram_gb: "",
    max_display_resolution: "",
    max_camera_mp: "",
    announcement_date: "",
    release_date: "",
    core_count: "",
    thread_count: "",
    big_little: "",
    isa_name: "",
    shader_units: "",
    compute_units: "",
    clock_mhz: "",
    fp32_gflops: "",
    ray_tracing_support: "",
    api_support: "",
    tops: "",
    tops_int4: "",
    tops_fp16: "",
    max_downlink_mbps: "",
    max_uplink_mbps: "",
    supports_mmwave: "",
    supports_satellite: "",
    supported_5g_modes: "",
    generation: "",
    max_data_rate_mtps: "",
    typical_data_rate_mtps: "",
    voltage: "",
    bandwidth_gbps: "",
    channel_width_bits: "",
    is_mobile: "",
    release_year: "",
    sequential_read_mbps: "",
    sequential_write_mbps: "",
    random_read_iops: "",
    random_write_iops: "",
    max_speed_mbps: "",
    data_speed_gbps: "",
    power_delivery_w: "",
    alt_modes: "",
    kernel_type: "",
    is_open_source: "",
  };
}

function buildHardwareModulePayload(
  form: HardwareModuleForm,
): CreateHardwareModuleInput {
  return {
    kind: form.kind,
    name: form.name,
    slug: form.slug,
    organization_id: optionalText(form.organization_id),
    category: optionalText(form.category),
    description: optionalText(form.description),
    model_code: optionalText(form.model_code),
    supports_64bit: optionalBoolean(form.supports_64bit),
    integrated_5g: optionalBoolean(form.integrated_5g),
    integrated_wifi: optionalBoolean(form.integrated_wifi),
    max_ram_gb: optionalInteger(form.max_ram_gb),
    max_display_resolution: optionalText(form.max_display_resolution),
    max_camera_mp: optionalInteger(form.max_camera_mp),
    announcement_date: optionalText(form.announcement_date),
    release_date: optionalText(form.release_date),
    core_count: optionalInteger(form.core_count),
    thread_count: optionalInteger(form.thread_count),
    big_little: optionalBoolean(form.big_little),
    isa_name: optionalText(form.isa_name),
    shader_units: optionalInteger(form.shader_units),
    compute_units: optionalInteger(form.compute_units),
    clock_mhz: optionalInteger(form.clock_mhz),
    fp32_gflops: optionalNumber(form.fp32_gflops),
    ray_tracing_support: optionalBoolean(form.ray_tracing_support),
    api_support: optionalText(form.api_support),
    tops: optionalNumber(form.tops),
    tops_int4: optionalNumber(form.tops_int4),
    tops_fp16: optionalNumber(form.tops_fp16),
    max_downlink_mbps: optionalInteger(form.max_downlink_mbps),
    max_uplink_mbps: optionalInteger(form.max_uplink_mbps),
    supports_mmwave: optionalBoolean(form.supports_mmwave),
    supports_satellite: optionalBoolean(form.supports_satellite),
    supported_5g_modes: optionalText(form.supported_5g_modes),
    generation: optionalText(form.generation),
    max_data_rate_mtps: optionalInteger(form.max_data_rate_mtps),
    typical_data_rate_mtps: optionalInteger(form.typical_data_rate_mtps),
    voltage: optionalNumber(form.voltage),
    bandwidth_gbps: optionalNumber(form.bandwidth_gbps),
    channel_width_bits: optionalInteger(form.channel_width_bits),
    is_mobile: optionalBoolean(form.is_mobile),
    release_year: optionalInteger(form.release_year),
    sequential_read_mbps: optionalInteger(form.sequential_read_mbps),
    sequential_write_mbps: optionalInteger(form.sequential_write_mbps),
    random_read_iops: optionalInteger(form.random_read_iops),
    random_write_iops: optionalInteger(form.random_write_iops),
    max_speed_mbps: optionalInteger(form.max_speed_mbps),
    data_speed_gbps: optionalNumber(form.data_speed_gbps),
    power_delivery_w: optionalInteger(form.power_delivery_w),
    alt_modes: optionalText(form.alt_modes),
    kernel_type: optionalText(form.kernel_type),
    is_open_source: optionalBoolean(form.is_open_source),
  };
}
