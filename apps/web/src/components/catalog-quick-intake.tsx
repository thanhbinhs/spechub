"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ClipboardPaste,
  FileSpreadsheet,
  FileText,
  Globe2,
  LoaderCircle,
  Save,
  Upload,
} from "lucide-react";
import type {
  QuickIntakeInput,
  QuickIntakePreview,
  QuickIntakePreviewItem,
} from "@spechub/api-client";
import { api } from "@/lib/api";

type EntityType = QuickIntakeInput["entity_type"];
type InputType = QuickIntakeInput["input_type"];
type HardwareKind = NonNullable<QuickIntakeInput["hardware_kind"]>;

const hardwareKinds: Array<{ value: HardwareKind; label: string }> = [
  { value: "chipset", label: "Chipset" },
  { value: "cpu", label: "CPU" },
  { value: "gpu", label: "GPU" },
  { value: "npu", label: "NPU" },
  { value: "modem", label: "Modem" },
  { value: "memory-standard", label: "RAM" },
  { value: "storage-standard", label: "Lưu trữ" },
  { value: "operating-system", label: "Hệ điều hành" },
];

const fieldLabels: Record<string, string> = {
  name: "Tên",
  slug: "Slug",
  summary: "Tóm tắt",
  variant_name: "Phiên bản",
  sku_code: "SKU / mã mẫu",
  market_name: "Tên thương mại",
  announcement_date: "Ngày công bố",
  release_date: "Ngày ra mắt",
  chipset: "Chipset",
  product_family_id: "Dòng sản phẩm đã ghép",
  memory_capacity_gb: "Dung lượng RAM (GB)",
  storage_capacity_gb: "Dung lượng lưu trữ (GB)",
  storage_options: "Các tùy chọn lưu trữ",
  display_size_inch: "Kích thước màn hình (inch)",
  display_technology: "Công nghệ màn hình",
  display_refresh_rate_hz: "Tần số quét (Hz)",
  resolution_width: "Chiều ngang màn hình",
  resolution_height: "Chiều dọc màn hình",
  display_pixel_density_ppi: "Mật độ điểm ảnh (ppi)",
  display_brightness_typical_nits: "Độ sáng thường (nit)",
  display_brightness_peak_nits: "Độ sáng đỉnh (nit)",
  display_hdr_formats: "HDR",
  display_color_gamut: "Dải màu",
  height_mm: "Chiều cao (mm)",
  width_mm: "Chiều rộng (mm)",
  thickness_mm: "Độ dày (mm)",
  weight_g: "Khối lượng (g)",
  frame_material: "Vật liệu khung",
  back_material: "Vật liệu mặt lưng",
  front_glass: "Kính mặt trước",
  ingress_protection: "Kháng nước/bụi",
  wifi_standard: "Chuẩn Wi-Fi",
  bluetooth_version: "Phiên bản Bluetooth",
  model_numbers: "Mã model theo khu vực",
  esim_supported: "Hỗ trợ eSIM",
  sim_slots: "Số SIM hoạt động",
  sim_type: "Loại SIM",
  launch_os_name: "Hệ điều hành trong nguồn",
  battery_capacity_mah: "Dung lượng pin (mAh)",
  battery_video_playback_hours: "Phát video tối đa (giờ)",
  wired_charging_w: "Sạc có dây (W)",
  wireless_charging_w: "Sạc không dây (W)",
  wireless_charging_protocol: "Chuẩn sạc không dây",
  rear_main_megapixel: "Camera chính (MP)",
  rear_main_aperture: "Khẩu độ camera chính",
  rear_main_focal_length_mm: "Tiêu cự camera chính (mm quy đổi)",
  rear_main_has_ois: "Camera chính có OIS",
  rear_ultrawide_megapixel: "Camera siêu rộng (MP)",
  rear_ultrawide_aperture: "Khẩu độ camera siêu rộng",
  rear_ultrawide_focal_length_mm: "Tiêu cự camera siêu rộng (mm)",
  rear_ultrawide_field_of_view_deg: "Góc nhìn camera siêu rộng (°)",
  front_megapixel: "Camera trước (MP)",
  front_aperture: "Khẩu độ camera trước",
  front_has_af: "Camera trước có AF",
  category: "Phân loại",
  description: "Mô tả",
  model_code: "Mã mẫu",
  organization_name: "Nhà sản xuất",
  core_count: "Số nhân",
  thread_count: "Số luồng",
  max_frequency_mhz: "Xung nhịp tối đa (MHz)",
  clock_mhz: "Xung nhịp (MHz)",
  tops: "TOPS",
  fp32_gflops: "FP32 (GFLOPS)",
  max_data_rate_mtps: "Tốc độ dữ liệu (MT/s)",
  bandwidth_gbps: "Băng thông (Gbps)",
  interface: "Giao tiếp",
  kernel_type: "Loại kernel",
  license_name: "Giấy phép",
};

