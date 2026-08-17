"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  BriefcaseBusiness,
  Camera,
  Check,
  CircleDollarSign,
  Cpu,
  Gamepad2,
  HardDrive,
  LoaderCircle,
  Monitor,
  Plane,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import { clsx } from "clsx";
import type {
  DeviceCategory,
  DeviceRecommendation,
  DeviceRecommendationInput,
  DeviceRecommendationMustHave,
  DeviceRecommendationOperatingSystem,
  DeviceRecommendationPriority,
  DeviceRecommendationResponse,
  DeviceRecommendationUseCase,
} from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { CompareToggle } from "@/components/research-workspace";
import { SearchableSelect } from "@/components/searchable-select";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localizeDeviceCategory } from "@/lib/localize";
import type { ResearchDevice } from "@/lib/research-device";

const DRAFT_KEY = "spechub.device-recommender.v1";

type Draft = {
  category_slug: string;
  budget_max: string;
  currency_code: string;
  operating_system: DeviceRecommendationOperatingSystem;
  use_cases: DeviceRecommendationUseCase[];
  priorities: DeviceRecommendationPriority[];
  must_haves: DeviceRecommendationMustHave[];
  min_storage_gb?: DeviceRecommendationInput["min_storage_gb"];
  limit: number;
};

type Choice<T extends string> = {
  value: T;
  label: string;
  description: string;
  icon: typeof Target;
};

const USE_CASES: Choice<DeviceRecommendationUseCase>[] = [
  {
    value: "gaming",
    label: "Chơi game",
    description: "FPS ổn định, màn hình mượt",
    icon: Gamepad2,
  },
  {
    value: "photography",
    label: "Chụp ảnh",
    description: "Camera, màn hình và lưu trữ",
    icon: Camera,
  },
  {
    value: "productivity",
    label: "Làm việc",
    description: "Hiệu năng, pin và phần mềm",
    icon: BriefcaseBusiness,
  },
  {
    value: "travel",
    label: "Di chuyển",
    description: "Nhẹ, pin lâu, tiện mang theo",
    icon: Plane,
  },
  {
    value: "long_term",
    label: "Dùng lâu dài",
    description: "Cập nhật tốt, cấu hình bền",
    icon: ShieldCheck,
  },
  {
    value: "value",
    label: "Tối ưu chi phí",
    description: "Nhiều giá trị trong ngân sách",
    icon: CircleDollarSign,
  },
];

const PRIORITIES: Choice<DeviceRecommendationPriority>[] = [
  {
    value: "performance",
    label: "Hiệu năng",
    description: "CPU, GPU và điểm phần cứng",
    icon: Cpu,
  },
  {
    value: "battery",
    label: "Pin & sạc",
    description: "Dung lượng và tốc độ sạc",
    icon: BatteryCharging,
  },
  {
    value: "camera",
    label: "Camera",
    description: "Hệ thống camera và chống rung",
    icon: Camera,
  },
  {
    value: "display",
    label: "Màn hình",
    description: "Tần số quét và độ sáng",
    icon: Monitor,
  },
  {
    value: "price",
    label: "Giá",
    description: "Chừa nhiều ngân sách hơn",
    icon: CircleDollarSign,
  },
  {
    value: "portability",
    label: "Gọn nhẹ",
    description: "Trọng lượng và độ mỏng",
    icon: Plane,
  },
  {
    value: "software",
    label: "Phần mềm",
    description: "Thời gian hỗ trợ cập nhật",
    icon: ShieldCheck,
  },
  {
    value: "storage",
    label: "Lưu trữ",
    description: "Dung lượng và khả năng mở rộng",
    icon: HardDrive,
  },
];

