"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type {
  DeviceCategory,
  ScoringProfileAdminInput,
} from "@spechub/api-client";
import { api } from "@/lib/api";
import { SearchableSelect } from "@/components/searchable-select";

type StoredMetric = {
  id: string;
  metric_key: string;
  label: string;
  weight_percent: string | number;
  min_value: string | number;
  max_value: string | number;
  direction: "higher" | "lower";
  scale: "linear" | "log";
  unit?: string | null;
};

type StoredModule = {
  id: string;
  module_key: string;
  label: string;
  description?: string | null;
  weight_percent: string | number;
  metrics: StoredMetric[];
};

type StoredProfile = {
  id: string;
  name: string;
  version: number;
  status: "draft" | "published" | "archived";
  effective_from?: string | null;
  device_category: Pick<DeviceCategory, "id" | "name" | "slug">;
  modules: StoredModule[];
};

type EditorMetric =
  ScoringProfileAdminInput["modules"][number]["metrics"][number];
type EditorModule = ScoringProfileAdminInput["modules"][number];

const DEFAULT_MODULES: EditorModule[] = [
  {
    key: "performance",
    label: "Hiệu năng",
    weight: 40,
    metrics: [
      {
        key: "cpu_multi",
        label: "CPU đa nhân",
        weight: 50,
        min: 0,
        max: 10000,
        direction: "higher",
        scale: "linear",
        unit: "điểm",
      },
      {
        key: "gpu",
        label: "GPU",
        weight: 50,
        min: 0,
        max: 20000,
        direction: "higher",
        scale: "linear",
        unit: "điểm",
      },
    ],
  },
  {
    key: "display",
    label: "Màn hình",
    weight: 20,
    metrics: [
      {
        key: "peak_brightness",
        label: "Độ sáng đỉnh",
        weight: 100,
        min: 300,
        max: 3000,
        direction: "higher",
        scale: "linear",
        unit: "nit",
      },
    ],
  },
  {
    key: "camera",
    label: "Camera",
    weight: 20,
    metrics: [
      {
        key: "camera_score",
        label: "Điểm camera",
        weight: 100,
        min: 0,
        max: 200,
        direction: "higher",
        scale: "linear",
        unit: "điểm",
      },
    ],
  },
  {
    key: "battery",
    label: "Pin",
    weight: 20,
    metrics: [
      {
        key: "endurance",
        label: "Thời lượng sử dụng",
        weight: 100,
        min: 0,
        max: 30,
        direction: "higher",
        scale: "linear",
        unit: "giờ",
      },
    ],
  },
];

function cloneDefaultModules() {
  return DEFAULT_MODULES.map((module) => ({
    ...module,
    metrics: module.metrics.map((metric) => ({ ...metric })),
  }));
}

function fromStored(profile: StoredProfile): EditorModule[] {
  return profile.modules.map((module) => ({
    key: module.module_key,
    label: module.label,
    description: module.description ?? undefined,
    weight: Number(module.weight_percent),
    metrics: module.metrics.map((metric) => ({
      key: metric.metric_key,
      label: metric.label,
      weight: Number(metric.weight_percent),
      min: Number(metric.min_value),
      max: Number(metric.max_value),
      direction: metric.direction,
      scale: metric.scale,
      unit: metric.unit ?? undefined,
    })),
  }));
}

function weightTone(total: number) {
  return Math.abs(total - 100) < 0.001 ? "text-emerald-700" : "text-rose-700";
}

function responseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: T[] }).data;
  }
  return [];
}