export function CatalogQuickIntake({
  accessToken,
  canCreateHardware,
  onContinueDevice,
  onContinueHardware,
}: {
  accessToken: string;
  canCreateHardware: boolean;
  onContinueDevice: (draftId: string) => void;
  onContinueHardware: (draftId: string) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entityType, setEntityType] = useState<EntityType>("device");
  const [inputType, setInputType] = useState<InputType>("url");
  const [hardwareKind, setHardwareKind] = useState<HardwareKind>("chipset");
  const [value, setValue] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [preview, setPreview] = useState<QuickIntakePreview | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [savedMessage, setSavedMessage] = useState("");
  const [fileError, setFileError] = useState("");

  const previewMutation = useMutation({
    mutationFn: () =>
      api.previewQuickIntake(
        {
          entity_type: entityType,
          hardware_kind:
            entityType === "hardware-module" ? hardwareKind : undefined,
          input_type: inputType,
          value,
          source_label: sourceLabel.trim() || undefined,
        },
        accessToken,
      ),
    onSuccess: (response) => {
      setPreview(response);
      setSelectedIndexes(new Set(response.data.map((item) => item.index)));
      setSavedMessage("");
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const items = (preview?.data ?? []).filter((item) =>
        selectedIndexes.has(item.index),
      );
      return api.createQuickIntakeDrafts(items, accessToken);
    },
    onSuccess: (drafts) => {
      void queryClient.invalidateQueries({
        queryKey: ["catalog-studio", "drafts"],
      });
      if (!drafts.length) return;
      const first = drafts[0];
      setSavedMessage(
        `Đã lưu ${drafts.length} bản nháp. Bạn có thể rà soát từng trường trước khi xuất bản.`,
      );
      if (first.draft_type === "device") onContinueDevice(first.id);
      else onContinueHardware(first.id);
    },
  });

  const canPreview = value.trim().length > 0;
  const officialUrlHint =
    entityType === "device"
      ? "Thiết bị: Apple /specs/, Google Store *_specs hoặc Samsung /specs/."
      : "Phần cứng: trang sản phẩm cụ thể của Qualcomm hoặc AMD.";
  const officialUrlPlaceholder =
    entityType === "device"
      ? "https://www.apple.com/iphone-17/specs/"
      : "https://www.qualcomm.com/smartphones/products/...";
  const selectedCount = selectedIndexes.size;
  const selectedHasDuplicate = (preview?.data ?? []).some(
    (item) => selectedIndexes.has(item.index) && item.duplicates.length,
  );

  const updatePreviewField = (
    itemIndex: number,
    field: string,
    next: string,
  ) => {
    setPreview((current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map((item) =>
          item.index === itemIndex ? updateItemField(item, field, next) : item,
        ),
      };
    });
  };

  const toggleSelected = (index: number) => {
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSpreadsheetFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const isWorkbook = /\.xlsx$/i.test(file.name);
      let content = "";
      if (isWorkbook) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), {
          type: "array",
        });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = firstSheetName
          ? workbook.Sheets[firstSheetName]
          : undefined;
        if (!firstSheet) {
          throw new Error("Tệp Excel chưa có trang tính để nhập.");
        }
        content = XLSX.utils.sheet_to_csv(firstSheet, { blankrows: false });
      } else {
        content = await file.text();
      }
      setInputType("csv");
      setValue(content);
      setSourceLabel(file.name);
      setPreview(null);
      setSavedMessage("");
      setFileError("");
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Không thể đọc tệp bảng tính.",
      );
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-sm">
                <ClipboardPaste size={14} />
                Nhập nhanh có kiểm chứng
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                Đưa dữ liệu vào catalog trong vài phút
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Dán trang thông số chính thức, thông số hoặc CSV. SpecHub giữ
                bằng chứng cho từng trường và tìm bản ghi có khả năng trùng
                trước khi tạo nháp.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
              <WorkflowBadge number="1" label="Nhập nguồn" />
              <WorkflowBadge number="2" label="Rà soát" />
              <WorkflowBadge number="3" label="Xuất bản" />
            </div>
          </div>
        </div>

        <div className="space-y-6 p-4 sm:p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <fieldset>
                <legend className="text-sm font-semibold text-slate-900">
                  Bạn muốn thêm gì?
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ChoiceButton
                    active={entityType === "device"}
                    icon={<FileText size={17} />}
                    title="Thiết bị"
                    description="Điện thoại, máy tính bảng, laptop…"
                    onClick={() => {
                      setEntityType("device");
                      setPreview(null);
                    }}
                  />
                  {canCreateHardware ? (
                    <ChoiceButton
                      active={entityType === "hardware-module"}
                      icon={<FileSpreadsheet size={17} />}
                      title="Mô-đun phần cứng"
                      description="Chipset, CPU, GPU, RAM…"
                      onClick={() => {
                        setEntityType("hardware-module");
                        setPreview(null);
                      }}
                    />
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-500">
                      <span className="mb-2 inline-flex rounded-md bg-slate-200 p-1.5">
                        <FileSpreadsheet size={17} />
                      </span>
                      <span className="block text-sm font-semibold">
                        Mô-đun phần cứng
                      </span>
                      <span className="mt-0.5 block text-xs leading-5">
                        Cần quyền Quản trị để tạo và xuất bản mô-đun.
                      </span>
                    </div>
                  )}
                </div>
              </fieldset>

              {entityType === "hardware-module" ? (
                <label className="block text-sm font-semibold text-slate-900">
                  Loại mô-đun
                  <select
                    value={hardwareKind}
                    onChange={(event) => {
                      setHardwareKind(event.target.value as HardwareKind);
                      setPreview(null);
                    }}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {hardwareKinds.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <fieldset>
                <legend className="text-sm font-semibold text-slate-900">
                  Nguồn dữ liệu
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <InputTypeButton
                    active={inputType === "url"}
                    icon={<Globe2 size={15} />}
                    label="URL chính thức"
                    onClick={() => {
                      setInputType("url");
                      setPreview(null);
                    }}
                  />
                  <InputTypeButton
                    active={inputType === "text"}
                    icon={<ClipboardPaste size={15} />}
                    label="Dán thông số"
                    onClick={() => {
                      setInputType("text");
                      setPreview(null);
                    }}
                  />
                  <InputTypeButton
                    active={inputType === "csv"}
                    icon={<FileSpreadsheet size={15} />}
                    label="CSV"
                    onClick={() => {
                      setInputType("csv");
                      setPreview(null);
                    }}
                  />
                </div>
              </fieldset>

              <label className="block text-sm font-semibold text-slate-900">
                {inputType === "url"
                  ? "URL trang Tech Specs chính thức"
                  : "Nội dung nguồn"}
                {inputType === "url" ? (
                  <>
                    <input
                      value={value}
                      onChange={(event) => {
                        setValue(event.target.value);
                        setPreview(null);
                      }}
                      type="url"
                      inputMode="url"
                      placeholder={officialUrlPlaceholder}
                      className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">
                      {officialUrlHint} Không hỗ trợ URL cửa hàng, danh mục,
                      review hoặc trang cần tải bằng JavaScript.
                    </span>
                  </>
                ) : (
                  <textarea
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      setPreview(null);
                    }}
                    rows={inputType === "csv" ? 9 : 12}
                    placeholder={
                      inputType === "csv"
                        ? "name,chipset,ram,storage,battery\nExample Phone,Snapdragon 8,12 GB,256 GB,5000 mAh"
                        : "Tên: Example Phone\nChipset: Snapdragon 8\nMàn hình: 6.7 inch, 120Hz\nPin: 5000 mAh, 80W"
                    }
                    className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-xs font-normal leading-5 text-slate-900 outline-none transition placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                )}
              </label>

              {inputType === "csv" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={(event) =>
                      void handleSpreadsheetFile(event.target.files?.[0])
                    }
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  >
                    <Upload size={15} />
                    Chọn CSV hoặc Excel
                  </button>
                  <span className="text-xs text-slate-500">
                    Hỗ trợ CSV, Excel .xlsx, dấu phẩy, chấm phẩy hoặc tab; tối
                    đa 100 dòng/lần.
                  </span>
                  {fileError ? (
                    <span className="basis-full text-xs text-red-700">
                      {fileError}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Quy tắc an toàn dữ liệu
              </h3>
              <ul className="mt-3 space-y-3 text-xs leading-5 text-slate-600">
                <li>
                  URL chỉ nhận từ nguồn Tech Specs chính thức được hỗ trợ; URL
                  khác bị từ chối thay vì đoán dữ liệu.
                </li>
                <li>
                  Không có mục nào được tự xuất bản. Mọi kết quả đều là bản nháp
                  để biên tập duyệt.
                </li>
                <li>Mỗi trường đều có trích đoạn bằng chứng để đối chiếu.</li>
                <li>
                  Gặp bản ghi trùng, hãy mở bản cũ để cập nhật thay vì tạo dữ
                  liệu phân tách.
                </li>
              </ul>
            </aside>
          </div>

          <label className="block text-sm font-semibold text-slate-900">
            Nhãn nguồn{" "}
            <span className="font-normal text-slate-400">(không bắt buộc)</span>
            <input
              value={sourceLabel}
              onChange={(event) => setSourceLabel(event.target.value)}
              placeholder="Ví dụ: Trang thông số chính thức của hãng"
              className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {previewMutation.error ? (
            <MutationError error={previewMutation.error} />
          ) : null}
          <button
            type="button"
            disabled={!canPreview || previewMutation.isPending}
            onClick={() => previewMutation.mutate()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewMutation.isPending ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Check size={17} />
            )}
            {previewMutation.isPending
              ? "Đang đọc và chuẩn hóa…"
              : "Tạo bản xem trước"}
          </button>
        </div>
      </section>

      {preview ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Đã nhận diện {preview.meta.count} mục từ{" "}
                {preview.meta.source.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {preview.meta.source.url ? (
                  <a
                    href={preview.meta.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline underline-offset-2"
                  >
                    {preview.meta.source.url}
                  </a>
                ) : (
                  "Nguồn thủ công"
                )}
                {" · "}Bạn có thể sửa trường có độ tin cậy thấp trước khi lưu.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={selectedCount === preview.data.length}
                onChange={(event) =>
                  setSelectedIndexes(
                    new Set(
                      event.target.checked
                        ? preview.data.map((item) => item.index)
                        : [],
                    ),
                  )
                }
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Chọn tất cả
            </label>
          </header>

          <div className="divide-y divide-slate-100">
            {preview.data.map((item) => (
              <PreviewItem
                key={item.index}
                item={item}
                selected={selectedIndexes.has(item.index)}
                onToggle={() => toggleSelected(item.index)}
                onChange={(field, next) =>
                  updatePreviewField(item.index, field, next)
                }
              />
            ))}
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm leading-6 text-slate-600">
              {selectedCount
                ? `${selectedCount} mục được chọn.`
                : "Chọn ít nhất một mục để lưu bản nháp."}
              {selectedHasDuplicate
                ? " Có mục trùng: nên kiểm tra trước khi tạo mới."
                : ""}
            </p>
            <button
              type="button"
              disabled={!selectedCount || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {saveMutation.isPending
                ? "Đang lưu…"
                : `Lưu ${selectedCount || ""} bản nháp`}
            </button>
          </footer>
          {saveMutation.error ? (
            <div className="px-4 pb-4 sm:px-5">
              <MutationError error={saveMutation.error} />
            </div>
          ) : null}
          {savedMessage ? (
            <p className="mx-4 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:mx-5">
              {savedMessage}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function PreviewItem({
  item,
  selected,
  onToggle,
  onChange,
}: {
  item: QuickIntakePreviewItem;
  selected: boolean;
  onToggle: () => void;
  onChange: (field: string, next: string) => void;
}) {
  const visibleFields = Object.entries(item.fields).filter(
    ([key, field]) =>
      field.value &&
      ![
        "kind",
        "release_status_id",
        "chipset_id",
        "product_family_id",
        "launch_os_version_id",
      ].includes(key),
  );
  return (
    <article
      className={`p-4 sm:p-5 ${selected ? "bg-white" : "bg-slate-50/60 opacity-75"}`}
    >
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 size-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          aria-label={`Chọn ${item.title}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950">
                  {item.title}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {item.draft_type === "device"
                    ? "Thiết bị"
                    : "Mô-đun phần cứng"}
                </span>
              </div>
              {item.duplicates.length ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                  <AlertTriangle size={13} /> Có thể trùng:{" "}
                  {item.duplicates
                    .map((duplicate) => duplicate.name)
                    .join(", ")}
                </p>
              ) : (
                <p className="mt-2 text-xs text-emerald-700">
                  Chưa thấy bản ghi trùng theo tên hoặc slug.
                </p>
              )}
            </div>
          </div>
          {item.warnings.length ? (
            <ul className="mt-3 space-y-1 text-xs leading-5 text-amber-800">
              {item.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleFields.map(([key, field]) => (
              <FieldEditor
                key={key}
                label={fieldLabels[key] ?? key.replaceAll("_", " ")}
                value={field.value}
                confidence={field.confidence}
                excerpt={field.source_excerpt}
                multiline={key === "summary" || key === "description"}
                onChange={(next) => onChange(key, next)}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function FieldEditor({
  label,
  value,
  confidence,
  excerpt,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  confidence: number;
  excerpt: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const confidenceLabel =
    confidence >= 0.85 ? "Cao" : confidence >= 0.7 ? "Khá" : "Cần kiểm tra";
  const confidenceColor =
    confidence >= 0.85
      ? "bg-emerald-50 text-emerald-700"
      : confidence >= 0.7
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-800";
  return (
    <div className="block min-w-0 text-xs font-semibold text-slate-700">
      <span>
        {label}
        <span
          className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${confidenceColor}`}
        >
          {confidenceLabel}
        </span>
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-normal leading-5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1.5 h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      )}
      {excerpt ? (
        <details className="mt-1.5 font-normal text-slate-500">
          <summary className="cursor-pointer text-[11px] text-blue-700 hover:text-blue-900">
            Xem bằng chứng nguồn
          </summary>
          <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] leading-4 text-slate-600">
            {excerpt}
          </p>
        </details>
      ) : null}
    </div>
  );
}

function updateItemField(
  item: QuickIntakePreviewItem,
  field: string,
  value: string,
): QuickIntakePreviewItem {
  const payload = structuredClone(item.payload);
  const fields = { ...item.fields, [field]: { ...item.fields[field], value } };
  if (item.draft_type === "device") {
    const target = payload as Record<string, Record<string, unknown>>;
    const mapping: Record<string, [string, string] | [string, string, string]> =
      {
        name: ["general", "name"],
        slug: ["general", "slug"],
        summary: ["general", "summary"],
        variant_name: ["model", "variant_name"],
        sku_code: ["model", "sku_code"],
        market_name: ["model", "market_name"],
        announcement_date: ["model", "announcement_date"],
        release_date: ["model", "release_date"],
        chipset: ["hardware", "chipset_name"],
        memory_capacity_gb: ["configuration", "memory_capacity_gb"],
        storage_capacity_gb: ["configuration", "storage_capacity_gb"],
        height_mm: ["configuration", "height_mm"],
        width_mm: ["configuration", "width_mm"],
        thickness_mm: ["configuration", "thickness_mm"],
        weight_g: ["configuration", "weight_g"],
        frame_material: ["configuration", "frame_material"],
        back_material: ["configuration", "back_material"],
        front_glass: ["configuration", "front_glass"],
        ingress_protection: ["configuration", "ingress_protection"],
        sim_slots: ["configuration", "sim_slots"],
        sim_type: ["configuration", "sim_type"],
        esim_supported: ["configuration", "esim_supported"],
        display_technology: ["display", "technology"],
        display_size_inch: ["display", "size_inch"],
        display_refresh_rate_hz: ["display", "refresh_rate_hz"],
        resolution_width: ["display", "resolution_width"],
        resolution_height: ["display", "resolution_height"],
        display_pixel_density_ppi: ["display", "pixel_density_ppi"],
        display_brightness_typical_nits: ["display", "brightness_typical_nits"],
        display_brightness_peak_nits: ["display", "brightness_peak_nits"],
        display_color_gamut: ["display", "color_gamut"],
        display_hdr_formats: ["display", "hdr_formats"],
        battery_capacity_mah: ["battery", "capacity_mah"],
        wired_charging_w: ["battery", "wired_charging_w"],
        wireless_charging_w: ["battery", "wireless_charging_w"],
        wireless_charging_protocol: ["battery", "wireless_charging_protocol"],
        rear_main_megapixel: ["camera", "rear_main", "effective_megapixel"],
        rear_main_aperture: ["camera", "rear_main", "aperture"],
        rear_main_focal_length_mm: [
          "camera",
          "rear_main",
          "focal_length_mm_eq",
        ],
        rear_main_has_ois: ["camera", "rear_main", "has_ois"],
        rear_ultrawide_megapixel: [
          "camera",
          "rear_ultrawide",
          "effective_megapixel",
        ],
        rear_ultrawide_aperture: ["camera", "rear_ultrawide", "aperture"],
        rear_ultrawide_focal_length_mm: [
          "camera",
          "rear_ultrawide",
          "focal_length_mm_eq",
        ],
        rear_ultrawide_field_of_view_deg: [
          "camera",
          "rear_ultrawide",
          "field_of_view_deg",
        ],
        front_megapixel: ["camera", "front", "effective_megapixel"],
        front_aperture: ["camera", "front", "aperture"],
        front_has_af: ["camera", "front", "has_af"],
      };
    const path = mapping[field];
    if (path) {
      if (path.length === 2) {
        const section = target[path[0]];
        if (section) section[path[1]] = value;
      } else {
        const section = target[path[0]];
        const nested = section?.[path[1]];
        if (nested && typeof nested === "object") {
          (nested as Record<string, unknown>)[path[2]] = value;
        }
      }
    }
    if (field === "summary") {
      const description = target.description;
      if (description) description.summary = value;
    }
    if (field === "name") item = { ...item, title: value };
  } else {
    const target = payload as Record<string, Record<string, unknown>>;
    if (target.hardware_module) target.hardware_module[field] = value;
    if (field === "name") item = { ...item, title: value };
  }
  return { ...item, payload, fields };
}

function WorkflowBadge({ number, label }: { number: string; label: string }) {
  return (
    <span className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
      <span className="mr-1 font-bold text-blue-700">{number}</span>
      {label}
    </span>
  );
}
function ChoiceButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition ${active ? "border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-600" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}
    >
      <span
        className={`mb-2 inline-flex rounded-md p-1.5 ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
      >
        {icon}
      </span>
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs font-normal leading-5 text-slate-500">
        {description}
      </span>
    </button>
  );
}
function InputTypeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${active ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}
    >
      {icon}
      {label}
    </button>
  );
}
function MutationError({ error }: { error: unknown }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800">
      {error instanceof Error
        ? error.message
        : "Không thể hoàn tất thao tác. Hãy thử lại."}
    </p>
  );
}
