"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  CatalogEvidenceClaim,
  CatalogEvidenceClaimKind,
  CatalogEvidenceSourceType,
} from "@spechub/api-client";
import { api } from "@/lib/api";

type ClaimForm = {
  field_path: string;
  value: string;
  source_type: CatalogEvidenceSourceType;
  source_label: string;
  source_url: string;
  source_title: string;
  evidence_excerpt: string;
  scope_region: string;
  scope_sku: string;
  methodology: string;
  tested_at: string;
  confidence: string;
};

const sourceOptions: Array<{
  value: CatalogEvidenceSourceType;
  label: string;
  claimKind: CatalogEvidenceClaimKind;
  hint: string;
}> = [
  {
    value: "official",
    label: "Hãng chính thức",
    claimKind: "declared",
    hint: "Dùng cho thông số hãng công bố và SKU/biến thể.",
  },
  {
    value: "certification",
    label: "Chứng nhận / cơ quan",
    claimKind: "declared",
    hint: "Dùng cho hồ sơ xác minh theo model hoặc khu vực.",
  },
  {
    value: "lab",
    label: "Phòng lab / review đo đạc",
    claimKind: "measured",
    hint: "Bắt buộc ghi điều kiện đo; không thay thế claim của hãng.",
  },
  {
    value: "benchmark",
    label: "Benchmark",
    claimKind: "benchmark",
    hint: "Bắt buộc ngày test và môi trường/app version.",
  },
  {
    value: "retail",
    label: "Nhà bán lẻ",
    claimKind: "commercial",
    hint: "Chỉ dùng cho giá/khả dụng và phải có khu vực.",
  },
  {
    value: "editorial",
    label: "Biên tập / hồ sơ có dẫn chứng",
    claimKind: "editorial",
    hint: "Dùng cho dữ liệu đã được biên tập; cần URL bằng chứng.",
  },
];

const emptyForm: ClaimForm = {
  field_path: "",
  value: "",
  source_type: "official",
  source_label: "",
  source_url: "",
  source_title: "",
  evidence_excerpt: "",
  scope_region: "",
  scope_sku: "",
  methodology: "",
  tested_at: "",
  confidence: "",
};

