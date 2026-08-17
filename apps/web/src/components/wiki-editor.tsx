"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bold,
  Check,
  Code2,
  Eye,
  Heading2,
  ImageIcon,
  ImagePlus,
  Italic,
  LayoutTemplate,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  Quote,
  Redo2,
  Send,
  Table2,
  Undo2,
  X,
} from "lucide-react";
import type {
  Citation,
  WikiArticle,
  WikiArticleStatus,
} from "@spechub/api-client";
import { useAuth } from "@/components/auth-provider";
import { MarkdownContent } from "@/components/markdown-content";
import { SearchableSelect } from "@/components/searchable-select";
import {
  WikiMediaDialog,
  type WikiMediaValue,
} from "@/components/wiki-media-dialog";
import { api } from "@/lib/api";

type ArticleType = WikiArticle["article_type"];

const articleTypes: Array<{ value: ArticleType; label: string }> = [
  { value: "guide", label: "Hướng dẫn" },
  { value: "introduction", label: "Giới thiệu" },
  { value: "review", label: "Chia sẻ / đánh giá" },
  { value: "comparison", label: "So sánh" },
  { value: "tutorial", label: "Bài thực hành" },
];

const articleTemplates: Record<
  ArticleType,
  { label: string; description: string; body: string }
> = {
  guide: {
    label: "Hướng dẫn chọn mua",
    description: "Đi từ nhu cầu tới checklist quyết định",
    body: `## Bắt đầu từ nhu cầu thực tế

Mô tả người đọc phù hợp với bài viết, ngân sách và tình huống sử dụng chính.

## Tiêu chí cần ưu tiên

### Tiêu chí 1

Giải thích tiêu chí, cách kiểm tra và mức nào là đủ dùng.

### Tiêu chí 2

Nêu đánh đổi quan trọng thay vì chỉ liệt kê thông số.

## Những lựa chọn nên cân nhắc

| Lựa chọn | Điểm mạnh | Hạn chế | Phù hợp với |
| --- | --- | --- | --- |
| Thiết bị A |  |  |  |
| Thiết bị B |  |  |  |

## Checklist trước khi mua

- [ ] Đã xác định ngân sách tối đa
- [ ] Đã thử tính năng quan trọng nhất
- [ ] Đã kiểm tra bảo hành và phụ kiện

## Kết luận

Tóm tắt lựa chọn theo từng nhóm nhu cầu, không đưa ra một đáp án cho tất cả.
`,
  },
  introduction: {
    label: "Giải thích công nghệ",
    description: "Biến thuật ngữ khó thành kiến thức dễ hiểu",
    body: `## Công nghệ này là gì?

Giải thích ngắn gọn bằng ngôn ngữ đời thường và cho biết người dùng sẽ gặp nó ở đâu.

## Cách hoạt động

Mô tả nguyên lý ở mức vừa đủ để hiểu lợi ích và giới hạn.

## Thông số nào thực sự quan trọng?

| Thông số | Ý nghĩa | Khi nào đáng quan tâm |
| --- | --- | --- |
|  |  |  |

## Hiểu lầm thường gặp

> Nêu một nhận định phổ biến nhưng thiếu ngữ cảnh, sau đó giải thích lại bằng dữ kiện.

## Điều cần nhớ

- Tóm tắt ý chính thứ nhất
- Tóm tắt ý chính thứ hai
- Gợi ý cách tự kiểm chứng
`,
  },
  review: {
    label: "Đánh giá trải nghiệm",
    description: "Có bối cảnh dùng thật, ưu nhược điểm rõ",
    body: `## Tóm tắt nhanh

Nêu thời gian trải nghiệm, phiên bản thiết bị và ba kết luận quan trọng nhất.

## Thiết kế và cảm giác sử dụng

Mô tả những điều chỉ nhận ra khi dùng hàng ngày; thêm ảnh minh họa nếu có.

## Hiệu năng, pin và nhiệt độ

Ghi rõ ứng dụng, điều kiện mạng, độ sáng và cách đo để người đọc hiểu bối cảnh.

## Camera hoặc tính năng nổi bật

Nêu tình huống hoạt động tốt, tình huống chưa tốt và giới hạn phần cứng/phần mềm.

## Điểm mình thích và chưa thích

### Điểm tốt

- _Điền điểm nổi bật_

### Điểm cần cân nhắc

- _Điền hạn chế hoặc đánh đổi_

## Có nên mua?

Kết luận theo từng nhóm người dùng và mức giá tại thời điểm viết.
`,
  },
  comparison: {
    label: "So sánh hai thiết bị",
    description: "So theo nhu cầu, có bảng thắng–thua rõ ràng",
    body: `## Kết luận nhanh

Nêu ngay thiết bị nào phù hợp với từng nhóm người dùng và điều gì tạo ra khác biệt lớn nhất.

## Bảng so sánh chính

| Tiêu chí | Thiết bị A | Thiết bị B | Lợi thế |
| --- | --- | --- | --- |
| Màn hình |  |  |  |
| Hiệu năng |  |  |  |
| Camera |  |  |  |
| Pin và sạc |  |  |  |
| Phần mềm |  |  |  |

## Trải nghiệm sử dụng hàng ngày

So sánh những khác biệt có thể cảm nhận được, không chỉ chép bảng thông số.

## Camera và video

Nêu rõ điều kiện chụp, tiêu cự và chế độ đã dùng.

## Hiệu năng, pin và nhiệt

Giải thích kết quả theo tác vụ thực tế và điều kiện thử nghiệm.

## Nên chọn máy nào?

- **Chọn Thiết bị A nếu:** …
- **Chọn Thiết bị B nếu:** …
- **Chưa nên đổi máy nếu:** …
`,
  },
  tutorial: {
    label: "Mẹo từng bước",
    description: "Quy trình ngắn, dễ làm theo và hoàn tác",
    body: `## Bạn sẽ làm được gì?

Nêu kết quả, thiết bị/phiên bản hệ điều hành đã kiểm tra và thời gian cần thiết.

## Trước khi bắt đầu

- [ ] Sao lưu dữ liệu quan trọng
- [ ] Kiểm tra phiên bản phần mềm
- [ ] Chuẩn bị tài khoản hoặc phụ kiện cần thiết

## Các bước thực hiện

### Bước 1: Mở cài đặt cần thiết

Mô tả đường dẫn chính xác và thêm ảnh chụp màn hình.

### Bước 2: Chọn tùy chọn phù hợp

Giải thích tác dụng của từng lựa chọn quan trọng.

### Bước 3: Kiểm tra kết quả

Nêu cách xác nhận thay đổi đã có hiệu lực.

## Nếu có lỗi

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
| --- | --- | --- |
|  |  |  |

## Cách hoàn tác

Chỉ dẫn cách trở về thiết lập ban đầu một cách an toàn.
`,
  },
};

