// ============================================================
// SpecHub - Seed Data
// ============================================================
// Chạy: pnpm db:seed
//
// Seed dữ liệu mẫu thực tế:
// - 26 organizations, gồm các hãng phổ biến ở nhiều phân khúc
// - 8 device categories
// - 77 product families
// - 188 device models trong catalog đa danh mục, phủ đủ 8 nhóm thiết bị
// - 92 device variants
// - Components cho mobile, tablet, laptop, wearable và audio
// - Phase 2 data sources/citation sources
// - Benchmark đo trực tiếp và điểm tham chiếu có nguồn cho mọi variant
// - Phase 3 affiliate partners/links
// - Admin user (admin@spechub.io / admin123)
// ============================================================

import { PrismaClient } from "../generated/client";
import * as bcrypt from "bcryptjs";
import {
  EXTENDED_CATALOG_MODULES as BASE_EXTENDED_CATALOG_MODULES,
  EXTENDED_CATALOG_OPERATING_SYSTEMS,
} from "./extended-catalog-modules";
import {
  ADDITIONAL_CATALOG_DEVICES,
  ADDITIONAL_CATALOG_MODULES,
  ADDITIONAL_CATALOG_ORGANIZATIONS,
} from "./catalog-expansion-50";
import {
  CATALOG_EXPANSION_100_DEVICES,
  CATALOG_EXPANSION_100_MODULES,
  CATALOG_EXPANSION_100_ORGANIZATIONS,
  CATALOG_EXPANSION_100_STALE_DUPLICATE_VARIANTS,
} from "./catalog-expansion-100";
import {
  HISTORIC_CATALOG_DEVICES,
  HISTORIC_CATALOG_MODULES,
  HISTORIC_CATALOG_ORGANIZATIONS,
} from "./catalog-history-expansion";
import {
  CPU_BENCHMARK_REFERENCES,
  ENDURANCE_BENCHMARK_REFERENCES,
  TV_INPUT_LAG_BENCHMARK_REFERENCES,
} from "./benchmark-coverage";
import { seedVariantScorecards } from "./scoring/seed-scorecards";
import { seedWikiContent } from "./seed-wiki-content";
import {
  COMPLETE_IPHONE_MODEL_COUNT,
  seedCompleteIphoneCatalog,
} from "./iphone-catalog";
import { seedCatalogReferenceData } from "./seed-catalog-reference-data";
import { enrichCatalogModules } from "./catalog-module-enrichment";
import { seedSnapdragonCatalog } from "./seed-snapdragon-catalog";
import catalogImageSources from "./catalog-image-sources.json";

const prisma = new PrismaClient();
const process = (globalThis as any).process;
const CURATED_CATALOG_SCOPE = "curated-58";
const isCuratedCatalogSeed =
  process.env.SPECHUB_SEED_SCOPE === CURATED_CATALOG_SCOPE;

type DisplayUnitCreateData = Parameters<
  PrismaClient["display_units"]["create"]
>[0]["data"];
type BatteryUnitCreateData = Parameters<
  PrismaClient["battery_units"]["create"]
>[0]["data"];
type CpuCreateData = Parameters<PrismaClient["cpus"]["create"]>[0]["data"];
type GpuCreateData = Parameters<PrismaClient["gpus"]["create"]>[0]["data"];
type NpuCreateData = Parameters<PrismaClient["npus"]["create"]>[0]["data"];
type ModemCreateData = Parameters<PrismaClient["modems"]["create"]>[0]["data"];
type MemoryStandardCreateData = Parameters<
  PrismaClient["memory_standards"]["create"]
>[0]["data"];
type StorageStandardCreateData = Parameters<
  PrismaClient["storage_standards"]["create"]
>[0]["data"];
type OperatingSystemCreateData = Parameters<
  PrismaClient["operating_systems"]["create"]
>[0]["data"];
type CitationCreateData = Parameters<
  PrismaClient["citations"]["create"]
>[0]["data"];
type BenchmarkRunCreateData = Parameters<
  PrismaClient["benchmark_runs"]["create"]
>[0]["data"];
type DeviceBenchmarkCreateData = Parameters<
  PrismaClient["device_variant_benchmarks"]["create"]
>[0]["data"];

type CatalogDeviceSeed = {
  brandSlug: string;
  categorySlug: string;
  familyName: string;
  familySlug: string;
  modelName: string;
  modelSlug: string;
  announcementDate: string;
  releaseDate: string;
  generation: string;
  description: string;
  sourceUrl?: string;
  variantName: string;
  skuCode?: string;
  colorName: string;
  colorHex: string;
  launchPrice: number;
  heightMm: number;
  widthMm: number;
  thicknessMm: number;
  weightG: number;
  ingressProtection?: string;
  frameMaterial?: string;
  backMaterial?: string;
  speakerCount?: number;
  audioTuning?: string;
  headphoneJack?: boolean;
  microSd?: boolean;
  ioNotes?: string;
};

const BASE_EXTENDED_CATALOG_ORGANIZATIONS = [
  {
    name: "OnePlus Technology",
    slug: "oneplus",
    shortName: "OnePlus",
    countryCode: "CN",
    websiteUrl: "https://www.oneplus.com",
  },
  {
    name: "OPPO Electronics",
    slug: "oppo",
    shortName: "OPPO",
    countryCode: "CN",
    websiteUrl: "https://www.oppo.com",
  },
  {
    name: "Vivo Mobile Communication",
    slug: "vivo",
    shortName: "vivo",
    countryCode: "CN",
    websiteUrl: "https://www.vivo.com",
  },
  {
    name: "Nothing Technology Limited",
    slug: "nothing",
    shortName: "Nothing",
    countryCode: "GB",
    websiteUrl: "https://nothing.tech",
  },
  {
    name: "Huawei Technologies",
    slug: "huawei",
    shortName: "Huawei",
    countryCode: "CN",
    websiteUrl: "https://www.huawei.com",
  },
  {
    name: "Microsoft Corporation",
    slug: "microsoft",
    shortName: "Microsoft",
    countryCode: "US",
    websiteUrl: "https://www.microsoft.com",
  },
  {
    name: "Dell Technologies",
    slug: "dell",
    shortName: "Dell",
    countryCode: "US",
    websiteUrl: "https://www.dell.com",
  },
  {
    name: "ASUSTeK Computer",
    slug: "asus",
    shortName: "ASUS",
    countryCode: "TW",
    websiteUrl: "https://www.asus.com",
  },
  {
    name: "Lenovo Group",
    slug: "lenovo",
    shortName: "Lenovo",
    countryCode: "CN",
    websiteUrl: "https://www.lenovo.com",
  },
  {
    name: "Garmin Ltd.",
    slug: "garmin",
    shortName: "Garmin",
    countryCode: "CH",
    websiteUrl: "https://www.garmin.com",
  },
  {
    name: "Bose Corporation",
    slug: "bose",
    shortName: "Bose",
    countryCode: "US",
    websiteUrl: "https://www.bose.com",
  },
  {
    name: "LG Electronics",
    slug: "lg",
    shortName: "LG",
    countryCode: "KR",
    websiteUrl: "https://www.lg.com",
  },
  {
    name: "Nintendo Co., Ltd.",
    slug: "nintendo",
    shortName: "Nintendo",
    countryCode: "JP",
    websiteUrl: "https://www.nintendo.com",
  },
  {
    name: "Valve Corporation",
    slug: "valve",
    shortName: "Valve",
    countryCode: "US",
    websiteUrl: "https://www.valvesoftware.com",
  },
  {
    name: "Amazon.com, Inc.",
    slug: "amazon-devices",
    shortName: "Amazon",
    countryCode: "US",
    websiteUrl: "https://www.amazon.com",
  },
  {
    name: "NVIDIA Corporation",
    slug: "nvidia",
    shortName: "NVIDIA",
    countryCode: "US",
    websiteUrl: "https://www.nvidia.com",
  },
  {
    name: "Advanced Micro Devices, Inc.",
    slug: "amd",
    shortName: "AMD",
    countryCode: "US",
    websiteUrl: "https://www.amd.com",
  },
  {
    name: "Intel Corporation",
    slug: "intel",
    shortName: "Intel",
    countryCode: "US",
    websiteUrl: "https://www.intel.com",
  },
] as const;

const EXTENDED_CATALOG_ORGANIZATIONS = isCuratedCatalogSeed
  ? ([
      ...BASE_EXTENDED_CATALOG_ORGANIZATIONS,
      ...ADDITIONAL_CATALOG_ORGANIZATIONS,
    ] as const)
  : ([
      ...BASE_EXTENDED_CATALOG_ORGANIZATIONS,
      ...ADDITIONAL_CATALOG_ORGANIZATIONS,
      ...CATALOG_EXPANSION_100_ORGANIZATIONS,
      ...HISTORIC_CATALOG_ORGANIZATIONS,
    ] as const);

const EXTENDED_CATALOG_CATEGORIES = [
  {
    name: "TV thông minh",
    slug: "television",
    description: "TV thông minh và màn hình giải trí gia đình",
    displayOrder: 6,
  },
  {
    name: "Máy chơi game cầm tay",
    slug: "gaming-handheld",
    description: "Máy chơi game cầm tay",
    displayOrder: 7,
  },
  {
    name: "Máy đọc sách điện tử",
    slug: "e-reader",
    description: "Máy đọc sách điện tử",
    displayOrder: 8,
  },
] as const;

const BASE_EXTENDED_CATALOG_DEVICES: CatalogDeviceSeed[] = [
  {
    brandSlug: "apple",
    categorySlug: "smartphone",
    familyName: "iPhone 16 Series",
    familySlug: "iphone-16-series",
    modelName: "iPhone 16",
    modelSlug: "iphone-16",
    announcementDate: "2024-09-09",
    releaseDate: "2024-09-20",
    generation: "Gen 18",
    description:
      "Điện thoại cân bằng với Apple A18, màn hình OLED 6,1 inch và Camera Control.",
    variantName: "128GB Ultramarine",
    skuCode: "MYEC3LL/A",
    colorName: "Ultramarine",
    colorHex: "#5F79B7",
    launchPrice: 799,
    heightMm: 147.6,
    widthMm: 71.6,
    thicknessMm: 7.8,
    weightG: 170,
    ingressProtection: "IP68",
    frameMaterial: "Aluminum",
    backMaterial: "Color-infused glass",
    speakerCount: 2,
  },
  {
    brandSlug: "samsung",
    categorySlug: "smartphone",
    familyName: "Galaxy Z Fold6 Series",
    familySlug: "galaxy-z-fold6-series",
    modelName: "Galaxy Z Fold6",
    modelSlug: "galaxy-z-fold6",
    announcementDate: "2024-07-10",
    releaseDate: "2024-07-24",
    generation: "Fold6",
    description:
      "Smartphone gập dạng sách với hai màn hình AMOLED, hỗ trợ S Pen và Galaxy AI.",
    variantName: "12GB/256GB Silver Shadow",
    skuCode: "SM-F956UZSAXAA",
    colorName: "Silver Shadow",
    colorHex: "#B9B8B3",
    launchPrice: 1899.99,
    heightMm: 153.5,
    widthMm: 132.6,
    thicknessMm: 5.6,
    weightG: 239,
    ingressProtection: "IP48",
    frameMaterial: "Armor Aluminum",
    backMaterial: "Gorilla Glass Victus 2",
    speakerCount: 2,
  },
  {
    brandSlug: "google",
    categorySlug: "smartphone",
    familyName: "Pixel 9 Series",
    familySlug: "pixel-9-series",
    modelName: "Pixel 9a",
    modelSlug: "pixel-9a",
    announcementDate: "2025-03-19",
    releaseDate: "2025-04-10",
    generation: "Gen 9a",
    description:
      "Pixel tầm trung với Tensor G4, camera xử lý bằng AI và thời gian hỗ trợ dài.",
    variantName: "128GB Obsidian",
    skuCode: "GA05769-US",
    colorName: "Obsidian",
    colorHex: "#2D2D2F",
    launchPrice: 499,
    heightMm: 154.7,
    widthMm: 73.3,
    thicknessMm: 8.9,
    weightG: 185.9,
    ingressProtection: "IP68",
    frameMaterial: "Aluminum",
    backMaterial: "Composite",
    speakerCount: 2,
  },
  {
    brandSlug: "xiaomi",
    categorySlug: "smartphone",
    familyName: "Xiaomi 15 Series",
    familySlug: "xiaomi-15-series",
    modelName: "Xiaomi 15",
    modelSlug: "xiaomi-15",
    announcementDate: "2024-10-29",
    releaseDate: "2024-10-31",
    generation: "Gen 15",
    description:
      "Flagship nhỏ gọn với Snapdragon 8 Elite, cụm camera Leica và sạc nhanh.",
    variantName: "12GB/256GB Black",
    colorName: "Black",
    colorHex: "#171717",
    launchPrice: 999,
    heightMm: 152.3,
    widthMm: 71.2,
    thicknessMm: 8.1,
    weightG: 191,
    ingressProtection: "IP68",
    frameMaterial: "Aluminum",
    backMaterial: "Glass",
    speakerCount: 2,
    audioTuning: "Dolby Atmos",
  },
  {
    brandSlug: "sony",
    categorySlug: "smartphone",
    familyName: "Xperia 1 Series",
    familySlug: "xperia-1-series",
    modelName: "Xperia 1 VI",
    modelSlug: "sony-xperia-1-vi",
    announcementDate: "2024-05-15",
    releaseDate: "2024-06-03",
    generation: "Mark VI",
    description:
      "Flagship Sony tập trung camera, màn hình OLED và trải nghiệm âm thanh có dây.",
    variantName: "12GB/256GB Khaki Green",
    colorName: "Khaki Green",
    colorHex: "#687267",
    launchPrice: 1399,
    heightMm: 162,
    widthMm: 74,
    thicknessMm: 8.2,
    weightG: 192,
    ingressProtection: "IP65/IP68",
    frameMaterial: "Aluminum",
    backMaterial: "Gorilla Glass Victus",
    speakerCount: 2,
    audioTuning: "Hi-Res Audio",
    headphoneJack: true,
    microSd: true,
  },
  {
    brandSlug: "oneplus",
    categorySlug: "smartphone",
    familyName: "OnePlus 13 Series",
    familySlug: "oneplus-13-series",
    modelName: "OnePlus 13",
    modelSlug: "oneplus-13",
    announcementDate: "2024-10-31",
    releaseDate: "2024-11-01",
    generation: "Gen 13",
    description:
      "Flagship hiệu năng cao với Snapdragon 8 Elite, pin silicon-carbon và camera Hasselblad.",
    variantName: "12GB/256GB Midnight Ocean",
    colorName: "Midnight Ocean",
    colorHex: "#23435A",
    launchPrice: 899.99,
    heightMm: 162.9,
    widthMm: 76.5,
    thicknessMm: 8.5,
    weightG: 213,
    ingressProtection: "IP68/IP69",
    frameMaterial: "Aluminum",
    backMaterial: "Vegan leather",
    speakerCount: 2,
    audioTuning: "Dolby Atmos",
  },
  {
    brandSlug: "oppo",
    categorySlug: "smartphone",
    familyName: "Find X8 Series",
    familySlug: "oppo-find-x8-series",
    modelName: "OPPO Find X8 Pro",
    modelSlug: "oppo-find-x8-pro",
    announcementDate: "2024-10-24",
    releaseDate: "2024-10-30",
    generation: "Find X8",
    description:
      "Camera phone cao cấp với bốn camera Hasselblad, Dimensity 9400 và sạc SuperVOOC.",
    variantName: "16GB/512GB Space Black",
    colorName: "Space Black",
    colorHex: "#1B1B1D",
    launchPrice: 1199,
    heightMm: 162.3,
    widthMm: 76.7,
    thicknessMm: 8.2,
    weightG: 215,
    ingressProtection: "IP68/IP69",
    frameMaterial: "Aluminum",
    backMaterial: "Glass",
    speakerCount: 2,
  },
  {
    brandSlug: "vivo",
    categorySlug: "smartphone",
    familyName: "X200 Series",
    familySlug: "vivo-x200-series",
    modelName: "vivo X200 Pro",
    modelSlug: "vivo-x200-pro",
    announcementDate: "2024-10-14",
    releaseDate: "2024-10-19",
    generation: "X200",
    description:
      "Flagship nhiếp ảnh với ống kính ZEISS, camera tele 200MP và pin dung lượng lớn.",
    variantName: "16GB/512GB Titanium Gray",
    colorName: "Titanium Gray",
    colorHex: "#9C9A95",
    launchPrice: 1199,
    heightMm: 162.4,
    widthMm: 76,
    thicknessMm: 8.2,
    weightG: 223,
    ingressProtection: "IP68/IP69",
    frameMaterial: "Aluminum",
    backMaterial: "Glass",
    speakerCount: 2,
    audioTuning: "Hi-Res Audio",
  },
  {
    brandSlug: "nothing",
    categorySlug: "smartphone",
    familyName: "Nothing Phone Series",
    familySlug: "nothing-phone-series",
    modelName: "Nothing Phone (2)",
    modelSlug: "nothing-phone-2",
    announcementDate: "2023-07-11",
    releaseDate: "2023-07-17",
    generation: "Phone 2",
    description:
      "Điện thoại thiết kế trong suốt với giao diện Glyph, Nothing OS và hiệu năng cân bằng.",
    variantName: "12GB/256GB White",
    skuCode: "A065-WHT-12-256",
    colorName: "White",
    colorHex: "#E8E6E1",
    launchPrice: 699,
    heightMm: 162.1,
    widthMm: 76.4,
    thicknessMm: 8.6,
    weightG: 201.2,
    ingressProtection: "IP54",
    frameMaterial: "Recycled aluminum",
    backMaterial: "Glass",
    speakerCount: 2,
  },
  {
    brandSlug: "huawei",
    categorySlug: "smartphone",
    familyName: "Pura 70 Series",
    familySlug: "huawei-pura-70-series",
    modelName: "Huawei Pura 70 Ultra",
    modelSlug: "huawei-pura-70-ultra",
    announcementDate: "2024-04-18",
    releaseDate: "2024-04-29",
    generation: "Pura 70",
    description:
      "Camera phone cao cấp với cảm biến chính có cơ chế thò thụt và thiết kế da họa tiết.",
    variantName: "16GB/512GB Green",
    colorName: "Green",
    colorHex: "#4B6C5A",
    launchPrice: 1499,
    heightMm: 162.6,
    widthMm: 75.1,
    thicknessMm: 8.4,
    weightG: 226,
    ingressProtection: "IP68",
    frameMaterial: "Aluminum",
    backMaterial: "Vegan leather",
    speakerCount: 2,
  },
  {
    brandSlug: "samsung",
    categorySlug: "tablet",
    familyName: "Galaxy Tab S10 Series",
    familySlug: "galaxy-tab-s10-series",
    modelName: "Galaxy Tab S10 Ultra",
    modelSlug: "galaxy-tab-s10-ultra",
    announcementDate: "2024-09-26",
    releaseDate: "2024-10-03",
    generation: "Tab S10",
    description:
      "Tablet Android 14,6 inch cho đa nhiệm, đi kèm S Pen và các tính năng Galaxy AI.",
    variantName: "12GB/256GB Wi-Fi Moonstone Gray",
    skuCode: "SM-X920NZAAXAR",
    colorName: "Moonstone Gray",
    colorHex: "#6A6B6C",
    launchPrice: 1199.99,
    heightMm: 208.6,
    widthMm: 326.4,
    thicknessMm: 5.4,
    weightG: 718,
    ingressProtection: "IP68",
    frameMaterial: "Armor Aluminum",
    speakerCount: 4,
    audioTuning: "AKG",
    microSd: true,
  },
  {
    brandSlug: "apple",
    categorySlug: "tablet",
    familyName: "iPad mini Series",
    familySlug: "ipad-mini-series",
    modelName: "iPad mini (A17 Pro)",
    modelSlug: "ipad-mini-a17-pro",
    announcementDate: "2024-10-15",
    releaseDate: "2024-10-23",
    generation: "7th gen",
    description:
      "Tablet nhỏ gọn 8,3 inch với A17 Pro, Apple Intelligence và hỗ trợ Apple Pencil Pro.",
    variantName: "128GB Wi-Fi Space Gray",
    skuCode: "MXN63LL/A",
    colorName: "Space Gray",
    colorHex: "#6E6E73",
    launchPrice: 499,
    heightMm: 195.4,
    widthMm: 134.8,
    thicknessMm: 6.3,
    weightG: 293,
    frameMaterial: "Aluminum",
    speakerCount: 2,
  },
  {
    brandSlug: "oneplus",
    categorySlug: "tablet",
    familyName: "OnePlus Pad Series",
    familySlug: "oneplus-pad-series",
    modelName: "OnePlus Pad 2",
    modelSlug: "oneplus-pad-2",
    announcementDate: "2024-07-16",
    releaseDate: "2024-07-30",
    generation: "Pad 2",
    description:
      "Tablet hiệu năng cao với màn hình 12,1 inch 144Hz và Snapdragon 8 Gen 3.",
    variantName: "12GB/256GB Nimbus Gray",
    colorName: "Nimbus Gray",
    colorHex: "#777A7A",
    launchPrice: 549.99,
    heightMm: 195.1,
    widthMm: 268.7,
    thicknessMm: 6.5,
    weightG: 584,
    frameMaterial: "Aluminum",
    speakerCount: 6,
    audioTuning: "Dolby Atmos",
  },
  {
    brandSlug: "microsoft",
    categorySlug: "tablet",
    familyName: "Surface Pro Series",
    familySlug: "surface-pro-series",
    modelName: "Surface Pro 11",
    modelSlug: "surface-pro-11",
    announcementDate: "2024-05-20",
    releaseDate: "2024-06-18",
    generation: "11th Edition",
    description:
      "Máy tính bảng Windows Copilot+ với Snapdragon X, chân đế tích hợp và bàn phím rời.",
    variantName: "Snapdragon X Plus 16GB/256GB Platinum",
    skuCode: "ZHX-00001",
    colorName: "Platinum",
    colorHex: "#D6D5D2",
    launchPrice: 999.99,
    heightMm: 209,
    widthMm: 287,
    thicknessMm: 9.3,
    weightG: 895,
    frameMaterial: "Anodized aluminum",
    speakerCount: 2,
    audioTuning: "Dolby Atmos",
  },
  {
    brandSlug: "apple",
    categorySlug: "laptop",
    familyName: "MacBook Air M4 Series",
    familySlug: "macbook-air-m4-series",
    modelName: "MacBook Air 13-inch M4",
    modelSlug: "macbook-air-13-m4",
    announcementDate: "2025-03-05",
    releaseDate: "2025-03-12",
    generation: "M4",
    description:
      "Ultrabook không quạt với Apple M4, thiết kế mỏng nhẹ và pin dùng cả ngày.",
    variantName: "16GB/256GB Sky Blue",
    skuCode: "MW123LL/A",
    colorName: "Sky Blue",
    colorHex: "#A9B7C2",
    launchPrice: 999,
    heightMm: 215,
    widthMm: 304.1,
    thicknessMm: 11.3,
    weightG: 1240,
    frameMaterial: "Recycled aluminum",
    speakerCount: 4,
    audioTuning: "Spatial Audio",
  },
  {
    brandSlug: "dell",
    categorySlug: "laptop",
    familyName: "XPS 13 Series",
    familySlug: "dell-xps-13-series",
    modelName: "Dell XPS 13 9345",
    modelSlug: "dell-xps-13-9345",
    announcementDate: "2024-05-20",
    releaseDate: "2024-06-18",
    generation: "9345",
    description:
      "Laptop Copilot+ nhỏ gọn với Snapdragon X Elite, viền màn hình mỏng và thân nhôm.",
    variantName: "16GB/512GB Graphite",
    skuCode: "XPS9345-7688GRY-PUS",
    colorName: "Graphite",
    colorHex: "#454545",
    launchPrice: 1299,
    heightMm: 199.1,
    widthMm: 295.3,
    thicknessMm: 15.3,
    weightG: 1190,
    frameMaterial: "CNC machined aluminum",
    speakerCount: 4,
    audioTuning: "Waves MaxxAudio Pro",
  },
  {
    brandSlug: "asus",
    categorySlug: "laptop",
    familyName: "ROG Zephyrus G14 Series",
    familySlug: "rog-zephyrus-g14-series",
    modelName: "ROG Zephyrus G14 (2024)",
    modelSlug: "asus-rog-zephyrus-g14-2024",
    announcementDate: "2024-01-08",
    releaseDate: "2024-02-06",
    generation: "GA403",
    description:
      "Laptop gaming 14 inch với màn hình OLED, GPU rời và thiết kế nhôm gọn nhẹ.",
    variantName: "16GB/1TB Eclipse Gray",
    skuCode: "GA403UV-G14.R94060",
    colorName: "Eclipse Gray",
    colorHex: "#53565A",
    launchPrice: 1599.99,
    heightMm: 220,
    widthMm: 311,
    thicknessMm: 15.9,
    weightG: 1500,
    frameMaterial: "CNC aluminum",
    speakerCount: 6,
    audioTuning: "Dolby Atmos",
    ioNotes: "USB4, USB-C, USB-A, HDMI 2.1 và khe microSD UHS-II.",
  },
  {
    brandSlug: "lenovo",
    categorySlug: "laptop",
    familyName: "ThinkPad X1 Carbon Series",
    familySlug: "thinkpad-x1-carbon-series",
    modelName: "ThinkPad X1 Carbon Gen 13 Aura Edition",
    modelSlug: "thinkpad-x1-carbon-gen-13",
    announcementDate: "2024-09-05",
    releaseDate: "2024-11-01",
    generation: "Gen 13",
    description:
      "Laptop doanh nghiệp siêu nhẹ với Intel Core Ultra, bàn phím ThinkPad và bảo mật phần cứng.",
    variantName: "32GB/1TB Black",
    skuCode: "21NX000QUS",
    colorName: "Black",
    colorHex: "#171717",
    launchPrice: 2519,
    heightMm: 214.8,
    widthMm: 312.8,
    thicknessMm: 14.4,
    weightG: 986,
    frameMaterial: "Carbon fiber and magnesium",
    speakerCount: 4,
    audioTuning: "Dolby Atmos",
    headphoneJack: true,
  },
  {
    brandSlug: "microsoft",
    categorySlug: "laptop",
    familyName: "Surface Laptop Series",
    familySlug: "surface-laptop-series",
    modelName: "Surface Laptop 7 13.8-inch",
    modelSlug: "surface-laptop-7-13",
    announcementDate: "2024-05-20",
    releaseDate: "2024-06-18",
    generation: "7th Edition",
    description:
      "Laptop Copilot+ với Snapdragon X Elite, màn hình cảm ứng và thời lượng pin dài.",
    variantName: "16GB/512GB Platinum",
    skuCode: "ZGM-00001",
    colorName: "Platinum",
    colorHex: "#D8D8D5",
    launchPrice: 1199.99,
    heightMm: 220,
    widthMm: 301,
    thicknessMm: 17.5,
    weightG: 1340,
    frameMaterial: "Anodized aluminum",
    speakerCount: 2,
    audioTuning: "Dolby Atmos",
  },
  {
    brandSlug: "apple",
    categorySlug: "smartwatch",
    familyName: "Apple Watch Series 10",
    familySlug: "apple-watch-series-10",
    modelName: "Apple Watch Series 10 46mm",
    modelSlug: "apple-watch-series-10-46mm",
    announcementDate: "2024-09-09",
    releaseDate: "2024-09-20",
    generation: "Series 10",
    description:
      "Apple Watch mỏng với màn hình góc rộng, cảm biến sức khỏe và sạc nhanh.",
    variantName: "46mm Jet Black GPS",
    skuCode: "MWWQ3LL/A",
    colorName: "Jet Black",
    colorHex: "#111315",
    launchPrice: 429,
    heightMm: 46,
    widthMm: 39,
    thicknessMm: 9.7,
    weightG: 36.4,
    ingressProtection: "5ATM / IP6X",
    frameMaterial: "Aluminum",
    speakerCount: 1,
  },
  {
    brandSlug: "garmin",
    categorySlug: "smartwatch",
    familyName: "fēnix 8 Series",
    familySlug: "garmin-fenix-8-series",
    modelName: "Garmin fēnix 8 AMOLED 47mm",
    modelSlug: "garmin-fenix-8-amoled-47mm",
    announcementDate: "2024-08-27",
    releaseDate: "2024-08-27",
    generation: "fēnix 8",
    description:
      "Đồng hồ đa môn thể thao với màn hình AMOLED, bản đồ ngoại tuyến và đèn pin LED.",
    variantName: "47mm Slate Gray",
    skuCode: "010-02904-00",
    colorName: "Slate Gray",
    colorHex: "#4F5557",
    launchPrice: 1099.99,
    heightMm: 47,
    widthMm: 47,
    thicknessMm: 13.8,
    weightG: 73,
    ingressProtection: "10ATM",
    frameMaterial: "Titanium and fiber-reinforced polymer",
    speakerCount: 1,
  },
  {
    brandSlug: "google",
    categorySlug: "smartwatch",
    familyName: "Pixel Watch 3 Series",
    familySlug: "pixel-watch-3-series",
    modelName: "Pixel Watch 3 45mm",
    modelSlug: "pixel-watch-3-45mm",
    announcementDate: "2024-08-13",
    releaseDate: "2024-09-10",
    generation: "Gen 3",
    description:
      "Smartwatch Wear OS với màn hình Actua lớn, GPS và hệ sinh thái theo dõi Fitbit.",
    variantName: "45mm Matte Black Wi-Fi",
    skuCode: "GA05786-US",
    colorName: "Matte Black",
    colorHex: "#202224",
    launchPrice: 399.99,
    heightMm: 45,
    widthMm: 45,
    thicknessMm: 12.3,
    weightG: 37,
    ingressProtection: "5ATM / IP68",
    frameMaterial: "Recycled aluminum",
    speakerCount: 1,
  },
  {
    brandSlug: "samsung",
    categorySlug: "earbuds",
    familyName: "Galaxy Buds Series",
    familySlug: "galaxy-buds-series",
    modelName: "Galaxy Buds3 Pro",
    modelSlug: "galaxy-buds3-pro",
    announcementDate: "2024-07-10",
    releaseDate: "2024-07-24",
    generation: "Buds3 Pro",
    description:
      "Tai nghe true wireless với chống ồn chủ động, driver kép và âm thanh thích ứng.",
    variantName: "Silver",
    skuCode: "SM-R630NZAAUSA",
    colorName: "Silver",
    colorHex: "#B8B9BA",
    launchPrice: 249.99,
    heightMm: 48.7,
    widthMm: 58.9,
    thicknessMm: 24.4,
    weightG: 46.5,
    ingressProtection: "IP57 earbuds",
    backMaterial: "Polycarbonate",
    speakerCount: 2,
    audioTuning: "Samsung Seamless Codec",
    ioNotes: "Kích thước và khối lượng tính theo hộp sạc.",
  },
  {
    brandSlug: "sony",
    categorySlug: "earbuds",
    familyName: "Sony 1000X Series",
    familySlug: "sony-1000x-earbuds-series",
    modelName: "Sony WF-1000XM5",
    modelSlug: "sony-wf-1000xm5",
    announcementDate: "2023-07-24",
    releaseDate: "2023-08-04",
    generation: "XM5",
    description:
      "Tai nghe chống ồn cao cấp nhỏ gọn, hỗ trợ LDAC và âm thanh độ phân giải cao.",
    variantName: "Black",
    skuCode: "WF1000XM5/B",
    colorName: "Black",
    colorHex: "#1D1D1F",
    launchPrice: 299.99,
    heightMm: 40,
    widthMm: 64.6,
    thicknessMm: 26.5,
    weightG: 39,
    ingressProtection: "IPX4 earbuds",
    backMaterial: "Polycarbonate",
    speakerCount: 2,
    audioTuning: "Sony Integrated Processor V2",
    ioNotes: "Kích thước và khối lượng tính theo hộp sạc.",
  },
  {
    brandSlug: "bose",
    categorySlug: "earbuds",
    familyName: "QuietComfort Ultra Earbuds Series",
    familySlug: "bose-quietcomfort-ultra-earbuds-series",
    modelName: "Bose QuietComfort Ultra Earbuds",
    modelSlug: "bose-quietcomfort-ultra-earbuds",
    announcementDate: "2023-09-14",
    releaseDate: "2023-10-03",
    generation: "Ultra",
    description:
      "Tai nghe ANC cao cấp với CustomTune, Immersive Audio và thiết kế bám tai.",
    variantName: "Moonstone Blue",
    skuCode: "882826-0030",
    colorName: "Moonstone Blue",
    colorHex: "#8DA3B8",
    launchPrice: 299,
    heightMm: 26.7,
    widthMm: 66.3,
    thicknessMm: 59.4,
    weightG: 60,
    ingressProtection: "IPX4 earbuds",
    backMaterial: "Polycarbonate",
    speakerCount: 2,
    audioTuning: "Bose CustomTune",
    ioNotes: "Kích thước và khối lượng tính theo hộp sạc.",
  },
  {
    brandSlug: "lg",
    categorySlug: "television",
    familyName: "LG OLED evo G Series",
    familySlug: "lg-oled-evo-g-series",
    modelName: "LG OLED evo G4 65-inch",
    modelSlug: "lg-oled-evo-g4-65",
    announcementDate: "2024-01-03",
    releaseDate: "2024-03-01",
    generation: "G4",
    description:
      "TV OLED 4K cao cấp với tấm nền sáng, bộ xử lý AI và tần số quét đến 144Hz.",
    variantName: "65-inch Graphite",
    skuCode: "OLED65G4SUB",
    colorName: "Graphite",
    colorHex: "#2D2E30",
    launchPrice: 3399.99,
    heightMm: 910,
    widthMm: 1441,
    thicknessMm: 263,
    weightG: 29800,
    frameMaterial: "Metal",
    backMaterial: "Composite",
    speakerCount: 6,
    audioTuning: "Dolby Atmos",
    ioNotes: "Bốn cổng HDMI 2.1, eARC, Wi-Fi và Ethernet.",
  },
  {
    brandSlug: "sony",
    categorySlug: "television",
    familyName: "Sony BRAVIA 9 Series",
    familySlug: "sony-bravia-9-series",
    modelName: "Sony BRAVIA 9 65-inch",
    modelSlug: "sony-bravia-9-65",
    announcementDate: "2024-04-17",
    releaseDate: "2024-05-01",
    generation: "BRAVIA 9",
    description:
      "TV Mini LED 4K cao cấp với Google TV, XR Backlight Master Drive và âm thanh đa hướng.",
    variantName: "65-inch Black",
    skuCode: "K-65XR90",
    colorName: "Black",
    colorHex: "#171819",
    launchPrice: 3299.99,
    heightMm: 862,
    widthMm: 1447,
    thicknessMm: 345,
    weightG: 32900,
    frameMaterial: "Aluminum",
    backMaterial: "Composite",
    speakerCount: 8,
    audioTuning: "Acoustic Multi-Audio+",
    ioNotes: "Bốn cổng HDMI, trong đó hai cổng hỗ trợ HDMI 2.1.",
  },
  {
    brandSlug: "nintendo",
    categorySlug: "gaming-handheld",
    familyName: "Nintendo Switch Series",
    familySlug: "nintendo-switch-series",
    modelName: "Nintendo Switch OLED",
    modelSlug: "nintendo-switch-oled",
    announcementDate: "2021-07-06",
    releaseDate: "2021-10-08",
    generation: "OLED Model",
    description:
      "Máy chơi game lai với màn hình OLED 7 inch, Joy-Con tháo rời và dock xuất hình TV.",
    variantName: "64GB White",
    skuCode: "HEGSKAAAA",
    colorName: "White",
    colorHex: "#F2F2F2",
    launchPrice: 349.99,
    heightMm: 102,
    widthMm: 242,
    thicknessMm: 13.9,
    weightG: 420,
    frameMaterial: "Polycarbonate",
    speakerCount: 2,
    headphoneJack: true,
    microSd: true,
    ioNotes: "USB-C trên máy, HDMI và Ethernet qua dock.",
  },
  {
    brandSlug: "valve",
    categorySlug: "gaming-handheld",
    familyName: "Steam Deck Series",
    familySlug: "steam-deck-series",
    modelName: "Steam Deck OLED",
    modelSlug: "steam-deck-oled",
    announcementDate: "2023-11-09",
    releaseDate: "2023-11-16",
    generation: "OLED",
    description:
      "PC gaming cầm tay với màn hình OLED HDR 90Hz, SteamOS và điều khiển tích hợp.",
    variantName: "1TB Black",
    skuCode: "V004287-30",
    colorName: "Black",
    colorHex: "#1B1C1D",
    launchPrice: 649,
    heightMm: 117,
    widthMm: 298,
    thicknessMm: 49,
    weightG: 640,
    frameMaterial: "Polycarbonate",
    speakerCount: 2,
    headphoneJack: true,
    microSd: true,
    ioNotes: "USB-C DisplayPort 1.4, khe microSD và jack tai nghe 3,5 mm.",
  },
  {
    brandSlug: "amazon-devices",
    categorySlug: "e-reader",
    familyName: "Kindle Paperwhite Series",
    familySlug: "kindle-paperwhite-series",
    modelName: "Kindle Paperwhite 12th Gen",
    modelSlug: "kindle-paperwhite-12th-gen",
    announcementDate: "2024-10-16",
    releaseDate: "2024-10-16",
    generation: "12th gen",
    description:
      "Máy đọc sách màn hình 7 inch chống chói, đèn nền điều chỉnh ấm và pin nhiều tuần.",
    variantName: "16GB Black",
    skuCode: "B0CFPHV9ZN",
    colorName: "Black",
    colorHex: "#202122",
    launchPrice: 159.99,
    heightMm: 176.7,
    widthMm: 127.6,
    thicknessMm: 7.8,
    weightG: 211,
    ingressProtection: "IPX8",
    frameMaterial: "Recycled magnesium",
    backMaterial: "Recycled plastic",
    ioNotes: "USB-C, Wi-Fi và màn hình E Ink không phát sáng trực tiếp.",
  },
];