export function CatalogEvidencePanel({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const [draftId, setDraftId] = useState("");
  const [form, setForm] = useState<ClaimForm>(emptyForm);
  const [notice, setNotice] = useState("");
  const drafts = useQuery({
    queryKey: ["catalog-evidence", "drafts"],
    queryFn: () => api.listCatalogDrafts(accessToken),
  });
  const availableDrafts = useMemo(
    () =>
      (drafts.data ?? []).filter(
        (draft) =>
          draft.draft_type === "device" ||
          draft.draft_type === "hardware-module",
      ),
    [drafts.data],
  );

  useEffect(() => {
    if (!draftId && availableDrafts[0]) setDraftId(availableDrafts[0].id);
  }, [availableDrafts, draftId]);

  const claims = useQuery({
    queryKey: ["catalog-evidence", "claims", draftId],
    queryFn: () =>
      api.listCatalogEvidenceClaims({ catalog_draft_id: draftId }, accessToken),
    enabled: Boolean(draftId),
  });
  const coverage = useQuery({
    queryKey: ["catalog-evidence", "coverage", draftId],
    queryFn: () =>
      api.getCatalogEvidenceCoverage(
        { catalog_draft_id: draftId },
        accessToken,
      ),
    enabled: Boolean(draftId),
  });
  const activeSource =
    sourceOptions.find((item) => item.value === form.source_type) ??
    sourceOptions[0];
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["catalog-evidence", "claims", draftId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["catalog-evidence", "coverage", draftId],
      }),
    ]);
  const createClaim = useMutation({
    mutationFn: () =>
      api.createCatalogEvidenceClaim(
        {
          catalog_draft_id: draftId,
          field_path: form.field_path.trim(),
          value: form.value.trim(),
          display_value: form.value.trim(),
          source_type: form.source_type,
          source_label: form.source_label.trim(),
          source_url: form.source_url.trim(),
          source_title: form.source_title.trim() || undefined,
          evidence_excerpt: form.evidence_excerpt.trim() || undefined,
          claim_kind: activeSource.claimKind,
          scope_region: form.scope_region.trim() || undefined,
          scope_sku: form.scope_sku.trim() || undefined,
          methodology: form.methodology.trim() || undefined,
          tested_at: form.tested_at || undefined,
          confidence: form.confidence ? Number(form.confidence) : undefined,
        },
        accessToken,
      ),
    onSuccess: async (claim) => {
      setNotice(
        claim.status === "conflict"
          ? "Đã lưu bằng chứng nhưng phát hiện giá trị mâu thuẫn; hãy xử lý trong danh sách bên dưới."
          : "Đã lưu bằng chứng ở trạng thái chờ duyệt.",
      );
      setForm((current) => ({
        ...emptyForm,
        source_type: current.source_type,
        source_label: current.source_label,
      }));
      await refresh();
    },
  });
  const resolveClaim = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "accepted" | "rejected" | "stale";
    }) => api.resolveCatalogEvidenceClaim(id, { status }, accessToken),
    onSuccess: async () => {
      setNotice("Đã cập nhật trạng thái bằng chứng.");
      await refresh();
    },
  });
  const error = createClaim.error ?? resolveClaim.error;

  if (drafts.isLoading) {
    return <EvidenceLoading />;
  }

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-800 shadow-sm">
                <ShieldCheck size={14} />
                Bằng chứng theo từng trường
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                Hợp nhất dữ liệu mà không đánh đổi khả năng kiểm chứng
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Mỗi nguồn là một claim độc lập. Chỉ biên tập viên mới chấp nhận
                claim; nguồn mới không âm thầm ghi đè dữ liệu catalog.
              </p>
            </div>
            {coverage.data ? (
              <CoverageBadges summary={coverage.data.summary} />
            ) : null}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <label className="block max-w-3xl text-sm font-semibold text-slate-900">
            Draft cần hoàn thiện
            <select
              value={draftId}
              onChange={(event) => {
                setDraftId(event.target.value);
                setNotice("");
              }}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Chọn bản nháp</option>
              {availableDrafts.map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.title} ·{" "}
                  {draft.draft_type === "device" ? "Thiết bị" : "Phần cứng"} ·{" "}
                  {draft.status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {!draftId ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          Chưa có draft phù hợp. Hãy tạo draft từ Nhập nhanh hoặc form catalog
          trước.
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  Bổ sung bằng chứng
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {activeSource.hint}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Claim: {activeSource.claimKind}
              </span>
            </div>
            <form
              className="mt-5 grid gap-4 lg:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setNotice("");
                createClaim.mutate();
              }}
            >
              <FormField label="Loại nguồn">
                <select
                  value={form.source_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      source_type: event.target
                        .value as CatalogEvidenceSourceType,
                    }))
                  }
                  className={inputClass}
                >
                  {sourceOptions.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Đường dẫn trường"
                hint="Ví dụ: display.brightness_peak_nits"
              >
                <input
                  required
                  value={form.field_path}
                  onChange={(event) =>
                    setFormValue(setForm, "field_path", event.target.value)
                  }
                  className={inputClass}
                  placeholder="display.brightness_peak_nits"
                />
              </FormField>
              <FormField
                label="Giá trị"
                hint="Giá trị gốc; hệ thống không tự đổi nghĩa."
              >
                <input
                  required
                  value={form.value}
                  onChange={(event) =>
                    setFormValue(setForm, "value", event.target.value)
                  }
                  className={inputClass}
                  placeholder="1600 nits"
                />
              </FormField>
              <FormField label="Tên nguồn">
                <input
                  required
                  value={form.source_label}
                  onChange={(event) =>
                    setFormValue(setForm, "source_label", event.target.value)
                  }
                  className={inputClass}
                  placeholder="DXOMARK Display"
                />
              </FormField>
              <FormField label="URL bằng chứng">
                <input
                  required
                  type="url"
                  value={form.source_url}
                  onChange={(event) =>
                    setFormValue(setForm, "source_url", event.target.value)
                  }
                  className={inputClass}
                  placeholder="https://..."
                />
              </FormField>
              <FormField label="Tiêu đề trang">
                <input
                  value={form.source_title}
                  onChange={(event) =>
                    setFormValue(setForm, "source_title", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Tên bài thử nghiệm hoặc tài liệu"
                />
              </FormField>
              <FormField
                label="Khu vực"
                hint={
                  form.source_type === "retail"
                    ? "Bắt buộc với nguồn bán lẻ."
                    : "Ví dụ: VN, EU, US."
                }
              >
                <input
                  value={form.scope_region}
                  onChange={(event) =>
                    setFormValue(setForm, "scope_region", event.target.value)
                  }
                  className={inputClass}
                  placeholder="VN"
                />
              </FormField>
              <FormField label="SKU / biến thể">
                <input
                  value={form.scope_sku}
                  onChange={(event) =>
                    setFormValue(setForm, "scope_sku", event.target.value)
                  }
                  className={inputClass}
                  placeholder="SM-S928B"
                />
              </FormField>
              <FormField
                label="Ngày test"
                hint={
                  form.source_type === "benchmark"
                    ? "Bắt buộc với benchmark."
                    : undefined
                }
              >
                <input
                  type="date"
                  value={form.tested_at}
                  onChange={(event) =>
                    setFormValue(setForm, "tested_at", event.target.value)
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField
                label="Độ tin cậy"
                hint="0–1; hệ thống giới hạn theo loại nguồn."
              >
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.confidence}
                  onChange={(event) =>
                    setFormValue(setForm, "confidence", event.target.value)
                  }
                  className={inputClass}
                  placeholder="0.90"
                />
              </FormField>
              <div className="lg:col-span-2">
                <FormField label="Trích đoạn bằng chứng">
                  <textarea
                    value={form.evidence_excerpt}
                    onChange={(event) =>
                      setFormValue(
                        setForm,
                        "evidence_excerpt",
                        event.target.value,
                      )
                    }
                    rows={3}
                    className={`${inputClass} h-auto py-2`}
                    placeholder="Đoạn nêu rõ giá trị, model và điều kiện áp dụng."
                  />
                </FormField>
              </div>
              <div className="lg:col-span-2">
                <FormField
                  label="Phương pháp / môi trường"
                  hint={
                    form.source_type === "lab" ||
                    form.source_type === "benchmark"
                      ? "Bắt buộc với lab và benchmark."
                      : "Ví dụ: độ sáng, firmware, app version, power mode."
                  }
                >
                  <textarea
                    value={form.methodology}
                    onChange={(event) =>
                      setFormValue(setForm, "methodology", event.target.value)
                    }
                    rows={3}
                    className={`${inputClass} h-auto py-2`}
                    placeholder="Đo ở 150 nit, Wi‑Fi bật, firmware 1.0.4…"
                  />
                </FormField>
              </div>
              <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={createClaim.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
                >
                  {createClaim.isPending ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  Lưu claim chờ duyệt
                </button>
                <span className="text-xs text-slate-500">
                  Các claim khác giá trị cho cùng trường/SKU/vùng sẽ được đánh
                  dấu xung đột.
                </span>
              </div>
            </form>
            {notice ? <Notice text={notice} /> : null}
            {error ? <ErrorMessage error={error} /> : null}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <h3 className="text-base font-semibold text-slate-950">
                Claim đã ghi nhận
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Chỉ chấp nhận một claim khai báo cho cùng trường, vùng và SKU.
                Claim đo đạc/benchmark vẫn giữ phương pháp riêng để so sánh công
                bằng.
              </p>
            </header>
            {claims.isLoading ? <EvidenceLoading /> : null}
            {!claims.isLoading && !claims.data?.length ? (
              <p className="p-5 text-sm text-slate-600">
                Chưa có bằng chứng cho draft này.
              </p>
            ) : null}
            <div className="divide-y divide-slate-100">
              {claims.data?.map((claim) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  resolving={resolveClaim.isPending}
                  onResolve={(status) =>
                    resolveClaim.mutate({ id: claim.id, status })
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function ClaimRow({
  claim,
  resolving,
  onResolve,
}: {
  claim: CatalogEvidenceClaim;
  resolving: boolean;
  onResolve: (status: "accepted" | "rejected" | "stale") => void;
}) {
  const status = claimStatus(claim.status);
  return (
    <article className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">
              {claim.field_path}
            </code>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
            >
              {status.label}
            </span>
            <span className="text-xs text-slate-500">{claim.claim_kind}</span>
          </div>
          <p className="mt-2 text-base font-semibold text-slate-950">
            {claim.display_value || displayClaimValue(claim.value_json)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {claim.source.name}
            {claim.scope_region ? ` · ${claim.scope_region}` : ""}
            {claim.scope_sku ? ` · ${claim.scope_sku}` : ""}
            {claim.confidence !== null && claim.confidence !== undefined
              ? ` · tin cậy ${Number(claim.confidence).toFixed(2)}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {claim.status === "candidate" || claim.status === "conflict" ? (
            <button
              type="button"
              disabled={resolving}
              onClick={() => onResolve("accepted")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-700 px-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check size={14} />
              Chấp nhận
            </button>
          ) : null}
          {claim.status === "candidate" || claim.status === "conflict" ? (
            <button
              type="button"
              disabled={resolving}
              onClick={() => onResolve("rejected")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
            >
              <X size={14} />
              Từ chối
            </button>
          ) : null}
          {claim.status === "accepted" ? (
            <button
              type="button"
              disabled={resolving}
              onClick={() => onResolve("stale")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-200 px-2.5 text-xs font-semibold text-amber-800 disabled:opacity-50"
            >
              <Clock3 size={14} />
              Đánh dấu cũ
            </button>
          ) : null}
        </div>
      </div>
      {claim.citation?.url ? (
        <a
          href={claim.citation.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 underline underline-offset-2"
        >
          <ExternalLink size={13} />
          Mở nguồn
        </a>
      ) : null}
      {claim.evidence_excerpt ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-indigo-700">
            Xem trích đoạn và điều kiện
          </summary>
          <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <p>{claim.evidence_excerpt}</p>
            {claim.methodology ? (
              <p>
                <span className="font-semibold text-slate-700">
                  Phương pháp:
                </span>{" "}
                {claim.methodology}
              </p>
            ) : null}
          </div>
        </details>
      ) : claim.methodology ? (
        <p className="mt-3 text-xs leading-5 text-slate-600">
          <span className="font-semibold">Phương pháp:</span>{" "}
          {claim.methodology}
        </p>
      ) : null}
    </article>
  );
}

function CoverageBadges({
  summary,
}: {
  summary: {
    fields: number;
    accepted: number;
    candidates: number;
    conflicts: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-2 text-center text-xs">
      <Metric label="Trường" value={summary.fields} tone="slate" />
      <Metric label="Đã duyệt" value={summary.accepted} tone="emerald" />
      <Metric label="Chờ duyệt" value={summary.candidates} tone="blue" />
      <Metric label="Xung đột" value={summary.conflicts} tone="rose" />
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "blue" | "rose";
}) {
  const classes = {
    slate: "border-slate-200 bg-white text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };
  return (
    <span className={`rounded-lg border px-2 py-1.5 ${classes[tone]}`}>
      <strong className="block text-sm">{value}</strong>
      {label}
    </span>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      <span>{label}</span>
      {hint ? (
        <span className="mt-0.5 block text-xs font-normal leading-4 text-slate-500">
          {hint}
        </span>
      ) : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      {text}
    </p>
  );
}

function ErrorMessage({ error }: { error: unknown }) {
  return (
    <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
      {error instanceof Error
        ? error.message
        : "Không thể cập nhật bằng chứng."}
    </p>
  );
}

function EvidenceLoading() {
  return (
    <div className="flex items-center gap-2 p-5 text-sm text-slate-500">
      <LoaderCircle className="animate-spin" size={16} />
      Đang tải bằng chứng…
    </div>
  );
}

function setFormValue(
  setter: Dispatch<SetStateAction<ClaimForm>>,
  key: keyof ClaimForm,
  value: string,
) {
  setter((current) => ({ ...current, [key]: value }));
}

function claimStatus(status: CatalogEvidenceClaim["status"]) {
  const values = {
    accepted: {
      label: "Đã duyệt",
      className: "bg-emerald-50 text-emerald-700",
    },
    candidate: { label: "Chờ duyệt", className: "bg-blue-50 text-blue-700" },
    conflict: { label: "Xung đột", className: "bg-rose-50 text-rose-700" },
    rejected: { label: "Từ chối", className: "bg-slate-100 text-slate-600" },
    stale: { label: "Đã cũ", className: "bg-amber-50 text-amber-800" },
  } as const;
  return values[status];
}

function displayClaimValue(value: unknown) {
  return typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
    ? String(value)
    : JSON.stringify(value);
}

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