export function ScoringProfileManager({
  accessToken,
}: {
  accessToken: string;
}) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("Công thức điểm chuẩn");
  const [modules, setModules] = useState<EditorModule[]>(cloneDefaultModules);
  const [notice, setNotice] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["device-categories", "scoring"],
    queryFn: () => api.listDeviceCategories(),
  });
  const profilesQuery = useQuery({
    queryKey: ["admin-scoring-profiles"],
    queryFn: () => api.listAdminScoringProfiles<StoredProfile>(accessToken),
  });
  const categories = useMemo(
    () => categoriesQuery.data?.data ?? [],
    [categoriesQuery.data],
  );
  const profiles = useMemo(
    () => responseArray<StoredProfile>(profilesQuery.data),
    [profilesQuery.data],
  );

  useEffect(() => {
    if (!categoryId && categories[0]?.id) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const categoryProfiles = useMemo(
    () =>
      profiles.filter((profile) => profile.device_category.id === categoryId),
    [categoryId, profiles],
  );
  const moduleWeight = modules.reduce((sum, module) => sum + module.weight, 0);
  const invalidMetricModule = modules.find(
    (module) =>
      Math.abs(
        module.metrics.reduce((sum, metric) => sum + metric.weight, 0) - 100,
      ) >= 0.001,
  );

  const createMutation = useMutation({
    mutationFn: () =>
      api.createAdminScoringProfile<StoredProfile>(
        categoryId,
        { name, modules },
        accessToken,
      ),
    onSuccess: async () => {
      setNotice("Đã lưu một revision nháp mới.");
      await queryClient.invalidateQueries({
        queryKey: ["admin-scoring-profiles"],
      });
    },
    onError: (error) =>
      setNotice(
        error instanceof Error ? error.message : "Không thể lưu công thức.",
      ),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      api.publishAdminScoringProfile<StoredProfile>(id, accessToken),
    onSuccess: async () => {
      setNotice(
        "Đã publish revision. Revision công khai trước đó đã được lưu trữ.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin-scoring-profiles"],
      });
    },
    onError: (error) =>
      setNotice(
        error instanceof Error ? error.message : "Không thể publish revision.",
      ),
  });

  const updateModule = (index: number, patch: Partial<EditorModule>) => {
    setModules((current) =>
      current.map((module, moduleIndex) =>
        moduleIndex === index ? { ...module, ...patch } : module,
      ),
    );
  };

  const updateMetric = (
    moduleIndex: number,
    metricIndex: number,
    patch: Partial<EditorMetric>,
  ) => {
    setModules((current) =>
      current.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? {
              ...module,
              metrics: module.metrics.map((metric, currentMetricIndex) =>
                currentMetricIndex === metricIndex
                  ? { ...metric, ...patch }
                  : metric,
              ),
            }
          : module,
      ),
    );
  };

  const canSave =
    Boolean(categoryId && name.trim() && modules.length) &&
    Math.abs(moduleWeight - 100) < 0.001 &&
    !invalidMetricModule &&
    modules.every(
      (module) =>
        module.key.trim() &&
        module.label.trim() &&
        module.metrics.length &&
        module.metrics.every(
          (metric) =>
            metric.key.trim() && metric.label.trim() && metric.max > metric.min,
        ),
    );

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <SlidersHorizontal size={14} />
              Scoring Studio
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
              Công thức điểm theo loại thiết bị
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Điều chỉnh trọng số, khoảng chuẩn hóa và chiều đánh giá. Mỗi lần
              lưu tạo một revision mới; chỉ revision được publish mới dùng cho
              điểm công khai.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs text-slate-500">Tổng trọng số nhóm</p>
            <p className={`text-lg font-semibold ${weightTone(moduleWeight)}`}>
              {moduleWeight.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SearchableSelect
            label="Loại thiết bị"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
              meta: category.slug,
            }))}
            placeholder="Chọn loại thiết bị"
            searchPlaceholder="Tìm loại thiết bị..."
            clearable={false}
            required
          />
          <label className="text-sm font-medium text-slate-700">
            Tên revision
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>
        </div>
      </div>

      {modules.map((module, moduleIndex) => {
        const metricWeight = module.metrics.reduce(
          (sum, metric) => sum + metric.weight,
          0,
        );
        return (
          <article
            key={`${module.key}-${moduleIndex}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_130px_auto]">
              <input
                aria-label="Mã nhóm"
                value={module.key}
                onChange={(event) =>
                  updateModule(moduleIndex, { key: event.target.value })
                }
                placeholder="performance"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />
              <input
                aria-label="Tên nhóm"
                value={module.label}
                onChange={(event) =>
                  updateModule(moduleIndex, { label: event.target.value })
                }
                placeholder="Hiệu năng"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />
              <label className="flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm">
                <input
                  aria-label="Trọng số nhóm"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={module.weight}
                  onChange={(event) =>
                    updateModule(moduleIndex, {
                      weight: Number(event.target.value),
                    })
                  }
                  className="min-w-0 flex-1 outline-none"
                />
                <span className="text-slate-400">%</span>
              </label>
              <button
                type="button"
                aria-label={`Xóa nhóm ${module.label}`}
                onClick={() =>
                  setModules((current) =>
                    current.filter((_, index) => index !== moduleIndex),
                  )
                }
                className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={17} />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-2 pr-2 font-semibold">Mã chỉ số</th>
                    <th className="pb-2 pr-2 font-semibold">Tên</th>
                    <th className="pb-2 pr-2 font-semibold">Trọng số</th>
                    <th className="pb-2 pr-2 font-semibold">Min</th>
                    <th className="pb-2 pr-2 font-semibold">Max</th>
                    <th className="pb-2 pr-2 font-semibold">Chiều</th>
                    <th className="pb-2 pr-2 font-semibold">Thang</th>
                    <th className="pb-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {module.metrics.map((metric, metricIndex) => (
                    <tr
                      key={`${metric.key}-${metricIndex}`}
                      className="border-t border-slate-100"
                    >
                      {(["key", "label", "weight", "min", "max"] as const).map(
                        (field) => (
                          <td key={field} className="py-2 pr-2">
                            <input
                              aria-label={`${module.label} ${field}`}
                              type={
                                field === "key" || field === "label"
                                  ? "text"
                                  : "number"
                              }
                              step="0.1"
                              value={metric[field]}
                              onChange={(event) =>
                                updateMetric(moduleIndex, metricIndex, {
                                  [field]:
                                    field === "key" || field === "label"
                                      ? event.target.value
                                      : Number(event.target.value),
                                })
                              }
                              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 outline-none focus:border-violet-500"
                            />
                          </td>
                        ),
                      )}
                      <td className="py-2 pr-2">
                        <SearchableSelect
                          label={`${module.label} chiều đánh giá`}
                          labelClassName="sr-only"
                          controlClassName="h-9 rounded-lg"
                          value={metric.direction ?? "higher"}
                          onChange={(value) =>
                            updateMetric(moduleIndex, metricIndex, {
                              direction: value as "higher" | "lower",
                            })
                          }
                          options={[
                            { value: "higher", label: "Cao hơn" },
                            { value: "lower", label: "Thấp hơn" },
                          ]}
                          clearable={false}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <SearchableSelect
                          label={`${module.label} thang chuẩn hóa`}
                          labelClassName="sr-only"
                          controlClassName="h-9 rounded-lg"
                          value={metric.scale ?? "linear"}
                          onChange={(value) =>
                            updateMetric(moduleIndex, metricIndex, {
                              scale: value as "linear" | "log",
                            })
                          }
                          options={[
                            { value: "linear", label: "Tuyến tính" },
                            { value: "log", label: "Log" },
                          ]}
                          clearable={false}
                        />
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          aria-label={`Xóa chỉ số ${metric.label}`}
                          onClick={() =>
                            updateModule(moduleIndex, {
                              metrics: module.metrics.filter(
                                (_, index) => index !== metricIndex,
                              ),
                            })
                          }
                          className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  updateModule(moduleIndex, {
                    metrics: [
                      ...module.metrics,
                      {
                        key: `metric_${module.metrics.length + 1}`,
                        label: "Chỉ số mới",
                        weight: 0,
                        min: 0,
                        max: 100,
                        direction: "higher",
                        scale: "linear",
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus size={15} />
                Thêm chỉ số
              </button>
              <span
                className={`text-xs font-semibold ${weightTone(metricWeight)}`}
              >
                Tổng chỉ số: {metricWeight.toFixed(1)}%
              </span>
            </div>
          </article>
        );
      })}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() =>
            setModules((current) => [
              ...current,
              {
                key: `module_${current.length + 1}`,
                label: "Nhóm mới",
                weight: 0,
                metrics: [
                  {
                    key: "metric_1",
                    label: "Chỉ số mới",
                    weight: 100,
                    min: 0,
                    max: 100,
                    direction: "higher",
                    scale: "linear",
                  },
                ],
              },
            ])
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <Plus size={16} />
          Thêm nhóm
        </button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {notice ? <p className="text-sm text-slate-600">{notice}</p> : null}
          <button
            type="button"
            disabled={!canSave || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={16} />
            {createMutation.isPending ? "Đang lưu…" : "Lưu revision mới"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Lịch sử revision</h3>
        <div className="mt-3 space-y-2">
          {categoryProfiles.length ? (
            categoryProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {profile.name} · v{profile.version}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {profile.modules.length} nhóm ·{" "}
                    {profile.status === "published"
                      ? "Đang áp dụng"
                      : profile.status === "archived"
                        ? "Đã lưu trữ"
                        : "Bản nháp"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setName(`${profile.name} copy`);
                      setModules(fromStored(profile));
                      setNotice(
                        `Đã nạp v${profile.version} vào trình chỉnh sửa.`,
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={14} />
                    Dùng làm mẫu
                  </button>
                  {profile.status === "draft" ? (
                    <button
                      type="button"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(profile.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      Publish
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Loại thiết bị này chưa có revision nào.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