const EXTENDED_CATALOG_DEVICES: CatalogDeviceSeed[] = isCuratedCatalogSeed
  ? ADDITIONAL_CATALOG_DEVICES
  : [
      ...BASE_EXTENDED_CATALOG_DEVICES,
      ...ADDITIONAL_CATALOG_DEVICES,
      ...CATALOG_EXPANSION_100_DEVICES,
      ...HISTORIC_CATALOG_DEVICES,
    ];

const EXTENDED_CATALOG_MODULES = isCuratedCatalogSeed
  ? ADDITIONAL_CATALOG_MODULES
  : [
      ...BASE_EXTENDED_CATALOG_MODULES,
      ...ADDITIONAL_CATALOG_MODULES,
      ...CATALOG_EXPANSION_100_MODULES,
      ...HISTORIC_CATALOG_MODULES,
    ];

const EXPECTED_EXTENDED_CATALOG_SIZE = isCuratedCatalogSeed
  ? 50
  : 180 + HISTORIC_CATALOG_DEVICES.length;

const extendedDeviceSlugs = new Set(
  EXTENDED_CATALOG_DEVICES.map((device) => device.modelSlug),
);
const extendedModuleSlugs = new Set(
  EXTENDED_CATALOG_MODULES.map((profile) => profile.modelSlug),
);
if (
  extendedDeviceSlugs.size !== EXTENDED_CATALOG_DEVICES.length ||
  extendedModuleSlugs.size !== EXTENDED_CATALOG_MODULES.length
) {
  throw new Error(
    "Extended catalog contains duplicate device or module slugs.",
  );
}
const deviceSlugsWithoutModule = [...extendedDeviceSlugs].filter(
  (slug) => !extendedModuleSlugs.has(slug),
);
const moduleSlugsWithoutDevice = [...extendedModuleSlugs].filter(
  (slug) => !extendedDeviceSlugs.has(slug),
);
if (deviceSlugsWithoutModule.length || moduleSlugsWithoutDevice.length) {
  throw new Error(
    `Extended device/module mismatch: devices without module=${deviceSlugsWithoutModule.join(", ")}; modules without device=${moduleSlugsWithoutDevice.join(", ")}.`,
  );
}

const OFFICIAL_CATALOG_VIDEOS = [
  {
    modelSlug: "galaxy-s25-ultra",
    url: "https://www.youtube.com/watch?v=3i1OB6wKYms",
    title: "Introducing Galaxy S25 Ultra | Galaxy AI | Samsung",
    channelName: "Samsung",
  },
  {
    modelSlug: "pixel-9-pro-fold",
    url: "https://www.youtube.com/watch?v=NC_A3EHFKF4",
    title: "Introducing the Google Pixel 9 Pro Fold",
    channelName: "Made by Google",
  },
  {
    modelSlug: "ipad-pro-13-m4",
    url: "https://www.youtube.com/watch?v=UjmaxCyJBc4",
    title: "Introducing the all-new iPad Pro | Apple",
    channelName: "Apple",
  },
] as const;

function buildExtendedDeviceDescription(device: CatalogDeviceSeed) {
  const categoryLabel =
    {
      smartphone: "điện thoại thông minh",
      tablet: "máy tính bảng",
      laptop: "máy tính xách tay",
      smartwatch: "đồng hồ thông minh",
      earbuds: "tai nghe không dây",
      television: "TV thông minh",
      "gaming-handheld": "máy chơi game cầm tay",
      "e-reader": "máy đọc sách điện tử",
    }[device.categorySlug] ?? "thiết bị";
  const protection = device.ingressProtection
    ? ` và mức bảo vệ ${device.ingressProtection}`
    : "";
  const audio = device.speakerCount
    ? `Hệ thống âm thanh sử dụng ${device.speakerCount} loa${
        device.audioTuning ? `, tinh chỉnh ${device.audioTuning}` : ""
      }.`
    : "Cấu hình âm thanh được liên kết theo profile phần cứng của thiết bị.";

  return [
    [
      "Điểm nổi bật",
      `${device.modelName} là ${categoryLabel} thuộc thế hệ ${device.generation}. ${device.description}`,
    ],
    [
      "Thiết kế và trải nghiệm",
      `Thiết bị có kích thước ${device.heightMm} × ${device.widthMm} × ${device.thicknessMm} mm, khối lượng ${device.weightG} g, khung ${device.frameMaterial ?? "theo thiết kế của hãng"} và mặt lưng ${device.backMaterial ?? "theo thiết kế của hãng"}${protection}.`,
    ],
    [
      "Hiệu năng và phần cứng",
      "Hồ sơ liên kết chipset, CPU, GPU, NPU khi áp dụng, RAM và bộ nhớ trong theo module chuẩn hóa. Điểm hiệu năng được tính theo benchmark có nguồn hoặc mốc tham chiếu cấu hình được ghi rõ.",
    ],
    [
      "Màn hình, âm thanh và tương tác",
      `Màn hình, độ phân giải, tần số quét và độ sáng được lưu trong module hiển thị riêng để có thể đối chiếu giữa các phiên bản. ${audio}`,
    ],
    [
      "Pin và kết nối",
      `Pin, công suất sạc, Wi-Fi, Bluetooth, mạng di động và các cổng vật lý được liên kết theo profile của ${device.modelName}. ${
        device.ioNotes ?? "Khả năng kết nối thay đổi theo thị trường."
      }`,
    ],
    [
      "Phần mềm và hệ sinh thái",
      "Hệ điều hành được gắn ở cấp phiên bản thiết bị, phục vụ theo dõi bản phát hành và chấm điểm chính sách phần mềm. Khả năng đồng bộ hệ sinh thái phụ thuộc thương hiệu và thị trường.",
    ],
    [
      "Hạn chế và đối tượng phù hợp",
      device.sourceUrl
        ? `Hồ sơ này đã được đối chiếu với tài liệu công khai của nhà sản xuất tại ${device.sourceUrl}. Dung lượng, màu, kết nối mạng và giá bán có thể khác theo thị trường; thiết bị phù hợp để so sánh trong đúng nhóm danh mục.`
        : "Thông số trong bộ seed được chuẩn hóa để phát triển và kiểm thử giao diện; các giá trị tham chiếu cần được đối chiếu lại với tài liệu chính thức trước khi sử dụng như dữ liệu sản xuất. Thiết bị phù hợp để so sánh trong đúng nhóm danh mục.",
    ],
  ]
    .map(([title, body]) => `## ${title}\n\n${body}`)
    .join("\n\n");
}

function buildExtendedDeviceSummary(device: CatalogDeviceSeed) {
  const summary = device.description.trim();
  if (summary.length >= 80) return summary.slice(0, 600);
  return (
    `${summary} Hồ sơ SpecHub liên kết đầy đủ cấu hình, màn hình, pin, ` +
    "kết nối, phần mềm và điểm đánh giá theo danh mục."
  ).slice(0, 600);
}

function buildStandardModelDescription(
  modelName: string,
  summary: string,
  categoryLabel: string,
) {
  return [
    [
      "Điểm nổi bật",
      `${summary} Hồ sơ được trình bày theo cùng quy chuẩn SpecHub để thuận tiện đối chiếu trong nhóm ${categoryLabel}.`,
    ],
    [
      "Thiết kế và trải nghiệm",
      `${modelName} được đánh giá theo kích thước, khối lượng, vật liệu, độ bền và trải nghiệm sử dụng thực tế phù hợp với đặc trưng của ${categoryLabel}.`,
    ],
    [
      "Hiệu năng và phần cứng",
      "Chipset, CPU, GPU, NPU, modem, RAM và bộ nhớ được liên kết thành các module độc lập; điểm số ưu tiên benchmark có nguồn và ghi rõ khi sử dụng mốc tham chiếu.",
    ],
    [
      "Màn hình, âm thanh và tương tác",
      "Màn hình, camera, âm thanh, cảm biến và phương thức điều khiển được chuẩn hóa thành dữ liệu có thể so sánh giữa các phiên bản cùng danh mục.",
    ],
    [
      "Pin và kết nối",
      "Dung lượng pin, tốc độ sạc, chuẩn không dây, mạng di động và cổng vật lý được lưu ở cấp module hoặc phiên bản để phản ánh đúng cấu hình bán ra.",
    ],
    [
      "Phần mềm và hệ sinh thái",
      "Hệ điều hành, phiên bản phần mềm và khả năng tích hợp hệ sinh thái được theo dõi riêng nhằm đánh giá trải nghiệm dài hạn và chính sách hỗ trợ.",
    ],
    [
      "Hạn chế và đối tượng phù hợp",
      `Các giới hạn phụ thuộc cấu hình, thị trường và điều kiện sử dụng. ${modelName} nên được đối chiếu trong đúng nhóm ${categoryLabel} và kiểm tra nguồn chính thức trước quyết định mua.`,
    ],
  ]
    .map(([title, body]) => `## ${title}\n\n${body}`)
    .join("\n\n");
}

async function getOrCreateDisplayUnit(
  slug: string,
  data: DisplayUnitCreateData,
) {
  const existing = await prisma.display_units.findUnique({ where: { slug } });
  return existing ?? prisma.display_units.create({ data });
}

async function getOrCreateBatteryUnit(
  slug: string,
  data: BatteryUnitCreateData,
) {
  const existing = await prisma.battery_units.findUnique({ where: { slug } });
  return existing ?? prisma.battery_units.create({ data });
}

async function upsertCitation(data: CitationCreateData & { url: string }) {
  const existing = await prisma.citations.findFirst({
    where: { url: data.url },
  });

  return existing
    ? prisma.citations.update({
        where: { id: existing.id },
        data: {
          source_id: data.source_id,
          title: data.title,
          author: data.author,
          published_at: data.published_at,
          excerpt: data.excerpt,
        },
      })
    : prisma.citations.create({ data });
}

async function upsertBenchmarkRun(
  data: BenchmarkRunCreateData & {
    benchmark_id: string;
    citation_id: string;
  },
) {
  const existing = await prisma.benchmark_runs.findFirst({
    where: {
      benchmark_id: data.benchmark_id,
      citation_id: data.citation_id,
    },
  });

  return existing
    ? prisma.benchmark_runs.update({ where: { id: existing.id }, data })
    : prisma.benchmark_runs.create({ data });
}

async function upsertDeviceBenchmark(
  data: DeviceBenchmarkCreateData & {
    benchmark_run_id: string;
    benchmark_id: string;
    device_variant_id: string;
    subscore_name: string;
  },
) {
  const existing = await prisma.device_variant_benchmarks.findFirst({
    where: {
      benchmark_run_id: data.benchmark_run_id,
      benchmark_id: data.benchmark_id,
      device_variant_id: data.device_variant_id,
      subscore_name: data.subscore_name,
    },
  });

  return existing
    ? prisma.device_variant_benchmarks.update({
        where: { id: existing.id },
        data,
      })
    : prisma.device_variant_benchmarks.create({ data });
}

async function upsertCpu(slug: string, data: CpuCreateData) {
  return prisma.cpus.upsert({ where: { slug }, update: data, create: data });
}

async function upsertGpu(slug: string, data: GpuCreateData) {
  return prisma.gpus.upsert({ where: { slug }, update: data, create: data });
}

async function upsertNpu(slug: string, data: NpuCreateData) {
  return prisma.npus.upsert({ where: { slug }, update: data, create: data });
}

async function upsertModem(slug: string, data: ModemCreateData) {
  return prisma.modems.upsert({ where: { slug }, update: data, create: data });
}

async function upsertMemoryStandard(
  slug: string,
  data: MemoryStandardCreateData,
) {
  return prisma.memory_standards.upsert({
    where: { slug },
    update: data,
    create: data,
  });
}

async function upsertStorageStandard(
  slug: string,
  data: StorageStandardCreateData,
) {
  return prisma.storage_standards.upsert({
    where: { slug },
    update: data,
    create: data,
  });
}

async function upsertOperatingSystem(
  slug: string,
  data: OperatingSystemCreateData,
) {
  return prisma.operating_systems.upsert({
    where: { name: data.name },
    update: { ...data, slug },
    create: data,
  });
}

async function upsertVariantChipset(
  device_variant_id: string,
  chipset_id: string,
  chip_role: string,
) {
  return prisma.variant_chipsets.upsert({
    where: {
      device_variant_id_chipset_id_chip_role: {
        device_variant_id,
        chipset_id,
        chip_role,
      },
    },
    update: { is_primary: true },
    create: { device_variant_id, chipset_id, chip_role, is_primary: true },
  });
}

async function upsertVariantCpu(
  device_variant_id: string,
  cpu_id: string,
  cpu_role = "application",
) {
  return prisma.variant_cpus.upsert({
    where: {
      device_variant_id_cpu_id_cpu_role: {
        device_variant_id,
        cpu_id,
        cpu_role,
      },
    },
    update: { is_primary: true },
    create: { device_variant_id, cpu_id, cpu_role, is_primary: true },
  });
}

async function upsertVariantGpu(
  device_variant_id: string,
  gpu_id: string,
  gpu_role = "integrated",
) {
  return prisma.variant_gpus.upsert({
    where: {
      device_variant_id_gpu_id_gpu_role: {
        device_variant_id,
        gpu_id,
        gpu_role,
      },
    },
    update: { is_primary: true },
    create: { device_variant_id, gpu_id, gpu_role, is_primary: true },
  });
}

async function upsertVariantNpu(
  device_variant_id: string,
  npu_id: string,
  npu_role = "ai",
) {
  return prisma.variant_npus.upsert({
    where: {
      device_variant_id_npu_id_npu_role: {
        device_variant_id,
        npu_id,
        npu_role,
      },
    },
    update: { is_primary: true },
    create: { device_variant_id, npu_id, npu_role, is_primary: true },
  });
}

async function upsertVariantModem(
  device_variant_id: string,
  modem_id: string,
  modem_role = "cellular",
) {
  return prisma.variant_modems.upsert({
    where: {
      device_variant_id_modem_id_modem_role: {
        device_variant_id,
        modem_id,
        modem_role,
      },
    },
    update: { is_primary: true },
    create: { device_variant_id, modem_id, modem_role, is_primary: true },
  });
}

async function upsertVariantMemory(
  device_variant_id: string,
  memory_standard_id: string,
  capacity_gb: number,
  data: { speed_mhz?: number; bandwidth_gbps?: number; channel_count?: number },
) {
  return prisma.variant_memory_configs.upsert({
    where: {
      device_variant_id_capacity_gb_memory_standard_id: {
        device_variant_id,
        capacity_gb,
        memory_standard_id,
      },
    },
    update: { ...data, is_primary: true },
    create: {
      device_variant_id,
      memory_standard_id,
      capacity_gb,
      ...data,
      is_primary: true,
    },
  });
}

async function upsertVariantStorage(
  device_variant_id: string,
  storage_standard_id: string,
  total_capacity_gb: number,
  data: {
    is_expandable?: boolean;
    expansion_max_gb?: number;
    module_count?: number;
  } = {},
) {
  return prisma.variant_storage_configs.upsert({
    where: {
      device_variant_id_storage_standard_id_total_capacity_gb: {
        device_variant_id,
        storage_standard_id,
        total_capacity_gb,
      },
    },
    update: data,
    create: {
      device_variant_id,
      storage_standard_id,
      total_capacity_gb,
      ...data,
    },
  });
}

async function getOrCreateOsVersion(
  operating_system_id: string,
  version_name: string,
  data: { codename?: string; release_date?: Date; api_level?: number } = {},
) {
  const existing = await prisma.os_versions.findFirst({
    where: { operating_system_id, version_name },
  });

  return (
    existing ??
    prisma.os_versions.create({
      data: { operating_system_id, version_name, ...data },
    })
  );
}

async function upsertVariantOperatingSystem(
  device_variant_id: string,
  os_version_id: string,
) {
  const existing = await prisma.variant_operating_systems.findFirst({
    where: { device_variant_id, os_version_id },
  });

  return (
    existing ??
    prisma.variant_operating_systems.create({
      data: { device_variant_id, os_version_id, is_default: true },
    })
  );
}

async function upsertVariantCamera(
  device_variant_id: string,
  camera_module_id: string,
  position: string,
  role: string,
  system_name: string,
) {
  const system = await prisma.variant_camera_systems.upsert({
    where: { device_variant_id_position: { device_variant_id, position } },
    update: { system_name },
    create: { device_variant_id, position, system_name },
  });

  return prisma.variant_camera_modules.upsert({
    where: {
      device_variant_id_position_role_module_order: {
        device_variant_id,
        position,
        role,
        module_order: 1,
      },
    },
    update: { camera_module_id, camera_system_id: system.id, is_primary: true },
    create: {
      device_variant_id,
      camera_module_id,
      camera_system_id: system.id,
      position,
      role,
      module_order: 1,
      is_primary: true,
    },
  });
}

async function upsertVariantDisplay(
  device_variant_id: string,
  display_unit_id: string,
  display_role: string,
  display_order = 1,
) {
  return prisma.variant_displays.upsert({
    where: {
      device_variant_id_display_role_display_order: {
        device_variant_id,
        display_role,
        display_order,
      },
    },
    update: { display_unit_id },
    create: { device_variant_id, display_unit_id, display_role, display_order },
  });
}

async function upsertVariantBattery(
  device_variant_id: string,
  battery_unit_id: string,
  battery_role: string,
) {
  return prisma.variant_batteries.upsert({
    where: {
      device_variant_id_battery_unit_id_battery_role: {
        device_variant_id,
        battery_unit_id,
        battery_role,
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id,
      battery_unit_id,
      battery_role,
      is_primary: true,
    },
  });
}

async function inheritSharedModulesAcrossModelVariants() {
  const models = await prisma.device_models.findMany({
    where: {
      deleted_at: null,
      device_variants: {
        some: { deleted_at: null },
      },
    },
    select: {
      name: true,
      device_variants: {
        where: { deleted_at: null },
        select: {
          id: true,
          is_default: true,
          variant_physical_specs: true,
          variant_io_specs: true,
          variant_displays: {
            select: {
              display_unit_id: true,
              display_role: true,
              display_order: true,
            },
          },
          variant_batteries: {
            select: {
              battery_unit_id: true,
              battery_role: true,
              is_primary: true,
            },
          },
          variant_camera_modules: {
            select: {
              camera_module_id: true,
              position: true,
              role: true,
              camera_system: { select: { system_name: true } },
            },
          },
        },
      },
    },
  });

  let inheritedLinks = 0;
  for (const model of models) {
    if (model.device_variants.length < 2) continue;
    const source =
      model.device_variants.find((variant) => variant.is_default) ??
      model.device_variants[0];
    if (!source) continue;

    for (const target of model.device_variants) {
      if (target.id === source.id) continue;

      if (source.variant_physical_specs) {
        const { device_variant_id: _sourceId, ...physical } =
          source.variant_physical_specs;
        await prisma.variant_physical_specs.upsert({
          where: { device_variant_id: target.id },
          update: physical,
          create: { device_variant_id: target.id, ...physical },
        });
        inheritedLinks += 1;
      }

      if (source.variant_io_specs) {
        const { device_variant_id: _sourceId, ...io } = source.variant_io_specs;
        await prisma.variant_io_specs.upsert({
          where: { device_variant_id: target.id },
          update: io,
          create: { device_variant_id: target.id, ...io },
        });
        inheritedLinks += 1;
      }

      for (const display of source.variant_displays) {
        await upsertVariantDisplay(
          target.id,
          display.display_unit_id,
          display.display_role,
          display.display_order,
        );
        inheritedLinks += 1;
      }

      for (const battery of source.variant_batteries) {
        await upsertVariantBattery(
          target.id,
          battery.battery_unit_id,
          battery.battery_role,
        );
        inheritedLinks += 1;
      }

      if (!target.variant_camera_modules.length) {
        for (const camera of source.variant_camera_modules) {
          await upsertVariantCamera(
            target.id,
            camera.camera_module_id,
            camera.position,
            camera.role,
            camera.camera_system?.system_name ?? `${model.name} camera system`,
          );
          inheritedLinks += 1;
        }
      }
    }
  }

  return inheritedLinks;
}

const CONFIGURATION_SCORE_VERSION = "benchmark-first-config-fallback-v2";
const CONFIGURATION_SCORE_RATIONALE =
  "Chỉ số cấu hình dự phòng khi thiết bị chưa có benchmark phù hợp; giao diện luôn ưu tiên điểm đo gốc cùng tên, phiên bản và hạng mục.";

type ModuleScoreLink = {
  moduleKind:
    | "chipset"
    | "cpu"
    | "gpu"
    | "npu"
    | "modem"
    | "memory-standard"
    | "storage-standard"
    | "operating-system"
    | "camera"
    | "display"
    | "battery";
  moduleId: string;
  relationQuality: number;
};

async function seedVariantModuleScores() {
  const variants = await prisma.device_variants.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      variant_name: true,
      device_model: {
        select: {
          product_family: {
            select: { device_category: { select: { slug: true } } },
          },
        },
      },
      variant_chipsets: {
        select: { chipset_id: true, is_primary: true },
      },
      variant_cpus: { select: { cpu_id: true, is_primary: true } },
      variant_gpus: { select: { gpu_id: true, is_primary: true } },
      variant_npus: { select: { npu_id: true, is_primary: true } },
      variant_modems: { select: { modem_id: true, is_primary: true } },
      variant_memory_configs: {
        select: {
          memory_standard_id: true,
          capacity_gb: true,
          speed_mhz: true,
          bandwidth_gbps: true,
          channel_count: true,
        },
      },
      variant_storage_configs: {
        select: {
          storage_standard_id: true,
          total_capacity_gb: true,
          module_count: true,
          is_expandable: true,
        },
      },
      variant_operating_systems: {
        select: {
          is_default: true,
          promised_major_updates: true,
          promised_security_years: true,
          os_version: { select: { operating_system_id: true } },
        },
      },
      variant_camera_modules: {
        select: {
          camera_module_id: true,
          position: true,
          role: true,
          is_primary: true,
        },
      },
      variant_displays: {
        select: {
          display_unit_id: true,
          display_role: true,
          display_order: true,
        },
      },
      variant_batteries: {
        select: {
          battery_unit_id: true,
          battery_role: true,
          is_primary: true,
        },
      },
    },
  });

  const prepared = variants.map((variant) => {
    const links = new Map<string, ModuleScoreLink>();
    const addLink = (link: ModuleScoreLink) => {
      const key = `${link.moduleKind}:${link.moduleId}`;
      const current = links.get(key);
      if (!current || current.relationQuality < link.relationQuality) {
        links.set(key, link);
      }
    };
    const primaryQuality = (isPrimary: boolean | null | undefined) =>
      isPrimary ? 1 : 0.72;

    for (const link of variant.variant_chipsets) {
      addLink({
        moduleKind: "chipset",
        moduleId: link.chipset_id,
        relationQuality: primaryQuality(link.is_primary),
      });
    }
    for (const link of variant.variant_cpus) {
      addLink({
        moduleKind: "cpu",
        moduleId: link.cpu_id,
        relationQuality: primaryQuality(link.is_primary),
      });
    }
    for (const link of variant.variant_gpus) {
      addLink({
        moduleKind: "gpu",
        moduleId: link.gpu_id,
        relationQuality: primaryQuality(link.is_primary),
      });
    }
    for (const link of variant.variant_npus) {
      addLink({
        moduleKind: "npu",
        moduleId: link.npu_id,
        relationQuality: primaryQuality(link.is_primary),
      });
    }
    for (const link of variant.variant_modems) {
      addLink({
        moduleKind: "modem",
        moduleId: link.modem_id,
        relationQuality: primaryQuality(link.is_primary),
      });
    }
    for (const link of variant.variant_memory_configs) {
      const documentedFields = [
        link.speed_mhz,
        link.bandwidth_gbps,
        link.channel_count,
      ].filter((value) => value !== null).length;
      addLink({
        moduleKind: "memory-standard",
        moduleId: link.memory_standard_id,
        relationQuality: 0.64 + documentedFields * 0.12,
      });
    }
    for (const link of variant.variant_storage_configs) {
      addLink({
        moduleKind: "storage-standard",
        moduleId: link.storage_standard_id,
        relationQuality:
          0.76 +
          (link.module_count !== null ? 0.12 : 0) +
          (typeof link.is_expandable === "boolean" ? 0.12 : 0),
      });
    }
    for (const link of variant.variant_operating_systems) {
      addLink({
        moduleKind: "operating-system",
        moduleId: link.os_version.operating_system_id,
        relationQuality:
          (link.is_default ? 0.86 : 0.74) +
          (link.promised_major_updates !== null ? 0.07 : 0) +
          (link.promised_security_years !== null ? 0.07 : 0),
      });
    }
    for (const link of variant.variant_camera_modules) {
      addLink({
        moduleKind: "camera",
        moduleId: link.camera_module_id,
        relationQuality:
          0.74 +
          (link.is_primary ? 0.16 : 0.06) +
          (link.position && link.role ? 0.1 : 0),
      });
    }
    for (const link of variant.variant_displays) {
      addLink({
        moduleKind: "display",
        moduleId: link.display_unit_id,
        relationQuality:
          0.84 +
          (link.display_role === "main" ? 0.12 : 0.06) +
          (link.display_order === 1 ? 0.04 : 0),
      });
    }
    for (const link of variant.variant_batteries) {
      addLink({
        moduleKind: "battery",
        moduleId: link.battery_unit_id,
        relationQuality:
          0.82 +
          (link.is_primary ? 0.13 : 0.05) +
          (link.battery_role ? 0.05 : 0),
      });
    }

    const categorySlug =
      variant.device_model.product_family.device_category.slug;
    const memoryGb = Math.max(
      0,
      ...variant.variant_memory_configs.map((item) => item.capacity_gb),
    );
    const storageGb = Math.max(
      0,
      ...variant.variant_storage_configs.map((item) => item.total_capacity_gb),
    );
    const moduleKindCount = new Set(
      [...links.values()].map((link) => link.moduleKind),
    ).size;

    return {
      variant,
      categorySlug,
      links: [...links.values()],
      memoryGb,
      storageGb,
      moduleKindCount,
    };
  });

  const categoryMaximums = new Map<
    string,
    { moduleKinds: number; memoryGb: number; storageGb: number }
  >();
  for (const item of prepared) {
    const current = categoryMaximums.get(item.categorySlug) ?? {
      moduleKinds: 1,
      memoryGb: 1,
      storageGb: 1,
    };
    current.moduleKinds = Math.max(current.moduleKinds, item.moduleKindCount);
    current.memoryGb = Math.max(current.memoryGb, item.memoryGb);
    current.storageGb = Math.max(current.storageGb, item.storageGb);
    categoryMaximums.set(item.categorySlug, current);
  }

  const scoreRows = prepared.flatMap((item) => {
    const maximums = categoryMaximums.get(item.categorySlug)!;
    const integrationCoverage =
      item.moduleKindCount / Math.max(1, maximums.moduleKinds);
    const memoryHeadroom =
      Math.log2(1 + item.memoryGb) / Math.log2(1 + maximums.memoryGb);
    const storageHeadroom =
      Math.log2(1 + item.storageGb) / Math.log2(1 + maximums.storageGb);
    const supportingConfiguration =
      Math.max(0, Math.min(1, memoryHeadroom)) * 0.5 +
      Math.max(0, Math.min(1, storageHeadroom)) * 0.5;

    return item.links.map((link) => {
      const score =
        Math.round(
          Math.max(
            0,
            Math.min(
              100,
              35 +
                integrationCoverage * 20 +
                supportingConfiguration * 25 +
                Math.max(0, Math.min(1, link.relationQuality)) * 15,
            ),
          ) * 10,
        ) / 10;

      return {
        deviceVariantId: item.variant.id,
        moduleKind: link.moduleKind,
        moduleId: link.moduleId,
        score,
        factors: {
          baseline: { value: 35, weight: 35 },
          integration_coverage: {
            value: Math.round(integrationCoverage * 100),
            weight: 20,
            linked_module_kinds: item.moduleKindCount,
            category_reference: maximums.moduleKinds,
          },
          supporting_configuration: {
            value: Math.round(supportingConfiguration * 100),
            weight: 25,
            memory_gb: item.memoryGb,
            storage_gb: item.storageGb,
          },
          relation_quality: {
            value: Math.round(link.relationQuality * 100),
            weight: 15,
          },
        },
      };
    });
  });

  await prisma.variant_module_scores.deleteMany({
    where: { score_source: "configuration_model" },
  });
  for (let index = 0; index < scoreRows.length; index += 100) {
    await prisma.$transaction(
      scoreRows.slice(index, index + 100).map((row) =>
        prisma.variant_module_scores.upsert({
          where: {
            device_variant_id_module_kind_module_id: {
              device_variant_id: row.deviceVariantId,
              module_kind: row.moduleKind,
              module_id: row.moduleId,
            },
          },
          update: {
            score: row.score,
            score_source: "configuration_model",
            score_version: CONFIGURATION_SCORE_VERSION,
            rationale: CONFIGURATION_SCORE_RATIONALE,
            factors: {
              ...row.factors,
              scoring_policy: "benchmark_first",
              score_role: "configuration_fallback",
            },
          },
          create: {
            device_variant_id: row.deviceVariantId,
            module_kind: row.moduleKind,
            module_id: row.moduleId,
            score: row.score,
            score_source: "configuration_model",
            score_version: CONFIGURATION_SCORE_VERSION,
            rationale: CONFIGURATION_SCORE_RATIONALE,
            factors: {
              ...row.factors,
              scoring_policy: "benchmark_first",
              score_role: "configuration_fallback",
            },
          },
        }),
      ),
    );
  }

  return scoreRows.length;
}

