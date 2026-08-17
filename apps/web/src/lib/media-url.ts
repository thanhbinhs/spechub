const LEGACY_ALLOWED_IMAGE_HOSTS = new Set([
  "cdsassets.apple.com",
  "images.openai.com",
]);

function configuredStorageHost() {
  const value = process.env.NEXT_PUBLIC_STORAGE_CDN_BASE_URL?.trim();
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isRenderableImageUrl(value?: string | null) {
  const source = value?.trim();
  if (!source) return false;
  if (source.startsWith("/") && !source.startsWith("//")) return true;

  try {
    const parsed = new URL(source);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === configuredStorageHost()) {
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    }
    return (
      parsed.protocol === "https:" && LEGACY_ALLOWED_IMAGE_HOSTS.has(hostname)
    );
  } catch {
    return false;
  }
}

export function renderableImageUrl(value?: string | null) {
  return isRenderableImageUrl(value) ? value!.trim() : null;
}

export function youtubeEmbedUrl(value?: string | null) {
  const source = value?.trim();
  if (!source) return null;
  try {
    const parsed = new URL(source);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";
    if (hostname === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      videoId =
        parsed.searchParams.get("v") ??
        (parsed.pathname.startsWith("/embed/")
          ? (parsed.pathname.split("/").filter(Boolean)[1] ?? "")
          : "");
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export function renderableVideoUrl(value?: string | null) {
  const source = value?.trim();
  if (!source) return null;
  if (source.startsWith("/") && !source.startsWith("//")) return source;
  if (youtubeEmbedUrl(source)) return source;

  try {
    const parsed = new URL(source);
    return parsed.hostname.toLowerCase() === configuredStorageHost() &&
      (parsed.protocol === "https:" || parsed.protocol === "http:")
      ? source
      : null;
  } catch {
    return null;
  }
}

export function renderableMediaUrl(
  value: string | null | undefined,
  assetType: "image" | "video",
) {
  return assetType === "video"
    ? renderableVideoUrl(value)
    : renderableImageUrl(value);
}