const WIKI_DRAFT_KEY = "spechub:wiki-editor-draft:v1";

export function WikiEditor({ article }: { article?: WikiArticle }) {
  const router = useRouter();
  const { user, tokens, isLoading } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [body, setBody] = useState(article?.body_markdown ?? "");
  const [articleType, setArticleType] = useState<ArticleType>(
    article?.article_type ?? "guide",
  );
  const [languageCode, setLanguageCode] = useState(
    article?.language.code ?? "vi",
  );
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    article?.cover_image_url ?? "",
  );
  const [coverImageAlt, setCoverImageAlt] = useState(
    article?.cover_image_alt ?? "",
  );
  const [coverImageCaption, setCoverImageCaption] = useState(
    article?.cover_image_caption ?? "",
  );
  const [coverImageCredit, setCoverImageCredit] = useState(
    article?.cover_image_credit ?? "",
  );
  const [changeSummary, setChangeSummary] = useState("");
  const [preview, setPreview] = useState(false);
  const [mediaMode, setMediaMode] = useState<"cover" | "inline" | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(Boolean(article));
  const [draftStatus, setDraftStatus] = useState("");
  const mediaSelectionRef = useRef({ start: 0, end: 0 });
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>(
    article?.citations.map((item) => item.citation.id) ?? [],
  );
  const [citationQuery, setCitationQuery] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(title));
  }, [slugTouched, title]);

  useEffect(() => {
    if (article) return;
    try {
      const saved = window.localStorage.getItem(WIKI_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as WikiEditorDraft;
        if (!hasDraftContent(draft)) {
          window.localStorage.removeItem(WIKI_DRAFT_KEY);
          return;
        }
        setTitle(draft.title ?? "");
        setSlug(draft.slug ?? "");
        setSlugTouched(Boolean(draft.slug));
        setSummary(draft.summary ?? "");
        setBody(draft.body ?? "");
        setArticleType(draft.articleType ?? "guide");
        setLanguageCode(draft.languageCode ?? "vi");
        setTags(draft.tags ?? "");
        setCoverImageUrl(draft.coverImageUrl ?? "");
        setCoverImageAlt(draft.coverImageAlt ?? "");
        setCoverImageCaption(draft.coverImageCaption ?? "");
        setCoverImageCredit(draft.coverImageCredit ?? "");
        setChangeSummary(draft.changeSummary ?? "");
        setSelectedCitationIds(draft.selectedCitationIds ?? []);
        if (draft.updatedAt) {
          setDraftStatus(
            `Đã khôi phục bản nháp lúc ${new Intl.DateTimeFormat("vi", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(draft.updatedAt))}`,
          );
        }
      }
    } catch {
      window.localStorage.removeItem(WIKI_DRAFT_KEY);
    } finally {
      setDraftHydrated(true);
    }
  }, [article]);

  useEffect(() => {
    if (article || !draftHydrated) return;
    const draftContent: WikiEditorDraft = {
      title,
      slug,
      summary,
      body,
      articleType,
      languageCode,
      tags,
      coverImageUrl,
      coverImageAlt,
      coverImageCaption,
      coverImageCredit,
      changeSummary,
      selectedCitationIds,
    };
    if (!hasDraftContent(draftContent)) {
      window.localStorage.removeItem(WIKI_DRAFT_KEY);
      setDraftStatus("");
      return;
    }
    const timeout = window.setTimeout(() => {
      const updatedAt = new Date().toISOString();
      const draft: WikiEditorDraft = {
        ...draftContent,
        updatedAt,
      };
      window.localStorage.setItem(WIKI_DRAFT_KEY, JSON.stringify(draft));
      setDraftStatus("Bản nháp đã lưu trên thiết bị");
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [
    article,
    articleType,
    body,
    changeSummary,
    coverImageAlt,
    coverImageCaption,
    coverImageCredit,
    coverImageUrl,
    draftHydrated,
    languageCode,
    selectedCitationIds,
    slug,
    summary,
    tags,
    title,
  ]);

  const citations = useQuery({
    queryKey: ["wiki-editor-citations", citationQuery],
    queryFn: () =>
      api.listCitations({
        page: 1,
        pageSize: 20,
        q: citationQuery || undefined,
      }),
    enabled: Boolean(user),
  });

  const checks = useMemo(
    () => [
      {
        label: "Tiêu đề rõ nghĩa (tối thiểu 10 ký tự)",
        valid: title.trim().length >= 10,
      },
      {
        label: "Tóm tắt đủ ngữ cảnh (tối thiểu 40 ký tự)",
        valid: summary.trim().length >= 40,
      },
      {
        label: "Nội dung tối thiểu 300 ký tự",
        valid: body.trim().length >= 300,
      },
      {
        label: "Có ít nhất hai đề mục để dễ đọc",
        valid: (body.match(/^##?\s/gm) ?? []).length >= 2,
      },
      {
        label: "Ảnh bìa có mô tả dễ tiếp cận",
        valid: !coverImageUrl || coverImageAlt.trim().length >= 5,
      },
      {
        label: "Có mô tả mục đích thay đổi",
        valid: changeSummary.trim().length >= 10,
      },
    ],
    [body, changeSummary, coverImageAlt, coverImageUrl, summary, title],
  );
  const canSubmit = checks.every((check) => check.valid);
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const save = useMutation({
    mutationFn: async () => {
      if (!tokens?.access_token)
        throw new Error("Bạn cần đăng nhập để gửi bài.");
      if (article) {
        return api.submitWikiRevision(
          article.id,
          { title, body_markdown: body, change_summary: changeSummary },
          tokens.access_token,
        );
      }
      return api.createWikiArticle(
        {
          entity_table: "community_articles",
          entity_id: crypto.randomUUID(),
          language_code: languageCode,
          title: title.trim(),
          slug,
          summary: summary.trim(),
          body_markdown: body.trim(),
          article_type: articleType,
          tags: parseTags(tags),
          cover_image_url: coverImageUrl.trim() || undefined,
          cover_image_alt: coverImageAlt.trim() || undefined,
          cover_image_caption: coverImageCaption.trim() || undefined,
          cover_image_credit: coverImageCredit.trim() || undefined,
          status: "in_review" as WikiArticleStatus,
          change_summary: changeSummary.trim(),
          citations: selectedCitationIds.map((citationId, index) => ({
            citation_id: citationId,
            anchor_key: `ref-${index + 1}`,
          })),
        },
        tokens.access_token,
      );
    },
    onSuccess: () => {
      if (!article) window.localStorage.removeItem(WIKI_DRAFT_KEY);
      router.push("/wiki?submitted=1");
    },
  });

  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Đang kiểm tra tài khoản…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          Đăng nhập để đóng góp Wiki
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Mọi tài khoản SpecHub đều có thể tạo bài và đề xuất chỉnh sửa. Nội
          dung sẽ được duyệt trước khi công khai.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <>
      <form
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) save.mutate();
        }}
      >
        <div className="min-w-0 space-y-5">
          {!article && draftStatus ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-xs text-blue-800">
              <span>{draftStatus}</span>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.removeItem(WIKI_DRAFT_KEY);
                  setDraftStatus("Đã xóa bản nháp cục bộ");
                }}
                className="shrink-0 font-semibold hover:underline"
              >
                Xóa bản nháp
              </button>
            </div>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tiêu đề" className="md:col-span-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={300}
                  placeholder="Một tiêu đề cụ thể, cho biết người đọc sẽ nhận được gì"
                  className="form-control"
                  required
                />
              </Field>
              {!article ? (
                <>
                  <Field label="Đường dẫn">
                    <input
                      value={slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        setSlug(toSlug(event.target.value));
                      }}
                      className="form-control"
                      required
                    />
                  </Field>
                  <Field label="Loại bài viết">
                    <SearchableSelect
                      label="Loại bài viết"
                      labelClassName="sr-only"
                      value={articleType}
                      onChange={(value) => setArticleType(value as ArticleType)}
                      options={articleTypes}
                      clearable={false}
                    />
                  </Field>
                  <Field label="Ngôn ngữ">
                    <SearchableSelect
                      label="Ngôn ngữ"
                      labelClassName="sr-only"
                      value={languageCode}
                      onChange={setLanguageCode}
                      options={[
                        { value: "vi", label: "Tiếng Việt" },
                        { value: "en", label: "English" },
                      ]}
                      clearable={false}
                    />
                  </Field>
                  <Field
                    label="Thẻ chủ đề"
                    hint="Tối đa 8 thẻ, phân cách bằng dấu phẩy"
                  >
                    <input
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                      placeholder="smartphone, camera, kinh-nghiem"
                      className="form-control"
                    />
                  </Field>
                  <Field
                    label="Ảnh bìa"
                    className="md:col-span-2"
                    hint="Tỷ lệ 16:9, có mô tả và ghi nguồn"
                  >
                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                      <button
                        type="button"
                        onClick={() => setMediaMode("cover")}
                        className="group relative grid aspect-video overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white"
                      >
                        {coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverImageUrl}
                            alt=""
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <span className="m-auto flex flex-col items-center gap-2 text-xs font-medium text-slate-500">
                            <ImagePlus size={22} className="text-blue-600" />
                            Chọn ảnh bìa
                          </span>
                        )}
                        {coverImageUrl ? (
                          <span className="absolute inset-x-2 bottom-2 rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                            Thay ảnh
                          </span>
                        ) : null}
                      </button>
                      <div className="flex min-w-0 flex-col justify-center">
                        <p className="text-sm font-semibold text-slate-900">
                          {coverImageAlt || "Chưa chọn ảnh đại diện"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {coverImageCaption ||
                            "Ảnh bìa giúp bài nổi bật tại trang chủ Wiki và khi chia sẻ."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setMediaMode("cover")}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                          >
                            <ImageIcon size={13} />
                            {coverImageUrl ? "Chỉnh ảnh" : "Thêm ảnh"}
                          </button>
                          {coverImageUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCoverImageUrl("");
                                setCoverImageAlt("");
                                setCoverImageCaption("");
                                setCoverImageCredit("");
                              }}
                              className="h-8 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Gỡ ảnh
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Field>
                  <Field
                    label="Tóm tắt"
                    className="md:col-span-2"
                    hint={`${summary.length}/500 ký tự`}
                  >
                    <textarea
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      rows={3}
                      maxLength={500}
                      className="form-control min-h-24 py-3"
                      placeholder="Nêu chủ đề, phạm vi và đối tượng độc giả trong 2–3 câu."
                      required
                    />
                  </Field>
                </>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
              <ToolbarButton
                label="Hoàn tác"
                onClick={() => document.execCommand("undo")}
              >
                <Undo2 size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Làm lại"
                onClick={() => document.execCommand("redo")}
              >
                <Redo2 size={15} />
              </ToolbarButton>
              <span className="mx-1 h-5 w-px bg-slate-200" />
              <ToolbarButton
                label="Tiêu đề"
                onClick={() => insert("## ", "", "Tiêu đề mục")}
              >
                <Heading2 size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Đậm"
                onClick={() => insert("**", "**", "nội dung đậm")}
              >
                <Bold size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Nghiêng"
                onClick={() => insert("_", "_", "nội dung nghiêng")}
              >
                <Italic size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Liên kết"
                onClick={() => insert("[", "](https://)", "tên liên kết")}
              >
                <Link2 size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Chèn ảnh"
                onClick={() => {
                  const textarea = textareaRef.current;
                  mediaSelectionRef.current = {
                    start: textarea?.selectionStart ?? body.length,
                    end: textarea?.selectionEnd ?? body.length,
                  };
                  setMediaMode("inline");
                }}
              >
                <ImagePlus size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Trích dẫn"
                onClick={() => insert("> ", "", "trích dẫn")}
              >
                <Quote size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Danh sách"
                onClick={() => insert("- ", "", "mục danh sách")}
              >
                <List size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Danh sách số"
                onClick={() => insert("1. ", "", "mục danh sách")}
              >
                <ListOrdered size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Mã"
                onClick={() => insert("```\n", "\n```", "mã nguồn")}
              >
                <Code2 size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Bảng"
                onClick={() =>
                  insert(
                    "",
                    "",
                    "| Cột 1 | Cột 2 |\n| --- | --- |\n| Dữ liệu | Dữ liệu |\n",
                  )
                }
              >
                <Table2 size={15} />
              </ToolbarButton>
              <ToolbarButton
                label="Đường phân cách"
                onClick={() => insert("\n---\n", "", "")}
              >
                <Minus size={15} />
              </ToolbarButton>
              <button
                type="button"
                onClick={() => setPreview((value) => !value)}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
              >
                <Eye size={14} />
                {preview ? "Soạn thảo" : "Xem trước"}
              </button>
            </div>
            {!article ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <LayoutTemplate size={14} className="text-blue-700" />
                  Mẫu bài:
                </span>
                {(Object.keys(articleTemplates) as ArticleType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => applyTemplate(type)}
                      title={articleTemplates[type].description}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                        articleType === type
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {articleTemplates[type].label}
                    </button>
                  ),
                )}
              </div>
            ) : null}
            {preview ? (
              <div className="min-h-[520px] p-5 sm:p-7">
                {body ? (
                  <MarkdownContent markdown={body} />
                ) : (
                  <p className="text-sm text-slate-400">
                    Chưa có nội dung để xem trước.
                  </p>
                )}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="min-h-[520px] w-full resize-y px-5 py-4 font-mono text-sm leading-7 text-slate-800 outline-none"
                placeholder="Viết nội dung bằng Markdown…"
                required
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
              <span>
                {wordCount} từ · khoảng{" "}
                {Math.max(1, Math.ceil(wordCount / 220))} phút đọc
              </span>
              {!article && !body ? (
                <button
                  type="button"
                  onClick={() => applyTemplate(articleType)}
                  className="font-medium text-blue-700 hover:underline"
                >
                  Dùng mẫu {articleTemplates[articleType].label.toLowerCase()}
                </button>
              ) : null}
            </div>
          </section>

          {!article ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-950">
                Nguồn tham khảo
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Chọn nguồn có sẵn để các nhận định quan trọng có thể kiểm chứng.
              </p>
              <input
                value={citationQuery}
                onChange={(event) => setCitationQuery(event.target.value)}
                placeholder="Tìm nguồn theo tiêu đề hoặc nhà xuất bản…"
                className="form-control mt-3"
              />
              <div className="mt-3 grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2">
                {(citations.data?.data ?? []).map((citation: Citation) => {
                  const selected = selectedCitationIds.includes(citation.id);
                  return (
                    <button
                      key={citation.id}
                      type="button"
                      onClick={() =>
                        setSelectedCitationIds((current) =>
                          selected
                            ? current.filter((id) => id !== citation.id)
                            : [...current, citation.id],
                        )
                      }
                      className={`rounded-lg border p-3 text-left text-xs transition ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <span className="line-clamp-1 font-semibold text-slate-900">
                        {citation.title ??
                          citation.source?.name ??
                          "Nguồn tham khảo"}
                      </span>
                      <span className="mt-1 block text-slate-500">
                        {citation.source?.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Field
              label={article ? "Nội dung đã thay đổi" : "Mục đích bài viết"}
              hint="Giúp người duyệt hiểu nhanh đóng góp của bạn"
            >
              <textarea
                value={changeSummary}
                onChange={(event) => setChangeSummary(event.target.value)}
                rows={3}
                maxLength={300}
                className="form-control min-h-24 py-3"
                required
              />
            </Field>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">
              Kiểm tra trước khi gửi
            </h2>
            <div className="mt-4 space-y-3">
              {checks.map((check) => (
                <div key={check.label} className="flex gap-2 text-xs leading-5">
                  <span
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${check.valid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                  >
                    {check.valid ? <Check size={11} /> : <X size={10} />}
                  </span>
                  <span
                    className={
                      check.valid ? "text-slate-700" : "text-slate-500"
                    }
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
            <strong>Quy tắc cộng đồng</strong>
            <p className="mt-1">
              Viết trung lập, nêu rõ trải nghiệm cá nhân, không sao chép, không
              quảng cáo trá hình và gắn nguồn cho số liệu hoặc tuyên bố kỹ
              thuật.
            </p>
          </section>
          {save.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {save.error instanceof Error
                ? save.error.message
                : "Không thể gửi bài."}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={!canSubmit || save.isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {save.isPending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {article ? "Gửi đề xuất chỉnh sửa" : "Gửi bài để duyệt"}
          </button>
        </aside>
      </form>
      <WikiMediaDialog
        open={mediaMode !== null}
        mode={mediaMode ?? "inline"}
        initialValue={
          mediaMode === "cover"
            ? {
                url: coverImageUrl,
                alt: coverImageAlt,
                caption: coverImageCaption,
                credit: coverImageCredit,
              }
            : undefined
        }
        onClose={() => setMediaMode(null)}
        onInsert={(media) => {
          if (mediaMode === "cover") {
            setCoverImageUrl(media.url);
            setCoverImageAlt(media.alt);
            setCoverImageCaption(media.caption);
            setCoverImageCredit(media.credit);
            return;
          }
          insertMedia(media);
        }}
      />
    </>
  );

  function applyTemplate(type: ArticleType) {
    if (
      body.trim() &&
      !window.confirm(
        "Thay nội dung hiện tại bằng mẫu bài này? Bản nháp cục bộ vẫn được lưu tự động.",
      )
    ) {
      return;
    }
    setArticleType(type);
    setBody(articleTemplates[type].body);
    setPreview(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function insertMedia(media: WikiMediaValue) {
    const { start, end } = mediaSelectionRef.current;
    const safeAlt = media.alt.replace(/[[\]]/g, "");
    const attribution = [media.caption, media.credit && `Ảnh: ${media.credit}`]
      .filter(Boolean)
      .join(" · ");
    const markdown = `\n\n![${safeAlt}](${media.url})${
      attribution ? `\n\n*${attribution}*` : ""
    }\n\n`;
    setBody(
      (current) => `${current.slice(0, start)}${markdown}${current.slice(end)}`,
    );
    setPreview(false);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const cursor = start + markdown.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insert(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end) || fallback;
    const next = `${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  }
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
        {label}
        {hint ? (
          <span className="font-normal text-slate-400">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-slate-950"
    >
      {children}
    </button>
  );
}

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 320);
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => toSlug(tag))
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

type WikiEditorDraft = {
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  articleType?: ArticleType;
  languageCode?: string;
  tags?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  coverImageCredit?: string;
  changeSummary?: string;
  selectedCitationIds?: string[];
  updatedAt?: string;
};

function hasDraftContent(draft: WikiEditorDraft) {
  return Boolean(
    draft.title?.trim() ||
      draft.summary?.trim() ||
      draft.body?.trim() ||
      draft.tags?.trim() ||
      draft.coverImageUrl?.trim() ||
      draft.changeSummary?.trim() ||
      draft.selectedCitationIds?.length,
  );
}