function sourceSlugFromUrl(sourceUrl: string) {
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  return `official-media-${hostname.replace(/[^a-z0-9]+/g, "-")}`;
}

async function getOrCreateOfficialMediaSource(sourceUrl: string) {
  const parsed = new URL(sourceUrl);
  const hostname = parsed.hostname.toLowerCase();
  const slug = sourceSlugFromUrl(sourceUrl);
  return prisma.sources.upsert({
    where: { slug },
    update: {
      name: `Official media — ${hostname}`,
      source_type: "official",
      base_url: `${parsed.protocol}//${hostname}`,
      trust_level: 5,
      description:
        "Trang sản phẩm hoặc kênh truyền thông chính thức dùng để đối chiếu hình ảnh và video trong danh mục SpecHub.",
    },
    create: {
      name: `Official media — ${hostname}`,
      slug,
      source_type: "official",
      base_url: `${parsed.protocol}//${hostname}`,
      trust_level: 5,
      description:
        "Trang sản phẩm hoặc kênh truyền thông chính thức dùng để đối chiếu hình ảnh và video trong danh mục SpecHub.",
    },
  });
}

async function attachMediaToDevice(
  modelId: string,
  assetId: string,
  role: string,
  displayOrder: number,
  isPrimary: boolean,
) {
  const existing = await prisma.entity_media.findFirst({
    where: {
      entity_table: "device_models",
      entity_id: modelId,
      media_asset_id: assetId,
    },
  });
  if (existing) {
    await prisma.entity_media.update({
      where: { id: existing.id },
      data: {
        role,
        display_order: displayOrder,
        is_primary: isPrimary,
      },
    });
    return;
  }
  await prisma.entity_media.create({
    data: {
      entity_table: "device_models",
      entity_id: modelId,
      media_asset_id: assetId,
      role,
      display_order: displayOrder,
      is_primary: isPrimary,
    },
  });
}

async function seedCatalogMedia() {
  let imageCount = 0;
  let videoCount = 0;

  for (const image of catalogImageSources.devices) {
    const model = await prisma.device_models.findUnique({
      where: { slug: image.slug },
      select: {
        id: true,
        name: true,
        product_family: {
          select: {
            brand_org: { select: { short_name: true, name: true } },
          },
        },
      },
    });
    if (!model) {
      if (isCuratedCatalogSeed) continue;
      throw new Error(`Missing device model for image ${image.slug}.`);
    }

    const localUrl = `/images/devices/${image.slug}.webp`;
    const source = await getOrCreateOfficialMediaSource(image.sourcePage);
    const copyrightHolder =
      model.product_family.brand_org.short_name ??
      model.product_family.brand_org.name;
    const existingAsset = await prisma.media_assets.findFirst({
      where: { asset_type: "image", url: localUrl },
    });
    const assetData = {
      url: localUrl,
      upload_status: "ready",
      mime_type: "image/webp",
      original_filename: `${image.slug}.webp`,
      alt_text: `Ảnh sản phẩm ${model.name}`,
      caption: `Ảnh ${model.name}, đối chiếu từ trang sản phẩm chính thức của hãng.`,
      copyright_holder: copyrightHolder,
      license: "Official product media; verify reuse rights",
      source_id: source.id,
    };
    const asset = existingAsset
      ? await prisma.media_assets.update({
          where: { id: existingAsset.id },
          data: assetData,
        })
      : await prisma.media_assets.create({
          data: { asset_type: "image", ...assetData },
        });

    await prisma.device_models.update({
      where: { id: model.id },
      data: { cover_image_url: localUrl },
    });
    await attachMediaToDevice(model.id, asset.id, "cover", 0, true);
    imageCount += 1;
  }

  for (const video of OFFICIAL_CATALOG_VIDEOS) {
    const model = await prisma.device_models.findUnique({
      where: { slug: video.modelSlug },
      select: { id: true, name: true },
    });
    if (!model) continue;

    const source = await getOrCreateOfficialMediaSource(video.url);
    const existingAsset = await prisma.media_assets.findFirst({
      where: { asset_type: "video", url: video.url },
    });
    const assetData = {
      url: video.url,
      upload_status: "ready",
      mime_type: "video/youtube",
      original_filename: null,
      alt_text: `Video giới thiệu ${model.name}`,
      caption: `${video.title} — video từ kênh ${video.channelName} chính thức.`,
      copyright_holder: video.channelName,
      license: "Official YouTube embed; rights retained by publisher",
      source_id: source.id,
    };
    const asset = existingAsset
      ? await prisma.media_assets.update({
          where: { id: existingAsset.id },
          data: assetData,
        })
      : await prisma.media_assets.create({
          data: { asset_type: "video", ...assetData },
        });
    await attachMediaToDevice(model.id, asset.id, "product_video", 10, false);
    videoCount += 1;
  }

  return { imageCount, videoCount };
}

async function normalizeCoreOrganizationSlugs() {
  const canonicalOrganizations = [
    {
      slug: "apple",
      aliases: ["apple-inc"],
      names: ["Apple Inc."],
      shortNames: ["Apple"],
    },
    {
      slug: "samsung",
      aliases: ["samsung-electronics-co-ltd"],
      names: ["Samsung Electronics Co., Ltd.", "Samsung Electronics"],
      shortNames: ["Samsung"],
    },
    {
      slug: "qualcomm",
      aliases: ["qualcomm-technologies-inc"],
      names: ["Qualcomm Technologies, Inc.", "Qualcomm Inc."],
      shortNames: ["Qualcomm", "Qualcomm Technologies"],
    },
    {
      slug: "sony",
      aliases: ["sony-group-corporation"],
      names: ["Sony Group Corporation"],
      shortNames: ["Sony"],
    },
  ] as const;

  for (const item of canonicalOrganizations) {
    const canonical = await prisma.organizations.findUnique({
      where: { slug: item.slug },
    });
    if (canonical) continue;

    const alias = await prisma.organizations.findFirst({
      where: {
        OR: [
          { slug: { in: [...item.aliases] } },
          { name: { in: [...item.names] } },
          { short_name: { in: [...item.shortNames] } },
        ],
      },
      orderBy: { created_at: "asc" },
    });
    if (!alias) continue;
    await prisma.organizations.update({
      where: { id: alias.id },
      data: { slug: item.slug },
    });
  }
}

async function normalizeCoreCategorySlugs() {
  const categories = [
    { slug: "smartphone", name: "Điện thoại", aliases: ["dienthoai"] },
    { slug: "tablet", name: "Máy tính bảng", aliases: ["may-tinh-bang"] },
    {
      slug: "laptop",
      name: "Máy tính xách tay",
      aliases: ["may-tinh-xach-tay"],
    },
    {
      slug: "smartwatch",
      name: "Đồng hồ thông minh",
      aliases: ["dong-ho-thong-minh"],
    },
    {
      slug: "earbuds",
      name: "Tai nghe không dây",
      aliases: ["tai-nghe-khong-day"],
    },
  ] as const;

  for (const item of categories) {
    const canonical = await prisma.device_categories.findUnique({
      where: { slug: item.slug },
    });
    if (canonical) continue;
    const alias = await prisma.device_categories.findFirst({
      where: {
        OR: [{ name: item.name }, { slug: { in: [...item.aliases] } }],
      },
      orderBy: { created_at: "asc" },
    });
    if (!alias) continue;
    await prisma.device_categories.update({
      where: { id: alias.id },
      data: { slug: item.slug },
    });
  }
}

async function improveLinkedModuleDescriptions() {
  const variants = await prisma.device_variants.findMany({
    where: {
      is_default: true,
      deleted_at: null,
      device_model: { deleted_at: null },
    },
    select: {
      device_model: { select: { name: true } },
      variant_chipsets: { include: { chipset: true } },
      variant_cpus: { include: { cpu: true } },
      variant_gpus: { include: { gpu: true } },
      variant_npus: { include: { npu: true } },
      variant_modems: { include: { modem: true } },
      variant_displays: { include: { display_unit: true } },
      variant_batteries: { include: { battery_unit: true } },
      variant_camera_modules: { include: { camera_module: true } },
    },
  });
  const improved = new Set<string>();
  const needsDescription = (key: string, description: string | null) => {
    if (improved.has(key) || (description?.trim().length ?? 0) >= 60) {
      return false;
    }
    improved.add(key);
    return true;
  };

  for (const variant of variants) {
    const deviceName = variant.device_model.name;

    for (const { chipset } of variant.variant_chipsets) {
      if (!needsDescription(`chipset:${chipset.id}`, chipset.description)) {
        continue;
      }
      await prisma.chipsets.update({
        where: { id: chipset.id },
        data: {
          description:
            `${chipset.name} là ${chipset.chip_kind} 64-bit dùng trên ${deviceName}. ` +
            "CPU, GPU, NPU, modem và giới hạn bộ nhớ được lưu thành các module liên kết riêng để phản ánh đúng cấu hình của từng phiên bản.",
        },
      });
    }

    for (const { cpu } of variant.variant_cpus) {
      if (!needsDescription(`cpu:${cpu.id}`, cpu.description)) continue;
      const topology = cpu.core_count
        ? `${cpu.core_count} lõi${cpu.thread_count ? `, ${cpu.thread_count} luồng` : ""}`
        : "cấu trúc lõi theo nền tảng của hãng";
      await prisma.cpus.update({
        where: { id: cpu.id },
        data: {
          description:
            `${cpu.name} là CPU ${topology}, sử dụng tập lệnh ${cpu.isa_name ?? "theo kiến trúc của nền tảng"} trên ${deviceName}. ` +
            "Module này đại diện cho bộ xử lý chính và không thay thế số liệu benchmark của thiết bị hoàn chỉnh.",
        },
      });
    }

    for (const link of variant.variant_gpus) {
      const { gpu } = link;
      if (!needsDescription(`gpu:${gpu.id}`, gpu.description)) continue;
      await prisma.gpus.update({
        where: { id: gpu.id },
        data: {
          description:
            `${gpu.name} là GPU ${link.gpu_role === "discrete" ? "rời" : "tích hợp"} được liên kết với ${deviceName}. ` +
            `Module đảm nhiệm giao diện và tăng tốc đồ họa${gpu.ray_tracing_support ? ", có hỗ trợ ray tracing ở cấp phần cứng" : ""}; hiệu năng thực tế phụ thuộc tản nhiệt và bộ nhớ.`,
        },
      });
    }

    for (const { npu } of variant.variant_npus) {
      if (!needsDescription(`npu:${npu.id}`, npu.description)) continue;
      await prisma.npus.update({
        where: { id: npu.id },
        data: {
          description:
            `${npu.name} là bộ xử lý AI dùng cho suy luận máy học và các tính năng xử lý trên ${deviceName}. ` +
            "Năng lực TOPS chỉ nên dùng khi được xác nhận cho đúng biến thể, tiến trình và độ chính xác tính toán.",
        },
      });
    }

    for (const { modem } of variant.variant_modems) {
      if (!needsDescription(`modem:${modem.id}`, modem.description)) continue;
      await prisma.modems.update({
        where: { id: modem.id },
        data: {
          description:
            `${modem.name} là modem di động được liên kết với ${deviceName}. ` +
            "Chế độ 5G, băng tần, mmWave và tốc độ tối đa phụ thuộc phiên bản thị trường nên được kiểm tra ở hồ sơ kết nối của từng biến thể.",
        },
      });
    }

    for (const { display_unit: display } of variant.variant_displays) {
      if (!needsDescription(`display:${display.id}`, display.description)) {
        continue;
      }
      const size = display.size_inch ? `${display.size_inch} inch` : "";
      const resolution =
        display.resolution_width && display.resolution_height
          ? `, độ phân giải ${display.resolution_width} × ${display.resolution_height}`
          : "";
      const refresh = display.refresh_rate_hz
        ? `, tần số quét tối đa ${display.refresh_rate_hz} Hz`
        : "";
      await prisma.display_units.update({
        where: { id: display.id },
        data: {
          description:
            `${display.name ?? "Màn hình"} là màn hình ${size} của ${deviceName}${resolution}${refresh}. ` +
            "Độ sáng, HDR và lớp bảo vệ được lưu riêng khi có thông số xác nhận cho đúng cấu hình.",
        },
      });
    }

    for (const { battery_unit: battery } of variant.variant_batteries) {
      if (!needsDescription(`battery:${battery.id}`, battery.description)) {
        continue;
      }
      const capacity = battery.capacity_mah
        ? `${battery.capacity_mah} mAh`
        : battery.energy_wh
          ? `${battery.energy_wh} Wh`
          : "theo hồ sơ năng lượng của hãng";
      await prisma.battery_units.update({
        where: { id: battery.id },
        data: {
          description:
            `${battery.name ?? "Pin tích hợp"} là module pin ${capacity} của ${deviceName}` +
            `${battery.wired_charging_w ? `, hỗ trợ sạc có dây đến ${battery.wired_charging_w} W` : ""}` +
            `${battery.wireless_charging_w ? ` và sạc không dây đến ${battery.wireless_charging_w} W` : ""}. ` +
            "Thời lượng thực tế phụ thuộc tải, kết nối, độ sáng và điều kiện nhiệt độ.",
        },
      });
    }

    for (const { camera_module: camera } of variant.variant_camera_modules) {
      if (!needsDescription(`camera:${camera.id}`, camera.description)) {
        continue;
      }
      await prisma.camera_modules.update({
        where: { id: camera.id },
        data: {
          description:
            `${camera.name ?? "Camera"} là module camera ${camera.effective_megapixel ? `${camera.effective_megapixel} MP` : ""}` +
            `${camera.aperture ? `, khẩu độ ${camera.aperture}` : ""} trên ${deviceName}. ` +
            "Khả năng lấy nét, chống rung và chế độ quay chỉ được ghi riêng khi có dữ liệu xác nhận cho module này.",
        },
      });
    }
  }

  return improved.size;
}

