// ============================================================
// SpecHub - Seed Data
// ============================================================
// Chạy: pnpm db:seed
//
// Seed dữ liệu mẫu thực tế:
// - 8 organizations (Apple, Samsung, Qualcomm, MediaTek, Sony, TSMC, Google, Xiaomi)
// - 5 device categories
// - 8 product families
// - 8 device models thật, phủ đủ 5 nhóm thiết bị
// - 12 device variants
// - Components cho mobile, tablet, laptop, wearable và audio
// - Phase 2 data sources/citation sources
// - Sourced benchmark coverage cho toàn bộ 12 variants
// - Phase 3 affiliate partners/links
// - Admin user (admin@spechub.io / admin123)
// ============================================================

import { PrismaClient } from "../generated/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const process = (globalThis as any).process;

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
type WirelessStandardCreateData = Parameters<
  PrismaClient["wireless_standards"]["create"]
>[0]["data"];
type PortStandardCreateData = Parameters<
  PrismaClient["port_standards"]["create"]
>[0]["data"];
type HardwareSensorCreateData = Parameters<
  PrismaClient["hardware_sensors"]["create"]
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
    where: { slug },
    update: data,
    create: data,
  });
}

async function upsertWirelessStandard(
  slug: string,
  data: WirelessStandardCreateData,
) {
  return prisma.wireless_standards.upsert({
    where: { slug },
    update: data,
    create: data,
  });
}

async function upsertPortStandard(slug: string, data: PortStandardCreateData) {
  return prisma.port_standards.upsert({
    where: { slug },
    update: data,
    create: data,
  });
}