const MUST_HAVES: Array<{
  value: DeviceRecommendationMustHave;
  label: string;
}> = [
  { value: "5g", label: "5G" },
  { value: "oled", label: "OLED" },
  { value: "high_refresh", label: "Từ 120 Hz" },
  { value: "wireless_charging", label: "Sạc không dây" },
  { value: "ois", label: "Camera OIS" },
  { value: "expandable_storage", label: "Mở rộng bộ nhớ" },
  { value: "lightweight", label: "Trọng lượng nhẹ" },
];

const OPERATING_SYSTEMS: Array<{
  value: DeviceRecommendationOperatingSystem;
  label: string;
}> = [
  { value: "any", label: "Không giới hạn" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "windows", label: "Windows" },
  { value: "macos", label: "macOS" },
  { value: "linux", label: "Linux" },
];

const initialDraft = (categorySlug: string): Draft => ({
  category_slug: categorySlug,
  budget_max: "",
  currency_code: "USD",
  operating_system: "any",
  use_cases: [],
  priorities: [],
  must_haves: [],
  limit: 3,
});

export function DeviceRecommender({
  categories,
}: {
  categories: DeviceCategory[];
}) {
  const categoryOptions = useMemo(
    () => flattenCategories(categories),
    [categories],
  );
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() =>
    initialDraft(categoryOptions[0]?.slug ?? "smartphone"),
  );
  const [result, setResult] = useState<DeviceRecommendationResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<Draft>;
      setDraft((current) => ({
        ...current,
        ...parsed,
        use_cases: Array.isArray(parsed.use_cases)
          ? parsed.use_cases
          : current.use_cases,
        priorities: Array.isArray(parsed.priorities)
          ? parsed.priorities
          : current.priorities,
        must_haves: Array.isArray(parsed.must_haves)
          ? parsed.must_haves
          : current.must_haves,
      }));
    } catch {
      // The recommender remains available when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Persistence is optional and must never block a recommendation.
    }
  }, [draft]);

  async function submitRecommendation() {
    if (!draft.use_cases.length) {
      setError("Hãy chọn ít nhất một nhu cầu sử dụng.");
      setStep(2);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const budget = Number(draft.budget_max);
      const response = await api.recommendDevices({
        ...draft,
        budget_max:
          draft.budget_max.trim() && Number.isFinite(budget)
            ? budget
            : undefined,
      });
      setResult(response);
      window.requestAnimationFrame(() => {
        document.getElementById("recommendation-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tạo đề xuất lúc này. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setDraft(initialDraft(categoryOptions[0]?.slug ?? "smartphone"));
    setStep(1);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Nói rõ nhu cầu, nhận đúng 3 lựa chọn đáng cân nhắc
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Các tiêu chí bắt buộc được dùng để lọc cứng. Điểm phù hợp, lý do
              và phần đánh đổi đều dựa trên dữ liệu cấu hình hiện có.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white bg-white/80 p-3 shadow-sm backdrop-blur">
            {[
              ["1", "Thông tin"],
              ["2", "Nhu cầu"],
              ["3", "Tiêu chí"],
            ].map(([number, label]) => (
              <button
                key={number}
                type="button"
                onClick={() => setStep(Number(number))}
                className={clsx(
                  "rounded-lg px-2 py-3 text-center transition",
                  step === Number(number)
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
                )}
              >
                <span className="block text-lg font-bold">{number}</span>
                <span className="mt-0.5 block text-[11px] font-semibold">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {step === 1 ? (
          <StepOne
            draft={draft}
            setDraft={setDraft}
            categories={categoryOptions}
          />
        ) : step === 2 ? (
          <StepTwo draft={draft} setDraft={setDraft} />
        ) : (
          <StepThree draft={draft} setDraft={setDraft} />
        )}

        {error ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={
              step === 1 ? reset : () => setStep((current) => current - 1)
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            {step === 1 ? <RefreshCw size={16} /> : <ArrowLeft size={16} />}
            {step === 1 ? "Đặt lại" : "Quay lại"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !draft.use_cases.length) {
                  setError("Hãy chọn ít nhất một nhu cầu sử dụng.");
                  return;
                }
                setError(null);
                setStep((current) => current + 1);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Tiếp tục <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoading}
              onClick={submitRecommendation}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isLoading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Sparkles size={17} />
              )}
              {isLoading ? "Đang phân tích..." : "Tìm 3 máy phù hợp"}
            </button>
          )}
        </div>
      </section>

      {result ? (
        <RecommendationResults result={result} onAdjust={() => setStep(1)} />
      ) : null}
    </div>
  );
}

function StepOne({
  draft,
  setDraft,
  categories,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  categories: DeviceCategory[];
}) {
  return (
    <div>
      <StepHeading
        number="01"
        title="Thông tin cơ bản"
        description="Chọn danh mục, ngân sách và hệ điều hành bạn muốn dùng."
      />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <SearchableSelect
          label="Loại thiết bị"
          labelClassName="text-sm font-semibold text-slate-800"
          controlClassName="h-12 rounded-lg"
          value={draft.category_slug}
          onChange={(category_slug) =>
            setDraft((current) => ({ ...current, category_slug }))
          }
          options={categories.map((category) => ({
            value: category.slug,
            label: localizeDeviceCategory(category),
            meta: category.slug,
          }))}
          placeholder="Chọn loại thiết bị"
          searchPlaceholder="Tìm loại thiết bị..."
          clearable={false}
          required
        />

        <SearchableSelect
          label="Hệ điều hành"
          labelClassName="text-sm font-semibold text-slate-800"
          controlClassName="h-12 rounded-lg"
          value={draft.operating_system}
          onChange={(operating_system) =>
            setDraft((current) => ({
              ...current,
              operating_system:
                operating_system as DeviceRecommendationOperatingSystem,
            }))
          }
          options={OPERATING_SYSTEMS}
          placeholder="Chọn hệ điều hành"
          clearable={false}
          required
        />

        <div className="space-y-2 text-sm font-semibold text-slate-800 md:col-span-2">
          <label htmlFor="recommend-budget">
            Ngân sách tối đa{" "}
            <span className="font-normal text-slate-500">
              (có thể bỏ trống)
            </span>
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
            <input
              id="recommend-budget"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder={
                draft.currency_code === "VND"
                  ? "Ví dụ: 25000000"
                  : "Ví dụ: 1200"
              }
              value={draft.budget_max}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  budget_max: event.target.value,
                }))
              }
              className="h-12 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <SearchableSelect
              label="Đơn vị tiền tệ"
              labelClassName="sr-only"
              controlClassName="h-12 rounded-lg"
              value={draft.currency_code}
              onChange={(currency_code) =>
                setDraft((current) => ({
                  ...current,
                  currency_code,
                }))
              }
              options={[
                { value: "VND", label: "VND", meta: "Việt Nam đồng · ₫" },
                { value: "USD", label: "USD", meta: "Đô la Mỹ · $" },
                { value: "EUR", label: "EUR", meta: "Euro · €" },
              ]}
              clearable={false}
            />
          </div>
          <p className="text-xs font-normal leading-5 text-slate-500">
            Chỉ các phiên bản có giá cùng đơn vị và không vượt ngân sách mới
            được giữ lại.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepTwo({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  return (
    <div>
      <StepHeading
        number="02"
        title="Bạn dùng máy để làm gì?"
        description="Chọn tối đa 3 nhu cầu. Đây là phần quyết định trọng số chấm điểm."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((choice) => (
          <ChoiceCard
            key={choice.value}
            choice={choice}
            selected={draft.use_cases.includes(choice.value)}
            onClick={() =>
              setDraft((current) => ({
                ...current,
                use_cases: toggleLimited(current.use_cases, choice.value, 3),
              }))
            }
          />
        ))}
      </div>
      <SelectionCount
        current={draft.use_cases.length}
        maximum={3}
        label="nhu cầu"
      />
    </div>
  );
}

function StepThree({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  return (
    <div>
      <StepHeading
        number="03"
        title="Ưu tiên và tiêu chí bắt buộc"
        description="Ưu tiên dùng để xếp hạng; tiêu chí bắt buộc sẽ loại máy không đáp ứng."
      />
      <h3 className="mt-6 text-sm font-semibold text-slate-950">
        Ưu tiên theo thứ tự chọn (tối đa 3)
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRIORITIES.map((choice) => (
          <ChoiceCard
            key={choice.value}
            choice={choice}
            compact
            order={draft.priorities.indexOf(choice.value) + 1 || undefined}
            selected={draft.priorities.includes(choice.value)}
            onClick={() =>
              setDraft((current) => ({
                ...current,
                priorities: toggleLimited(current.priorities, choice.value, 3),
              }))
            }
          />
        ))}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Phải có</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Không chọn nếu bạn sẵn sàng linh hoạt để có nhiều kết quả hơn.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MUST_HAVES.map((item) => {
              const selected = draft.must_haves.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      must_haves: toggleLimited(
                        current.must_haves,
                        item.value,
                        MUST_HAVES.length,
                      ),
                    }))
                  }
                  className={clsx(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition",
                    selected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50",
                  )}
                >
                  {selected ? <Check size={14} /> : null}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <SearchableSelect
          label="Bộ nhớ tối thiểu"
          labelClassName="text-sm font-semibold text-slate-800"
          controlClassName="h-12 rounded-lg"
          value={draft.min_storage_gb ? String(draft.min_storage_gb) : ""}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              min_storage_gb: value
                ? (Number(value) as Draft["min_storage_gb"])
                : undefined,
            }))
          }
          options={[128, 256, 512, 1024, 2048].map((size) => ({
            value: String(size),
            label: `Từ ${size.toLocaleString("vi-VN")} GB`,
          }))}
          placeholder="Không giới hạn"
        />
      </div>
    </div>
  );
}