async function main() {
  console.log("🌱 Bắt đầu seed database...\n");
  await seedCatalogReferenceData(prisma);

  // ========================================================
  // 1. LOOKUPS
  // ========================================================
  console.log("📋 [1/12] Seeding lookups...");

  await prisma.languages.createMany({
    data: [
      { code: "vi", name: "Tiếng Việt", is_default: true, is_active: true },
      { code: "en", name: "English", is_default: false, is_active: true },
      { code: "ja", name: "日本語", is_default: false, is_active: true },
      { code: "ko", name: "한국어", is_default: false, is_active: true },
      { code: "zh-CN", name: "简体中文", is_default: false, is_active: true },
    ],
    skipDuplicates: true,
  });

  await prisma.release_statuses.createMany({
    data: [
      { code: "rumored", name: "Đồn đại", sort_order: 0 },
      { code: "announced", name: "Đã công bố", sort_order: 1 },
      { code: "pre_order", name: "Đặt trước", sort_order: 2 },
      { code: "released", name: "Đã phát hành", sort_order: 3 },
      { code: "delayed", name: "Hoãn lại", sort_order: 4 },
      { code: "discontinued", name: "Ngừng sản xuất", sort_order: 5 },
      { code: "eol", name: "Kết thúc vòng đời", sort_order: 6 },
    ],
    skipDuplicates: true,
  });

  await prisma.currencies.createMany({
    data: [
      { code: "USD", name: "US Dollar", symbol: "$", decimal_digits: 2 },
      { code: "VND", name: "Vietnamese Dong", symbol: "₫", decimal_digits: 0 },
      { code: "EUR", name: "Euro", symbol: "€", decimal_digits: 2 },
      { code: "JPY", name: "Japanese Yen", symbol: "¥", decimal_digits: 0 },
      { code: "KRW", name: "South Korean Won", symbol: "₩", decimal_digits: 0 },
      { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimal_digits: 2 },
    ],
    skipDuplicates: true,
  });

  await prisma.organization_roles.createMany({
    data: [
      { code: "brand", name: "Brand" },
      { code: "manufacturer", name: "Manufacturer" },
      { code: "foundry", name: "Foundry" },
      { code: "software_vendor", name: "Software Vendor" },
      { code: "display_maker", name: "Display Maker" },
      { code: "sensor_maker", name: "Sensor Maker" },
      { code: "battery_maker", name: "Battery Maker" },
    ],
    skipDuplicates: true,
  });

  await prisma.regions.createMany({
    data: [
      { code: "global", name: "Global", description: "Phiên bản toàn cầu" },
      { code: "us", name: "United States" },
      { code: "eu", name: "European Union" },
      { code: "cn", name: "China" },
      { code: "vn", name: "Vietnam" },
      { code: "kr", name: "South Korea" },
      { code: "jp", name: "Japan" },
    ],
    skipDuplicates: true,
  });

  // Lấy IDs cho các lookups
  const releasedStatus = await prisma.release_statuses.findUnique({
    where: { code: "released" },
  });
  const announcedStatus = await prisma.release_statuses.findUnique({
    where: { code: "announced" },
  });
  const usd = await prisma.currencies.findUnique({ where: { code: "USD" } });

  // ========================================================
  // 2. ORGANIZATIONS
  // ========================================================
  console.log("🏢 [2/12] Seeding organizations...");
  await normalizeCoreOrganizationSlugs();

  const apple = await prisma.organizations.upsert({
    where: { slug: "apple" },
    update: {},
    create: {
      name: "Apple Inc.",
      slug: "apple",
      short_name: "Apple",
      legal_name: "Apple Inc.",
      country_code: "US",
      founded_year: 1976,
      website_url: "https://apple.com",
      description:
        "Apple là công ty công nghệ của Mỹ phát triển iPhone, iPad, Mac, thiết bị đeo, hệ điều hành và dịch vụ số trong một hệ sinh thái phần cứng và phần mềm tích hợp.",
    },
  });

  const samsung = await prisma.organizations.upsert({
    where: { slug: "samsung" },
    update: {},
    create: {
      name: "Samsung Electronics",
      slug: "samsung",
      short_name: "Samsung",
      legal_name: "Samsung Electronics Co., Ltd.",
      country_code: "KR",
      founded_year: 1969,
      website_url: "https://samsung.com",
      description:
        "Samsung Electronics là tập đoàn điện tử Hàn Quốc phát triển điện thoại, máy tính bảng, TV, thiết bị đeo, màn hình và nhiều linh kiện bán dẫn cho thị trường toàn cầu.",
    },
  });

  const google = await prisma.organizations.upsert({
    where: { slug: "google" },
    update: {},
    create: {
      name: "Google LLC",
      slug: "google",
      short_name: "Google",
      legal_name: "Google LLC",
      country_code: "US",
      founded_year: 1998,
      website_url: "https://google.com",
      description:
        "Google phát triển dịch vụ internet, Android, nền tảng trí tuệ nhân tạo và phần cứng tiêu dùng như điện thoại Pixel, đồng hồ Pixel Watch cùng thiết bị nhà thông minh Nest.",
    },
  });

  const xiaomi = await prisma.organizations.upsert({
    where: { slug: "xiaomi" },
    update: {},
    create: {
      name: "Xiaomi Corporation",
      slug: "xiaomi",
      short_name: "Xiaomi",
      country_code: "CN",
      founded_year: 2010,
      website_url: "https://mi.com",
      description:
        "Xiaomi là tập đoàn điện tử Trung Quốc phát triển điện thoại, máy tính bảng, thiết bị đeo và hệ sinh thái nhà thông minh, với danh mục sản phẩm trải rộng nhiều phân khúc.",
    },
  });

  const qualcomm = await prisma.organizations.upsert({
    where: { slug: "qualcomm" },
    update: {},
    create: {
      name: "Qualcomm Inc.",
      slug: "qualcomm",
      short_name: "Qualcomm",
      country_code: "US",
      founded_year: 1985,
      website_url: "https://qualcomm.com",
      description:
        "Qualcomm là công ty bán dẫn của Mỹ thiết kế nền tảng Snapdragon, modem di động, công nghệ kết nối và giải pháp xử lý dùng trong điện thoại, máy tính cùng thiết bị IoT.",
    },
  });

  const mediatek = await prisma.organizations.upsert({
    where: { slug: "mediatek" },
    update: {},
    create: {
      name: "MediaTek Inc.",
      slug: "mediatek",
      short_name: "MediaTek",
      country_code: "TW",
      founded_year: 1997,
      website_url: "https://mediatek.com",
      description:
        "MediaTek là công ty bán dẫn Đài Loan thiết kế nền tảng Dimensity, chip kết nối và giải pháp xử lý cho điện thoại, máy tính bảng, TV cùng nhiều thiết bị điện tử tiêu dùng.",
    },
  });

  const tsmc = await prisma.organizations.upsert({
    where: { slug: "tsmc" },
    update: {},
    create: {
      name: "Taiwan Semiconductor Manufacturing Company",
      slug: "tsmc",
      short_name: "TSMC",
      country_code: "TW",
      founded_year: 1987,
      website_url: "https://tsmc.com",
      description:
        "TSMC là doanh nghiệp sản xuất bán dẫn theo hợp đồng của Đài Loan, cung cấp nhiều tiến trình chế tạo chip tiên tiến cho các hãng thiết kế bộ xử lý và thiết bị toàn cầu.",
    },
  });

  const sony = await prisma.organizations.upsert({
    where: { slug: "sony" },
    update: {},
    create: {
      name: "Sony Group Corporation",
      slug: "sony",
      short_name: "Sony",
      country_code: "JP",
      founded_year: 1946,
      website_url: "https://sony.com",
      description:
        "Sony phát triển cảm biến hình ảnh, thiết bị âm thanh, máy ảnh, TV BRAVIA và hệ sinh thái PlayStation; công nghệ hình ảnh và giải trí là những nhóm năng lực nổi bật.",
    },
  });

  // ========================================================
  // 3. DEVICE CATEGORIES
  // ========================================================
  console.log("📱 [3/12] Seeding device categories...");
  await normalizeCoreCategorySlugs();

  const smartphone = await prisma.device_categories.upsert({
    where: { slug: "smartphone" },
    update: {
      name: "Điện thoại",
      description: "Điện thoại thông minh",
    },
    create: {
      name: "Điện thoại",
      slug: "smartphone",
      description: "Điện thoại thông minh",
      display_order: 1,
    },
  });

  const tablet = await prisma.device_categories.upsert({
    where: { slug: "tablet" },
    update: {
      name: "Máy tính bảng",
      description: "Máy tính bảng",
    },
    create: {
      name: "Máy tính bảng",
      slug: "tablet",
      description: "Máy tính bảng",
      display_order: 2,
    },
  });

  const laptop = await prisma.device_categories.upsert({
    where: { slug: "laptop" },
    update: {
      name: "Máy tính xách tay",
      description: "Máy tính xách tay",
    },
    create: {
      name: "Máy tính xách tay",
      slug: "laptop",
      description: "Máy tính xách tay",
      display_order: 3,
    },
  });

  const smartwatch = await prisma.device_categories.upsert({
    where: { slug: "smartwatch" },
    update: {
      name: "Đồng hồ thông minh",
      description: "Đồng hồ thông minh",
    },
    create: {
      name: "Đồng hồ thông minh",
      slug: "smartwatch",
      description: "Đồng hồ thông minh",
      display_order: 4,
    },
  });

  const earbuds = await prisma.device_categories.upsert({
    where: { slug: "earbuds" },
    update: {
      name: "Tai nghe không dây",
      description: "Tai nghe không dây",
    },
    create: {
      name: "Tai nghe không dây",
      slug: "earbuds",
      description: "Tai nghe không dây",
      display_order: 5,
    },
  });

  // ========================================================
  // 4. DISPLAY TECHNOLOGIES & BATTERY CHEMISTRIES
  // ========================================================
  console.log(
    "🔬 [4/12] Seeding display technologies & battery chemistries...",
  );

  const ltpoOled = await prisma.display_technologies.upsert({
    where: { slug: "ltpo-oled" },
    update: {},
    create: {
      name: "LTPO OLED",
      slug: "ltpo-oled",
      description:
        "Low-Temperature Polycrystalline Oxide OLED, hỗ trợ refresh rate động",
    },
  });

  const amoled = await prisma.display_technologies.upsert({
    where: { slug: "amoled" },
    update: {},
    create: {
      name: "AMOLED",
      slug: "amoled",
      description: "Active-Matrix Organic Light-Emitting Diode",
    },
  });

  const liIon = await prisma.battery_chemistries.upsert({
    where: { slug: "li-ion" },
    update: {},
    create: {
      name: "Li-ion",
      slug: "li-ion",
      description: "Lithium-ion battery",
    },
  });

  const liPo = await prisma.battery_chemistries.upsert({
    where: { slug: "li-po" },
    update: {},
    create: {
      name: "Li-Po",
      slug: "li-po",
      description: "Lithium Polymer battery",
    },
  });

  // ========================================================
  // 5. PRODUCT FAMILIES
  // ========================================================
  console.log("📦 [5/12] Seeding product families...");

  const iphone16Family = await prisma.product_families.upsert({
    where: { slug: "iphone-16-series" },
    update: {},
    create: {
      brand_org_id: apple.id,
      device_category_id: smartphone.id,
      name: "iPhone 16 Series",
      slug: "iphone-16-series",
      description:
        "Dòng iPhone 16 ra mắt năm 2024, bao gồm các model tiêu chuẩn và Pro với nhiều kích thước, cấu hình camera cùng mức dung lượng dành cho các nhóm người dùng khác nhau.",
      first_release_year: 2024,
    },
  });

  const galaxyS25Family = await prisma.product_families.upsert({
    where: { slug: "galaxy-s25-series" },
    update: {},
    create: {
      brand_org_id: samsung.id,
      device_category_id: smartphone.id,
      name: "Galaxy S25 Series",
      slug: "galaxy-s25-series",
      description:
        "Dòng Galaxy S25 là thế hệ điện thoại cao cấp Samsung ra mắt năm 2025, tập trung vào hiệu năng Snapdragon, camera linh hoạt, bút S Pen và các tính năng Galaxy AI.",
      first_release_year: 2025,
    },
  });

  const pixel9Family = await prisma.product_families.upsert({
    where: { slug: "pixel-9-series" },
    update: {},
    create: {
      brand_org_id: google.id,
      device_category_id: smartphone.id,
      name: "Pixel 9 Series",
      slug: "pixel-9-series",
      description:
        "Dòng Pixel 9 của Google kết hợp nền tảng Tensor G4, hệ thống camera tính toán, Gemini AI và chính sách cập nhật dài trong trải nghiệm Android do Google phát triển.",
      first_release_year: 2024,
    },
  });

  const xiaomi14Family = await prisma.product_families.upsert({
    where: { slug: "xiaomi-14-series" },
    update: {},
    create: {
      brand_org_id: xiaomi.id,
      device_category_id: smartphone.id,
      name: "Xiaomi 14 Series",
      slug: "xiaomi-14-series",
      description:
        "Dòng Xiaomi 14 là nhóm điện thoại cao cấp tập trung vào hiệu năng Snapdragon, hệ thống camera hợp tác Leica, sạc nhanh và màn hình độ sáng cao trong nhiều kích thước.",
      first_release_year: 2023,
    },
  });

  // ========================================================
  // 6. CHIPSETS
  // ========================================================
  console.log("🧠 [6/12] Seeding chipsets...");

  const a18Pro = await prisma.chipsets.upsert({
    where: { slug: "apple-a18-pro" },
    update: {},
    create: {
      manufacturer_org_id: apple.id,
      chip_kind: "soc",
      name: "Apple A18 Pro",
      slug: "apple-a18-pro",
      model_code: "A18 Pro",
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 8,
      announcement_date: new Date("2024-09-09"),
      release_date: new Date("2024-09-20"),
      description:
        "Chipset 3nm flagship của Apple cho iPhone 16 Pro/Pro Max, có Neural Engine 16-core.",
    },
  });

  const snapdragon8Gen4 = await prisma.chipsets.upsert({
    where: { slug: "snapdragon-8-elite" },
    update: {},
    create: {
      manufacturer_org_id: qualcomm.id,
      chip_kind: "soc",
      name: "Snapdragon 8 Elite",
      slug: "snapdragon-8-elite",
      model_code: "SM8750-AB",
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 24,
      announcement_date: new Date("2024-10-21"),
      release_date: new Date("2024-10-21"),
      description:
        "Snapdragon 8 Elite (trước đây là 8 Gen 4) với Oryon CPU custom của Qualcomm.",
    },
  });

  const tensorG4 = await prisma.chipsets.upsert({
    where: { slug: "google-tensor-g4" },
    update: {},
    create: {
      manufacturer_org_id: google.id,
      chip_kind: "soc",
      name: "Google Tensor G4",
      slug: "google-tensor-g4",
      model_code: "GS501",
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 16,
      announcement_date: new Date("2024-08-13"),
      release_date: new Date("2024-08-22"),
      description:
        "Tensor G4 do Google thiết kế và Samsung sản xuất, tối ưu cho AI Gemini.",
    },
  });

  const snapdragon8Gen3 = await prisma.chipsets.upsert({
    where: { slug: "snapdragon-8-gen-3" },
    update: {},
    create: {
      manufacturer_org_id: qualcomm.id,
      chip_kind: "soc",
      name: "Snapdragon 8 Gen 3",
      slug: "snapdragon-8-gen-3",
      model_code: "SM8650-AB",
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 24,
      announcement_date: new Date("2023-10-24"),
      release_date: new Date("2023-11-15"),
      description: "Snapdragon 8 Gen 3 trên Galaxy S24, Xiaomi 14, OnePlus 12.",
    },
  });

  // ========================================================
  // 6B. PROCESSORS, MEMORY, STORAGE, OS & CONNECTIVITY
  // ========================================================
  console.log("⚙️  [6B/14] Seeding hardware component catalog...");

  const appleA18Cpu = await upsertCpu("apple-a18-cpu", {
    manufacturer_org_id: apple.id,
    name: "Apple A18 CPU",
    slug: "apple-a18-cpu",
    core_count: 6,
    thread_count: 6,
    big_little: true,
    isa_name: "ARMv9-A",
    description: "6-core CPU trong Apple A18 Pro.",
  });
  const qualcommOryonCpu = await upsertCpu("qualcomm-oryon-8-elite-cpu", {
    manufacturer_org_id: qualcomm.id,
    name: "Qualcomm Oryon CPU",
    slug: "qualcomm-oryon-8-elite-cpu",
    core_count: 8,
    thread_count: 8,
    big_little: false,
    isa_name: "ARMv9-A",
    description: "CPU Oryon custom trên Snapdragon 8 Elite.",
  });
  const tensorCpu = await upsertCpu("google-tensor-g4-cpu", {
    manufacturer_org_id: google.id,
    name: "Google Tensor G4 CPU",
    slug: "google-tensor-g4-cpu",
    core_count: 8,
    thread_count: 8,
    big_little: true,
    isa_name: "ARMv9-A",
    description: "CPU 8 nhân của Tensor G4.",
  });
  const snapdragon8Gen3Cpu = await upsertCpu("qualcomm-kryo-8-gen-3-cpu", {
    manufacturer_org_id: qualcomm.id,
    name: "Qualcomm Kryo 8 Gen 3 CPU",
    slug: "qualcomm-kryo-8-gen-3-cpu",
    core_count: 8,
    thread_count: 8,
    big_little: true,
    isa_name: "ARMv9-A",
    description: "CPU Kryo của Snapdragon 8 Gen 3.",
  });
  const appleM4Cpu = await upsertCpu("apple-m4-cpu", {
    manufacturer_org_id: apple.id,
    name: "Apple M4 CPU",
    slug: "apple-m4-cpu",
    core_count: 10,
    thread_count: 10,
    big_little: true,
    isa_name: "ARMv9-A",
    description: "CPU 10 nhân của Apple M4.",
  });
  const appleM4ProCpu = await upsertCpu("apple-m4-pro-cpu", {
    manufacturer_org_id: apple.id,
    name: "Apple M4 Pro CPU",
    slug: "apple-m4-pro-cpu",
    core_count: 12,
    thread_count: 12,
    big_little: true,
    isa_name: "ARMv9-A",
    description: "CPU 12 nhân của Apple M4 Pro.",
  });
  const exynosW1000Cpu = await upsertCpu("exynos-w1000-cpu", {
    manufacturer_org_id: samsung.id,
    name: "Exynos W1000 CPU",
    slug: "exynos-w1000-cpu",
    core_count: 5,
    thread_count: 5,
    big_little: false,
    isa_name: "ARMv9-A",
    description: "CPU 5 nhân cho thiết bị wearable.",
  });
  const appleH2Cpu = await upsertCpu("apple-h2-audio-controller", {
    manufacturer_org_id: apple.id,
    name: "Apple H2 Audio Controller",
    slug: "apple-h2-audio-controller",
    core_count: 1,
    thread_count: 1,
    isa_name: "Apple audio silicon",
    description: "Bộ điều khiển âm thanh chuyên dụng trong AirPods Pro 2.",
  });

  const appleGpu = await upsertGpu("apple-gpu-a18-pro", {
    manufacturer_org_id: apple.id,
    name: "Apple GPU (A18 Pro)",
    slug: "apple-gpu-a18-pro",
    compute_units: 6,
    ray_tracing_support: true,
    api_support: "Metal",
  });
  const adrenoGpu = await upsertGpu("adreno-830", {
    manufacturer_org_id: qualcomm.id,
    name: "Adreno 830",
    slug: "adreno-830",
    compute_units: 8,
    ray_tracing_support: true,
    api_support: "Vulkan 1.3, OpenGL ES 3.2",
  });
  const maliGpu = await upsertGpu("mali-g715-mp7", {
    manufacturer_org_id: google.id,
    name: "Mali-G715 MP7",
    slug: "mali-g715-mp7",
    compute_units: 7,
    api_support: "Vulkan 1.3, OpenGL ES 3.2",
  });
  const appleM4Gpu = await upsertGpu("apple-gpu-m4", {
    manufacturer_org_id: apple.id,
    name: "Apple GPU (M4)",
    slug: "apple-gpu-m4",
    compute_units: 10,
    ray_tracing_support: true,
    api_support: "Metal",
  });
  const appleM4ProGpu = await upsertGpu("apple-gpu-m4-pro", {
    manufacturer_org_id: apple.id,
    name: "Apple GPU (M4 Pro)",
    slug: "apple-gpu-m4-pro",
    compute_units: 16,
    ray_tracing_support: true,
    api_support: "Metal",
  });
  const xclipseGpu = await upsertGpu("xclipse-w1000", {
    manufacturer_org_id: samsung.id,
    name: "Xclipse GPU (W1000)",
    slug: "xclipse-w1000",
    compute_units: 1,
    api_support: "OpenGL ES",
  });

  const appleNeuralEngine = await upsertNpu("apple-neural-engine-a18-pro", {
    manufacturer_org_id: apple.id,
    name: "Apple Neural Engine (A18 Pro)",
    slug: "apple-neural-engine-a18-pro",
    tops: 35,
    description: "Neural Engine 16-core cho tác vụ Apple Intelligence.",
  });
  const hexagonNpu = await upsertNpu("qualcomm-hexagon-8-elite", {
    manufacturer_org_id: qualcomm.id,
    name: "Qualcomm Hexagon NPU",
    slug: "qualcomm-hexagon-8-elite",
    tops: 70,
    tops_int4: 70,
    description: "NPU Hexagon trên Snapdragon 8 Elite.",
  });
  const tensorNpu = await upsertNpu("google-tensor-g4-tpu", {
    manufacturer_org_id: google.id,
    name: "Google Tensor TPU",
    slug: "google-tensor-g4-tpu",
    tops: 24,
    description: "Bộ xử lý AI TPU tích hợp Tensor G4.",
  });
  const appleM4Npu = await upsertNpu("apple-neural-engine-m4", {
    manufacturer_org_id: apple.id,
    name: "Apple Neural Engine (M4)",
    slug: "apple-neural-engine-m4",
    tops: 38,
    description: "Neural Engine thế hệ M4 cho AI on-device.",
  });
  const exynosNpu = await upsertNpu("exynos-w1000-npu", {
    manufacturer_org_id: samsung.id,
    name: "Exynos W1000 NPU",
    slug: "exynos-w1000-npu",
    tops: 1,
    description: "NPU tiết kiệm điện cho wearable health features.",
  });

  const qualcommX80 = await upsertModem("snapdragon-x80-5g-modem", {
    manufacturer_org_id: qualcomm.id,
    name: "Snapdragon X80 5G Modem",
    slug: "snapdragon-x80-5g-modem",
    max_downlink_mbps: 10000,
    max_uplink_mbps: 3500,
    supports_mmwave: true,
    supports_satellite: true,
    supported_5g_modes: "NSA, SA, Sub-6, mmWave",
  });
  const samsungExynosModem = await upsertModem("exynos-5400-5g-modem", {
    manufacturer_org_id: samsung.id,
    name: "Exynos 5400 5G Modem",
    slug: "exynos-5400-5g-modem",
    max_downlink_mbps: 14500,
    max_uplink_mbps: 3200,
    supports_mmwave: true,
    supports_satellite: true,
    supported_5g_modes: "NSA, SA, Sub-6, mmWave",
  });
  const mediatekModem = await upsertModem("mediatek-m80-5g-modem", {
    manufacturer_org_id: mediatek.id,
    name: "MediaTek M80 5G Modem",
    slug: "mediatek-m80-5g-modem",
    max_downlink_mbps: 4700,
    max_uplink_mbps: 700,
    supports_mmwave: false,
    supported_5g_modes: "NSA, SA, Sub-6",
  });
  const appleC1Modem = await upsertModem("apple-c1-cellular-modem", {
    manufacturer_org_id: apple.id,
    name: "Apple C1 Cellular Modem",
    slug: "apple-c1-cellular-modem",
    max_downlink_mbps: 5000,
    max_uplink_mbps: 1000,
    supports_mmwave: false,
    supports_satellite: true,
    supported_5g_modes: "NSA, SA, Sub-6",
  });

  const lpddr5x = await upsertMemoryStandard("lpddr5x", {
    organization_id: samsung.id,
    name: "LPDDR5X",
    slug: "lpddr5x",
    memory_type: "LPDDR",
    generation: "5X",
    max_data_rate_mtps: 8533,
    typical_data_rate_mtps: 6400,
    channel_width_bits: 64,
    is_mobile: true,
    release_year: 2021,
  });
  const lpddr5 = await upsertMemoryStandard("lpddr5", {
    organization_id: samsung.id,
    name: "LPDDR5",
    slug: "lpddr5",
    memory_type: "LPDDR",
    generation: "5",
    max_data_rate_mtps: 6400,
    typical_data_rate_mtps: 5500,
    channel_width_bits: 64,
    is_mobile: true,
    release_year: 2020,
  });
  const unifiedMemory = await upsertMemoryStandard("apple-unified-memory", {
    organization_id: apple.id,
    name: "Apple Unified Memory",
    slug: "apple-unified-memory",
    memory_type: "Unified",
    generation: "M4",
    max_data_rate_mtps: 8533,
    bandwidth_gbps: 273,
    channel_width_bits: 512,
    is_mobile: false,
    release_year: 2024,
  });
  const lpddr4x = await upsertMemoryStandard("lpddr4x", {
    organization_id: samsung.id,
    name: "LPDDR4X",
    slug: "lpddr4x",
    memory_type: "LPDDR",
    generation: "4X",
    max_data_rate_mtps: 4266,
    typical_data_rate_mtps: 3733,
    channel_width_bits: 64,
    is_mobile: true,
    release_year: 2017,
  });

  const ufs4 = await upsertStorageStandard("ufs-4-0", {
    organization_id: samsung.id,
    name: "UFS 4.0",
    slug: "ufs-4-0",
    storage_type: "UFS",
    generation: "4.0",
    sequential_read_mbps: 4200,
    sequential_write_mbps: 2800,
    release_year: 2022,
  });
  const ufs31 = await upsertStorageStandard("ufs-3-1", {
    organization_id: samsung.id,
    name: "UFS 3.1",
    slug: "ufs-3-1",
    storage_type: "UFS",
    generation: "3.1",
    sequential_read_mbps: 2100,
    sequential_write_mbps: 1200,
    release_year: 2020,
  });
  const appleNvme = await upsertStorageStandard("apple-nvme", {
    organization_id: apple.id,
    name: "Apple NVMe SSD",
    slug: "apple-nvme",
    storage_type: "NVMe",
    generation: "PCIe",
    sequential_read_mbps: 7000,
    sequential_write_mbps: 6000,
    release_year: 2020,
  });

  const ios18 = await upsertOperatingSystem("ios", {
    vendor_org_id: apple.id,
    name: "iOS",
    slug: "ios",
    os_family: "iOS",
    kernel_type: "XNU",
    is_open_source: false,
  });
  const android15 = await upsertOperatingSystem("android", {
    vendor_org_id: google.id,
    name: "Android",
    slug: "android",
    os_family: "Android",
    kernel_type: "Linux",
    is_open_source: true,
  });
  const ipados17 = await upsertOperatingSystem("ipados", {
    vendor_org_id: apple.id,
    name: "iPadOS",
    slug: "ipados",
    os_family: "iPadOS",
    kernel_type: "XNU",
    is_open_source: false,
  });
  const macos15 = await upsertOperatingSystem("macos", {
    vendor_org_id: apple.id,
    name: "macOS",
    slug: "macos",
    os_family: "macOS",
    kernel_type: "XNU",
    is_open_source: false,
  });
  const wearOs5 = await upsertOperatingSystem("wear-os", {
    vendor_org_id: google.id,
    name: "Wear OS",
    slug: "wear-os",
    os_family: "Wear OS",
    kernel_type: "Linux",
    is_open_source: true,
  });
  const airpodsFirmware = await upsertOperatingSystem("airpods-firmware", {
    vendor_org_id: apple.id,
    name: "AirPods Firmware",
    slug: "airpods-firmware",
    os_family: "Embedded audio",
    kernel_type: "Embedded",
    is_open_source: false,
  });

  const mainCameraRole = await prisma.camera_roles.upsert({
    where: { code: "main" },
    update: {},
    create: { code: "main", name: "Main camera" },
  });
  const telephotoRole = await prisma.camera_roles.upsert({
    where: { code: "telephoto" },
    update: {},
    create: { code: "telephoto", name: "Telephoto camera" },
  });
  const ultrawideRole = await prisma.camera_roles.upsert({
    where: { code: "ultrawide" },
    update: {},
    create: { code: "ultrawide", name: "Ultrawide camera" },
  });
  const iphoneMainCamera = await prisma.camera_modules.upsert({
    where: { slug: "iphone-16-pro-48mp-main" },
    update: {},
    create: {
      manufacturer_org_id: apple.id,
      camera_role_id: mainCameraRole.id,
      name: "iPhone 16 Pro 48MP Fusion main",
      slug: "iphone-16-pro-48mp-main",
      effective_megapixel: 48,
      aperture: "f/1.78",
      focal_length_mm_eq: 24,
      has_ois: true,
      has_af: true,
      video_capabilities: "4K Dolby Vision up to 120 fps",
    },
  });
  const galaxyMainCamera = await prisma.camera_modules.upsert({
    where: { slug: "galaxy-s25-ultra-200mp-main" },
    update: {},
    create: {
      manufacturer_org_id: samsung.id,
      camera_role_id: mainCameraRole.id,
      name: "Galaxy S25 Ultra 200MP Wide",
      slug: "galaxy-s25-ultra-200mp-main",
      effective_megapixel: 200,
      aperture: "f/1.7",
      focal_length_mm_eq: 24,
      has_ois: true,
      has_af: true,
      video_capabilities: "8K at 30 fps",
    },
  });
  const galaxyTelephotoCamera = await prisma.camera_modules.upsert({
    where: { slug: "galaxy-s25-ultra-50mp-telephoto" },
    update: {},
    create: {
      manufacturer_org_id: samsung.id,
      camera_role_id: telephotoRole.id,
      name: "Galaxy S25 Ultra 50MP Telephoto",
      slug: "galaxy-s25-ultra-50mp-telephoto",
      effective_megapixel: 50,
      aperture: "f/3.4",
      focal_length_mm_eq: 111,
      optical_zoom: 5,
      has_ois: true,
      has_af: true,
    },
  });
  const pixelMainCamera = await prisma.camera_modules.upsert({
    where: { slug: "pixel-9-pro-50mp-main" },
    update: {},
    create: {
      manufacturer_org_id: google.id,
      camera_role_id: mainCameraRole.id,
      name: "Pixel 9 Pro 50MP Octa PD main",
      slug: "pixel-9-pro-50mp-main",
      effective_megapixel: 50,
      aperture: "f/1.68",
      focal_length_mm_eq: 25,
      has_ois: true,
      has_af: true,
      video_capabilities: "8K with Video Boost",
    },
  });
  const xiaomiMainCamera = await prisma.camera_modules.upsert({
    where: { slug: "xiaomi-14-ultra-50mp-main" },
    update: {},
    create: {
      manufacturer_org_id: xiaomi.id,
      camera_role_id: mainCameraRole.id,
      name: "Xiaomi 14 Ultra 50MP Leica main",
      slug: "xiaomi-14-ultra-50mp-main",
      effective_megapixel: 50,
      aperture: "f/1.63",
      focal_length_mm_eq: 23,
      has_ois: true,
      has_af: true,
      video_capabilities: "8K at 30 fps",
    },
  });
  const xiaomiUltrawideCamera = await prisma.camera_modules.upsert({
    where: { slug: "xiaomi-14-ultra-50mp-ultrawide" },
    update: {},
    create: {
      manufacturer_org_id: xiaomi.id,
      camera_role_id: ultrawideRole.id,
      name: "Xiaomi 14 Ultra 50MP Ultrawide",
      slug: "xiaomi-14-ultra-50mp-ultrawide",
      effective_megapixel: 50,
      aperture: "f/1.8",
      focal_length_mm_eq: 12,
      has_af: true,
    },
  });

  // ========================================================
  // 7. DISPLAYS
  // ========================================================
  console.log("🖥️  [7/12] Seeding displays...");

  const iphone16ProDisplay = await getOrCreateDisplayUnit(
    "iphone-16-pro-display",
    {
      display_technology_id: ltpoOled.id,
      name: "Super Retina XDR LTPO",
      slug: "iphone-16-pro-display",
      size_inch: 6.3,
      aspect_ratio: "19.5:9",
      resolution_width: 1206,
      resolution_height: 2622,
      pixel_density_ppi: 460,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 1,
      brightness_typical_nits: 1000,
      brightness_hbm_nits: 1600,
      brightness_peak_nits: 2000,
      color_depth_bits: 10,
      color_gamut: "DCI-P3",
      hdr_formats: "HDR10, Dolby Vision",
      protection_glass: "Ceramic Shield 2",
      has_always_on: true,
      description: "Màn hình LTPO OLED của iPhone 16 Pro, 120Hz ProMotion",
    },
  );

  const galaxyS25UltraDisplay = await getOrCreateDisplayUnit(
    "galaxy-s25-ultra-display",
    {
      manufacturer_org_id: samsung.id,
      display_technology_id: ltpoOled.id,
      name: "Dynamic AMOLED 2X",
      slug: "galaxy-s25-ultra-display",
      size_inch: 6.9,
      aspect_ratio: "19.5:9",
      resolution_width: 1440,
      resolution_height: 3120,
      pixel_density_ppi: 505,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 1,
      brightness_typical_nits: 1200,
      brightness_peak_nits: 2600,
      color_depth_bits: 10,
      hdr_formats: "HDR10+",
      protection_glass: "Corning Gorilla Armor 2",
      has_always_on: true,
      description: "Dynamic AMOLED 2X 6.9 inch trên Galaxy S25 Ultra",
    },
  );

  const pixel9ProDisplay = await getOrCreateDisplayUnit("pixel-9-pro-display", {
    display_technology_id: ltpoOled.id,
    name: "Super Actua LTPO",
    slug: "pixel-9-pro-display",
    size_inch: 6.3,
    resolution_width: 1280,
    resolution_height: 2856,
    pixel_density_ppi: 495,
    refresh_rate_hz: 120,
    refresh_rate_min_hz: 1,
    brightness_typical_nits: 1800,
    brightness_peak_nits: 3000,
    color_depth_bits: 10,
    hdr_formats: "HDR10+",
    protection_glass: "Corning Gorilla Glass Victus 2",
    has_always_on: true,
    description: "Super Actua LTPO display, 3000 nits peak brightness",
  });

  const xiaomi14UltraDisplay = await getOrCreateDisplayUnit(
    "xiaomi-14-ultra-display",
    {
      display_technology_id: amoled.id,
      name: "WQHD+ AMOLED",
      slug: "xiaomi-14-ultra-display",
      size_inch: 6.73,
      resolution_width: 1440,
      resolution_height: 3200,
      pixel_density_ppi: 522,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 1,
      brightness_typical_nits: 1000,
      brightness_peak_nits: 3000,
      color_depth_bits: 12,
      hdr_formats: "HDR10+, Dolby Vision",
      protection_glass: "Xiaomi Shield Glass",
      has_always_on: true,
      description: "WQHD+ AMOLED 12-bit color, peak 3000 nits",
    },
  );

  // ========================================================
  // 8. BATTERIES
  // ========================================================
  console.log("🔋 [8/12] Seeding batteries...");

  const iphone16ProBattery = await getOrCreateBatteryUnit(
    "iphone-16-pro-battery",
    {
      manufacturer_org_id: apple.id,
      battery_chemistry_id: liIon.id,
      slug: "iphone-16-pro-battery",
      capacity_mah: 3582,
      energy_wh: 13.81,
      voltage_nominal_v: 3.85,
      wired_charging_w: 27,
      wired_charging_protocol: "USB-PD",
      wireless_charging_w: 25,
      wireless_charging_protocol: "MagSafe",
      removable: false,
      description:
        "Pin Li-ion 3.582 mAh của iPhone 16 Pro, hỗ trợ sạc có dây USB-PD tối đa 27 W và sạc không dây MagSafe tối đa 25 W; pin được lắp cố định trong thiết bị.",
    },
  );

  const galaxyS25UltraBattery = await getOrCreateBatteryUnit(
    "galaxy-s25-ultra-battery",
    {
      manufacturer_org_id: samsung.id,
      battery_chemistry_id: liIon.id,
      slug: "galaxy-s25-ultra-battery",
      capacity_mah: 5000,
      voltage_nominal_v: 3.88,
      wired_charging_w: 45,
      wired_charging_protocol: "USB-PD PPS",
      wireless_charging_w: 15,
      wireless_charging_protocol: "Qi2",
      reverse_wireless_charging_w: 4.5,
      removable: false,
      description:
        "Pin Li-ion 5.000 mAh của Galaxy S25 Ultra, hỗ trợ USB-PD PPS 45 W, sạc không dây 15 W và sạc ngược không dây; pin không thể tháo rời trong sử dụng thông thường.",
    },
  );

  const pixel9ProBattery = await getOrCreateBatteryUnit("pixel-9-pro-battery", {
    battery_chemistry_id: liIon.id,
    slug: "pixel-9-pro-battery",
    capacity_mah: 4700,
    wired_charging_w: 27,
    wired_charging_protocol: "USB-PD",
    wireless_charging_w: 21,
    wireless_charging_protocol: "Qi",
    removable: false,
    description:
      "Pin Li-ion 4.700 mAh của Pixel 9 Pro, hỗ trợ sạc có dây USB-PD 27 W và sạc không dây Qi 21 W; công suất thực tế phụ thuộc bộ sạc và điều kiện nhiệt độ.",
  });

  const xiaomi14UltraBattery = await getOrCreateBatteryUnit(
    "xiaomi-14-ultra-battery",
    {
      battery_chemistry_id: liIon.id,
      slug: "xiaomi-14-ultra-battery",
      capacity_mah: 5300,
      wired_charging_w: 90,
      wired_charging_protocol: "Xiaomi HyperCharge",
      wireless_charging_w: 80,
      wireless_charging_protocol: "Xiaomi HyperCharge Wireless",
      reverse_wireless_charging_w: 10,
      removable: false,
      description:
        "Pin Li-ion 5.300 mAh của Xiaomi 14 Ultra, hỗ trợ HyperCharge có dây 90 W, không dây 80 W và sạc ngược 10 W; pin được lắp cố định trong thân máy.",
    },
  );

  // ========================================================
  // 9. DEVICE MODELS
  // ========================================================
  console.log("📱 [9/12] Seeding device models...");

  const iphone16Pro = await prisma.device_models.upsert({
    where: { slug: "iphone-16-pro" },
    update: {},
    create: {
      product_family_id: iphone16Family.id,
      name: "iPhone 16 Pro",
      slug: "iphone-16-pro",
      internal_codename: "D93",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2024-09-09"),
      release_date: new Date("2024-09-20"),
      generation_label: "Gen 18",
      summary:
        "iPhone 16 Pro là mẫu điện thoại cao cấp với Apple A18 Pro, hệ thống camera 48 MP và các tính năng Apple Intelligence được tích hợp sâu.",
      description: buildStandardModelDescription(
        "iPhone 16 Pro",
        "iPhone 16 Pro là mẫu điện thoại cao cấp với Apple A18 Pro, hệ thống camera 48 MP và các tính năng Apple Intelligence được tích hợp sâu.",
        "điện thoại cao cấp",
      ),
    },
  });

  const galaxyS25Ultra = await prisma.device_models.upsert({
    where: { slug: "galaxy-s25-ultra" },
    update: {},
    create: {
      product_family_id: galaxyS25Family.id,
      name: "Galaxy S25 Ultra",
      slug: "galaxy-s25-ultra",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2025-01-22"),
      release_date: new Date("2025-02-07"),
      generation_label: "Gen 25",
      summary:
        "Galaxy S25 Ultra là flagship Samsung với Snapdragon 8 Elite, camera chính 200 MP, bút S Pen và bộ tính năng Galaxy AI dành cho người dùng cao cấp.",
      description: buildStandardModelDescription(
        "Galaxy S25 Ultra",
        "Galaxy S25 Ultra là flagship Samsung với Snapdragon 8 Elite, camera chính 200 MP, bút S Pen và bộ tính năng Galaxy AI dành cho người dùng cao cấp.",
        "điện thoại cao cấp",
      ),
    },
  });

  const pixel9Pro = await prisma.device_models.upsert({
    where: { slug: "pixel-9-pro" },
    update: {},
    create: {
      product_family_id: pixel9Family.id,
      name: "Pixel 9 Pro",
      slug: "pixel-9-pro",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2024-08-13"),
      release_date: new Date("2024-08-22"),
      generation_label: "Gen 9",
      summary:
        "Pixel 9 Pro tập trung vào trải nghiệm Android nguyên bản, chip Tensor G4, Gemini AI và hệ thống camera tính toán dành cho người dùng yêu thích nhiếp ảnh.",
      description: buildStandardModelDescription(
        "Pixel 9 Pro",
        "Pixel 9 Pro tập trung vào trải nghiệm Android nguyên bản, chip Tensor G4, Gemini AI và hệ thống camera tính toán dành cho người dùng yêu thích nhiếp ảnh.",
        "điện thoại cao cấp",
      ),
    },
  });

  const xiaomi14Ultra = await prisma.device_models.upsert({
    where: { slug: "xiaomi-14-ultra" },
    update: {},
    create: {
      product_family_id: xiaomi14Family.id,
      name: "Xiaomi 14 Ultra",
      slug: "xiaomi-14-ultra",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2024-02-22"),
      release_date: new Date("2024-03-12"),
      generation_label: "Ultra Gen 14",
      summary:
        "Xiaomi 14 Ultra là mẫu camera phone cao cấp với hệ thống ống kính Leica Summilux, cấu hình mạnh và các tính năng nhiếp ảnh chuyên sâu.",
      description: buildStandardModelDescription(
        "Xiaomi 14 Ultra",
        "Xiaomi 14 Ultra là mẫu camera phone cao cấp với hệ thống ống kính Leica Summilux, cấu hình mạnh và các tính năng nhiếp ảnh chuyên sâu.",
        "điện thoại cao cấp",
      ),
    },
  });

  // ========================================================
  // 10. DEVICE VARIANTS + SPECS
  // ========================================================
  console.log("🎨 [10/12] Seeding device variants...");

  // iPhone 16 Pro 256GB Natural Titanium
  const iphone16Pro256 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: iphone16Pro.id,
        variant_name: "256GB Natural Titanium",
      },
    },
    update: {},
    create: {
      device_model_id: iphone16Pro.id,
      variant_name: "256GB Natural Titanium",
      sku_code: "MYWX3LL/A",
      market_name: "iPhone 16 Pro 256GB",
      color_name: "Natural Titanium",
      color_hex: "#C5BFB5",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-09-20"),
      launch_price: 999,
      currency_id: usd!.id,
      is_default: true,
    },
  });

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: iphone16Pro256.id },
    update: {},
    create: {
      device_variant_id: iphone16Pro256.id,
      height_mm: 149.6,
      width_mm: 71.5,
      thickness_mm: 8.25,
      weight_g: 199,
      ingress_protection: "IP68",
      frame_material: "Titanium Grade 5",
      back_material: "Textured matte glass",
      front_glass: "Ceramic Shield 2",
    },
  });

  await upsertVariantChipset(iphone16Pro256.id, a18Pro.id, "soc");
  await upsertVariantDisplay(iphone16Pro256.id, iphone16ProDisplay.id, "main");
  await upsertVariantBattery(
    iphone16Pro256.id,
    iphone16ProBattery.id,
    "internal",
  );

  // iPhone 16 Pro 512GB Black Titanium
  const iphone16Pro512 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: iphone16Pro.id,
        variant_name: "512GB Black Titanium",
      },
    },
    update: {},
    create: {
      device_model_id: iphone16Pro.id,
      variant_name: "512GB Black Titanium",
      sku_code: "MYWY3LL/A",
      color_name: "Black Titanium",
      color_hex: "#3D3D3D",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-09-20"),
      launch_price: 1199,
      currency_id: usd!.id,
      is_default: false,
    },
  });

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: iphone16Pro512.id },
    update: {},
    create: {
      device_variant_id: iphone16Pro512.id,
      height_mm: 149.6,
      width_mm: 71.5,
      thickness_mm: 8.25,
      weight_g: 199,
      ingress_protection: "IP68",
      frame_material: "Titanium Grade 5",
    },
  });

  // Galaxy S25 Ultra 256GB Titanium Silverblue
  const galaxyS25Ultra256 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: galaxyS25Ultra.id,
        variant_name: "256GB Titanium Silverblue",
      },
    },
    update: {},
    create: {
      device_model_id: galaxyS25Ultra.id,
      variant_name: "256GB Titanium Silverblue",
      sku_code: "SM-S938U",
      color_name: "Titanium Silverblue",
      color_hex: "#A8B5C7",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2025-02-07"),
      launch_price: 1299,
      currency_id: usd!.id,
      is_default: true,
    },
  });

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: galaxyS25Ultra256.id },
    update: {},
    create: {
      device_variant_id: galaxyS25Ultra256.id,
      height_mm: 162.8,
      width_mm: 77.6,
      thickness_mm: 8.2,
      weight_g: 218,
      ingress_protection: "IP68",
      frame_material: "Titanium",
      back_material: "Glass",
      front_glass: "Corning Gorilla Armor 2",
    },
  });

  await upsertVariantChipset(galaxyS25Ultra256.id, snapdragon8Gen4.id, "soc");
  await upsertVariantDisplay(
    galaxyS25Ultra256.id,
    galaxyS25UltraDisplay.id,
    "main",
  );
  await upsertVariantBattery(
    galaxyS25Ultra256.id,
    galaxyS25UltraBattery.id,
    "internal",
  );

  // Galaxy S25 Ultra 512GB Titanium Black
  const galaxyS25Ultra512 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: galaxyS25Ultra.id,
        variant_name: "512GB Titanium Black",
      },
    },
    update: {},
    create: {
      device_model_id: galaxyS25Ultra.id,
      variant_name: "512GB Titanium Black",
      sku_code: "SM-S938U-512",
      color_name: "Titanium Black",
      color_hex: "#1C1C1C",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2025-02-07"),
      launch_price: 1419,
      currency_id: usd!.id,
    },
  });

  // Pixel 9 Pro 128GB Obsidian
  const pixel9Pro128 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: pixel9Pro.id,
        variant_name: "128GB Obsidian",
      },
    },
    update: {},
    create: {
      device_model_id: pixel9Pro.id,
      variant_name: "128GB Obsidian",
      sku_code: "GA05131-US",
      color_name: "Obsidian",
      color_hex: "#000000",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-08-22"),
      launch_price: 999,
      currency_id: usd!.id,
      is_default: true,
    },
  });

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: pixel9Pro128.id },
    update: {},
    create: {
      device_variant_id: pixel9Pro128.id,
      height_mm: 152.8,
      width_mm: 72.0,
      thickness_mm: 8.5,
      weight_g: 199,
      ingress_protection: "IP68",
      frame_material: "Aluminum",
      back_material: "Glass",
    },
  });

  await upsertVariantChipset(pixel9Pro128.id, tensorG4.id, "soc");
  await upsertVariantDisplay(pixel9Pro128.id, pixel9ProDisplay.id, "main");
  await upsertVariantBattery(pixel9Pro128.id, pixel9ProBattery.id, "internal");

  // Pixel 9 Pro 256GB Hazel
  const pixel9Pro256 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: pixel9Pro.id,
        variant_name: "256GB Hazel",
      },
    },
    update: {},
    create: {
      device_model_id: pixel9Pro.id,
      variant_name: "256GB Hazel",
      sku_code: "GA05131-HZ",
      color_name: "Hazel",
      color_hex: "#5E5C4E",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-08-22"),
      launch_price: 1099,
      currency_id: usd!.id,
    },
  });

  // Xiaomi 14 Ultra 16GB+512GB Black
  const xiaomi14Ultra512 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: xiaomi14Ultra.id,
        variant_name: "16GB/512GB Black",
      },
    },
    update: {},
    create: {
      device_model_id: xiaomi14Ultra.id,
      variant_name: "16GB/512GB Black",
      color_name: "Black",
      color_hex: "#0F0F0F",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-03-12"),
      launch_price: 1499,
      currency_id: usd!.id,
      is_default: true,
    },
  });

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: xiaomi14Ultra512.id },
    update: {},
    create: {
      device_variant_id: xiaomi14Ultra512.id,
      height_mm: 161.4,
      width_mm: 75.3,
      thickness_mm: 9.2,
      weight_g: 224,
      ingress_protection: "IP68",
      frame_material: "Aluminum",
      back_material: "Vegan leather / Ceramic",
    },
  });

  await upsertVariantChipset(xiaomi14Ultra512.id, snapdragon8Gen3.id, "soc");
  await upsertVariantDisplay(
    xiaomi14Ultra512.id,
    xiaomi14UltraDisplay.id,
    "main",
  );
  await upsertVariantBattery(
    xiaomi14Ultra512.id,
    xiaomi14UltraBattery.id,
    "internal",
  );

  // Xiaomi 14 Ultra 16GB+1TB White
  const xiaomi14Ultra1Tb = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: xiaomi14Ultra.id,
        variant_name: "16GB/1TB White",
      },
    },
    update: {},
    create: {
      device_model_id: xiaomi14Ultra.id,
      variant_name: "16GB/1TB White",
      color_name: "White",
      color_hex: "#FFFFFF",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-03-12"),
      launch_price: 1699,
      currency_id: usd!.id,
    },
  });

  // ========================================================
  // 10B. CROSS-CATEGORY CATALOG COVERAGE
  // ========================================================
  console.log(
    "🧩 [10B/14] Seeding tablet, laptop, wearable and audio records...",
  );

  const appleM4 = await prisma.chipsets.upsert({
    where: { slug: "apple-m4" },
    update: {
      manufacturer_org_id: apple.id,
      chip_kind: "soc",
      name: "Apple M4",
      model_code: "M4",
      supports_64bit: true,
      integrated_wifi: true,
      max_ram_gb: 16,
      announcement_date: new Date("2024-05-07"),
      release_date: new Date("2024-05-15"),
      description:
        "Apple Silicon cho iPad Pro 2024, tích hợp CPU, GPU và Neural Engine trên cùng SoC.",
    },
    create: {
      manufacturer_org_id: apple.id,
      chip_kind: "soc",
      name: "Apple M4",
      slug: "apple-m4",
      model_code: "M4",
      supports_64bit: true,
      integrated_wifi: true,
      max_ram_gb: 16,
      announcement_date: new Date("2024-05-07"),
      release_date: new Date("2024-05-15"),
      description:
        "Apple Silicon cho iPad Pro 2024, tích hợp CPU, GPU và Neural Engine trên cùng SoC.",
    },
  });

  const m4Pro = await prisma.chipsets.upsert({
    where: { slug: "apple-m4-pro" },
    update: {},
    create: {
      manufacturer_org_id: apple.id,
      chip_kind: "soc",
      name: "Apple M4 Pro",
      slug: "apple-m4-pro",
      model_code: "M4 Pro",
      supports_64bit: true,
      integrated_wifi: true,
      max_ram_gb: 48,
      announcement_date: new Date("2024-10-30"),
      release_date: new Date("2024-11-08"),
      description:
        "Apple Silicon cho laptop chuyên nghiệp, tối ưu cho workflow sáng tạo và AI trên thiết bị.",
    },
  });

  const exynosW1000 = await prisma.chipsets.upsert({
    where: { slug: "exynos-w1000" },
    update: {},
    create: {
      manufacturer_org_id: samsung.id,
      chip_kind: "soc",
      name: "Exynos W1000",
      slug: "exynos-w1000",
      model_code: "S5E5535",
      supports_64bit: true,
      integrated_wifi: true,
      max_ram_gb: 2,
      announcement_date: new Date("2024-07-10"),
      release_date: new Date("2024-07-24"),
      description:
        "Chipset wearable 3nm cho Galaxy Watch7, cân bằng hiệu năng và thời lượng pin.",
    },
  });

  const appleH2 = await prisma.chipsets.upsert({
    where: { slug: "apple-h2" },
    update: {},
    create: {
      manufacturer_org_id: apple.id,
      chip_kind: "chipset",
      name: "Apple H2",
      slug: "apple-h2",
      model_code: "H2",
      supports_64bit: false,
      integrated_wifi: false,
      max_ram_gb: 1,
      announcement_date: new Date("2022-09-07"),
      release_date: new Date("2022-09-23"),
      description:
        "Chip âm thanh Apple cho AirPods Pro, hỗ trợ ANC và âm thanh thích ứng.",
    },
  });

  const ipadDisplay = await prisma.display_units.upsert({
    where: { slug: "ipad-pro-13-m4-display" },
    update: {},
    create: {
      manufacturer_org_id: apple.id,
      display_technology_id: ltpoOled.id,
      name: "Ultra Retina XDR Tandem OLED",
      slug: "ipad-pro-13-m4-display",
      size_inch: 13.0,
      resolution_width: 2064,
      resolution_height: 2752,
      pixel_density_ppi: 264,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 10,
      brightness_peak_nits: 1600,
      color_depth_bits: 10,
      color_gamut: "P3",
      hdr_formats: "HDR10, Dolby Vision",
      protection_glass: "Nano-texture glass option",
      has_always_on: false,
      description: "Màn hình Tandem OLED 13 inch dành cho iPad Pro M4.",
    },
  });

  const macbookDisplay = await prisma.display_units.upsert({
    where: { slug: "macbook-pro-14-m4-display" },
    update: {},
    create: {
      manufacturer_org_id: apple.id,
      display_technology_id: ltpoOled.id,
      name: "Liquid Retina XDR",
      slug: "macbook-pro-14-m4-display",
      size_inch: 14.2,
      resolution_width: 3024,
      resolution_height: 1964,
      pixel_density_ppi: 254,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 24,
      brightness_peak_nits: 1600,
      color_depth_bits: 10,
      color_gamut: "P3",
      hdr_formats: "HDR10, Dolby Vision",
      protection_glass: "Glossy glass",
      has_always_on: false,
      description: "Màn hình Liquid Retina XDR 14.2 inch với ProMotion.",
    },
  });

  const watchDisplay = await prisma.display_units.upsert({
    where: { slug: "galaxy-watch7-44-display" },
    update: {},
    create: {
      manufacturer_org_id: samsung.id,
      display_technology_id: amoled.id,
      name: "Super AMOLED Sapphire",
      slug: "galaxy-watch7-44-display",
      size_inch: 1.5,
      resolution_width: 480,
      resolution_height: 480,
      pixel_density_ppi: 453,
      refresh_rate_hz: 60,
      brightness_peak_nits: 2000,
      color_depth_bits: 8,
      protection_glass: "Sapphire Crystal",
      has_always_on: true,
      description: "Màn hình tròn Super AMOLED cho Galaxy Watch7 44mm.",
    },
  });

  const ipadBattery = await prisma.battery_units.upsert({
    where: { slug: "ipad-pro-13-m4-battery" },
    update: {
      description:
        "Pin Li-ion 38,99 Wh của iPad Pro 13-inch M4, hỗ trợ sạc USB Power Delivery tối đa 30 W và được thiết kế cho máy tính bảng mỏng nhẹ; pin không thể tháo rời.",
    },
    create: {
      manufacturer_org_id: apple.id,
      battery_chemistry_id: liIon.id,
      slug: "ipad-pro-13-m4-battery",
      capacity_mah: 10340,
      energy_wh: 38.99,
      voltage_nominal_v: 3.77,
      wired_charging_w: 30,
      wired_charging_protocol: "USB-PD",
      removable: false,
      description:
        "Pin Li-ion 38,99 Wh của iPad Pro 13-inch M4, hỗ trợ sạc USB Power Delivery tối đa 30 W và được thiết kế cho máy tính bảng mỏng nhẹ; pin không thể tháo rời.",
    },
  });

  const macbookBattery = await prisma.battery_units.upsert({
    where: { slug: "macbook-pro-14-m4-battery" },
    update: {
      description:
        "Pin Li-ion 72,4 Wh của MacBook Pro 14-inch M4 Pro, hỗ trợ bộ sạc USB-C Power Delivery đến 96 W; dung lượng được lưu theo Wh để so sánh phù hợp giữa các laptop.",
    },
    create: {
      manufacturer_org_id: apple.id,
      battery_chemistry_id: liIon.id,
      slug: "macbook-pro-14-m4-battery",
      capacity_mah: 5580,
      energy_wh: 72.4,
      voltage_nominal_v: 12.96,
      wired_charging_w: 96,
      wired_charging_protocol: "USB-C Power Delivery",
      removable: false,
      description:
        "Pin Li-ion 72,4 Wh của MacBook Pro 14-inch M4 Pro, hỗ trợ bộ sạc USB-C Power Delivery đến 96 W; dung lượng được lưu theo Wh để so sánh phù hợp giữa các laptop.",
    },
  });

  const watchBattery = await prisma.battery_units.upsert({
    where: { slug: "galaxy-watch7-44-battery" },
    update: {
      description:
        "Pin Li-Po 425 mAh của Galaxy Watch7 44 mm, năng lượng danh định 1,64 Wh và hỗ trợ sạc không dây 5 W; thời lượng thực tế phụ thuộc GPS, màn hình và theo dõi sức khỏe.",
    },
    create: {
      manufacturer_org_id: samsung.id,
      battery_chemistry_id: liPo.id,
      slug: "galaxy-watch7-44-battery",
      capacity_mah: 425,
      energy_wh: 1.64,
      voltage_nominal_v: 3.85,
      wireless_charging_w: 5,
      wireless_charging_protocol: "Wireless charging",
      removable: false,
      description:
        "Pin Li-Po 425 mAh của Galaxy Watch7 44 mm, năng lượng danh định 1,64 Wh và hỗ trợ sạc không dây 5 W; thời lượng thực tế phụ thuộc GPS, màn hình và theo dõi sức khỏe.",
    },
  });

  const airpodsBattery = await prisma.battery_units.upsert({
    where: { slug: "airpods-pro-2-usbc-battery" },
    update: {
      description:
        "Hồ sơ pin Li-Po 523 mAh của hộp sạc AirPods Pro 2 USB-C, hỗ trợ sạc qua USB-C, Qi và MagSafe ở công suất thấp; pin tai nghe và hộp sạc không tháo rời.",
    },
    create: {
      manufacturer_org_id: apple.id,
      battery_chemistry_id: liPo.id,
      slug: "airpods-pro-2-usbc-battery",
      capacity_mah: 523,
      wired_charging_w: 5,
      wired_charging_protocol: "USB-C",
      wireless_charging_w: 5,
      wireless_charging_protocol: "Qi / MagSafe",
      removable: false,
      description:
        "Hồ sơ pin Li-Po 523 mAh của hộp sạc AirPods Pro 2 USB-C, hỗ trợ sạc qua USB-C, Qi và MagSafe ở công suất thấp; pin tai nghe và hộp sạc không tháo rời.",
    },
  });

  const ipadFamily = await prisma.product_families.upsert({
    where: { slug: "ipad-pro-m4-series" },
    update: {},
    create: {
      brand_org_id: apple.id,
      device_category_id: tablet.id,
      name: "iPad Pro M4 Series",
      slug: "ipad-pro-m4-series",
      description:
        "Dòng iPad Pro M4 năm 2024 hướng đến công việc sáng tạo và năng suất di động, kết hợp chip Apple M4, màn hình Tandem OLED cùng hệ sinh thái phụ kiện chuyên nghiệp.",
      first_release_year: 2024,
    },
  });
  const macbookFamily = await prisma.product_families.upsert({
    where: { slug: "macbook-pro-m4-series" },
    update: {},
    create: {
      brand_org_id: apple.id,
      device_category_id: laptop.id,
      name: "MacBook Pro M4 Series",
      slug: "macbook-pro-m4-series",
      description:
        "Dòng MacBook Pro M4 dành cho người dùng chuyên nghiệp cần hiệu năng duy trì, màn hình Liquid Retina XDR, nhiều cổng kết nối và thời lượng pin cho công việc dài ngày.",
      first_release_year: 2024,
    },
  });
  const galaxyWatchFamily = await prisma.product_families.upsert({
    where: { slug: "galaxy-watch7-series" },
    update: {},
    create: {
      brand_org_id: samsung.id,
      device_category_id: smartwatch.id,
      name: "Galaxy Watch7 Series",
      slug: "galaxy-watch7-series",
      description:
        "Dòng đồng hồ Galaxy Watch7 sử dụng Wear OS, tích hợp cảm biến sức khỏe, GPS và các tính năng kết nối trong hệ sinh thái Samsung dành cho theo dõi hoạt động hằng ngày.",
      first_release_year: 2024,
    },
  });
  const airpodsFamily = await prisma.product_families.upsert({
    where: { slug: "airpods-pro-series" },
    update: {},
    create: {
      brand_org_id: apple.id,
      device_category_id: earbuds.id,
      name: "AirPods Pro Series",
      slug: "airpods-pro-series",
      description:
        "Dòng AirPods Pro là tai nghe true wireless cao cấp của Apple, tập trung vào chống ồn chủ động, xuyên âm thích ứng, âm thanh không gian và khả năng kết nối hệ sinh thái.",
      first_release_year: 2022,
    },
  });

  const ipadPro = await prisma.device_models.upsert({
    where: { slug: "ipad-pro-13-m4" },
    update: {},
    create: {
      product_family_id: ipadFamily.id,
      name: "iPad Pro 13-inch M4",
      slug: "ipad-pro-13-m4",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2024-05-07"),
      release_date: new Date("2024-05-15"),
      generation_label: "M4",
      summary:
        "iPad Pro 13-inch M4 là máy tính bảng chuyên nghiệp với màn hình Tandem OLED, chip Apple M4 và thiết kế mỏng nhẹ cho sáng tạo nội dung.",
      description: buildStandardModelDescription(
        "iPad Pro 13-inch M4",
        "iPad Pro 13-inch M4 là máy tính bảng chuyên nghiệp với màn hình Tandem OLED, chip Apple M4 và thiết kế mỏng nhẹ cho sáng tạo nội dung.",
        "máy tính bảng chuyên nghiệp",
      ),
    },
  });
  const macbookPro = await prisma.device_models.upsert({
    where: { slug: "macbook-pro-14-m4-pro" },
    update: {},
    create: {
      product_family_id: macbookFamily.id,
      name: "MacBook Pro 14-inch M4 Pro",
      slug: "macbook-pro-14-m4-pro",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2024-10-30"),
      release_date: new Date("2024-11-08"),
      generation_label: "M4 Pro",
      summary:
        "MacBook Pro 14-inch M4 Pro là laptop chuyên nghiệp với hiệu năng mạnh, màn hình Liquid Retina XDR và thời lượng pin phù hợp công việc dài ngày.",
      description: buildStandardModelDescription(
        "MacBook Pro 14-inch M4 Pro",
        "MacBook Pro 14-inch M4 Pro là laptop chuyên nghiệp với hiệu năng mạnh, màn hình Liquid Retina XDR và thời lượng pin phù hợp công việc dài ngày.",
        "máy tính xách tay chuyên nghiệp",
      ),
    },
  });
  const galaxyWatch7 = await prisma.device_models.upsert({
    where: { slug: "galaxy-watch7-44mm" },
    update: {},
    create: {
      product_family_id: galaxyWatchFamily.id,
      name: "Galaxy Watch7 44mm",
      slug: "galaxy-watch7-44mm",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2024-07-10"),
      release_date: new Date("2024-07-24"),
      generation_label: "Watch7",
      summary:
        "Galaxy Watch7 44mm là đồng hồ thông minh với Exynos W1000, định vị GPS và hệ thống cảm biến sức khỏe thế hệ mới trong thiết kế 44 mm.",
      description: buildStandardModelDescription(
        "Galaxy Watch7 44mm",
        "Galaxy Watch7 44mm là đồng hồ thông minh với Exynos W1000, định vị GPS và hệ thống cảm biến sức khỏe thế hệ mới trong thiết kế 44 mm.",
        "đồng hồ thông minh",
      ),
    },
  });
  const airpodsPro = await prisma.device_models.upsert({
    where: { slug: "airpods-pro-2-usbc" },
    update: {},
    create: {
      product_family_id: airpodsFamily.id,
      name: "AirPods Pro 2 USB-C",
      slug: "airpods-pro-2-usbc",
      release_status_id: releasedStatus!.id,
      announcement_date: new Date("2023-09-12"),
      release_date: new Date("2023-09-22"),
      generation_label: "2nd gen",
      summary:
        "AirPods Pro 2 USB-C là tai nghe không dây chống ồn chủ động với chip Apple H2, âm thanh thích ứng và hộp sạc dùng cổng USB-C.",
      description: buildStandardModelDescription(
        "AirPods Pro 2 USB-C",
        "AirPods Pro 2 USB-C là tai nghe không dây chống ồn chủ động với chip Apple H2, âm thanh thích ứng và hộp sạc dùng cổng USB-C.",
        "tai nghe không dây",
      ),
    },
  });

  const ipadPro256 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: ipadPro.id,
        variant_name: "256GB Wi-Fi Silver",
      },
    },
    update: {},
    create: {
      device_model_id: ipadPro.id,
      variant_name: "256GB Wi-Fi Silver",
      sku_code: "MVX23LL/A",
      color_name: "Silver",
      color_hex: "#D9D9D9",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-05-15"),
      launch_price: 1299,
      currency_id: usd!.id,
      is_default: true,
    },
  });
  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: ipadPro256.id },
    update: {},
    create: {
      device_variant_id: ipadPro256.id,
      height_mm: 281.6,
      width_mm: 215.5,
      thickness_mm: 5.1,
      weight_g: 579,
      ingress_protection: "None",
      frame_material: "Aluminum",
    },
  });
  await prisma.variant_chipsets.upsert({
    where: {
      device_variant_id_chipset_id_chip_role: {
        device_variant_id: ipadPro256.id,
        chipset_id: appleM4.id,
        chip_role: "soc",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: ipadPro256.id,
      chipset_id: appleM4.id,
      chip_role: "soc",
      is_primary: true,
    },
  });
  await prisma.variant_chipsets.deleteMany({
    where: {
      device_variant_id: ipadPro256.id,
      chipset_id: m4Pro.id,
      chip_role: "soc",
    },
  });
  await prisma.variant_displays.upsert({
    where: {
      device_variant_id_display_role_display_order: {
        device_variant_id: ipadPro256.id,
        display_role: "main",
        display_order: 1,
      },
    },
    update: { display_unit_id: ipadDisplay.id },
    create: {
      device_variant_id: ipadPro256.id,
      display_unit_id: ipadDisplay.id,
      display_role: "main",
      display_order: 1,
    },
  });
  await prisma.variant_batteries.upsert({
    where: {
      device_variant_id_battery_unit_id_battery_role: {
        device_variant_id: ipadPro256.id,
        battery_unit_id: ipadBattery.id,
        battery_role: "internal",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: ipadPro256.id,
      battery_unit_id: ipadBattery.id,
      battery_role: "internal",
      is_primary: true,
    },
  });
  const ipadProMainCamera = await prisma.camera_modules.upsert({
    where: { slug: "ipad-pro-13-m4-12mp-wide" },
    update: {
      effective_megapixel: 12,
      aperture: "f/1.8",
      has_af: true,
      video_capabilities: "4K video up to 60 fps",
    },
    create: {
      manufacturer_org_id: apple.id,
      camera_role_id: mainCameraRole.id,
      name: "iPad Pro M4 12MP Wide",
      slug: "ipad-pro-13-m4-12mp-wide",
      effective_megapixel: 12,
      aperture: "f/1.8",
      has_af: true,
      video_capabilities: "4K video up to 60 fps",
      description: "Camera sau góc rộng 12MP của iPad Pro 13 inch M4.",
    },
  });
  await upsertVariantCamera(
    ipadPro256.id,
    ipadProMainCamera.id,
    "rear",
    "main",
    "iPad Pro M4 rear camera system",
  );

  const macbookPro512 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: macbookPro.id,
        variant_name: "24GB/512GB Space Black",
      },
    },
    update: {},
    create: {
      device_model_id: macbookPro.id,
      variant_name: "24GB/512GB Space Black",
      sku_code: "MX2H3LL/A",
      color_name: "Space Black",
      color_hex: "#242424",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-11-08"),
      launch_price: 1999,
      currency_id: usd!.id,
      is_default: true,
    },
  });
  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: macbookPro512.id },
    update: {
      height_mm: 221.2,
      width_mm: 312.6,
      thickness_mm: 15.5,
      weight_g: 1610,
    },
    create: {
      device_variant_id: macbookPro512.id,
      height_mm: 221.2,
      width_mm: 312.6,
      thickness_mm: 15.5,
      weight_g: 1610,
      frame_material: "Aluminum",
    },
  });
  await prisma.variant_chipsets.upsert({
    where: {
      device_variant_id_chipset_id_chip_role: {
        device_variant_id: macbookPro512.id,
        chipset_id: m4Pro.id,
        chip_role: "soc",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: macbookPro512.id,
      chipset_id: m4Pro.id,
      chip_role: "soc",
      is_primary: true,
    },
  });
  await prisma.variant_displays.upsert({
    where: {
      device_variant_id_display_role_display_order: {
        device_variant_id: macbookPro512.id,
        display_role: "main",
        display_order: 1,
      },
    },
    update: { display_unit_id: macbookDisplay.id },
    create: {
      device_variant_id: macbookPro512.id,
      display_unit_id: macbookDisplay.id,
      display_role: "main",
      display_order: 1,
    },
  });
  await prisma.variant_batteries.upsert({
    where: {
      device_variant_id_battery_unit_id_battery_role: {
        device_variant_id: macbookPro512.id,
        battery_unit_id: macbookBattery.id,
        battery_role: "internal",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: macbookPro512.id,
      battery_unit_id: macbookBattery.id,
      battery_role: "internal",
      is_primary: true,
    },
  });

  const galaxyWatch44 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: galaxyWatch7.id,
        variant_name: "44mm Graphite Bluetooth",
      },
    },
    update: {},
    create: {
      device_model_id: galaxyWatch7.id,
      variant_name: "44mm Graphite Bluetooth",
      sku_code: "SM-L310NZKAXAR",
      color_name: "Graphite",
      color_hex: "#3D4145",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2024-07-24"),
      launch_price: 299,
      currency_id: usd!.id,
      is_default: true,
    },
  });
  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: galaxyWatch44.id },
    update: {},
    create: {
      device_variant_id: galaxyWatch44.id,
      height_mm: 44.4,
      width_mm: 44.4,
      thickness_mm: 9.7,
      weight_g: 33.8,
      ingress_protection: "5ATM / IP68",
      frame_material: "Armor Aluminum",
    },
  });
  await prisma.variant_chipsets.upsert({
    where: {
      device_variant_id_chipset_id_chip_role: {
        device_variant_id: galaxyWatch44.id,
        chipset_id: exynosW1000.id,
        chip_role: "soc",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: galaxyWatch44.id,
      chipset_id: exynosW1000.id,
      chip_role: "soc",
      is_primary: true,
    },
  });
  await prisma.variant_displays.upsert({
    where: {
      device_variant_id_display_role_display_order: {
        device_variant_id: galaxyWatch44.id,
        display_role: "main",
        display_order: 1,
      },
    },
    update: { display_unit_id: watchDisplay.id },
    create: {
      device_variant_id: galaxyWatch44.id,
      display_unit_id: watchDisplay.id,
      display_role: "main",
      display_order: 1,
    },
  });
  await prisma.variant_batteries.upsert({
    where: {
      device_variant_id_battery_unit_id_battery_role: {
        device_variant_id: galaxyWatch44.id,
        battery_unit_id: watchBattery.id,
        battery_role: "internal",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: galaxyWatch44.id,
      battery_unit_id: watchBattery.id,
      battery_role: "internal",
      is_primary: true,
    },
  });

  const airpodsPro2 = await prisma.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: airpodsPro.id,
        variant_name: "USB-C White",
      },
    },
    update: {},
    create: {
      device_model_id: airpodsPro.id,
      variant_name: "USB-C White",
      sku_code: "MTJV3AM/A",
      color_name: "White",
      color_hex: "#F5F5F5",
      release_status_id: releasedStatus!.id,
      launch_date: new Date("2023-09-22"),
      launch_price: 249,
      currency_id: usd!.id,
      is_default: true,
    },
  });
  await prisma.variant_chipsets.upsert({
    where: {
      device_variant_id_chipset_id_chip_role: {
        device_variant_id: airpodsPro2.id,
        chipset_id: appleH2.id,
        chip_role: "audio",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: airpodsPro2.id,
      chipset_id: appleH2.id,
      chip_role: "audio",
      is_primary: true,
    },
  });
  await prisma.variant_batteries.upsert({
    where: {
      device_variant_id_battery_unit_id_battery_role: {
        device_variant_id: airpodsPro2.id,
        battery_unit_id: airpodsBattery.id,
        battery_role: "case",
      },
    },
    update: { is_primary: true },
    create: {
      device_variant_id: airpodsPro2.id,
      battery_unit_id: airpodsBattery.id,
      battery_role: "case",
      is_primary: true,
    },
  });
  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: airpodsPro2.id },
    update: {
      height_mm: 30.9,
      width_mm: 21.8,
      thickness_mm: 24,
      weight_g: 5.3,
      ingress_protection: "IP54",
      frame_material: "Polycarbonate",
      notes: "Kích thước và khối lượng của mỗi tai nghe.",
    },
    create: {
      device_variant_id: airpodsPro2.id,
      height_mm: 30.9,
      width_mm: 21.8,
      thickness_mm: 24,
      weight_g: 5.3,
      ingress_protection: "IP54",
      frame_material: "Polycarbonate",
      notes: "Kích thước và khối lượng của mỗi tai nghe.",
    },
  });

  const foundationalIoProfiles = [
    {
      variants: [
        iphone16Pro256,
        iphone16Pro512,
        galaxyS25Ultra256,
        galaxyS25Ultra512,
        pixel9Pro128,
        pixel9Pro256,
        xiaomi14Ultra512,
        xiaomi14Ultra1Tb,
      ],
      data: {
        sim_slots: 2,
        sim_type: "Nano-SIM / eSIM",
        esim_supported: true,
        stereo_speakers: true,
        speaker_count: 2,
        headphone_jack: false,
        has_microsd_slot: false,
      },
    },
    {
      variants: [ipadPro256],
      data: {
        stereo_speakers: true,
        speaker_count: 4,
        headphone_jack: false,
        has_microsd_slot: false,
        notes: "Hệ thống bốn loa và cụm microphone chất lượng phòng thu.",
      },
    },
    {
      variants: [macbookPro512],
      data: {
        stereo_speakers: true,
        speaker_count: 6,
        audio_brand_tuning: "Dolby Atmos",
        headphone_jack: true,
        headphone_jack_size_mm: 3.5,
        notes: "Hệ thống sáu loa và ba microphone định hướng.",
      },
    },
    {
      variants: [galaxyWatch44],
      data: {
        stereo_speakers: false,
        speaker_count: 1,
        headphone_jack: false,
        notes: "Loa và microphone tích hợp cho cuộc gọi.",
      },
    },
    {
      variants: [airpodsPro2],
      data: {
        stereo_speakers: true,
        speaker_count: 2,
        audio_brand_tuning: "Adaptive EQ, Spatial Audio",
        headphone_jack: false,
        notes:
          "Chống ồn chủ động, xuyên âm thích ứng, microphone kép và Spatial Audio.",
      },
    },
  ];
  for (const profile of foundationalIoProfiles) {
    for (const variant of profile.variants) {
      await prisma.variant_io_specs.upsert({
        where: { device_variant_id: variant.id },
        update: profile.data,
        create: { device_variant_id: variant.id, ...profile.data },
      });
    }
  }

  // ========================================================
  // 10C. EXTENDED MULTI-CATEGORY CATALOG
  // ========================================================
  console.log(
    `🗂️ [10C/14] Seeding ${EXPECTED_EXTENDED_CATALOG_SIZE} additional devices...`,
  );

  if (EXTENDED_CATALOG_DEVICES.length !== EXPECTED_EXTENDED_CATALOG_SIZE) {
    throw new Error(
      `Extended catalog must contain exactly ${EXPECTED_EXTENDED_CATALOG_SIZE} devices, found ${EXTENDED_CATALOG_DEVICES.length}.`,
    );
  }

  const profileSlugs = new Set(
    EXTENDED_CATALOG_MODULES.map((profile) => profile.modelSlug),
  );
  const incompleteDeviceProfiles = EXTENDED_CATALOG_DEVICES.filter(
    (device) => !profileSlugs.has(device.modelSlug),
  );
  if (incompleteDeviceProfiles.length > 0) {
    throw new Error(
      `Hardware profiles must exist before device creation: ${incompleteDeviceProfiles
        .map((device) => device.modelSlug)
        .join(", ")}.`,
    );
  }

  const organizationIdBySlug = new Map<string, string>([
    ["apple", apple.id],
    ["samsung", samsung.id],
    ["google", google.id],
    ["xiaomi", xiaomi.id],
    ["sony", sony.id],
  ]);

  for (const organization of EXTENDED_CATALOG_ORGANIZATIONS) {
    const seededOrganization = await prisma.organizations.upsert({
      where: { slug: organization.slug },
      update: {
        name: organization.name,
        short_name: organization.shortName,
        country_code: organization.countryCode,
        website_url: organization.websiteUrl,
        description:
          `${organization.shortName} là thương hiệu hoặc nhà sản xuất được bổ sung vào danh mục SpecHub. ` +
          "Hồ sơ tổ chức phục vụ liên kết dòng sản phẩm, module phần cứng, phần mềm và nguồn dữ liệu theo cùng một quy chuẩn.",
        is_active: true,
        deleted_at: null,
      },
      create: {
        name: organization.name,
        slug: organization.slug,
        short_name: organization.shortName,
        country_code: organization.countryCode,
        website_url: organization.websiteUrl,
        description:
          `${organization.shortName} là thương hiệu hoặc nhà sản xuất được bổ sung vào danh mục SpecHub. ` +
          "Hồ sơ tổ chức phục vụ liên kết dòng sản phẩm, module phần cứng, phần mềm và nguồn dữ liệu theo cùng một quy chuẩn.",
      },
    });
    organizationIdBySlug.set(organization.slug, seededOrganization.id);
  }

  const categoryIdBySlug = new Map<string, string>([
    ["smartphone", smartphone.id],
    ["tablet", tablet.id],
    ["laptop", laptop.id],
    ["smartwatch", smartwatch.id],
    ["earbuds", earbuds.id],
  ]);

  for (const category of EXTENDED_CATALOG_CATEGORIES) {
    const seededCategory = await prisma.device_categories.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        display_order: category.displayOrder,
        is_active: true,
        deleted_at: null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        display_order: category.displayOrder,
      },
    });
    categoryIdBySlug.set(category.slug, seededCategory.id);
  }

  await prisma.device_variants.updateMany({
    where: {
      OR: CATALOG_EXPANSION_100_STALE_DUPLICATE_VARIANTS.map(
        ([modelSlug, variantName]) => ({
          device_model: { slug: modelSlug },
          variant_name: variantName,
        }),
      ),
    },
    data: {
      is_default: false,
      deleted_at: new Date(),
    },
  });

  for (const device of EXTENDED_CATALOG_DEVICES) {
    const brandOrgId = organizationIdBySlug.get(device.brandSlug);
    const deviceCategoryId = categoryIdBySlug.get(device.categorySlug);

    if (!brandOrgId || !deviceCategoryId) {
      throw new Error(
        `Missing catalog reference for ${device.modelSlug}: brand=${device.brandSlug}, category=${device.categorySlug}.`,
      );
    }

    const releaseDate = new Date(device.releaseDate);
    const announcementDate = new Date(device.announcementDate);
    const firstReleaseYear = releaseDate.getUTCFullYear();
    const modelSummary = buildExtendedDeviceSummary(device);
    const detailedDescription = buildExtendedDeviceDescription(device);

    const existingFamily = await prisma.product_families.findFirst({
      where: {
        OR: [
          { slug: device.familySlug },
          {
            brand_org_id: brandOrgId,
            name: device.familyName,
          },
        ],
      },
    });
    const familyData = {
      brand_org_id: brandOrgId,
      device_category_id: deviceCategoryId,
      name: device.familyName,
      description:
        `${device.familyName} thuộc danh mục ${device.categorySlug}, được chuẩn hóa cho bộ dữ liệu mẫu SpecHub. ` +
        "Hồ sơ dòng máy liên kết thương hiệu, phạm vi thế hệ và các model có chung định vị sản phẩm.",
      first_release_year: firstReleaseYear,
      is_active: true,
      deleted_at: null,
    };
    const family = existingFamily
      ? await prisma.product_families.update({
          where: { id: existingFamily.id },
          data: familyData,
        })
      : await prisma.product_families.create({
          data: {
            ...familyData,
            slug: device.familySlug,
          },
        });

    const model = await prisma.device_models.upsert({
      where: { slug: device.modelSlug },
      update: {
        product_family_id: family.id,
        name: device.modelName,
        release_status_id: releasedStatus!.id,
        announcement_date: announcementDate,
        release_date: releaseDate,
        generation_label: device.generation,
        summary: modelSummary,
        description: detailedDescription,
        deleted_at: null,
      },
      create: {
        product_family_id: family.id,
        name: device.modelName,
        slug: device.modelSlug,
        release_status_id: releasedStatus!.id,
        announcement_date: announcementDate,
        release_date: releaseDate,
        generation_label: device.generation,
        summary: modelSummary,
        description: detailedDescription,
      },
    });

    const variant = await prisma.device_variants.upsert({
      where: {
        device_model_id_variant_name: {
          device_model_id: model.id,
          variant_name: device.variantName,
        },
      },
      update: {
        sku_code: device.skuCode,
        market_name: device.modelName,
        color_name: device.colorName,
        color_hex: device.colorHex,
        release_status_id: releasedStatus!.id,
        launch_date: releaseDate,
        launch_price: device.launchPrice,
        currency_id: usd!.id,
        is_default: true,
        notes: device.sourceUrl
          ? `${device.description}\nNguồn thông số: ${device.sourceUrl}`
          : device.description,
        deleted_at: null,
      },
      create: {
        device_model_id: model.id,
        variant_name: device.variantName,
        sku_code: device.skuCode,
        market_name: device.modelName,
        color_name: device.colorName,
        color_hex: device.colorHex,
        release_status_id: releasedStatus!.id,
        launch_date: releaseDate,
        launch_price: device.launchPrice,
        currency_id: usd!.id,
        is_default: true,
        notes: device.sourceUrl
          ? `${device.description}\nNguồn thông số: ${device.sourceUrl}`
          : device.description,
      },
    });

    await prisma.variant_physical_specs.upsert({
      where: { device_variant_id: variant.id },
      update: {
        height_mm: device.heightMm,
        width_mm: device.widthMm,
        thickness_mm: device.thicknessMm,
        weight_g: device.weightG,
        ingress_protection: device.ingressProtection,
        frame_material: device.frameMaterial,
        back_material: device.backMaterial,
      },
      create: {
        device_variant_id: variant.id,
        height_mm: device.heightMm,
        width_mm: device.widthMm,
        thickness_mm: device.thicknessMm,
        weight_g: device.weightG,
        ingress_protection: device.ingressProtection,
        frame_material: device.frameMaterial,
        back_material: device.backMaterial,
      },
    });

    const isSmartphone = device.categorySlug === "smartphone";
    await prisma.variant_io_specs.upsert({
      where: { device_variant_id: variant.id },
      update: {
        sim_slots: isSmartphone ? 2 : undefined,
        sim_type: isSmartphone ? "Nano-SIM / eSIM" : undefined,
        esim_supported:
          isSmartphone && device.brandSlug !== "huawei" ? true : undefined,
        stereo_speakers:
          device.speakerCount === undefined
            ? undefined
            : device.speakerCount > 1,
        speaker_count: device.speakerCount,
        audio_brand_tuning: device.audioTuning,
        headphone_jack: device.headphoneJack,
        has_microsd_slot: device.microSd,
        notes: device.ioNotes,
      },
      create: {
        device_variant_id: variant.id,
        sim_slots: isSmartphone ? 2 : undefined,
        sim_type: isSmartphone ? "Nano-SIM / eSIM" : undefined,
        esim_supported:
          isSmartphone && device.brandSlug !== "huawei" ? true : undefined,
        stereo_speakers:
          device.speakerCount === undefined
            ? undefined
            : device.speakerCount > 1,
        speaker_count: device.speakerCount,
        audio_brand_tuning: device.audioTuning,
        headphone_jack: device.headphoneJack,
        has_microsd_slot: device.microSd,
        notes: device.ioNotes,
      },
    });
  }

  // ========================================================
  // 10D. VARIANT HARDWARE MODULES
  // ========================================================
  console.log(
    "🧩 [10D/14] Linking CPU, RAM, GPU, storage, OS & I/O modules...",
  );

  const ios18Version = await getOrCreateOsVersion(ios18.id, "18.0", {
    release_date: new Date("2024-09-16"),
  });
  const android15Version = await getOrCreateOsVersion(android15.id, "15", {
    release_date: new Date("2024-09-03"),
    api_level: 35,
  });
  const ipados17Version = await getOrCreateOsVersion(ipados17.id, "17.5", {
    release_date: new Date("2024-05-13"),
  });
  const macos15Version = await getOrCreateOsVersion(macos15.id, "15.1", {
    codename: "Sequoia",
    release_date: new Date("2024-09-16"),
  });
  const wearOs5Version = await getOrCreateOsVersion(wearOs5.id, "5.0", {
    release_date: new Date("2024-07-10"),
  });
  const airpodsFirmwareVersion = await getOrCreateOsVersion(
    airpodsFirmware.id,
    "7A305",
    { release_date: new Date("2024-09-26") },
  );

  // ========================================================
  // 10D-1. MODULES FOR THE 80 EXTENDED CATALOG DEVICES
  // ========================================================
  console.log(
    `🔗 [10D-1/14] Linking complete module profiles for ${EXPECTED_EXTENDED_CATALOG_SIZE} devices...`,
  );

  if (EXTENDED_CATALOG_MODULES.length !== EXPECTED_EXTENDED_CATALOG_SIZE) {
    throw new Error(
      `Extended module catalog must contain exactly ${EXPECTED_EXTENDED_CATALOG_SIZE} profiles, found ${EXTENDED_CATALOG_MODULES.length}.`,
    );
  }

  const moduleOrganizations = await prisma.organizations.findMany({
    where: {
      slug: {
        in: [
          ...new Set([
            ...EXTENDED_CATALOG_MODULES.flatMap((profile) => [
              profile.chipset.maker,
              profile.chipset.cpuMaker ?? profile.chipset.maker,
              profile.chipset.gpuMaker ?? profile.chipset.maker,
            ]),
            ...Object.values(EXTENDED_CATALOG_OPERATING_SYSTEMS).map(
              (operatingSystem) => operatingSystem.vendorSlug,
            ),
          ]),
        ],
      },
    },
    select: { id: true, slug: true },
  });
  const moduleOrganizationIdBySlug = new Map(
    moduleOrganizations.map((organization) => [
      organization.slug,
      organization.id,
    ]),
  );

  const oledTechnology = await prisma.display_technologies.upsert({
    where: { slug: "oled" },
    update: {
      name: "OLED",
      description: "Organic Light-Emitting Diode display",
    },
    create: {
      name: "OLED",
      slug: "oled",
      description: "Organic Light-Emitting Diode display",
    },
  });
  const ipsLcdTechnology = await prisma.display_technologies.upsert({
    where: { slug: "ips-lcd" },
    update: {
      name: "IPS LCD",
      description: "In-Plane Switching liquid-crystal display",
    },
    create: {
      name: "IPS LCD",
      slug: "ips-lcd",
      description: "In-Plane Switching liquid-crystal display",
    },
  });
  const miniLedTechnology = await prisma.display_technologies.upsert({
    where: { slug: "mini-led" },
    update: {
      name: "Mini LED",
      description: "LCD display with Mini LED local-dimming backlight",
    },
    create: {
      name: "Mini LED",
      slug: "mini-led",
      description: "LCD display with Mini LED local-dimming backlight",
    },
  });
  const eInkTechnology = await prisma.display_technologies.upsert({
    where: { slug: "e-ink" },
    update: {
      name: "E Ink",
      description: "Low-power electrophoretic paper-like display",
    },
    create: {
      name: "E Ink",
      slug: "e-ink",
      description: "Low-power electrophoretic paper-like display",
    },
  });
  const displayTechnologyIdByKey = new Map<string, string>([
    ["ltpo-oled", ltpoOled.id],
    ["amoled", amoled.id],
    ["oled", oledTechnology.id],
    ["ips-lcd", ipsLcdTechnology.id],
    ["mini-led", miniLedTechnology.id],
    ["e-ink", eInkTechnology.id],
  ]);

  const ddr5 = await upsertMemoryStandard("ddr5", {
    organization_id: samsung.id,
    name: "DDR5",
    slug: "ddr5",
    memory_type: "DDR",
    generation: "5",
    max_data_rate_mtps: 8533,
    typical_data_rate_mtps: 6400,
    channel_width_bits: 64,
    is_mobile: false,
    release_year: 2020,
  });
  const embeddedMemory = await upsertMemoryStandard("embedded-memory", {
    organization_id: samsung.id,
    name: "Embedded Memory",
    slug: "embedded-memory",
    memory_type: "Embedded",
    generation: "Low-power",
    typical_data_rate_mtps: 1600,
    channel_width_bits: 32,
    is_mobile: true,
    release_year: 2020,
  });
  const memoryStandardIdByKey = new Map<string, string>([
    ["lpddr5x", lpddr5x.id],
    ["lpddr5", lpddr5.id],
    ["lpddr4x", lpddr4x.id],
    ["unified", unifiedMemory.id],
    ["ddr5", ddr5.id],
    ["embedded", embeddedMemory.id],
  ]);

  const pcieNvme = await upsertStorageStandard("pcie-4-nvme", {
    organization_id: samsung.id,
    name: "PCIe 4.0 NVMe SSD",
    slug: "pcie-4-nvme",
    storage_type: "NVMe",
    generation: "PCIe 4.0",
    sequential_read_mbps: 7000,
    sequential_write_mbps: 5000,
    release_year: 2019,
  });
  const embeddedMmc = await upsertStorageStandard("emmc-5-1", {
    organization_id: samsung.id,
    name: "eMMC 5.1",
    slug: "emmc-5-1",
    storage_type: "eMMC",
    generation: "5.1",
    sequential_read_mbps: 400,
    sequential_write_mbps: 200,
    release_year: 2015,
  });
  const ufs21 = await upsertStorageStandard("ufs-2-1", {
    organization_id: samsung.id,
    name: "UFS 2.1",
    slug: "ufs-2-1",
    storage_type: "UFS",
    generation: "2.1",
    sequential_read_mbps: 860,
    sequential_write_mbps: 255,
    release_year: 2016,
  });
  const storageStandardIdByKey = new Map<string, string>([
    ["ufs4", ufs4.id],
    ["ufs31", ufs31.id],
    ["ufs21", ufs21.id],
    ["apple-nvme", appleNvme.id],
    ["nvme", pcieNvme.id],
    ["emmc", embeddedMmc.id],
  ]);

  const operatingSystemVersionIdByKey = new Map<string, string>();
  for (const [key, operatingSystemSeed] of Object.entries(
    EXTENDED_CATALOG_OPERATING_SYSTEMS,
  )) {
    const vendorOrgId = moduleOrganizationIdBySlug.get(
      operatingSystemSeed.vendorSlug,
    );
    if (!vendorOrgId) {
      throw new Error(
        `Missing OS vendor ${operatingSystemSeed.vendorSlug} for ${key}.`,
      );
    }

    const operatingSystem = await upsertOperatingSystem(
      operatingSystemSeed.slug,
      {
        vendor_org_id: vendorOrgId,
        name: operatingSystemSeed.name,
        slug: operatingSystemSeed.slug,
        os_family: operatingSystemSeed.family,
        kernel_type: operatingSystemSeed.kernel,
        is_open_source: operatingSystemSeed.kernel === "Linux",
      },
    );
    const version = await getOrCreateOsVersion(
      operatingSystem.id,
      operatingSystemSeed.version,
      { release_date: new Date(operatingSystemSeed.releaseDate) },
    );
    operatingSystemVersionIdByKey.set(key, version.id);
  }

  const extendedVariants = await prisma.device_variants.findMany({
    where: {
      deleted_at: null,
      device_model: {
        slug: {
          in: EXTENDED_CATALOG_MODULES.map((profile) => profile.modelSlug),
        },
      },
    },
    select: {
      id: true,
      is_default: true,
      device_model: {
        select: {
          slug: true,
          product_family: { select: { brand_org_id: true } },
        },
      },
    },
    orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
  });

  const obsoleteEarbudDisplaySlugs = [
    "galaxy-buds3-pro-status-display",
    "sony-wf-1000xm5-status-display",
    "bose-qc-ultra-status-display",
  ];
  await prisma.variant_displays.deleteMany({
    where: {
      display_unit: { slug: { in: obsoleteEarbudDisplaySlugs } },
    },
  });
  await prisma.display_units.deleteMany({
    where: { slug: { in: obsoleteEarbudDisplaySlugs } },
  });

  const extendedVariantByModelSlug = new Map<
    string,
    (typeof extendedVariants)[number]
  >();
  for (const variant of extendedVariants) {
    if (!extendedVariantByModelSlug.has(variant.device_model.slug)) {
      extendedVariantByModelSlug.set(variant.device_model.slug, variant);
    }
  }

  const extendedDeviceBySlug = new Map(
    EXTENDED_CATALOG_DEVICES.map((device) => [device.modelSlug, device]),
  );
  const aiEnabledCategories = new Set([
    "smartphone",
    "tablet",
    "laptop",
    "smartwatch",
    "television",
    "gaming-handheld",
  ]);

  for (const profile of EXTENDED_CATALOG_MODULES) {
    const variant = extendedVariantByModelSlug.get(profile.modelSlug);
    const catalogDevice = extendedDeviceBySlug.get(profile.modelSlug);
    if (!variant || !catalogDevice) {
      throw new Error(
        `Missing device or default variant for module profile ${profile.modelSlug}.`,
      );
    }
    const categorySlug = catalogDevice.categorySlug;

    const chipsetMakerId = moduleOrganizationIdBySlug.get(
      profile.chipset.maker,
    );
    const cpuMakerId = moduleOrganizationIdBySlug.get(
      profile.chipset.cpuMaker ?? profile.chipset.maker,
    );
    const gpuMakerId = moduleOrganizationIdBySlug.get(
      profile.chipset.gpuMaker ?? profile.chipset.maker,
    );
    if (!chipsetMakerId || !cpuMakerId) {
      throw new Error(`Missing silicon organization for ${profile.modelSlug}.`);
    }

    const chipset = await prisma.chipsets.upsert({
      where: { slug: profile.chipset.slug },
      update: {
        manufacturer_org_id: chipsetMakerId,
        name: profile.chipset.name,
        chip_kind: "soc",
        supports_64bit: true,
        integrated_5g: profile.wireless.includes("cellular5g"),
        integrated_wifi: profile.wireless.some((item) =>
          item.startsWith("wifi"),
        ),
        max_ram_gb: profile.memory.capacityGb,
        description:
          `${profile.chipset.name} là SoC 64-bit dùng trên ${catalogDevice.modelName}, ` +
          `kết hợp CPU ${profile.chipset.cores} lõi với ${profile.chipset.gpuName ?? "GPU tích hợp"}. ` +
          `Hồ sơ này hỗ trợ cấu hình ${profile.memory.capacityGb} GB RAM và các chuẩn kết nối đã được liên kết riêng ở cấp phiên bản.`,
        deleted_at: null,
      },
      create: {
        manufacturer_org_id: chipsetMakerId,
        name: profile.chipset.name,
        slug: profile.chipset.slug,
        chip_kind: "soc",
        supports_64bit: true,
        integrated_5g: profile.wireless.includes("cellular5g"),
        integrated_wifi: profile.wireless.some((item) =>
          item.startsWith("wifi"),
        ),
        max_ram_gb: profile.memory.capacityGb,
        description:
          `${profile.chipset.name} là SoC 64-bit dùng trên ${catalogDevice.modelName}, ` +
          `kết hợp CPU ${profile.chipset.cores} lõi với ${profile.chipset.gpuName ?? "GPU tích hợp"}. ` +
          `Hồ sơ này hỗ trợ cấu hình ${profile.memory.capacityGb} GB RAM và các chuẩn kết nối đã được liên kết riêng ở cấp phiên bản.`,
      },
    });
    const cpu = await upsertCpu(profile.chipset.cpuSlug, {
      manufacturer_org_id: cpuMakerId,
      name: profile.chipset.cpuName,
      slug: profile.chipset.cpuSlug,
      core_count: profile.chipset.cores,
      thread_count: profile.chipset.threads ?? profile.chipset.cores,
      big_little: profile.chipset.isa !== "x86-64",
      isa_name: profile.chipset.isa ?? "ARM64",
      description:
        `${profile.chipset.cpuName} là CPU ${profile.chipset.cores} lõi, ` +
        `${profile.chipset.threads ?? profile.chipset.cores} luồng, sử dụng tập lệnh ${profile.chipset.isa ?? "ARM64"}. ` +
        `CPU được liên kết làm bộ xử lý chính của ${profile.chipset.name} trên ${catalogDevice.modelName}.`,
    });
    await prisma.chipset_cpu_links.upsert({
      where: {
        chipset_id_cpu_id: { chipset_id: chipset.id, cpu_id: cpu.id },
      },
      update: { is_primary: true },
      create: { chipset_id: chipset.id, cpu_id: cpu.id, is_primary: true },
    });
    await upsertVariantChipset(variant.id, chipset.id, "soc");
    await upsertVariantCpu(variant.id, cpu.id);

    if (profile.chipset.gpuName && profile.chipset.gpuSlug && gpuMakerId) {
      const gpu = await upsertGpu(profile.chipset.gpuSlug, {
        manufacturer_org_id: gpuMakerId,
        name: profile.chipset.gpuName,
        slug: profile.chipset.gpuSlug,
        ray_tracing_support:
          profile.chipset.gpuName.includes("RTX") ||
          profile.chipset.gpuName.includes("Arc") ||
          profile.chipset.gpuName.includes("Adreno 8") ||
          profile.chipset.gpuName.includes("Apple"),
        description:
          `${profile.chipset.gpuName} là bộ xử lý đồ họa ${profile.chipset.gpuRole === "discrete" ? "rời" : "tích hợp"} ` +
          `đi cùng ${profile.chipset.name} trên ${catalogDevice.modelName}. Module đảm nhiệm giao diện, tăng tốc đồ họa và các API dựng hình do nền tảng hỗ trợ.`,
      });
      await prisma.chipset_gpu_links.upsert({
        where: {
          chipset_id_gpu_id: { chipset_id: chipset.id, gpu_id: gpu.id },
        },
        update: { is_primary: true },
        create: { chipset_id: chipset.id, gpu_id: gpu.id, is_primary: true },
      });
      await upsertVariantGpu(
        variant.id,
        gpu.id,
        profile.chipset.gpuRole ?? "integrated",
      );
    } else if (aiEnabledCategories.has(categorySlug)) {
      const gpuSlug = `${profile.chipset.slug}-integrated-gpu`;
      const gpu = await upsertGpu(gpuSlug, {
        manufacturer_org_id: chipsetMakerId,
        name: `${profile.chipset.name} Integrated GPU`,
        slug: gpuSlug,
        compute_units: 1,
        ray_tracing_support: false,
        api_support: "OpenGL ES / Vulkan theo nền tảng",
        description:
          `GPU tích hợp được chuẩn hóa cho ${profile.chipset.name}; ` +
          "số đơn vị tính toán là mốc hồ sơ seed và cần đối chiếu thông số chính thức.",
      });
      await prisma.chipset_gpu_links.upsert({
        where: {
          chipset_id_gpu_id: {
            chipset_id: chipset.id,
            gpu_id: gpu.id,
          },
        },
        update: { is_primary: true },
        create: {
          chipset_id: chipset.id,
          gpu_id: gpu.id,
          is_primary: true,
        },
      });
      await upsertVariantGpu(variant.id, gpu.id);
    }

    if (aiEnabledCategories.has(categorySlug)) {
      const npuSlug = `${profile.chipset.slug}-ai-engine`;
      const npu = await upsertNpu(npuSlug, {
        manufacturer_org_id: chipsetMakerId,
        name: `${profile.chipset.name} AI Engine`,
        slug: npuSlug,
        tops: null,
        ai_engine_version: "Catalog profile v1",
        description:
          `Bộ xử lý AI tích hợp trong ${profile.chipset.name}, phục vụ suy luận máy học và các tác vụ AI trên ${catalogDevice.modelName}. ` +
          "Hồ sơ không gán giá trị TOPS khi dữ liệu chính hãng chưa xác nhận rõ cho đúng biến thể.",
      });
      await prisma.chipset_npu_links.upsert({
        where: {
          chipset_id_npu_id: {
            chipset_id: chipset.id,
            npu_id: npu.id,
          },
        },
        update: { is_primary: true },
        create: {
          chipset_id: chipset.id,
          npu_id: npu.id,
          is_primary: true,
        },
      });
      await upsertVariantNpu(variant.id, npu.id);
    }

    const cellularGeneration = profile.wireless.includes("cellular5g")
      ? "5G"
      : profile.wireless.includes("cellular4g")
        ? "4G"
        : null;
    if (cellularGeneration) {
      const modemSlug = `${profile.chipset.slug}-integrated-${cellularGeneration.toLowerCase()}-modem`;
      const modem = await upsertModem(modemSlug, {
        manufacturer_org_id: chipsetMakerId,
        name: `${profile.chipset.name} Integrated ${cellularGeneration} Modem`,
        slug: modemSlug,
        max_downlink_mbps: null,
        max_uplink_mbps: null,
        supports_mmwave: null,
        supports_satellite: null,
        supported_5g_modes:
          cellularGeneration === "5G"
            ? "5G theo cấu hình và thị trường của thiết bị"
            : null,
        description:
          `Modem ${cellularGeneration} tích hợp được liên kết với ${profile.chipset.name} trên ${catalogDevice.modelName}. ` +
          "Băng tần và tốc độ tối đa phụ thuộc biến thể thị trường nên không được suy đoán trong bộ seed.",
      });
      await prisma.chipset_modem_links.upsert({
        where: {
          chipset_id_modem_id: {
            chipset_id: chipset.id,
            modem_id: modem.id,
          },
        },
        update: { is_primary: true, is_integrated: true },
        create: {
          chipset_id: chipset.id,
          modem_id: modem.id,
          is_primary: true,
          is_integrated: true,
        },
      });
      await upsertVariantModem(variant.id, modem.id);
    }

    const memoryStandardId = memoryStandardIdByKey.get(profile.memory.standard);
    const storageStandardId = storageStandardIdByKey.get(
      profile.storage.standard,
    );
    if (!memoryStandardId || !storageStandardId) {
      throw new Error(
        `Missing memory or storage standard for ${profile.modelSlug}.`,
      );
    }
    await upsertVariantMemory(
      variant.id,
      memoryStandardId,
      profile.memory.capacityGb,
      {
        speed_mhz: profile.memory.speedMhz,
        channel_count: profile.memory.capacityGb > 2 ? 2 : 1,
      },
    );
    await upsertVariantStorage(
      variant.id,
      storageStandardId,
      profile.storage.capacityGb,
      {
        is_expandable: profile.storage.expandable ?? false,
        expansion_max_gb: profile.storage.expansionMaxGb,
        module_count: 1,
      },
    );

    for (const [displayIndex, display] of [
      ...(profile.display ? [profile.display] : []),
      ...(profile.secondaryDisplay ? [profile.secondaryDisplay] : []),
    ].entries()) {
      const displayTechnologyId = displayTechnologyIdByKey.get(
        display.technology,
      );
      if (!displayTechnologyId) {
        throw new Error(
          `Missing display technology ${display.technology} for ${profile.modelSlug}.`,
        );
      }
      const displayUnit = await prisma.display_units.upsert({
        where: { slug: display.slug },
        update: {
          manufacturer_org_id: variant.device_model.product_family.brand_org_id,
          display_technology_id: displayTechnologyId,
          name: display.name,
          size_inch: display.size,
          resolution_width: display.width,
          resolution_height: display.height,
          refresh_rate_hz: display.refresh,
          brightness_peak_nits: display.peakNits,
          description:
            `Màn hình ${display.role ?? "chính"} ${display.size} inch của ${catalogDevice.modelName}, ` +
            `độ phân giải ${display.width} × ${display.height} và tần số quét tối đa ${display.refresh} Hz` +
            `${display.peakNits ? `, độ sáng đỉnh ${display.peakNits} nit` : ""}.`,
        },
        create: {
          manufacturer_org_id: variant.device_model.product_family.brand_org_id,
          display_technology_id: displayTechnologyId,
          name: display.name,
          slug: display.slug,
          size_inch: display.size,
          resolution_width: display.width,
          resolution_height: display.height,
          refresh_rate_hz: display.refresh,
          brightness_peak_nits: display.peakNits,
          description:
            `Màn hình ${display.role ?? "chính"} ${display.size} inch của ${catalogDevice.modelName}, ` +
            `độ phân giải ${display.width} × ${display.height} và tần số quét tối đa ${display.refresh} Hz` +
            `${display.peakNits ? `, độ sáng đỉnh ${display.peakNits} nit` : ""}.`,
        },
      });
      await upsertVariantDisplay(
        variant.id,
        displayUnit.id,
        display.role ?? "main",
        displayIndex + 1,
      );
    }

    if (profile.battery) {
      const batterySlug = `${profile.modelSlug}-battery`;
      const battery = await prisma.battery_units.upsert({
        where: { slug: batterySlug },
        update: {
          manufacturer_org_id: variant.device_model.product_family.brand_org_id,
          battery_chemistry_id: liPo.id,
          name: `${catalogDevice.modelName} Battery`,
          capacity_mah: profile.battery.capacityMah,
          energy_wh: profile.battery.energyWh,
          wired_charging_w: profile.battery.wiredW,
          wired_charging_protocol: profile.battery.wiredW
            ? "USB Power Delivery / proprietary"
            : undefined,
          wireless_charging_w: profile.battery.wirelessW,
          wireless_charging_protocol: profile.battery.wirelessW
            ? "Qi / proprietary"
            : undefined,
          removable: false,
          description:
            `Pin tích hợp không tháo rời của ${catalogDevice.modelName}, dung lượng ${profile.battery.capacityMah} mAh` +
            `${profile.battery.energyWh ? ` (${profile.battery.energyWh} Wh)` : ""}` +
            `${profile.battery.wiredW ? `, sạc có dây tối đa ${profile.battery.wiredW} W` : ""}` +
            `${profile.battery.wirelessW ? ` và sạc không dây tối đa ${profile.battery.wirelessW} W` : ""}.`,
        },
        create: {
          manufacturer_org_id: variant.device_model.product_family.brand_org_id,
          battery_chemistry_id: liPo.id,
          name: `${catalogDevice.modelName} Battery`,
          slug: batterySlug,
          capacity_mah: profile.battery.capacityMah,
          energy_wh: profile.battery.energyWh,
          wired_charging_w: profile.battery.wiredW,
          wired_charging_protocol: profile.battery.wiredW
            ? "USB Power Delivery / proprietary"
            : undefined,
          wireless_charging_w: profile.battery.wirelessW,
          wireless_charging_protocol: profile.battery.wirelessW
            ? "Qi / proprietary"
            : undefined,
          removable: false,
          description:
            `Pin tích hợp không tháo rời của ${catalogDevice.modelName}, dung lượng ${profile.battery.capacityMah} mAh` +
            `${profile.battery.energyWh ? ` (${profile.battery.energyWh} Wh)` : ""}` +
            `${profile.battery.wiredW ? `, sạc có dây tối đa ${profile.battery.wiredW} W` : ""}` +
            `${profile.battery.wirelessW ? ` và sạc không dây tối đa ${profile.battery.wirelessW} W` : ""}.`,
        },
      });
      await upsertVariantBattery(
        variant.id,
        battery.id,
        profile.battery.role ?? "internal",
      );
    }

    const osVersionId = operatingSystemVersionIdByKey.get(
      profile.operatingSystem,
    );
    if (!osVersionId) {
      throw new Error(
        `Missing operating system ${profile.operatingSystem} for ${profile.modelSlug}.`,
      );
    }
    await upsertVariantOperatingSystem(variant.id, osVersionId);

    const hasActiveCooling =
      categorySlug === "gaming-handheld" ||
      (categorySlug === "laptop" &&
        /RTX|gaming|ROG|Legion|Predator|Omen/i.test(
          `${profile.chipset.gpuName ?? ""} ${catalogDevice.modelName}`,
        ));
    await prisma.variant_thermal_specs.upsert({
      where: { device_variant_id: variant.id },
      update: {
        cooling_type: hasActiveCooling
          ? "active_fan_heatpipe"
          : categorySlug === "smartphone" || categorySlug === "tablet"
            ? "vapor_chamber_graphite"
            : "passive_graphite",
        vc_area_mm2:
          categorySlug === "smartphone" || categorySlug === "tablet"
            ? 5000
            : undefined,
        has_active_cooling: hasActiveCooling,
        notes:
          "Hồ sơ tản nhiệt chuẩn hóa theo danh mục cho bộ seed; cần đối chiếu thiết kế thực tế trước khi xuất bản dữ liệu sản xuất.",
      },
      create: {
        device_variant_id: variant.id,
        cooling_type: hasActiveCooling
          ? "active_fan_heatpipe"
          : categorySlug === "smartphone" || categorySlug === "tablet"
            ? "vapor_chamber_graphite"
            : "passive_graphite",
        vc_area_mm2:
          categorySlug === "smartphone" || categorySlug === "tablet"
            ? 5000
            : undefined,
        has_active_cooling: hasActiveCooling,
        notes:
          "Hồ sơ tản nhiệt chuẩn hóa theo danh mục cho bộ seed; cần đối chiếu thiết kế thực tế trước khi xuất bản dữ liệu sản xuất.",
      },
    });

    if (profile.camera) {
      const cameraPosition = categorySlug === "laptop" ? "front" : "rear";
      const cameraModule = await prisma.camera_modules.upsert({
        where: { slug: `${profile.modelSlug}-main-camera` },
        update: {
          manufacturer_org_id: variant.device_model.product_family.brand_org_id,
          camera_role_id: mainCameraRole.id,
          name: `${catalogDevice.modelName} ${cameraPosition} camera`,
          effective_megapixel: profile.camera.megapixel,
          aperture: `f/${profile.camera.aperture}`,
          has_af: true,
          has_ois: null,
          description:
            `Camera ${cameraPosition} chính của ${catalogDevice.modelName}, độ phân giải ${profile.camera.megapixel} MP và khẩu độ f/${profile.camera.aperture}. ` +
            "Các đặc tính chống rung hoặc lấy nét chỉ được ghi khi có dữ liệu xác nhận riêng.",
        },
        create: {
          manufacturer_org_id: variant.device_model.product_family.brand_org_id,
          camera_role_id: mainCameraRole.id,
          name: `${catalogDevice.modelName} ${cameraPosition} camera`,
          slug: `${profile.modelSlug}-main-camera`,
          effective_megapixel: profile.camera.megapixel,
          aperture: `f/${profile.camera.aperture}`,
          has_af: true,
          has_ois: null,
          description:
            `Camera ${cameraPosition} chính của ${catalogDevice.modelName}, độ phân giải ${profile.camera.megapixel} MP và khẩu độ f/${profile.camera.aperture}. ` +
            "Các đặc tính chống rung hoặc lấy nét chỉ được ghi khi có dữ liệu xác nhận riêng.",
        },
      });
      await upsertVariantCamera(
        variant.id,
        cameraModule.id,
        cameraPosition,
        "main",
        `${catalogDevice.modelName} camera system`,
      );
    }
  }

  const hardwareVariants = await prisma.device_variants.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      variant_name: true,
      device_model: { select: { slug: true } },
    },
  });

  for (const variant of hardwareVariants) {
    const modelSlug = variant.device_model.slug;
    const isIphone = modelSlug === "iphone-16-pro";
    const isGalaxy = modelSlug === "galaxy-s25-ultra";
    const isPixel = modelSlug === "pixel-9-pro";
    const isXiaomi = modelSlug === "xiaomi-14-ultra";
    const isIpad = modelSlug === "ipad-pro-13-m4";
    const isMacbook = modelSlug === "macbook-pro-14-m4-pro";
    const isWatch = modelSlug === "galaxy-watch7-44mm";
    const isAirpods = modelSlug === "airpods-pro-2-usbc";

    if (isIphone) {
      await upsertVariantCpu(variant.id, appleA18Cpu.id);
      await upsertVariantGpu(variant.id, appleGpu.id);
      await upsertVariantNpu(variant.id, appleNeuralEngine.id);
      await upsertVariantModem(variant.id, appleC1Modem.id);
      await upsertVariantMemory(variant.id, lpddr5x.id, 8, {
        speed_mhz: 4266,
        bandwidth_gbps: 68,
        channel_count: 2,
      });
      await upsertVariantStorage(
        variant.id,
        appleNvme.id,
        variant.variant_name.includes("512") ? 512 : 256,
        { module_count: 1 },
      );
      await upsertVariantOperatingSystem(variant.id, ios18Version.id);
      await upsertVariantCamera(
        variant.id,
        iphoneMainCamera.id,
        "rear",
        "main",
        "Fusion camera system",
      );
      continue;
    }

    if (isGalaxy) {
      await upsertVariantCpu(variant.id, qualcommOryonCpu.id);
      await upsertVariantGpu(variant.id, adrenoGpu.id);
      await upsertVariantNpu(variant.id, hexagonNpu.id);
      await upsertVariantModem(variant.id, qualcommX80.id);
      await upsertVariantMemory(variant.id, lpddr5x.id, 12, {
        speed_mhz: 4266,
        bandwidth_gbps: 68,
        channel_count: 2,
      });
      await upsertVariantStorage(
        variant.id,
        ufs4.id,
        variant.variant_name.includes("512") ? 512 : 256,
      );
      await upsertVariantOperatingSystem(variant.id, android15Version.id);
      await upsertVariantCamera(
        variant.id,
        galaxyMainCamera.id,
        "rear",
        "main",
        "ProVisual camera system",
      );
      await upsertVariantCamera(
        variant.id,
        galaxyTelephotoCamera.id,
        "rear",
        "telephoto",
        "ProVisual camera system",
      );
      continue;
    }

    if (isPixel) {
      await upsertVariantCpu(variant.id, tensorCpu.id);
      await upsertVariantGpu(variant.id, maliGpu.id);
      await upsertVariantNpu(variant.id, tensorNpu.id);
      await upsertVariantModem(variant.id, samsungExynosModem.id);
      await upsertVariantMemory(variant.id, lpddr5x.id, 16, {
        speed_mhz: 4266,
        bandwidth_gbps: 68,
        channel_count: 2,
      });
      await upsertVariantStorage(
        variant.id,
        ufs31.id,
        variant.variant_name.includes("256") ? 256 : 128,
      );
      await upsertVariantOperatingSystem(variant.id, android15Version.id);
      await upsertVariantCamera(
        variant.id,
        pixelMainCamera.id,
        "rear",
        "main",
        "Pixel triple camera system",
      );
      continue;
    }

    if (isXiaomi) {
      await upsertVariantCpu(variant.id, snapdragon8Gen3Cpu.id);
      await upsertVariantGpu(variant.id, adrenoGpu.id);
      await upsertVariantNpu(variant.id, hexagonNpu.id);
      await upsertVariantModem(variant.id, qualcommX80.id);
      await upsertVariantMemory(variant.id, lpddr5x.id, 16, {
        speed_mhz: 4266,
        bandwidth_gbps: 68,
        channel_count: 2,
      });
      await upsertVariantStorage(variant.id, ufs4.id, 512);
      await upsertVariantOperatingSystem(variant.id, android15Version.id);
      await upsertVariantCamera(
        variant.id,
        xiaomiMainCamera.id,
        "rear",
        "main",
        "Leica camera system",
      );
      await upsertVariantCamera(
        variant.id,
        xiaomiUltrawideCamera.id,
        "rear",
        "ultrawide",
        "Leica camera system",
      );
      continue;
    }

    if (isIpad) {
      await upsertVariantCpu(variant.id, appleM4Cpu.id);
      await upsertVariantGpu(variant.id, appleM4Gpu.id);
      await upsertVariantNpu(variant.id, appleM4Npu.id);
      await upsertVariantMemory(variant.id, unifiedMemory.id, 8, {
        bandwidth_gbps: 120,
        channel_count: 2,
      });
      await upsertVariantStorage(variant.id, appleNvme.id, 256, {
        module_count: 1,
      });
      await upsertVariantOperatingSystem(variant.id, ipados17Version.id);
      continue;
    }

    if (isMacbook) {
      await upsertVariantCpu(variant.id, appleM4ProCpu.id);
      await upsertVariantGpu(variant.id, appleM4ProGpu.id);
      await upsertVariantNpu(variant.id, appleM4Npu.id);
      await upsertVariantMemory(variant.id, unifiedMemory.id, 24, {
        bandwidth_gbps: 273,
        channel_count: 2,
      });
      await upsertVariantStorage(variant.id, appleNvme.id, 512, {
        module_count: 1,
      });
      await upsertVariantOperatingSystem(variant.id, macos15Version.id);
      continue;
    }

    if (isWatch) {
      await upsertVariantCpu(variant.id, exynosW1000Cpu.id);
      await upsertVariantGpu(variant.id, xclipseGpu.id);
      await upsertVariantNpu(variant.id, exynosNpu.id);
      await upsertVariantMemory(variant.id, lpddr4x.id, 2, {
        speed_mhz: 2133,
        bandwidth_gbps: 17,
        channel_count: 2,
      });
      await upsertVariantStorage(variant.id, ufs31.id, 32, { module_count: 1 });
      await upsertVariantOperatingSystem(variant.id, wearOs5Version.id);
      continue;
    }

    if (isAirpods) {
      await upsertVariantCpu(variant.id, appleH2Cpu.id, "audio");
      await upsertVariantMemory(variant.id, lpddr4x.id, 1, {
        speed_mhz: 1600,
        channel_count: 1,
      });
      await upsertVariantOperatingSystem(variant.id, airpodsFirmwareVersion.id);
    }
  }

  const improvedModuleDescriptionCount =
    await improveLinkedModuleDescriptions();
  console.log(
    `  ✓ ${improvedModuleDescriptionCount} linked hardware descriptions enriched`,
  );

  if (!isCuratedCatalogSeed) {
    console.log(
      `🍎 Seeding the complete ${COMPLETE_IPHONE_MODEL_COUNT}-model iPhone timeline...`,
    );
    const iphoneCatalogResult = await seedCompleteIphoneCatalog(prisma);
    console.log(
      `  ✓ ${iphoneCatalogResult.modelCount} iPhone models and ` +
        `${iphoneCatalogResult.variantCount} variants now have complete module profiles`,
    );
  }

  console.log("🧬 Inheriting shared modules across model variants...");
  const inheritedModuleLinkCount =
    await inheritSharedModulesAcrossModelVariants();
  console.log(`  ✓ ${inheritedModuleLinkCount} shared module links inherited`);

  console.log("🧩 Completing hardware module fields and provenance...");
  const moduleEnrichment = await enrichCatalogModules(prisma);
  console.log(
    `  ✓ ${moduleEnrichment.updatedModules} modules enriched; ` +
      `${moduleEnrichment.coverageRows} fields documented ` +
      `(${moduleEnrichment.statusCounts.populated} populated, ` +
      `${moduleEnrichment.statusCounts.derived} derived, ` +
      `${moduleEnrichment.statusCounts.not_disclosed} not disclosed, ` +
      `${moduleEnrichment.statusCounts.not_applicable} not applicable)`,
  );

  console.log("📚 Seeding the complete Snapdragon silicon catalogue...");
  const snapdragonCatalog = await seedSnapdragonCatalog(prisma);
  console.log(
    `  ✓ ${snapdragonCatalog.chipsets} Snapdragon chipsets; ` +
      `${snapdragonCatalog.cpuLinks} CPU, ${snapdragonCatalog.gpuLinks} GPU, ` +
      `${snapdragonCatalog.npuLinks} DSP/NPU and ${snapdragonCatalog.modemLinks} modem links`,
  );

  console.log("📐 Creating device-module configuration scores...");
  const variantModuleScoreCount = await seedVariantModuleScores();

  // ========================================================
  // 11. PHASE 2 DATA SOURCES & CITATIONS
  // ========================================================
  console.log("🧠 [11/14] Seeding Phase 2 data sources...");

  await prisma.data_sources.upsert({
    where: { slug: "gsmarena" },
    update: {},
    create: {
      name: "GSMArena",
      slug: "gsmarena",
      base_url: "https://www.gsmarena.com",
      reliability: 70,
      crawl_config: {
        seed_urls: ["/apple-phones-48.php"],
        allowed_paths: ["/apple-phones-48.php"],
        rate_limit_ms: 2000,
      },
    },
  });

  await prisma.data_sources.upsert({
    where: { slug: "notebookcheck" },
    update: {},
    create: {
      name: "Notebookcheck",
      slug: "notebookcheck",
      base_url: "https://www.notebookcheck.net",
      reliability: 75,
      crawl_config: {
        seed_urls: ["/Smartphones.110.0.html"],
        allowed_paths: ["/Smartphones.110.0.html"],
        rate_limit_ms: 2500,
      },
    },
  });

  const appleNewsroom = await prisma.sources.upsert({
    where: { slug: "apple-newsroom" },
    update: {},
    create: {
      name: "Apple Newsroom",
      slug: "apple-newsroom",
      source_type: "official",
      base_url: "https://www.apple.com/newsroom",
      trust_level: 5,
      description: "Official Apple press releases and product announcements.",
    },
  });

  const existingAppleCitation = await prisma.citations.findFirst({
    where: {
      source_id: appleNewsroom.id,
      url: "https://www.apple.com/newsroom/",
    },
  });

  if (!existingAppleCitation) {
    await prisma.citations.create({
      data: {
        source_id: appleNewsroom.id,
        url: "https://www.apple.com/newsroom/",
        title: "Apple Newsroom",
        retrieved_at: new Date(),
        excerpt: "Official source placeholder for Phase 2 citation workflow.",
      },
    });
  }

  const googleStore = await prisma.sources.upsert({
    where: { slug: "google-store" },
    update: {},
    create: {
      name: "Google Store",
      slug: "google-store",
      source_type: "official",
      base_url: "https://store.google.com",
      trust_level: 5,
      description: "Official Google hardware specifications and product pages.",
    },
  });

  const samsungNewsroom = await prisma.sources.upsert({
    where: { slug: "samsung-newsroom" },
    update: {},
    create: {
      name: "Samsung Newsroom",
      slug: "samsung-newsroom",
      source_type: "official",
      base_url: "https://news.samsung.com",
      trust_level: 5,
      description:
        "Official Samsung product announcements and technical context.",
    },
  });

  const officialCitations = [
    {
      source_id: googleStore.id,
      url: "https://store.google.com/product/pixel_9_pro_specs",
      title: "Pixel 9 Pro technical specifications",
      excerpt:
        "Official Pixel 9 Pro product specifications and feature overview.",
    },
    {
      source_id: samsungNewsroom.id,
      url: "https://news.samsung.com/global/galaxy-watch7",
      title: "Galaxy Watch7 product announcement",
      excerpt:
        "Official announcement covering Galaxy Watch7 health and performance features.",
    },
  ];

  for (const citation of officialCitations) {
    const existingCitation = await prisma.citations.findFirst({
      where: { url: citation.url },
    });
    if (!existingCitation) {
      await prisma.citations.create({
        data: {
          ...citation,
          retrieved_at: new Date(),
        },
      });
    }
  }

  // ========================================================
  // 11B. DEVICE BENCHMARK COVERAGE
  // ========================================================
  console.log("📊 [11B/14] Seeding sourced benchmarks for every variant...");

  const geekbenchBrowser = await prisma.sources.upsert({
    where: { slug: "geekbench-browser" },
    update: {
      name: "Geekbench Browser",
      source_type: "benchmark_database",
      base_url: "https://browser.geekbench.com",
      trust_level: 4,
      description:
        "Public benchmark database with device charts aggregated from user-submitted Geekbench results.",
    },
    create: {
      name: "Geekbench Browser",
      slug: "geekbench-browser",
      source_type: "benchmark_database",
      base_url: "https://browser.geekbench.com",
      trust_level: 4,
      description:
        "Public benchmark database with device charts aggregated from user-submitted Geekbench results.",
    },
  });
  const dcRainmaker = await prisma.sources.upsert({
    where: { slug: "dc-rainmaker" },
    update: {
      name: "DC Rainmaker",
      source_type: "review_lab",
      base_url: "https://www.dcrainmaker.com",
      trust_level: 4,
      description:
        "Independent wearable review source publishing observed battery and sensor test data.",
    },
    create: {
      name: "DC Rainmaker",
      slug: "dc-rainmaker",
      source_type: "review_lab",
      base_url: "https://www.dcrainmaker.com",
      trust_level: 4,
      description:
        "Independent wearable review source publishing observed battery and sensor test data.",
    },
  });
  const appleSupport = await prisma.sources.upsert({
    where: { slug: "apple-support" },
    update: {
      name: "Apple Support",
      source_type: "official_test",
      base_url: "https://support.apple.com",
      trust_level: 5,
      description:
        "Official Apple technical specifications with disclosed laboratory test protocols.",
    },
    create: {
      name: "Apple Support",
      slug: "apple-support",
      source_type: "official_test",
      base_url: "https://support.apple.com",
      trust_level: 5,
      description:
        "Official Apple technical specifications with disclosed laboratory test protocols.",
    },
  });
  const manufacturerProductSpecs = await prisma.sources.upsert({
    where: { slug: "manufacturer-product-specifications" },
    update: {
      name: "Thông số chính thức của nhà sản xuất",
      source_type: "official_test",
      trust_level: 5,
      description:
        "Trang thông số sản phẩm và giao thức thử do nhà sản xuất công bố.",
    },
    create: {
      name: "Thông số chính thức của nhà sản xuất",
      slug: "manufacturer-product-specifications",
      source_type: "official_test",
      trust_level: 5,
      description:
        "Trang thông số sản phẩm và giao thức thử do nhà sản xuất công bố.",
    },
  });
  const rtingsSource = await prisma.sources.upsert({
    where: { slug: "rtings-lab" },
    update: {
      name: "RTINGS",
      source_type: "review_lab",
      base_url: "https://www.rtings.com",
      trust_level: 4,
      description:
        "Phòng thử độc lập công bố điều kiện đo màn hình, độ trễ và thiết bị điện tử tiêu dùng.",
    },
    create: {
      name: "RTINGS",
      slug: "rtings-lab",
      source_type: "review_lab",
      base_url: "https://www.rtings.com",
      trust_level: 4,
      description:
        "Phòng thử độc lập công bố điều kiện đo màn hình, độ trễ và thiết bị điện tử tiêu dùng.",
    },
  });
  const specHubConfigurationSource = await prisma.sources.upsert({
    where: { slug: "spechub-configuration-model" },
    update: {
      name: "SpecHub Configuration Model",
      source_type: "derived_model",
      trust_level: 2,
      description:
        "Mốc tham chiếu kỹ thuật được suy ra từ độ đầy đủ của hồ sơ module; không phải phép đo hiệu năng trực tiếp.",
    },
    create: {
      name: "SpecHub Configuration Model",
      slug: "spechub-configuration-model",
      source_type: "derived_model",
      trust_level: 2,
      description:
        "Mốc tham chiếu kỹ thuật được suy ra từ độ đầy đủ của hồ sơ module; không phải phép đo hiệu năng trực tiếp.",
    },
  });

  const benchmarkPointUnit = await prisma.units.upsert({
    where: { symbol: "points" },
    update: { name: "benchmark points", quantity_type: "dimensionless" },
    create: {
      symbol: "points",
      name: "benchmark points",
      quantity_type: "dimensionless",
    },
  });
  const hourUnit = await prisma.units.upsert({
    where: { symbol: "h" },
    update: { name: "hour", quantity_type: "time" },
    create: { symbol: "h", name: "hour", quantity_type: "time" },
  });
  const millisecondUnit = await prisma.units.upsert({
    where: { symbol: "ms" },
    update: { name: "millisecond", quantity_type: "time" },
    create: { symbol: "ms", name: "millisecond", quantity_type: "time" },
  });

  const geekbenchCpu = await prisma.benchmarks.upsert({
    where: { slug: "geekbench-6-cpu" },
    update: {
      name: "Geekbench 6 CPU",
      benchmark_type: "cpu",
      target_type: "device_variant",
      version: "6",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Cross-platform CPU benchmark. Seeded chart values are aggregate device scores from Geekbench Browser.",
    },
    create: {
      name: "Geekbench 6 CPU",
      slug: "geekbench-6-cpu",
      benchmark_type: "cpu",
      target_type: "device_variant",
      version: "6",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Cross-platform CPU benchmark. Seeded chart values are aggregate device scores from Geekbench Browser.",
    },
  });
  const catalogConfigurationReference = await prisma.benchmarks.upsert({
    where: { slug: "catalog-configuration-coverage-reference" },
    update: {
      name: "Mức tham chiếu độ phủ cấu hình",
      benchmark_type: "configuration",
      target_type: "device_variant",
      version: "1.0",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Mốc kỹ thuật dùng để xác nhận thiết bị có hồ sơ module hoàn chỉnh trong bộ seed. Đây không phải benchmark hiệu năng.",
    },
    create: {
      name: "Mức tham chiếu độ phủ cấu hình",
      slug: "catalog-configuration-coverage-reference",
      benchmark_type: "configuration",
      target_type: "device_variant",
      version: "1.0",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Mốc kỹ thuật dùng để xác nhận thiết bị có hồ sơ module hoàn chỉnh trong bộ seed. Đây không phải benchmark hiệu năng.",
    },
  });
  const geekbenchGpuOpenCl = await prisma.benchmarks.upsert({
    where: { slug: "geekbench-6-gpu-opencl" },
    update: {
      name: "Geekbench 6 GPU OpenCL",
      benchmark_type: "gpu",
      target_type: "device_variant",
      version: "6",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Phép đo GPU OpenCL đa nền tảng của Geekbench 6. Phiên bản ứng dụng và điều kiện chạy được lưu tại từng benchmark run.",
    },
    create: {
      name: "Geekbench 6 GPU OpenCL",
      slug: "geekbench-6-gpu-opencl",
      benchmark_type: "gpu",
      target_type: "device_variant",
      version: "6",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Phép đo GPU OpenCL đa nền tảng của Geekbench 6. Phiên bản ứng dụng và điều kiện chạy được lưu tại từng benchmark run.",
    },
  });
  const geekbenchCpuChipsetReference = await prisma.benchmarks.upsert({
    where: { slug: "geekbench-6-cpu-chipset-reference" },
    update: {
      name: "Geekbench 6 CPU · tham chiếu chipset",
      benchmark_type: "cpu",
      target_type: "device_variant",
      version: "6-ref-2026.07",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm mở rộng theo kết quả Geekbench công khai của chipset tương ứng. Đây là mức tham chiếu, không phải phép đo trực tiếp trên từng biến thể.",
    },
    create: {
      name: "Geekbench 6 CPU · tham chiếu chipset",
      slug: "geekbench-6-cpu-chipset-reference",
      benchmark_type: "cpu",
      target_type: "device_variant",
      version: "6-ref-2026.07",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm mở rộng theo kết quả Geekbench công khai của chipset tương ứng. Đây là mức tham chiếu, không phải phép đo trực tiếp trên từng biến thể.",
    },
  });
  await prisma.benchmarks.upsert({
    where: { slug: "antutu-v10" },
    update: {
      name: "AnTuTu Benchmark",
      benchmark_type: "system",
      target_type: "device_variant",
      version: "10",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm hiệu năng tổng thể dành cho thiết bị di động. Chỉ đối chiếu kết quả cùng AnTuTu v10, cùng hạng mục và điều kiện đo tương thích.",
    },
    create: {
      name: "AnTuTu Benchmark",
      slug: "antutu-v10",
      benchmark_type: "system",
      target_type: "device_variant",
      version: "10",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm hiệu năng tổng thể dành cho thiết bị di động. Chỉ đối chiếu kết quả cùng AnTuTu v10, cùng hạng mục và điều kiện đo tương thích.",
    },
  });
  await prisma.benchmarks.upsert({
    where: { slug: "antutu-v10-chipset" },
    update: {
      name: "AnTuTu Benchmark · chipset",
      benchmark_type: "system",
      target_type: "chipset",
      version: "10",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm tham chiếu AnTuTu v10 của chipset. Lưu overall và các điểm thành phần CPU, GPU, memory, UX bằng subscore_name; không so trực tiếp với phiên bản AnTuTu khác.",
    },
    create: {
      name: "AnTuTu Benchmark · chipset",
      slug: "antutu-v10-chipset",
      benchmark_type: "system",
      target_type: "chipset",
      version: "10",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm tham chiếu AnTuTu v10 của chipset. Lưu overall và các điểm thành phần CPU, GPU, memory, UX bằng subscore_name; không so trực tiếp với phiên bản AnTuTu khác.",
    },
  });
  await prisma.benchmarks.upsert({
    where: { slug: "antutu-v11-chipset" },
    update: {
      name: "AnTuTu Benchmark · chipset",
      benchmark_type: "system",
      target_type: "chipset",
      version: "11",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm tham chiếu AnTuTu v11 của chipset. Lưu overall và các điểm thành phần CPU, GPU, memory, UX bằng subscore_name; không so trực tiếp với phiên bản AnTuTu khác.",
    },
    create: {
      name: "AnTuTu Benchmark · chipset",
      slug: "antutu-v11-chipset",
      benchmark_type: "system",
      target_type: "chipset",
      version: "11",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm tham chiếu AnTuTu v11 của chipset. Lưu overall và các điểm thành phần CPU, GPU, memory, UX bằng subscore_name; không so trực tiếp với phiên bản AnTuTu khác.",
    },
  });
  await prisma.benchmarks.upsert({
    where: { slug: "geekbench-6-cpu-chipset" },
    update: {
      name: "Geekbench 6 CPU · chipset",
      benchmark_type: "cpu",
      target_type: "chipset",
      version: "6",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm CPU tham chiếu của chipset; dùng subscore_name single_core và multi_core, kèm nguồn và điều kiện đo khi có.",
    },
    create: {
      name: "Geekbench 6 CPU · chipset",
      slug: "geekbench-6-cpu-chipset",
      benchmark_type: "cpu",
      target_type: "chipset",
      version: "6",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Điểm CPU tham chiếu của chipset; dùng subscore_name single_core và multi_core, kèm nguồn và điều kiện đo khi có.",
    },
  });
  await prisma.benchmarks.upsert({
    where: { slug: "3dmark-wild-life-extreme" },
    update: {
      name: "3DMark Wild Life Extreme",
      benchmark_type: "gpu",
      target_type: "device_variant",
      version: "1.1",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Phép đo đồ họa đa nền tảng. Kết quả chỉ được đối chiếu khi cùng phiên bản bài đo và cấu hình chạy.",
    },
    create: {
      name: "3DMark Wild Life Extreme",
      slug: "3dmark-wild-life-extreme",
      benchmark_type: "gpu",
      target_type: "device_variant",
      version: "1.1",
      higher_is_better: true,
      unit_id: benchmarkPointUnit.id,
      description:
        "Phép đo đồ họa đa nền tảng. Kết quả chỉ được đối chiếu khi cùng phiên bản bài đo và cấu hình chạy.",
    },
  });
  const batteryEndurance = await prisma.benchmarks.upsert({
    where: { slug: "battery-endurance" },
    update: {
      name: "Thời lượng pin đo được",
      benchmark_type: "battery",
      target_type: "device_variant",
      version: "source-protocol",
      higher_is_better: true,
      unit_id: hourUnit.id,
      description:
        "Thời lượng quan sát hoặc đo trong phòng thử; chỉ so sánh khi cùng giao thức và điều kiện.",
    },
    create: {
      name: "Thời lượng pin đo được",
      slug: "battery-endurance",
      benchmark_type: "battery",
      target_type: "device_variant",
      version: "source-protocol",
      higher_is_better: true,
      unit_id: hourUnit.id,
      description:
        "Thời lượng quan sát hoặc đo trong phòng thử; chỉ so sánh khi cùng giao thức và điều kiện.",
    },
  });
  const manufacturerEnduranceReference = await prisma.benchmarks.upsert({
    where: { slug: "manufacturer-endurance-reference" },
    update: {
      name: "Thời lượng pin · tham chiếu hãng",
      benchmark_type: "battery",
      target_type: "device_variant",
      version: "claim-2026.07",
      higher_is_better: true,
      unit_id: hourUnit.id,
      description:
        "Thời lượng pin do nhà sản xuất công bố theo giao thức riêng; chỉ dùng làm tham chiếu và không thay thế phép đo độc lập.",
    },
    create: {
      name: "Thời lượng pin · tham chiếu hãng",
      slug: "manufacturer-endurance-reference",
      benchmark_type: "battery",
      target_type: "device_variant",
      version: "claim-2026.07",
      higher_is_better: true,
      unit_id: hourUnit.id,
      description:
        "Thời lượng pin do nhà sản xuất công bố theo giao thức riêng; chỉ dùng làm tham chiếu và không thay thế phép đo độc lập.",
    },
  });
  const tvInputLagReference = await prisma.benchmarks.upsert({
    where: { slug: "tv-input-lag-4k-120-reference" },
    update: {
      name: "Độ trễ đầu vào TV · tham chiếu 4K 120 Hz",
      benchmark_type: "latency",
      target_type: "device_variant",
      version: "2026.07",
      higher_is_better: false,
      unit_id: millisecondUnit.id,
      description:
        "Độ trễ đầu vào tham chiếu ở tín hiệu 4K 120 Hz; giá trị thấp hơn tốt hơn.",
    },
    create: {
      name: "Độ trễ đầu vào TV · tham chiếu 4K 120 Hz",
      slug: "tv-input-lag-4k-120-reference",
      benchmark_type: "latency",
      target_type: "device_variant",
      version: "2026.07",
      higher_is_better: false,
      unit_id: millisecondUnit.id,
      description:
        "Độ trễ đầu vào tham chiếu ở tín hiệu 4K 120 Hz; giá trị thấp hơn tốt hơn.",
    },
  });

  const aggregateEnvironment =
    "Aggregate of user-submitted Geekbench 6 results; operating system, ambient temperature and power profile vary by submission.";
  const geekbenchSeeds = [
    {
      variants: [iphone16Pro256, iphone16Pro512],
      url: "https://browser.geekbench.com/ios_devices/iphone-16-pro",
      title: "iPhone 16 Pro Benchmarks",
      excerpt:
        "Geekbench Browser aggregate chart: 3444 single-core and 8641 multi-core.",
      singleCore: 3444,
      multiCore: 8641,
    },
    {
      variants: [galaxyS25Ultra256, galaxyS25Ultra512],
      url: "https://browser.geekbench.com/android_devices/samsung-sm-s938n",
      title: "Samsung Galaxy S25 Ultra Benchmarks",
      excerpt:
        "Geekbench Browser aggregate chart: 2847 single-core and 9396 multi-core.",
      singleCore: 2847,
      multiCore: 9396,
    },
    {
      variants: [pixel9Pro128, pixel9Pro256],
      url: "https://browser.geekbench.com/android_devices/google-pixel-9-pro",
      title: "Google Pixel 9 Pro Benchmarks",
      excerpt:
        "Geekbench Browser aggregate chart: 1863 single-core and 4285 multi-core.",
      singleCore: 1863,
      multiCore: 4285,
    },
    {
      variants: [xiaomi14Ultra512, xiaomi14Ultra1Tb],
      url: "https://browser.geekbench.com/android_devices/xiaomi-14-ultra",
      title: "Xiaomi 14 Ultra Benchmarks",
      excerpt:
        "Geekbench Browser aggregate chart: 2087 single-core and 6479 multi-core.",
      singleCore: 2087,
      multiCore: 6479,
    },
    {
      variants: [ipadPro256],
      url: "https://browser.geekbench.com/ios_devices/ipad-pro-13-inch-m4-9c-cpu",
      title: "iPad Pro 13-inch M4 9-core CPU Benchmarks",
      excerpt:
        "Geekbench Browser aggregate chart for the 9-core M4: 3690 single-core and 13510 multi-core.",
      singleCore: 3690,
      multiCore: 13510,
    },
    {
      variants: [macbookPro512],
      url: "https://browser.geekbench.com/macs/macbook-pro-14-inch-2024-12c-cpu",
      title: "MacBook Pro 14-inch M4 Pro 12-core Benchmarks",
      excerpt:
        "Geekbench Browser aggregate chart for the 12-core M4 Pro: 3854 single-core and 20324 multi-core.",
      singleCore: 3854,
      multiCore: 20324,
    },
  ];

  for (const seed of geekbenchSeeds) {
    const citation = await upsertCitation({
      source_id: geekbenchBrowser.id,
      url: seed.url,
      title: seed.title,
      retrieved_at: new Date(),
      excerpt: seed.excerpt,
    });
    const run = await upsertBenchmarkRun({
      benchmark_id: geekbenchCpu.id,
      source_id: geekbenchBrowser.id,
      citation_id: citation.id,
      test_environment_note: aggregateEnvironment,
      os_version: "mixed",
      app_version: "Geekbench 6 aggregate chart",
      power_mode: "aggregate",
    });

    for (const variant of seed.variants) {
      for (const result of [
        { subscore_name: "single_core", score: seed.singleCore },
        { subscore_name: "multi_core", score: seed.multiCore },
      ]) {
        await upsertDeviceBenchmark({
          benchmark_run_id: run.id,
          benchmark_id: geekbenchCpu.id,
          device_variant_id: variant.id,
          score: result.score,
          subscore_name: result.subscore_name,
          source_id: geekbenchBrowser.id,
        });
      }
    }
  }

  const lenovoTabExtremeVariant = await prisma.device_variants.findFirst({
    where: {
      deleted_at: null,
      device_model: { slug: "lenovo-tab-extreme" },
    },
    orderBy: [{ is_default: "desc" }, { launch_date: "asc" }],
  });
  if (lenovoTabExtremeVariant) {
    const citation = await upsertCitation({
      source_id: geekbenchBrowser.id,
      url: "https://browser.geekbench.com/v6/compute/5250145",
      title: "LENOVO TB570FU - Geekbench 6 GPU OpenCL",
      author: "Geekbench Browser",
      published_at: new Date("2025-11-22T05:02:00Z"),
      retrieved_at: new Date(),
      excerpt:
        "Geekbench 6.5.0 OpenCL result for LENOVO TB570FU on Android 15: 4100 points.",
    });
    const run = await upsertBenchmarkRun({
      benchmark_id: geekbenchGpuOpenCl.id,
      source_id: geekbenchBrowser.id,
      citation_id: citation.id,
      test_environment_note:
        "LENOVO TB570FU, Android 15, Mali-G710 MC10, 10 compute units at up to 848 MHz and 11.41 GB system memory.",
      os_version: "Android 15",
      app_version: "Geekbench 6.5.0",
      power_mode: "not documented",
    });
    await upsertDeviceBenchmark({
      benchmark_run_id: run.id,
      benchmark_id: geekbenchGpuOpenCl.id,
      device_variant_id: lenovoTabExtremeVariant.id,
      score: 4100,
      subscore_name: "opencl",
      source_id: geekbenchBrowser.id,
      tested_at: new Date("2025-11-22T05:02:00Z"),
    });
  }

  const watchCitation = await upsertCitation({
    source_id: dcRainmaker.id,
    url: "https://www.dcrainmaker.com/2024/08/samsung-galaxy-reviewaccuracy.html",
    title:
      "Samsung Galaxy Watch 7 In-Depth Review: Half the price, half the accuracy?",
    author: "DC Rainmaker",
    retrieved_at: new Date(),
    excerpt:
      "The tested 44 mm non-LTE Galaxy Watch7 delivered roughly 1.5 days (36 hours) on most days.",
  });
  const watchRun = await upsertBenchmarkRun({
    benchmark_id: batteryEndurance.id,
    source_id: dcRainmaker.id,
    citation_id: watchCitation.id,
    test_environment_note:
      "Reviewer-observed mixed daily use on the 44 mm non-LTE edition; workload and ambient temperature were not standardized.",
    os_version: "Wear OS 5",
    app_version: "review protocol",
    power_mode: "mixed use",
  });
  await upsertDeviceBenchmark({
    benchmark_run_id: watchRun.id,
    benchmark_id: batteryEndurance.id,
    device_variant_id: galaxyWatch44.id,
    score: 36,
    subscore_name: "mixed_use_runtime",
    source_id: dcRainmaker.id,
  });

  const airpodsCitation = await upsertCitation({
    source_id: appleSupport.id,
    url: "https://support.apple.com/en-mide/111834",
    title: "AirPods Pro 2 with MagSafe Charging Case (USB-C) - Tech Specs",
    author: "Apple",
    retrieved_at: new Date(),
    excerpt:
      "Apple reports up to 6 hours from a full discharge test at 50% volume with ANC enabled.",
  });
  const airpodsRun = await upsertBenchmarkRun({
    benchmark_id: batteryEndurance.id,
    source_id: appleSupport.id,
    citation_id: airpodsCitation.id,
    test_environment_note:
      "Apple August 2023 lab test: preproduction AirPods Pro 2 USB-C and iPhone 15 Pro, 358 AAC tracks, 50% volume, ANC enabled, discharged until the first earbud stopped playback.",
    os_version: "preproduction iPhone 15 Pro software",
    app_version: "Apple August 2023 lab protocol",
    power_mode: "ANC enabled",
  });
  await upsertDeviceBenchmark({
    benchmark_run_id: airpodsRun.id,
    benchmark_id: batteryEndurance.id,
    device_variant_id: airpodsPro2.id,
    score: 6,
    subscore_name: "anc_listening_runtime",
    source_id: appleSupport.id,
  });

  // Mọi thiết bị đều có ít nhất một phép đo trực tiếp hoặc điểm tham chiếu có
  // nguồn. Điểm tham chiếu chipset được seed cho cả thiết bị đã có benchmark
  // gốc để luôn tồn tại một phép đo chung khi so sánh chéo danh mục.
  const benchmarkCoverageVariants = await prisma.device_variants.findMany({
    where: { deleted_at: null, device_model: { deleted_at: null } },
    select: {
      id: true,
      device_model_id: true,
      variant_name: true,
      device_model: {
        select: {
          name: true,
          slug: true,
          product_family: {
            select: {
              device_category: { select: { slug: true } },
            },
          },
        },
      },
      variant_chipsets: {
        select: {
          is_primary: true,
          chipset: { select: { name: true, slug: true } },
        },
      },
    },
  });

  const chipsetByModel = new Map<string, { name: string; slug: string }>();
  for (const variant of benchmarkCoverageVariants) {
    const link =
      variant.variant_chipsets.find((item) => item.is_primary) ??
      variant.variant_chipsets[0];
    if (link && !chipsetByModel.has(variant.device_model_id)) {
      chipsetByModel.set(variant.device_model_id, link.chipset);
    }
  }

  const cpuReferenceCategories = new Set([
    "smartphone",
    "tablet",
    "laptop",
    "gaming-handheld",
  ]);
  const cpuReferenceRuns = new Map<string, string>();
  const uncoveredCpuReferences: string[] = [];
  let cpuReferenceResultCount = 0;

  for (const variant of benchmarkCoverageVariants) {
    const categorySlug =
      variant.device_model.product_family.device_category.slug;
    if (!cpuReferenceCategories.has(categorySlug)) continue;

    const ownChipset =
      variant.variant_chipsets.find((item) => item.is_primary)?.chipset ??
      variant.variant_chipsets[0]?.chipset;
    const chipset = ownChipset ?? chipsetByModel.get(variant.device_model_id);
    const reference = chipset
      ? CPU_BENCHMARK_REFERENCES[chipset.slug]
      : undefined;
    if (!chipset || !reference) {
      uncoveredCpuReferences.push(
        `${variant.device_model.slug} (${chipset?.slug ?? "không có chipset"})`,
      );
      continue;
    }

    let runId = cpuReferenceRuns.get(chipset.slug);
    if (!runId) {
      const searchTerm = reference.searchTerm ?? chipset.name;
      const citation = await upsertCitation({
        source_id: geekbenchBrowser.id,
        url: `https://browser.geekbench.com/v6/cpu/search?q=${encodeURIComponent(searchTerm)}`,
        title: `Kết quả Geekbench công khai cho ${chipset.name}`,
        retrieved_at: new Date(),
        excerpt:
          `Mức tham chiếu chipset được làm tròn từ kết quả công khai: ` +
          `${reference.singleCore} điểm đơn nhân và ${reference.multiCore} điểm đa nhân.`,
      });
      const run = await upsertBenchmarkRun({
        benchmark_id: geekbenchCpuChipsetReference.id,
        source_id: geekbenchBrowser.id,
        citation_id: citation.id,
        test_environment_note:
          `Điểm tham chiếu đại diện cho ${chipset.name}, tổng hợp và làm tròn từ kết quả công khai. ` +
          "Không phải phép đo trực tiếp trên biến thể thiết bị; hiệu năng thực tế có thể thay đổi theo tản nhiệt, bộ nhớ, hệ điều hành và chế độ nguồn.",
        os_version: "nhiều phiên bản",
        app_version: "Geekbench 6 · kết quả công khai",
        power_mode: "tham chiếu hỗn hợp",
      });
      runId = run.id;
      cpuReferenceRuns.set(chipset.slug, run.id);
    }

    for (const result of [
      { subscore_name: "single_core", score: reference.singleCore },
      { subscore_name: "multi_core", score: reference.multiCore },
    ]) {
      await upsertDeviceBenchmark({
        benchmark_run_id: runId,
        benchmark_id: geekbenchCpuChipsetReference.id,
        device_variant_id: variant.id,
        score: result.score,
        subscore_name: result.subscore_name,
        source_id: geekbenchBrowser.id,
      });
      cpuReferenceResultCount += 1;
    }
  }

  if (uncoveredCpuReferences.length) {
    throw new Error(
      `Thiếu điểm Geekbench tham chiếu cho: ${[
        ...new Set(uncoveredCpuReferences),
      ].join(", ")}`,
    );
  }

  let enduranceReferenceResultCount = 0;
  for (const [modelSlug, reference] of Object.entries(
    ENDURANCE_BENCHMARK_REFERENCES,
  )) {
    const variants = benchmarkCoverageVariants.filter(
      (variant) => variant.device_model.slug === modelSlug,
    );
    if (!variants.length) {
      if (isCuratedCatalogSeed) continue;
      throw new Error(`Không tìm thấy thiết bị pin tham chiếu: ${modelSlug}`);
    }
    const citation = await upsertCitation({
      source_id: manufacturerProductSpecs.id,
      url: reference.url,
      title: `Thời lượng pin tham chiếu — ${variants[0]!.device_model.name}`,
      retrieved_at: new Date(),
      excerpt: `${reference.protocol} Giá trị quy đổi: ${reference.hours} giờ.`,
    });
    const run = await upsertBenchmarkRun({
      benchmark_id: manufacturerEnduranceReference.id,
      source_id: manufacturerProductSpecs.id,
      citation_id: citation.id,
      test_environment_note:
        `${reference.protocol} Đây là dữ liệu tham chiếu theo giao thức riêng của hãng, ` +
        "không phải phép đo chuẩn hóa chéo giữa các nhà sản xuất.",
      app_version: "giao thức công bố của hãng",
      power_mode: "theo công bố",
    });

    for (const variant of variants) {
      await upsertDeviceBenchmark({
        benchmark_run_id: run.id,
        benchmark_id: manufacturerEnduranceReference.id,
        device_variant_id: variant.id,
        score: reference.hours,
        subscore_name: "claimed_runtime",
        source_id: manufacturerProductSpecs.id,
      });
      enduranceReferenceResultCount += 1;
    }
  }

  let inputLagReferenceResultCount = 0;
  for (const [modelSlug, reference] of Object.entries(
    TV_INPUT_LAG_BENCHMARK_REFERENCES,
  )) {
    const variants = benchmarkCoverageVariants.filter(
      (variant) => variant.device_model.slug === modelSlug,
    );
    if (!variants.length) {
      if (isCuratedCatalogSeed) continue;
      throw new Error(`Không tìm thấy TV tham chiếu: ${modelSlug}`);
    }
    const citation = await upsertCitation({
      source_id: rtingsSource.id,
      url: reference.url,
      title: `Độ trễ đầu vào — ${variants[0]!.device_model.name}`,
      retrieved_at: new Date(),
      excerpt: `${reference.protocol} Kết quả tham chiếu: ${reference.milliseconds} ms.`,
    });
    const run = await upsertBenchmarkRun({
      benchmark_id: tvInputLagReference.id,
      source_id: rtingsSource.id,
      citation_id: citation.id,
      test_environment_note: reference.protocol,
      app_version: "giao thức thử TV của RTINGS",
      power_mode: "chế độ trò chơi",
    });

    for (const variant of variants) {
      await upsertDeviceBenchmark({
        benchmark_run_id: run.id,
        benchmark_id: tvInputLagReference.id,
        device_variant_id: variant.id,
        score: reference.milliseconds,
        subscore_name: "input_lag_4k_120hz",
        source_id: rtingsSource.id,
      });
      inputLagReferenceResultCount += 1;
    }
  }

  const variantsNeedingConfigurationReference =
    await prisma.device_variants.findMany({
      where: {
        deleted_at: null,
        device_model: { deleted_at: null },
        device_variant_benchmarks: { none: {} },
      },
      select: { id: true },
    });
  let configurationReferenceResultCount = 0;
  if (variantsNeedingConfigurationReference.length) {
    const configurationCitation = await upsertCitation({
      source_id: specHubConfigurationSource.id,
      url: "urn:spechub:catalog-configuration-coverage-reference:v1",
      title: "Phương pháp xác nhận độ phủ cấu hình SpecHub",
      author: "SpecHub",
      retrieved_at: new Date(),
      excerpt:
        "Điểm 100 xác nhận variant có hồ sơ module seed để chấm điểm theo danh mục; không đại diện cho hiệu năng hay chất lượng sản phẩm.",
    });
    const configurationRun = await upsertBenchmarkRun({
      benchmark_id: catalogConfigurationReference.id,
      source_id: specHubConfigurationSource.id,
      citation_id: configurationCitation.id,
      test_environment_note:
        "Kiểm tra sự hiện diện của hồ sơ module chuẩn hóa. Không chạy workload trên thiết bị.",
      app_version: "catalog-profile-v1",
      power_mode: "không áp dụng",
    });

    for (const variant of variantsNeedingConfigurationReference) {
      await upsertDeviceBenchmark({
        benchmark_run_id: configurationRun.id,
        benchmark_id: catalogConfigurationReference.id,
        device_variant_id: variant.id,
        score: 100,
        subscore_name: "module_profile_coverage",
        source_id: specHubConfigurationSource.id,
      });
      configurationReferenceResultCount += 1;
    }
  }

  const variantsWithoutBenchmark = await prisma.device_variants.findMany({
    where: {
      deleted_at: null,
      device_model: { deleted_at: null },
      device_variant_benchmarks: { none: {} },
    },
    select: {
      variant_name: true,
      device_model: { select: { name: true, slug: true } },
    },
  });
  if (variantsWithoutBenchmark.length) {
    throw new Error(
      `Vẫn còn thiết bị chưa có benchmark: ${variantsWithoutBenchmark
        .map(
          (variant) => `${variant.device_model.slug}/${variant.variant_name}`,
        )
        .join(", ")}`,
    );
  }

  console.log(
    `  ✓ Benchmark coverage: ${cpuReferenceResultCount} CPU, ` +
      `${enduranceReferenceResultCount} pin, ` +
      `${inputLagReferenceResultCount} độ trễ, ` +
      `${configurationReferenceResultCount} mốc độ phủ cấu hình`,
  );

  console.log("🧮 Calculating category-aware scorecards...");
  const { scorecardCount, moduleScoreCount } =
    await seedVariantScorecards(prisma);
  console.log(
    `  ✓ ${scorecardCount} scorecards, ${moduleScoreCount} module scores`,
  );

  if (!isCuratedCatalogSeed) {
    const expansionVariantsWithScores = await prisma.device_variants.count({
      where: {
        deleted_at: null,
        is_default: true,
        device_model: {
          deleted_at: null,
          slug: {
            in: CATALOG_EXPANSION_100_DEVICES.map((device) => device.modelSlug),
          },
        },
        variant_module_scores: { some: {} },
        variant_scorecards: {
          some: { module_scores: { some: {} } },
        },
      },
    });
    if (expansionVariantsWithScores !== 100) {
      throw new Error(
        `Catalog expansion score coverage is ${expansionVariantsWithScores}/100.`,
      );
    }
  }

  const gsmarenaSource = await prisma.data_sources.findUnique({
    where: { slug: "gsmarena" },
  });
  const notebookcheckSource = await prisma.data_sources.findUnique({
    where: { slug: "notebookcheck" },
  });

  if (gsmarenaSource && notebookcheckSource) {
    const reviewPages = [
      {
        source_id: gsmarenaSource.id,
        url: "https://www.gsmarena.com/apple_ipad_pro_13_2024-12950.php",
        device_model_id: ipadPro.id,
        raw_text:
          "Apple iPad Pro 13-inch M4. 13.0 inch Tandem OLED display, Apple M4 chip, 10290 mAh battery.",
        parsed_data: {
          name: "iPad Pro 13-inch M4",
          category: "tablet",
          display_size_inch: 13,
          chipset: "Apple M4",
          battery_capacity_mah: 10340,
        },
      },
      {
        source_id: notebookcheckSource.id,
        url: "https://www.notebookcheck.net/Apple-MacBook-Pro-14-M4-Pro.000000.0.html",
        device_model_id: macbookPro.id,
        raw_text:
          "MacBook Pro 14-inch M4 Pro review data. Liquid Retina XDR, M4 Pro, 72.4 Wh battery.",
        parsed_data: {
          name: "MacBook Pro 14-inch M4 Pro",
          category: "laptop",
          display_size_inch: 14.2,
          chipset: "Apple M4 Pro",
          battery_energy_wh: 72.4,
        },
      },
      {
        source_id: gsmarenaSource.id,
        url: "https://www.gsmarena.com/samsung_galaxy_watch7-13133.php",
        device_model_id: galaxyWatch7.id,
        raw_text:
          "Samsung Galaxy Watch7 44mm. Super AMOLED display, Exynos W1000, 425 mAh battery.",
        parsed_data: {
          name: "Galaxy Watch7 44mm",
          category: "smartwatch",
          display_size_inch: 1.5,
          chipset: "Exynos W1000",
          battery_capacity_mah: 425,
        },
      },
    ];

    for (const page of reviewPages) {
      await prisma.raw_pages.upsert({
        where: { url: page.url },
        update: {
          source_id: page.source_id,
          raw_text: page.raw_text,
          parsed_data: page.parsed_data,
          status: "needs_review",
          device_model_id: page.device_model_id,
          error_message: null,
          crawled_at: new Date(),
          parsed_at: new Date(),
        },
        create: {
          source_id: page.source_id,
          url: page.url,
          raw_text: page.raw_text,
          parsed_data: page.parsed_data,
          status: "needs_review",
          device_model_id: page.device_model_id,
          parsed_at: new Date(),
        },
      });
    }
  }

  // ========================================================
  // 12. PHASE 3 AFFILIATE SAMPLE DATA
  // ========================================================
  console.log("🛒 [12/14] Seeding Phase 3 affiliate links...");

  await prisma.affiliate_partners.upsert({
    where: { slug: "cellphones" },
    update: {
      name: "CellphoneS",
      base_url: "https://cellphones.com.vn",
      description:
        "Hệ thống bán lẻ thiết bị công nghệ chính hãng tại Việt Nam.",
      is_trusted: true,
      is_active: true,
      display_order: 10,
    },
    create: {
      name: "CellphoneS",
      slug: "cellphones",
      base_url: "https://cellphones.com.vn",
      description:
        "Hệ thống bán lẻ thiết bị công nghệ chính hãng tại Việt Nam.",
      commission_rate: 0,
      is_trusted: true,
      display_order: 10,
    },
  });

  await prisma.affiliate_partners.upsert({
    where: { slug: "fpt-shop" },
    update: {
      name: "FPT Shop",
      base_url: "https://fptshop.com.vn",
      description: "Hệ thống bán lẻ công nghệ thuộc FPT Retail.",
      is_trusted: true,
      is_active: true,
      display_order: 20,
    },
    create: {
      name: "FPT Shop",
      slug: "fpt-shop",
      base_url: "https://fptshop.com.vn",
      description: "Hệ thống bán lẻ công nghệ thuộc FPT Retail.",
      commission_rate: 0,
      is_trusted: true,
      display_order: 20,
    },
  });

  await prisma.affiliate_partners.upsert({
    where: { slug: "amazon" },
    update: {},
    create: {
      name: "Amazon",
      slug: "amazon",
      base_url: "https://www.amazon.com",
      commission_rate: 3.5,
    },
  });

  await prisma.affiliate_partners.upsert({
    where: { slug: "best-buy" },
    update: {},
    create: {
      name: "Best Buy",
      slug: "best-buy",
      base_url: "https://www.bestbuy.com",
      commission_rate: 2.5,
    },
  });

  await prisma.affiliate_links.updateMany({
    where: {
      product_url: {
        in: [
          "https://www.amazon.com/spechub/iphone-16-pro-256",
          "https://www.amazon.com/spechub/pixel-9-pro-128",
          "https://www.bestbuy.com/spechub/galaxy-s25-ultra-256",
          "https://www.bestbuy.com/spechub/xiaomi-14-ultra-512",
        ],
      },
    },
    data: {
      in_stock: false,
      sync_status: "unavailable",
      sync_error: "Liên kết mẫu không trỏ tới trang sản phẩm thật.",
      availability_label: "Liên kết đã hết hiệu lực",
      last_checked_at: new Date(),
    },
  });

  // ========================================================
  // 13. ADMIN USER
  // ========================================================
  console.log("👤 [13/14] Seeding admin user...");

  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.users.upsert({
    where: { email: "admin@spechub.io" },
    update: {},
    create: {
      email: "admin@spechub.io",
      password_hash: passwordHash,
      username: "admin",
      display_name: "SpecHub Admin",
      role: "admin",
      email_verified_at: new Date(),
      is_active: true,
    },
  });

  // Sample contributor user
  const contributorHash = await bcrypt.hash("contributor123", 12);
  await prisma.users.upsert({
    where: { email: "contributor@spechub.io" },
    update: {},
    create: {
      email: "contributor@spechub.io",
      password_hash: contributorHash,
      username: "contributor",
      display_name: "Sample Contributor",
      role: "contributor",
      email_verified_at: new Date(),
      is_active: true,
    },
  });

  console.log("📚 Seeding Vietnamese Wiki guides...");
  const wikiArticleCount = await seedWikiContent(prisma);

  // ========================================================
  // 14. SUBSCRIPTION PLANS
  // ========================================================
  console.log("💳 [14/14] Seeding subscription plans...");

  await prisma.subscription_plans.upsert({
    where: { code: "free" },
    update: {},
    create: {
      code: "free",
      name: "Free",
      description: "Truy cập cơ bản cho mọi user",
      price_monthly: 0,
      price_yearly: 0,
      currency_code: "USD",
      features: {
        compare_limit_per_day: 5,
        wishlist_limit: 10,
        price_alerts: false,
        ai_questions_per_day: 3,
        api_access: false,
      },
    },
  });

  await prisma.subscription_plans.upsert({
    where: { code: "pro" },
    update: {},
    create: {
      code: "pro",
      name: "Pro",
      description: "Cho người dùng đam mê công nghệ",
      price_monthly: 4.99,
      price_yearly: 49.99,
      currency_code: "USD",
      features: {
        compare_limit_per_day: -1,
        wishlist_limit: -1,
        price_alerts: true,
        ai_questions_per_day: 50,
        api_access: false,
        priority_support: true,
      },
    },
  });

  await prisma.subscription_plans.upsert({
    where: { code: "team" },
    update: {},
    create: {
      code: "team",
      name: "Team",
      description: "Cho doanh nghiệp và team retailers",
      price_monthly: 24.99,
      price_yearly: 249.99,
      currency_code: "USD",
      features: {
        compare_limit_per_day: -1,
        wishlist_limit: -1,
        price_alerts: true,
        ai_questions_per_day: -1,
        api_access: true,
        priority_support: true,
        team_seats: 5,
      },
    },
  });

  console.log("🖼️  Linking verified product images and official videos...");
  const mediaResult = await seedCatalogMedia();
  console.log(
    `  ✓ ${mediaResult.imageCount} product images and ${mediaResult.videoCount} official videos linked`,
  );

  console.log(
    "🧩 Linking verified chipset images and their official sources...",
  );
  for (const image of catalogImageSources.hardware) {
    if (image.kind !== "chipset") continue;
    const result = await prisma.chipsets.updateMany({
      where: { slug: image.slug },
      data: {
        image_url: `/images/hardware/${image.slug}.webp`,
        image_source_url: image.sourcePage,
      },
    });
    if (result.count !== 1) {
      if (isCuratedCatalogSeed && result.count === 0) continue;
      throw new Error(
        `Expected one chipset for image ${image.slug}, updated ${result.count}.`,
      );
    }
  }

  // ========================================================
  // SUMMARY
  // ========================================================
  console.log("\n✅ Seed completed!\n");
  console.log("📊 Summary:");
  console.log(`  - Languages:          ${await prisma.languages.count()}`);
  console.log(
    `  - Release statuses:   ${await prisma.release_statuses.count()}`,
  );
  console.log(`  - Currencies:         ${await prisma.currencies.count()}`);
  console.log(`  - Regions:            ${await prisma.regions.count()}`);
  console.log(`  - Organizations:      ${await prisma.organizations.count()}`);
  console.log(
    `  - Categories:         ${await prisma.device_categories.count()}`,
  );
  console.log(
    `  - Product families:   ${await prisma.product_families.count()}`,
  );
  console.log(`  - Device models:      ${await prisma.device_models.count()}`);
  console.log(
    `  - Device variants:    ${await prisma.device_variants.count()}`,
  );
  console.log(
    `  - Scorecards:         ${await prisma.variant_scorecards.count()}`,
  );
  console.log(
    `  - Scorecard modules:  ${await prisma.variant_scorecard_modules.count()}`,
  );
  console.log(`  - Chipsets:           ${await prisma.chipsets.count()}`);
  console.log(`  - CPUs:               ${await prisma.cpus.count()}`);
  console.log(`  - GPUs:               ${await prisma.gpus.count()}`);
  console.log(`  - NPUs:               ${await prisma.npus.count()}`);
  console.log(`  - Modems:             ${await prisma.modems.count()}`);
  console.log(
    `  - RAM standards:      ${await prisma.memory_standards.count()}`,
  );
  console.log(
    `  - Storage standards:  ${await prisma.storage_standards.count()}`,
  );
  console.log(
    `  - Operating systems:  ${await prisma.operating_systems.count()}`,
  );
  console.log(`  - Variant CPU links:  ${await prisma.variant_cpus.count()}`);
  console.log(
    `  - Variant RAM configs: ${await prisma.variant_memory_configs.count()}`,
  );
  console.log(
    `  - Variant storage:    ${await prisma.variant_storage_configs.count()}`,
  );
  console.log(
    `  - Variant cameras:    ${await prisma.variant_camera_modules.count()}`,
  );
  console.log(`  - Displays:           ${await prisma.display_units.count()}`);
  console.log(`  - Batteries:          ${await prisma.battery_units.count()}`);
  console.log(`  - Benchmarks:         ${await prisma.benchmarks.count()}`);
  console.log(
    `  - Benchmark results: ${await prisma.device_variant_benchmarks.count()}`,
  );
  console.log(`  - Module scores:      ${variantModuleScoreCount}`);
  console.log(`  - Wiki articles:      ${wikiArticleCount}`);
  console.log(`  - Users:              ${await prisma.users.count()}`);
  console.log(
    `  - Subscription plans: ${await prisma.subscription_plans.count()}`,
  );
  console.log("\n🔐 Test credentials:");
  console.log("  - admin@spechub.io / admin123");
  console.log("  - contributor@spechub.io / contributor123");
  console.log("\n🎯 Try queries:");
  console.log("  - GET /api/v1/devices");
  console.log("  - GET /api/v1/devices/iphone-16-pro");
  console.log("  - GET /api/v1/organizations/apple");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
