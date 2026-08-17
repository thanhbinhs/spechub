"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageIcon, Link2, LoaderCircle, Upload, X } from "lucide-react";

export type WikiMediaValue = {
  url: string;
  alt: string;
  caption: string;
  credit: string;
};

type MediaSource = "library" | "upload" | "url";

const mediaLibrary = [
  {
    url: "/images/devices/iphone-16-pro-max.webp",
    label: "iPhone 16 Pro Max",
    credit: "SpecHub",
  },
  {
    url: "/images/devices/galaxy-s25-ultra.webp",
    label: "Samsung Galaxy S25 Ultra",
    credit: "SpecHub",
  },
  {
    url: "/images/devices/pixel-9-pro.webp",
    label: "Google Pixel 9 Pro",
    credit: "SpecHub",
  },
  {
    url: "/images/devices/iphone-16.webp",
    label: "iPhone 16",
    credit: "SpecHub",
  },
  {
    url: "/images/devices/galaxy-s25.webp",
    label: "Samsung Galaxy S25",
    credit: "SpecHub",
  },
  {
    url: "/images/devices/xiaomi-15.webp",
    label: "Xiaomi 15",
    credit: "SpecHub",
  },
  {
    url: "/images/devices/macbook-air-13-m4.webp",
    label: "MacBook Air 13 M4",
    credit: "SpecHub",
  },
  {
    url: "/images/devices/ipad-pro-13-m4.webp",
    label: "iPad Pro 13 M4",
    credit: "SpecHub",
  },
] as const;

