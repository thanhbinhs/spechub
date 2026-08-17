import type { HardwareModuleKind, ReleaseStatus } from "@spechub/api-client";

type NamedValue = {
  name?: string | null;
  slug?: string | null;
  code?: string | null;
};

const DEVICE_CATEGORY_LABELS: Record<string, string> = {
  smartphone: "Điện thoại",
  tablet: "Máy tính bảng",
  laptop: "Máy tính xách tay",
  smartwatch: "Đồng hồ thông minh",
  earbuds: "Tai nghe không dây",
  television: "TV thông minh",
  tv: "TV thông minh",
  "gaming-handheld": "Máy chơi game cầm tay",
  "gaming handheld": "Máy chơi game cầm tay",
  "e-reader": "Máy đọc sách điện tử",
  ereader: "Máy đọc sách điện tử",
  desktop: "Máy tính để bàn",
  monitor: "Màn hình máy tính",
};

const RELEASE_STATUS_LABELS: Record<string, string> = {
  released: "Đã phát hành",
  available: "Đang bán",
  announced: "Đã công bố",
  upcoming: "Sắp ra mắt",
  rumored: "Tin đồn",
  rumoured: "Tin đồn",
  delayed: "Hoãn phát hành",
  discontinued: "Ngừng kinh doanh",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  supported: "Còn hỗ trợ",
  "end-of-support": "Hết hỗ trợ",
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  vietnamese: "Tiếng Việt",
  en: "Tiếng Anh",
  english: "Tiếng Anh",
  ja: "Tiếng Nhật",
  japanese: "Tiếng Nhật",
  ko: "Tiếng Hàn",
  korean: "Tiếng Hàn",
  zh: "Tiếng Trung",
  chinese: "Tiếng Trung",
};

const MODULE_LABELS: Record<HardwareModuleKind, string> = {
  chipset: "Chipset",
  cpu: "CPU",
  gpu: "GPU",
  npu: "NPU",
  modem: "Modem",
  "memory-standard": "RAM",
  "storage-standard": "Lưu trữ",
  "operating-system": "Hệ điều hành",
  camera: "Máy ảnh",
  display: "Màn hình",
  battery: "Pin",
};

const ROLE_LABELS: Record<string, string> = {
  main: "Chính",
  soc: "SoC",
  application: "Ứng dụng",
  primary: "Chính",
  secondary: "Phụ",
  internal: "Tích hợp",
  external: "Ngoài",
  front: "Trước",
  rear: "Sau",
  cover: "Màn hình ngoài",
  inner: "Màn hình trong",
  outer: "Màn hình ngoài",
  ultrawide: "Góc siêu rộng",
  "ultra-wide": "Góc siêu rộng",
  telephoto: "Chụp xa",
  periscope: "Tiềm vọng",
  selfie: "Chụp trước",
  graphics: "Đồ họa",
  system: "Hệ thống",
};

export function localizeDeviceCategory(
  category?: NamedValue | string | null,
  fallback = "Thiết bị",
) {
  if (!category) return fallback;
  const name = typeof category === "string" ? category : category.name;
  const slug = typeof category === "string" ? null : category.slug;
  return (
    DEVICE_CATEGORY_LABELS[normalizeKey(slug)] ??
    DEVICE_CATEGORY_LABELS[normalizeKey(name)] ??
    name ??
    fallback
  );
}

export function localizeReleaseStatus(
  status?: Pick<ReleaseStatus, "code" | "name"> | NamedValue | string | null,
  fallback = "Chưa xác định",
) {
  if (!status) return fallback;
  const name = typeof status === "string" ? status : status.name;
  const code = typeof status === "string" ? null : status.code;
  return (
    RELEASE_STATUS_LABELS[normalizeKey(code)] ??
    RELEASE_STATUS_LABELS[normalizeKey(name)] ??
    name ??
    fallback
  );
}

export function localizeLanguage(
  language?: NamedValue | string | null,
  fallback = "Chưa xác định",
) {
  if (!language) return fallback;
  const name = typeof language === "string" ? language : language.name;
  const code = typeof language === "string" ? null : language.code;
  return (
    LANGUAGE_LABELS[normalizeKey(code)] ??
    LANGUAGE_LABELS[normalizeKey(name)] ??
    name ??
    fallback
  );
}

export function localizeModuleKind(kind: HardwareModuleKind | string) {
  return MODULE_LABELS[kind as HardwareModuleKind] ?? kind;
}

export function localizeRole(role?: string | null, fallback = "Chính") {
  if (!role) return fallback;
  return ROLE_LABELS[normalizeKey(role)] ?? role;
}

export function localizeModuleName(name?: string | null, fallback = "Mô-đun") {
  if (!name) return fallback;
  const exactLabels: Record<string, string> = {
    "ambient light sensor": "Cảm biến ánh sáng môi trường",
    "heart rate sensor": "Cảm biến nhịp tim",
    "temperature sensor": "Cảm biến nhiệt độ",
    barometer: "Khí áp kế",
    accelerometer: "Gia tốc kế",
    gyroscope: "Con quay hồi chuyển",
    magnetometer: "Từ kế",
    "proximity sensor": "Cảm biến tiệm cận",
    "fingerprint sensor": "Cảm biến vân tay",
    "embedded memory": "Bộ nhớ tích hợp",
    "apple unified memory": "Bộ nhớ hợp nhất Apple",
  };
  const exact = exactLabels[name.trim().toLocaleLowerCase("vi")];
  if (exact) return exact;

  return name
    .replace(/^(.+?)\s+rear camera$/i, "Camera sau $1")
    .replace(/^(.+?)\s+front camera$/i, "Camera trước $1")
    .replace(/^(.+?)\s+ultrawide camera$/i, "Camera góc siêu rộng $1")
    .replace(/^(.+?)\s+telephoto camera$/i, "Camera chụp xa $1")
    .replace(/^(.+?)\s+firmware$/i, "Phần mềm hệ thống $1")
    .replace(/^(.+?)\s+cover display$/i, "Màn hình ngoài $1")
    .replace(/^(.+?)\s+display$/i, "Màn hình $1")
    .replace(/^(.+?\d+MP)\s+telephoto$/i, "$1 chụp xa")
    .replace(/^(.+?\d+MP)\s+wide$/i, "$1 góc rộng");
}

export function localizeDescription(value?: string | null) {
  if (!value) return value;
  return value
    .replace(/\bCamera phone\b/gi, "Điện thoại chụp ảnh")
    .replace(/\bUltrabook\b/gi, "Máy tính xách tay siêu mỏng nhẹ")
    .replace(/\bLaptop\b/g, "Máy tính xách tay")
    .replace(/\bTablet\b/g, "Máy tính bảng")
    .replace(/\bSmartwatch\b/g, "Đồng hồ thông minh")
    .replace(/\bFlagship\b/g, "Mẫu cao cấp")
    .replace(/\bcamera tele\b/gi, "camera chụp xa")
    .replace(/\bPC gaming\b/gi, "máy chơi game PC");
}

function normalizeKey(value?: string | null) {
  return value?.trim().toLocaleLowerCase("vi").replace(/_/g, "-") ?? "";
}