function ChoiceCard<T extends string>({
  choice,
  selected,
  onClick,
  compact,
  order,
}: {
  choice: Choice<T>;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
  order?: number;
}) {
  const Icon = choice.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "relative flex items-start gap-3 rounded-xl border text-left transition",
        compact ? "p-3" : "p-4",
        selected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40",
      )}
    >
      <span
        className={clsx(
          "grid shrink-0 place-items-center rounded-lg",
          compact ? "size-9" : "size-11",
          selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        <Icon size={compact ? 17 : 19} />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm text-slate-950">{choice.label}</strong>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {choice.description}
        </span>
      </span>
      {selected ? (
        <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
          {order ?? <Check size={12} />}
        </span>
      ) : null}
    </button>
  );
}

function RecommendationResults({
  result,
  onAdjust,
}: {
  result: DeviceRecommendationResponse;
  onAdjust: () => void;
}) {
  return (
    <section id="recommendation-results" className="scroll-mt-24 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <BadgeCheck size={17} /> Kết quả đã đối chiếu dữ liệu
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {result.meta.returned_count
              ? `${result.meta.returned_count} lựa chọn phù hợp nhất`
              : "Chưa có máy đáp ứng đủ"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Đã xét {result.meta.candidate_count} mẫu,{" "}
            {result.meta.eligible_count} mẫu vượt qua mọi tiêu chí bắt buộc.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdjust}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
        >
          <SlidersHorizontal size={16} /> Điều chỉnh nhu cầu
        </button>
      </div>

      {result.data.recommendations.length ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {result.data.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.variant.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <Target size={24} className="mx-auto text-amber-700" />
          <h3 className="mt-3 font-semibold text-slate-950">
            Bộ lọc đang quá chặt hoặc catalog chưa đủ dữ liệu
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Thử tăng ngân sách, bỏ bớt một tiêu chí “phải có”, hoặc chọn “Không
            giới hạn” cho hệ điều hành.
          </p>
        </div>
      )}
    </section>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: DeviceRecommendation;
}) {
  const brand =
    recommendation.model.product_family.brand_org.short_name ??
    recommendation.model.product_family.brand_org.name;
  const category = localizeDeviceCategory(
    recommendation.model.product_family.device_category,
  );
  const researchDevice: ResearchDevice = {
    modelId: recommendation.model.id,
    slug: recommendation.model.slug,
    name: recommendation.model.name,
    brand,
    category,
    imageUrl: recommendation.model.cover_image_url,
    accent: recommendation.variant.color_hex,
    variantId: recommendation.variant.id,
    variantName: recommendation.variant.variant_name,
  };

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <DeviceArtwork
          compact
          className="h-48 rounded-none border-0 border-b"
          brand={brand}
          name={recommendation.model.name}
          category={category}
          imageUrl={recommendation.model.cover_image_url}
          accent={recommendation.variant.color_hex}
        />
        <span className="absolute bottom-3 left-3 z-20 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
          #{recommendation.rank}
        </span>
        <span className="absolute bottom-3 right-3 z-20 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-slate-200">
          {recommendation.match_score}% phù hợp
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {brand} · {recommendation.variant.variant_name}
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
          {recommendation.model.name}
        </h3>
        <p className="mt-2 text-sm font-semibold text-blue-700">
          {formatPrice(
            recommendation.variant.launch_price,
            recommendation.variant.currency,
          )}
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Độ phủ dữ liệu</span>
            <span>{recommendation.evidence_coverage}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${recommendation.evidence_coverage}%` }}
            />
          </div>
        </div>

        {recommendation.matched_requirements.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {recommendation.matched_requirements.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
              >
                <Check size={12} /> {item}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vì sao nên chọn
          </h4>
          {recommendation.reasons.map((reason) => (
            <p
              key={reason}
              className="flex items-start gap-2 text-sm leading-6 text-slate-700"
            >
              <BadgeCheck size={16} className="mt-1 shrink-0 text-blue-600" />
              <span>{reason}</span>
            </p>
          ))}
        </div>

        {recommendation.trade_offs.length ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              <AlertTriangle size={14} /> Cần cân nhắc
            </h4>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-950">
              {recommendation.trade_offs.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Xem cách tính điểm
          </summary>
          <div className="mt-3 space-y-3">
            {recommendation.score_breakdown
              .filter((item) => item.weight > 0)
              .sort((left, right) => right.weight - left.weight)
              .map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700">
                      {item.label} · trọng số {Math.round(item.weight)}%
                    </span>
                    <span className="text-slate-500">
                      {Math.round(item.score)}/100
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={clsx(
                        "h-full rounded-full",
                        item.source === "missing"
                          ? "bg-slate-400"
                          : "bg-blue-600",
                      )}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    {item.evidence}
                  </p>
                </div>
              ))}
          </div>
        </details>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Link
            href={`/devices/${recommendation.model.slug}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Chi tiết <ArrowRight size={15} />
          </Link>
          <CompareToggle device={researchDevice} compact className="h-10" />
        </div>
      </div>
    </article>
  );
}

function StepHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-xs font-bold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SelectionCount({
  current,
  maximum,
  label,
}: {
  current: number;
  maximum: number;
  label: string;
}) {
  return (
    <p className="mt-3 text-right text-xs font-medium text-slate-500">
      Đã chọn {current}/{maximum} {label}
    </p>
  );
}

function toggleLimited<T>(items: T[], item: T, maximum: number) {
  if (items.includes(item)) return items.filter((current) => current !== item);
  if (items.length >= maximum) return items;
  return [...items, item];
}

function flattenCategories(categories: DeviceCategory[]) {
  const result: DeviceCategory[] = [];
  const visit = (items: DeviceCategory[]) => {
    for (const category of items) {
      result.push(category);
      const nested =
        category.children ??
        (category as DeviceCategory & { child_categories?: DeviceCategory[] })
          .child_categories;
      if (nested?.length) visit(nested);
    }
  };
  visit(categories);
  return result;
}