export function WikiMediaDialog({
  open,
  mode,
  initialValue,
  onClose,
  onInsert,
}: {
  open: boolean;
  mode: "cover" | "inline";
  initialValue?: Partial<WikiMediaValue>;
  onClose: () => void;
  onInsert: (value: WikiMediaValue) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<MediaSource>("library");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [fileName, setFileName] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState("");
  const initialUrl = initialValue?.url ?? "";
  const initialAlt = initialValue?.alt ?? "";
  const initialCaption = initialValue?.caption ?? "";
  const initialCredit = initialValue?.credit ?? "";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setUrl(initialUrl);
    setAlt(initialAlt);
    setCaption(initialCaption);
    setCredit(initialCredit);
    setFileName("");
    setError("");
    setSource(
      mediaLibrary.some((item) => item.url === initialUrl)
        ? "library"
        : initialUrl
          ? "url"
          : "library",
    );
  }, [initialAlt, initialCaption, initialCredit, initialUrl, open]);

  const canInsert = Boolean(url.trim() && alt.trim() && !isOptimizing);

  function chooseLibraryItem(item: (typeof mediaLibrary)[number]) {
    setSource("library");
    setUrl(item.url);
    setAlt(item.label);
    setCaption(item.label);
    setCredit(item.credit);
    setError("");
  }

  async function chooseFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Hãy chọn ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Ảnh gốc cần nhỏ hơn 8 MB.");
      return;
    }

    setError("");
    setIsOptimizing(true);
    try {
      const optimizedUrl = await optimizeImage(file);
      setUrl(optimizedUrl);
      setFileName(file.name);
      setAlt((current) => current || file.name.replace(/\.[^.]+$/, ""));
    } catch {
      setError("Không thể xử lý ảnh này. Hãy thử một ảnh khác.");
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="wiki-media-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className="m-auto w-[min(920px,calc(100%-2rem))] max-w-none overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/55"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <p className="app-section-label">
            {mode === "cover" ? "Ảnh đại diện bài viết" : "Ảnh trong nội dung"}
          </p>
          <h2 id="wiki-media-title" className="mt-1 text-xl font-semibold">
            {mode === "cover" ? "Chọn ảnh bìa" : "Chèn ảnh vào bài"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Thêm mô tả ảnh rõ ràng để người dùng trình đọc màn hình vẫn hiểu nội
            dung.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <SourceTab
              active={source === "library"}
              onClick={() => setSource("library")}
              icon={<ImageIcon size={14} />}
            >
              Thư viện
            </SourceTab>
            {mode === "inline" ? (
              <SourceTab
                active={source === "upload"}
                onClick={() => setSource("upload")}
                icon={<Upload size={14} />}
              >
                Tải từ máy
              </SourceTab>
            ) : null}
            <SourceTab
              active={source === "url"}
              onClick={() => setSource("url")}
              icon={<Link2 size={14} />}
            >
              Liên kết
            </SourceTab>
          </div>

          {source === "library" ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {mediaLibrary.map((item) => {
                const selected = url === item.url;
                return (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => chooseLibraryItem(item)}
                    className={`group relative overflow-hidden rounded-xl border bg-slate-50 text-left transition ${
                      selected
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="aspect-[4/3] w-full object-contain p-3 transition group-hover:scale-[1.03]"
                    />
                    <span className="block border-t border-slate-200 bg-white px-2.5 py-2 text-[11px] font-medium leading-4 text-slate-700">
                      {item.label}
                    </span>
                    {selected ? (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white shadow">
                        <Check size={13} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {source === "upload" ? (
            <div className="mt-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => void chooseFile(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void chooseFile(event.dataTransfer.files?.[0]);
                }}
                className="flex min-h-72 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
              >
                {isOptimizing ? (
                  <LoaderCircle
                    size={30}
                    className="animate-spin text-blue-600"
                  />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-blue-700 shadow-sm">
                    <Upload size={21} />
                  </span>
                )}
                <span className="mt-4 text-sm font-semibold text-slate-900">
                  {isOptimizing
                    ? "Đang tối ưu ảnh…"
                    : fileName || "Kéo ảnh vào đây hoặc bấm để chọn"}
                </span>
                <span className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  JPG, PNG hoặc WebP · tối đa 8 MB. Ảnh được thu nhỏ và nén
                  trước khi gắn vào bài.
                </span>
              </button>
            </div>
          ) : null}

          {source === "url" ? (
            <label className="mt-5 block">
              <span className="text-xs font-semibold text-slate-700">
                Địa chỉ ảnh
              </span>
              <div className="relative mt-1.5">
                <Link2
                  size={16}
                  className="pointer-events-none absolute left-3 top-3 text-slate-400"
                />
                <input
                  type="url"
                  value={url.startsWith("data:") ? "" : url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setError("");
                  }}
                  placeholder="https://example.com/anh.webp"
                  className="form-control pl-9"
                />
              </div>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                Chỉ dùng ảnh bạn sở hữu hoặc được phép chia sẻ.
              </span>
            </label>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col bg-slate-50/70 p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                className="aspect-video w-full object-contain p-3"
              />
            ) : (
              <div className="grid aspect-video place-items-center text-slate-300">
                <ImageIcon size={36} />
              </div>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                Mô tả ảnh
                <span className="font-normal text-slate-400">Bắt buộc</span>
              </span>
              <input
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                maxLength={180}
                placeholder="Ví dụ: Hai điện thoại đặt cạnh nhau"
                className="form-control mt-1.5"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Chú thích
              </span>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={2}
                maxLength={240}
                placeholder="Giải thích điều người đọc cần chú ý trong ảnh"
                className="form-control mt-1.5 min-h-20 py-2.5"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Nguồn / tác giả ảnh
              </span>
              <input
                value={credit}
                onChange={(event) => setCredit(event.target.value)}
                maxLength={160}
                placeholder="Ví dụ: SpecHub, Apple Newsroom…"
                className="form-control mt-1.5"
              />
            </label>
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="app-button-secondary"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!canInsert}
              onClick={() => {
                onInsert({
                  url: url.trim(),
                  alt: alt.trim(),
                  caption: caption.trim(),
                  credit: credit.trim(),
                });
                onClose();
              }}
              className="app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImageIcon size={15} />
              {mode === "cover" ? "Dùng làm ảnh bìa" : "Chèn vào bài"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function SourceTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

async function optimizeImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const maxDimension = 1600;
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.width, image.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}