async function upsertHardwareSensor(
  slug: string,
  data: HardwareSensorCreateData,
) {
  return prisma.hardware_sensors.upsert({
    where: { slug },
    update: data,
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

async function upsertVariantPort(
  device_variant_id: string,
  port_standard_id: string,
  port_count: number,
) {
  return prisma.variant_ports.upsert({
    where: {
      device_variant_id_port_standard_id: {
        device_variant_id,
        port_standard_id,
      },
    },
    update: { port_count },
    create: { device_variant_id, port_standard_id, port_count },
  });
}

async function upsertVariantWireless(
  device_variant_id: string,
  wireless_standard_id: string,
) {
  return prisma.variant_wireless_support.upsert({
    where: {
      device_variant_id_wireless_standard_id: {
        device_variant_id,
        wireless_standard_id,
      },
    },
    update: {},
    create: { device_variant_id, wireless_standard_id },
  });
}

async function upsertVariantSensor(
  device_variant_id: string,
  hardware_sensor_id: string,
) {
  return prisma.variant_hardware_sensors.upsert({
    where: {
      device_variant_id_hardware_sensor_id: {
        device_variant_id,
        hardware_sensor_id,
      },
    },
    update: {},
    create: { device_variant_id, hardware_sensor_id },
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

async function main() {
  console.log("🌱 Bắt đầu seed database...\n");

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
      { code: "pre_order", name: "Pre-order", sort_order: 2 },
      { code: "released", name: "Đã phát hành", sort_order: 3 },
      { code: "delayed", name: "Hoãn lại", sort_order: 4 },
      { code: "discontinued", name: "Ngừng sản xuất", sort_order: 5 },
      { code: "eol", name: "End of Life", sort_order: 6 },
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
        "Apple là công ty công nghệ đa quốc gia của Mỹ, nổi tiếng với iPhone, iPad, Mac.",
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
        "Samsung Electronics là tập đoàn điện tử đa quốc gia của Hàn Quốc.",
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
        "Google là công ty công nghệ đa quốc gia, cũng làm phần cứng (Pixel, Nest).",
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
        "Xiaomi là tập đoàn điện tử của Trung Quốc, nổi tiếng với smartphone giá tốt.",
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
        "Qualcomm là công ty bán dẫn của Mỹ, nổi tiếng với chipset Snapdragon.",
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
        "MediaTek là công ty bán dẫn của Đài Loan, sản xuất chipset Dimensity.",
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
        "TSMC là foundry sản xuất chip lớn nhất thế giới, gia công cho Apple, AMD, NVIDIA.",
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
        "Sony nổi tiếng với camera sensors (Exmor), PlayStation, TV BRAVIA.",
    },
  });

  // ========================================================
  // 3. DEVICE CATEGORIES
  // ========================================================
  console.log("📱 [3/12] Seeding device categories...");

  const smartphone = await prisma.device_categories.upsert({
    where: { slug: "smartphone" },
    update: {},
    create: {
      name: "Smartphone",
      slug: "smartphone",
      description: "Điện thoại thông minh",
      display_order: 1,
    },
  });

  const tablet = await prisma.device_categories.upsert({
    where: { slug: "tablet" },
    update: {},
    create: {
      name: "Tablet",
      slug: "tablet",
      description: "Máy tính bảng",
      display_order: 2,
    },
  });

  const laptop = await prisma.device_categories.upsert({
    where: { slug: "laptop" },
    update: {},
    create: {
      name: "Laptop",
      slug: "laptop",
      description: "Máy tính xách tay",
      display_order: 3,
    },
  });

  const smartwatch = await prisma.device_categories.upsert({
    where: { slug: "smartwatch" },
    update: {},
    create: {
      name: "Smartwatch",
      slug: "smartwatch",
      description: "Đồng hồ thông minh",
      display_order: 4,
    },
  });

  const earbuds = await prisma.device_categories.upsert({
    where: { slug: "earbuds" },
    update: {},
    create: {
      name: "Earbuds",
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
        "Dòng iPhone 16 ra mắt 2024, gồm iPhone 16, 16 Plus, 16 Pro, 16 Pro Max",
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
      description: "Dòng Galaxy S25 ra mắt 2025, có Galaxy AI tích hợp sâu",
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
      description: "Dòng Pixel 9 với chipset Tensor G4 và Gemini AI",
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
      description: "Dòng Xiaomi 14 với camera Leica",
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

  const ios18 = await upsertOperatingSystem("ios-18", {
    vendor_org_id: apple.id,
    name: "iOS",
    slug: "ios-18",
    os_family: "iOS",
    kernel_type: "XNU",
    is_open_source: false,
  });
  const android15 = await upsertOperatingSystem("android-15", {
    vendor_org_id: google.id,
    name: "Android",
    slug: "android-15",
    os_family: "Android",
    kernel_type: "Linux",
    is_open_source: true,
  });
  const ipados17 = await upsertOperatingSystem("ipados-17", {
    vendor_org_id: apple.id,
    name: "iPadOS",
    slug: "ipados-17",
    os_family: "iPadOS",
    kernel_type: "XNU",
    is_open_source: false,
  });
  const macos15 = await upsertOperatingSystem("macos-15", {
    vendor_org_id: apple.id,
    name: "macOS",
    slug: "macos-15",
    os_family: "macOS",
    kernel_type: "XNU",
    is_open_source: false,
  });
  const wearOs5 = await upsertOperatingSystem("wear-os-5", {
    vendor_org_id: google.id,
    name: "Wear OS",
    slug: "wear-os-5",
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

  const wifi7 = await upsertWirelessStandard("wifi-7", {
    organization_id: apple.id,
    name: "Wi-Fi 7",
    slug: "wifi-7",
    wireless_type: "Wi-Fi",
    max_speed_mbps: 5764,
  });
  const wifi6e = await upsertWirelessStandard("wifi-6e", {
    organization_id: qualcomm.id,
    name: "Wi-Fi 6E",
    slug: "wifi-6e",
    wireless_type: "Wi-Fi",
    max_speed_mbps: 2400,
  });
  const bluetooth54 = await upsertWirelessStandard("bluetooth-5-4", {
    organization_id: qualcomm.id,
    name: "Bluetooth 5.4",
    slug: "bluetooth-5-4",
    wireless_type: "Bluetooth",
    max_speed_mbps: 2,
  });
  const bluetooth53 = await upsertWirelessStandard("bluetooth-5-3", {
    organization_id: qualcomm.id,
    name: "Bluetooth 5.3",
    slug: "bluetooth-5-3",
    wireless_type: "Bluetooth",
    max_speed_mbps: 2,
  });
  const cellular5g = await upsertWirelessStandard("5g-sub6", {
    organization_id: qualcomm.id,
    name: "5G Sub-6",
    slug: "5g-sub6",
    wireless_type: "Cellular",
    max_speed_mbps: 10000,
  });

  const usbC = await upsertPortStandard("usb-c-3-2", {
    organization_id: apple.id,
    name: "USB-C 3.2 Gen 2",
    slug: "usb-c-3-2",
    port_type: "USB-C",
    data_speed_gbps: 10,
    power_delivery_w: 100,
    alt_modes: "DisplayPort",
  });
  const thunderbolt = await upsertPortStandard("thunderbolt-5-usb-c", {
    organization_id: apple.id,
    name: "Thunderbolt 5 / USB-C",
    slug: "thunderbolt-5-usb-c",
    port_type: "USB-C",
    data_speed_gbps: 80,
    power_delivery_w: 240,
    alt_modes: "DisplayPort, PCIe",
  });
  const usbC20 = await upsertPortStandard("usb-c-2-0", {
    organization_id: apple.id,
    name: "USB-C 2.0",
    slug: "usb-c-2-0",
    port_type: "USB-C",
    data_speed_gbps: 0.48,
    power_delivery_w: 60,
  });

  const accelerometer = await upsertHardwareSensor("accelerometer", {
    manufacturer_org_id: samsung.id,
    name: "Accelerometer",
    slug: "accelerometer",
    sensor_category: "motion",
  });
  const gyroscope = await upsertHardwareSensor("gyroscope", {
    manufacturer_org_id: samsung.id,
    name: "Gyroscope",
    slug: "gyroscope",
    sensor_category: "motion",
  });
  const ambientLight = await upsertHardwareSensor("ambient-light-sensor", {
    manufacturer_org_id: samsung.id,
    name: "Ambient Light Sensor",
    slug: "ambient-light-sensor",
    sensor_category: "environment",
  });
  const barometer = await upsertHardwareSensor("barometer", {
    manufacturer_org_id: samsung.id,
    name: "Barometer",
    slug: "barometer",
    sensor_category: "environment",
  });
  const heartRate = await upsertHardwareSensor("heart-rate-sensor", {
    manufacturer_org_id: samsung.id,
    name: "Heart Rate Sensor",
    slug: "heart-rate-sensor",
    sensor_category: "health",
  });
  const temperature = await upsertHardwareSensor("temperature-sensor", {
    manufacturer_org_id: samsung.id,
    name: "Temperature Sensor",
    slug: "temperature-sensor",
    sensor_category: "health",
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
      description:
        "iPhone 16 Pro với Apple A18 Pro, camera 48MP, Apple Intelligence",
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
      description:
        "Flagship của Samsung 2025 với Snapdragon 8 Elite, camera 200MP, S Pen",
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
      description:
        "Pixel 9 Pro với Tensor G4, Gemini AI tích hợp sâu, camera AI nâng cao",
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
      description:
        "Xiaomi 14 Ultra với camera Leica Summilux, 4 ống kính f/1.63",
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
    update: {},
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
    },
  });

  const macbookBattery = await prisma.battery_units.upsert({
    where: { slug: "macbook-pro-14-m4-battery" },
    update: {},
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
    },
  });

  const watchBattery = await prisma.battery_units.upsert({
    where: { slug: "galaxy-watch7-44-battery" },
    update: {},
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
    },
  });

  const airpodsBattery = await prisma.battery_units.upsert({
    where: { slug: "airpods-pro-2-usbc-battery" },
    update: {},
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
      description: "iPad Pro 2024 với chip M4 và màn hình Tandem OLED.",
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
      description: "MacBook Pro thế hệ M4 dành cho công việc chuyên nghiệp.",
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
        "Đồng hồ thông minh Galaxy Watch7 với theo dõi sức khỏe và Wear OS.",
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
      description: "Tai nghe true wireless cao cấp với chống ồn chủ động.",
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
      description: "Tablet chuyên nghiệp với màn hình Tandem OLED và Apple M4.",
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
      description:
        "Laptop chuyên nghiệp với Apple M4 Pro, màn hình Liquid Retina XDR và pin dài.",
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
      description:
        "Smartwatch 44mm với Exynos W1000, GPS và cảm biến sức khỏe thế hệ mới.",
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
      description:
        "Tai nghe ANC với chip Apple H2, hộp sạc USB-C và âm thanh thích ứng.",
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

  // ========================================================
  // 10B. VARIANT HARDWARE MODULES
  // ========================================================
  console.log(
    "🧩 [10B/14] Linking CPU, RAM, GPU, storage, OS & I/O modules...",
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

  const hardwareVariants = await prisma.device_variants.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      variant_name: true,
      device_model: { select: { slug: true } },
    },
  });

  const sharedMobileSensors = [accelerometer.id, gyroscope.id, ambientLight.id];
  const flagshipSensors = [...sharedMobileSensors, barometer.id];

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
      await upsertVariantWireless(variant.id, wifi7.id);
      await upsertVariantWireless(variant.id, bluetooth54.id);
      await upsertVariantWireless(variant.id, cellular5g.id);
      await upsertVariantPort(variant.id, usbC20.id, 1);
      for (const sensorId of sharedMobileSensors) {
        await upsertVariantSensor(variant.id, sensorId);
      }
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
      await upsertVariantWireless(variant.id, wifi7.id);
      await upsertVariantWireless(variant.id, bluetooth54.id);
      await upsertVariantWireless(variant.id, cellular5g.id);
      await upsertVariantPort(variant.id, usbC.id, 1);
      for (const sensorId of flagshipSensors) {
        await upsertVariantSensor(variant.id, sensorId);
      }
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
      await upsertVariantWireless(variant.id, wifi7.id);
      await upsertVariantWireless(variant.id, bluetooth53.id);
      await upsertVariantWireless(variant.id, cellular5g.id);
      await upsertVariantPort(variant.id, usbC.id, 1);
      for (const sensorId of flagshipSensors) {
        await upsertVariantSensor(variant.id, sensorId);
      }
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
      await upsertVariantWireless(variant.id, wifi7.id);
      await upsertVariantWireless(variant.id, bluetooth54.id);
      await upsertVariantWireless(variant.id, cellular5g.id);
      await upsertVariantPort(variant.id, usbC.id, 1);
      for (const sensorId of flagshipSensors) {
        await upsertVariantSensor(variant.id, sensorId);
      }
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
      await upsertVariantWireless(variant.id, wifi7.id);
      await upsertVariantWireless(variant.id, bluetooth54.id);
      await upsertVariantPort(variant.id, usbC.id, 1);
      for (const sensorId of sharedMobileSensors) {
        await upsertVariantSensor(variant.id, sensorId);
      }
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
      await upsertVariantWireless(variant.id, wifi7.id);
      await upsertVariantWireless(variant.id, bluetooth54.id);
      await upsertVariantPort(variant.id, thunderbolt.id, 3);
      await upsertVariantSensor(variant.id, accelerometer.id);
      await upsertVariantSensor(variant.id, ambientLight.id);
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
      await upsertVariantWireless(variant.id, wifi6e.id);
      await upsertVariantWireless(variant.id, bluetooth53.id);
      for (const sensorId of [
        ...sharedMobileSensors,
        heartRate.id,
        temperature.id,
      ]) {
        await upsertVariantSensor(variant.id, sensorId);
      }
      continue;
    }

    if (isAirpods) {
      await upsertVariantCpu(variant.id, appleH2Cpu.id, "audio");
      await upsertVariantMemory(variant.id, lpddr4x.id, 1, {
        speed_mhz: 1600,
        channel_count: 1,
      });
      await upsertVariantOperatingSystem(variant.id, airpodsFirmwareVersion.id);
      await upsertVariantWireless(variant.id, bluetooth53.id);
      await upsertVariantPort(variant.id, usbC20.id, 1);
      await upsertVariantSensor(variant.id, accelerometer.id);
      await upsertVariantSensor(variant.id, gyroscope.id);
    }
  }

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
  const batteryEndurance = await prisma.benchmarks.upsert({
    where: { slug: "battery-endurance" },
    update: {
      name: "Battery endurance",
      benchmark_type: "battery",
      target_type: "device_variant",
      version: "source-protocol",
      higher_is_better: true,
      unit_id: hourUnit.id,
      description:
        "Observed or laboratory-reported runtime. Results are comparable only when protocol and conditions match.",
    },
    create: {
      name: "Battery endurance",
      slug: "battery-endurance",
      benchmark_type: "battery",
      target_type: "device_variant",
      version: "source-protocol",
      higher_is_better: true,
      unit_id: hourUnit.id,
      description:
        "Observed or laboratory-reported runtime. Results are comparable only when protocol and conditions match.",
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

  const amazon = await prisma.affiliate_partners.upsert({
    where: { slug: "amazon" },
    update: {},
    create: {
      name: "Amazon",
      slug: "amazon",
      base_url: "https://www.amazon.com",
      commission_rate: 3.5,
    },
  });

  const bestBuy = await prisma.affiliate_partners.upsert({
    where: { slug: "best-buy" },
    update: {},
    create: {
      name: "Best Buy",
      slug: "best-buy",
      base_url: "https://www.bestbuy.com",
      commission_rate: 2.5,
    },
  });

  const affiliateSeeds = [
    {
      partner_id: amazon.id,
      device_variant_id: iphone16Pro256.id,
      region_code: "US",
      product_url: "https://www.amazon.com/spechub/iphone-16-pro-256",
      current_price: 1049,
      currency_code: "USD",
    },
    {
      partner_id: bestBuy.id,
      device_variant_id: galaxyS25Ultra256.id,
      region_code: "US",
      product_url: "https://www.bestbuy.com/spechub/galaxy-s25-ultra-256",
      current_price: 1249,
      currency_code: "USD",
    },
    {
      partner_id: amazon.id,
      device_variant_id: pixel9Pro128.id,
      region_code: "US",
      product_url: "https://www.amazon.com/spechub/pixel-9-pro-128",
      current_price: 899,
      currency_code: "USD",
    },
    {
      partner_id: bestBuy.id,
      device_variant_id: xiaomi14Ultra512.id,
      region_code: "US",
      product_url: "https://www.bestbuy.com/spechub/xiaomi-14-ultra-512",
      current_price: 1399,
      currency_code: "USD",
    },
  ];

  for (const seed of affiliateSeeds) {
    const existing = await prisma.affiliate_links.findFirst({
      where: {
        partner_id: seed.partner_id,
        device_variant_id: seed.device_variant_id,
        region_code: seed.region_code,
      },
    });

    const link = existing
      ? await prisma.affiliate_links.update({
          where: { id: existing.id },
          data: {
            product_url: seed.product_url,
            current_price: seed.current_price,
            currency_code: seed.currency_code,
            in_stock: true,
            last_checked_at: new Date(),
          },
        })
      : await prisma.affiliate_links.create({
          data: {
            ...seed,
            in_stock: true,
          },
        });

    const existingHistory = await prisma.affiliate_price_history.findFirst({
      where: {
        affiliate_link_id: link.id,
        price: seed.current_price,
        currency_code: seed.currency_code,
      },
    });

    if (!existingHistory) {
      await prisma.affiliate_price_history.create({
        data: {
          affiliate_link_id: link.id,
          price: seed.current_price,
          currency_code: seed.currency_code,
        },
      });
    }
  }

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
  console.log(
    `  - Wireless standards: ${await prisma.wireless_standards.count()}`,
  );
  console.log(`  - Port standards:     ${await prisma.port_standards.count()}`);
  console.log(
    `  - Hardware sensors:   ${await prisma.hardware_sensors.count()}`,
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
