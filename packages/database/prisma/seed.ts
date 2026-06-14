// ============================================================
// SpecHub - Seed Data
// ============================================================
// Chạy: pnpm db:seed
// 
// Seed dữ liệu mẫu thực tế:
// - 8 organizations (Apple, Samsung, Qualcomm, MediaTek, Sony, TSMC, Google, Xiaomi)
// - 5 device categories
// - 4 product families
// - 4 device models thật (iPhone 16 Pro, Galaxy S25 Ultra, Pixel 9 Pro, Xiaomi 14 Ultra)
// - 8 device variants
// - Components: 4 chipsets, 4 displays, 4 batteries, camera sensors
// - Admin user (admin@spechub.io / admin123)
// ============================================================

import { PrismaClient } from '../generated/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const process = (globalThis as any).process

async function main() {
  console.log('🌱 Bắt đầu seed database...\n')

  // ========================================================
  // 1. LOOKUPS
  // ========================================================
  console.log('📋 [1/12] Seeding lookups...')

  await prisma.languages.createMany({
    data: [
      { code: 'vi', name: 'Tiếng Việt', is_default: true, is_active: true },
      { code: 'en', name: 'English', is_default: false, is_active: true },
      { code: 'ja', name: '日本語', is_default: false, is_active: true },
      { code: 'ko', name: '한국어', is_default: false, is_active: true },
      { code: 'zh-CN', name: '简体中文', is_default: false, is_active: true },
    ],
    skipDuplicates: true,
  })

  await prisma.release_statuses.createMany({
    data: [
      { code: 'rumored', name: 'Đồn đại', sort_order: 0 },
      { code: 'announced', name: 'Đã công bố', sort_order: 1 },
      { code: 'pre_order', name: 'Pre-order', sort_order: 2 },
      { code: 'released', name: 'Đã phát hành', sort_order: 3 },
      { code: 'delayed', name: 'Hoãn lại', sort_order: 4 },
      { code: 'discontinued', name: 'Ngừng sản xuất', sort_order: 5 },
      { code: 'eol', name: 'End of Life', sort_order: 6 },
    ],
    skipDuplicates: true,
  })

  await prisma.currencies.createMany({
    data: [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimal_digits: 2 },
      { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimal_digits: 0 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimal_digits: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_digits: 0 },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimal_digits: 0 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimal_digits: 2 },
    ],
    skipDuplicates: true,
  })

  await prisma.organization_roles.createMany({
    data: [
      { code: 'brand', name: 'Brand' },
      { code: 'manufacturer', name: 'Manufacturer' },
      { code: 'foundry', name: 'Foundry' },
      { code: 'software_vendor', name: 'Software Vendor' },
      { code: 'display_maker', name: 'Display Maker' },
      { code: 'sensor_maker', name: 'Sensor Maker' },
      { code: 'battery_maker', name: 'Battery Maker' },
    ],
    skipDuplicates: true,
  })

  await prisma.regions.createMany({
    data: [
      { code: 'global', name: 'Global', description: 'Phiên bản toàn cầu' },
      { code: 'us', name: 'United States' },
      { code: 'eu', name: 'European Union' },
      { code: 'cn', name: 'China' },
      { code: 'vn', name: 'Vietnam' },
      { code: 'kr', name: 'South Korea' },
      { code: 'jp', name: 'Japan' },
    ],
    skipDuplicates: true,
  })

  // Lấy IDs cho các lookups
  const releasedStatus = await prisma.release_statuses.findUnique({ where: { code: 'released' } })
  const announcedStatus = await prisma.release_statuses.findUnique({ where: { code: 'announced' } })
  const usd = await prisma.currencies.findUnique({ where: { code: 'USD' } })

  // ========================================================
  // 2. ORGANIZATIONS
  // ========================================================
  console.log('🏢 [2/12] Seeding organizations...')

  const apple = await prisma.organizations.upsert({
    where: { slug: 'apple' },
    update: {},
    create: {
      name: 'Apple Inc.',
      slug: 'apple',
      short_name: 'Apple',
      legal_name: 'Apple Inc.',
      country_code: 'US',
      founded_year: 1976,
      website_url: 'https://apple.com',
      description: 'Apple là công ty công nghệ đa quốc gia của Mỹ, nổi tiếng với iPhone, iPad, Mac.',
    },
  })

  const samsung = await prisma.organizations.upsert({
    where: { slug: 'samsung' },
    update: {},
    create: {
      name: 'Samsung Electronics',
      slug: 'samsung',
      short_name: 'Samsung',
      legal_name: 'Samsung Electronics Co., Ltd.',
      country_code: 'KR',
      founded_year: 1969,
      website_url: 'https://samsung.com',
      description: 'Samsung Electronics là tập đoàn điện tử đa quốc gia của Hàn Quốc.',
    },
  })

  const google = await prisma.organizations.upsert({
    where: { slug: 'google' },
    update: {},
    create: {
      name: 'Google LLC',
      slug: 'google',
      short_name: 'Google',
      legal_name: 'Google LLC',
      country_code: 'US',
      founded_year: 1998,
      website_url: 'https://google.com',
      description: 'Google là công ty công nghệ đa quốc gia, cũng làm phần cứng (Pixel, Nest).',
    },
  })

  const xiaomi = await prisma.organizations.upsert({
    where: { slug: 'xiaomi' },
    update: {},
    create: {
      name: 'Xiaomi Corporation',
      slug: 'xiaomi',
      short_name: 'Xiaomi',
      country_code: 'CN',
      founded_year: 2010,
      website_url: 'https://mi.com',
      description: 'Xiaomi là tập đoàn điện tử của Trung Quốc, nổi tiếng với smartphone giá tốt.',
    },
  })

  const qualcomm = await prisma.organizations.upsert({
    where: { slug: 'qualcomm' },
    update: {},
    create: {
      name: 'Qualcomm Inc.',
      slug: 'qualcomm',
      short_name: 'Qualcomm',
      country_code: 'US',
      founded_year: 1985,
      website_url: 'https://qualcomm.com',
      description: 'Qualcomm là công ty bán dẫn của Mỹ, nổi tiếng với chipset Snapdragon.',
    },
  })

  const mediatek = await prisma.organizations.upsert({
    where: { slug: 'mediatek' },
    update: {},
    create: {
      name: 'MediaTek Inc.',
      slug: 'mediatek',
      short_name: 'MediaTek',
      country_code: 'TW',
      founded_year: 1997,
      website_url: 'https://mediatek.com',
      description: 'MediaTek là công ty bán dẫn của Đài Loan, sản xuất chipset Dimensity.',
    },
  })

  const tsmc = await prisma.organizations.upsert({
    where: { slug: 'tsmc' },
    update: {},
    create: {
      name: 'Taiwan Semiconductor Manufacturing Company',
      slug: 'tsmc',
      short_name: 'TSMC',
      country_code: 'TW',
      founded_year: 1987,
      website_url: 'https://tsmc.com',
      description: 'TSMC là foundry sản xuất chip lớn nhất thế giới, gia công cho Apple, AMD, NVIDIA.',
    },
  })

  const sony = await prisma.organizations.upsert({
    where: { slug: 'sony' },
    update: {},
    create: {
      name: 'Sony Group Corporation',
      slug: 'sony',
      short_name: 'Sony',
      country_code: 'JP',
      founded_year: 1946,
      website_url: 'https://sony.com',
      description: 'Sony nổi tiếng với camera sensors (Exmor), PlayStation, TV BRAVIA.',
    },
  })

  // ========================================================
  // 3. DEVICE CATEGORIES
  // ========================================================
  console.log('📱 [3/12] Seeding device categories...')

  const smartphone = await prisma.device_categories.upsert({
    where: { slug: 'smartphone' },
    update: {},
    create: {
      name: 'Smartphone',
      slug: 'smartphone',
      description: 'Điện thoại thông minh',
      display_order: 1,
    },
  })

  await prisma.device_categories.upsert({
    where: { slug: 'tablet' },
    update: {},
    create: {
      name: 'Tablet',
      slug: 'tablet',
      description: 'Máy tính bảng',
      display_order: 2,
    },
  })

  await prisma.device_categories.upsert({
    where: { slug: 'laptop' },
    update: {},
    create: {
      name: 'Laptop',
      slug: 'laptop',
      description: 'Máy tính xách tay',
      display_order: 3,
    },
  })

  await prisma.device_categories.upsert({
    where: { slug: 'smartwatch' },
    update: {},
    create: {
      name: 'Smartwatch',
      slug: 'smartwatch',
      description: 'Đồng hồ thông minh',
      display_order: 4,
    },
  })

  await prisma.device_categories.upsert({
    where: { slug: 'earbuds' },
    update: {},
    create: {
      name: 'Earbuds',
      slug: 'earbuds',
      description: 'Tai nghe không dây',
      display_order: 5,
    },
  })

  // ========================================================
  // 4. DISPLAY TECHNOLOGIES & BATTERY CHEMISTRIES
  // ========================================================
  console.log('🔬 [4/12] Seeding display technologies & battery chemistries...')

  const ltpoOled = await prisma.display_technologies.upsert({
    where: { slug: 'ltpo-oled' },
    update: {},
    create: {
      name: 'LTPO OLED',
      slug: 'ltpo-oled',
      description: 'Low-Temperature Polycrystalline Oxide OLED, hỗ trợ refresh rate động',
    },
  })

  const amoled = await prisma.display_technologies.upsert({
    where: { slug: 'amoled' },
    update: {},
    create: {
      name: 'AMOLED',
      slug: 'amoled',
      description: 'Active-Matrix Organic Light-Emitting Diode',
    },
  })

  const liIon = await prisma.battery_chemistries.upsert({
    where: { slug: 'li-ion' },
    update: {},
    create: { name: 'Li-ion', slug: 'li-ion', description: 'Lithium-ion battery' },
  })

  const liPo = await prisma.battery_chemistries.upsert({
    where: { slug: 'li-po' },
    update: {},
    create: { name: 'Li-Po', slug: 'li-po', description: 'Lithium Polymer battery' },
  })

  // ========================================================
  // 5. PRODUCT FAMILIES
  // ========================================================
  console.log('📦 [5/12] Seeding product families...')

  const iphone16Family = await prisma.product_families.upsert({
    where: { slug: 'iphone-16-series' },
    update: {},
    create: {
      brand_org_id: apple.id,
      device_category_id: smartphone.id,
      name: 'iPhone 16 Series',
      slug: 'iphone-16-series',
      description: 'Dòng iPhone 16 ra mắt 2024, gồm iPhone 16, 16 Plus, 16 Pro, 16 Pro Max',
      first_release_year: 2024,
    },
  })

  const galaxyS25Family = await prisma.product_families.upsert({
    where: { slug: 'galaxy-s25-series' },
    update: {},
    create: {
      brand_org_id: samsung.id,
      device_category_id: smartphone.id,
      name: 'Galaxy S25 Series',
      slug: 'galaxy-s25-series',
      description: 'Dòng Galaxy S25 ra mắt 2025, có Galaxy AI tích hợp sâu',
      first_release_year: 2025,
    },
  })

  const pixel9Family = await prisma.product_families.upsert({
    where: { slug: 'pixel-9-series' },
    update: {},
    create: {
      brand_org_id: google.id,
      device_category_id: smartphone.id,
      name: 'Pixel 9 Series',
      slug: 'pixel-9-series',
      description: 'Dòng Pixel 9 với chipset Tensor G4 và Gemini AI',
      first_release_year: 2024,
    },
  })

  const xiaomi14Family = await prisma.product_families.upsert({
    where: { slug: 'xiaomi-14-series' },
    update: {},
    create: {
      brand_org_id: xiaomi.id,
      device_category_id: smartphone.id,
      name: 'Xiaomi 14 Series',
      slug: 'xiaomi-14-series',
      description: 'Dòng Xiaomi 14 với camera Leica',
      first_release_year: 2023,
    },
  })

  // ========================================================
  // 6. CHIPSETS
  // ========================================================
  console.log('🧠 [6/12] Seeding chipsets...')

  const a18Pro = await prisma.chipsets.upsert({
    where: { slug: 'apple-a18-pro' },
    update: {},
    create: {
      manufacturer_org_id: apple.id,
      chip_kind: 'soc',
      name: 'Apple A18 Pro',
      slug: 'apple-a18-pro',
      model_code: 'A18 Pro',
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 8,
      announcement_date: new Date('2024-09-09'),
      release_date: new Date('2024-09-20'),
      description: 'Chipset 3nm flagship của Apple cho iPhone 16 Pro/Pro Max, có Neural Engine 16-core.',
    },
  })

  const snapdragon8Gen4 = await prisma.chipsets.upsert({
    where: { slug: 'snapdragon-8-elite' },
    update: {},
    create: {
      manufacturer_org_id: qualcomm.id,
      chip_kind: 'soc',
      name: 'Snapdragon 8 Elite',
      slug: 'snapdragon-8-elite',
      model_code: 'SM8750-AB',
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 24,
      announcement_date: new Date('2024-10-21'),
      release_date: new Date('2024-10-21'),
      description: 'Snapdragon 8 Elite (trước đây là 8 Gen 4) với Oryon CPU custom của Qualcomm.',
    },
  })

  const tensorG4 = await prisma.chipsets.upsert({
    where: { slug: 'google-tensor-g4' },
    update: {},
    create: {
      manufacturer_org_id: google.id,
      chip_kind: 'soc',
      name: 'Google Tensor G4',
      slug: 'google-tensor-g4',
      model_code: 'GS501',
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 16,
      announcement_date: new Date('2024-08-13'),
      release_date: new Date('2024-08-22'),
      description: 'Tensor G4 do Google thiết kế và Samsung sản xuất, tối ưu cho AI Gemini.',
    },
  })

  const snapdragon8Gen3 = await prisma.chipsets.upsert({
    where: { slug: 'snapdragon-8-gen-3' },
    update: {},
    create: {
      manufacturer_org_id: qualcomm.id,
      chip_kind: 'soc',
      name: 'Snapdragon 8 Gen 3',
      slug: 'snapdragon-8-gen-3',
      model_code: 'SM8650-AB',
      supports_64bit: true,
      integrated_5g: true,
      integrated_wifi: true,
      max_ram_gb: 24,
      announcement_date: new Date('2023-10-24'),
      release_date: new Date('2023-11-15'),
      description: 'Snapdragon 8 Gen 3 trên Galaxy S24, Xiaomi 14, OnePlus 12.',
    },
  })

  // ========================================================
  // 7. DISPLAYS
  // ========================================================
  console.log('🖥️  [7/12] Seeding displays...')

  const iphone16ProDisplay = await prisma.display_units.create({
    data: {
      display_technology_id: ltpoOled.id,
      name: 'Super Retina XDR LTPO',
      slug: 'iphone-16-pro-display',
      size_inch: 6.3,
      aspect_ratio: '19.5:9',
      resolution_width: 1206,
      resolution_height: 2622,
      pixel_density_ppi: 460,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 1,
      brightness_typical_nits: 1000,
      brightness_hbm_nits: 1600,
      brightness_peak_nits: 2000,
      color_depth_bits: 10,
      color_gamut: 'DCI-P3',
      hdr_formats: 'HDR10, Dolby Vision',
      protection_glass: 'Ceramic Shield 2',
      has_always_on: true,
      description: 'Màn hình LTPO OLED của iPhone 16 Pro, 120Hz ProMotion',
    },
  })

  const galaxyS25UltraDisplay = await prisma.display_units.create({
    data: {
      manufacturer_org_id: samsung.id,
      display_technology_id: ltpoOled.id,
      name: 'Dynamic AMOLED 2X',
      slug: 'galaxy-s25-ultra-display',
      size_inch: 6.9,
      aspect_ratio: '19.5:9',
      resolution_width: 1440,
      resolution_height: 3120,
      pixel_density_ppi: 505,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 1,
      brightness_typical_nits: 1200,
      brightness_peak_nits: 2600,
      color_depth_bits: 10,
      hdr_formats: 'HDR10+',
      protection_glass: 'Corning Gorilla Armor 2',
      has_always_on: true,
      description: 'Dynamic AMOLED 2X 6.9 inch trên Galaxy S25 Ultra',
    },
  })

  const pixel9ProDisplay = await prisma.display_units.create({
    data: {
      display_technology_id: ltpoOled.id,
      name: 'Super Actua LTPO',
      slug: 'pixel-9-pro-display',
      size_inch: 6.3,
      resolution_width: 1280,
      resolution_height: 2856,
      pixel_density_ppi: 495,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 1,
      brightness_typical_nits: 1800,
      brightness_peak_nits: 3000,
      color_depth_bits: 10,
      hdr_formats: 'HDR10+',
      protection_glass: 'Corning Gorilla Glass Victus 2',
      has_always_on: true,
      description: 'Super Actua LTPO display, 3000 nits peak brightness',
    },
  })

  const xiaomi14UltraDisplay = await prisma.display_units.create({
    data: {
      display_technology_id: amoled.id,
      name: 'WQHD+ AMOLED',
      slug: 'xiaomi-14-ultra-display',
      size_inch: 6.73,
      resolution_width: 1440,
      resolution_height: 3200,
      pixel_density_ppi: 522,
      refresh_rate_hz: 120,
      refresh_rate_min_hz: 1,
      brightness_typical_nits: 1000,
      brightness_peak_nits: 3000,
      color_depth_bits: 12,
      hdr_formats: 'HDR10+, Dolby Vision',
      protection_glass: 'Xiaomi Shield Glass',
      has_always_on: true,
      description: 'WQHD+ AMOLED 12-bit color, peak 3000 nits',
    },
  })

  // ========================================================
  // 8. BATTERIES
  // ========================================================
  console.log('🔋 [8/12] Seeding batteries...')

  const iphone16ProBattery = await prisma.battery_units.create({
    data: {
      manufacturer_org_id: apple.id,
      battery_chemistry_id: liIon.id,
      slug: 'iphone-16-pro-battery',
      capacity_mah: 3582,
      energy_wh: 13.81,
      voltage_nominal_v: 3.85,
      wired_charging_w: 27,
      wired_charging_protocol: 'USB-PD',
      wireless_charging_w: 25,
      wireless_charging_protocol: 'MagSafe',
      removable: false,
    },
  })

  const galaxyS25UltraBattery = await prisma.battery_units.create({
    data: {
      manufacturer_org_id: samsung.id,
      battery_chemistry_id: liIon.id,
      slug: 'galaxy-s25-ultra-battery',
      capacity_mah: 5000,
      voltage_nominal_v: 3.88,
      wired_charging_w: 45,
      wired_charging_protocol: 'USB-PD PPS',
      wireless_charging_w: 15,
      wireless_charging_protocol: 'Qi2',
      reverse_wireless_charging_w: 4.5,
      removable: false,
    },
  })

  const pixel9ProBattery = await prisma.battery_units.create({
    data: {
      battery_chemistry_id: liIon.id,
      slug: 'pixel-9-pro-battery',
      capacity_mah: 4700,
      wired_charging_w: 27,
      wired_charging_protocol: 'USB-PD',
      wireless_charging_w: 21,
      wireless_charging_protocol: 'Qi',
      removable: false,
    },
  })

  const xiaomi14UltraBattery = await prisma.battery_units.create({
    data: {
      battery_chemistry_id: liIon.id,
      slug: 'xiaomi-14-ultra-battery',
      capacity_mah: 5300,
      wired_charging_w: 90,
      wired_charging_protocol: 'Xiaomi HyperCharge',
      wireless_charging_w: 80,
      wireless_charging_protocol: 'Xiaomi HyperCharge Wireless',
      reverse_wireless_charging_w: 10,
      removable: false,
    },
  })

  // ========================================================
  // 9. DEVICE MODELS
  // ========================================================
  console.log('📱 [9/12] Seeding device models...')

  const iphone16Pro = await prisma.device_models.upsert({
    where: { slug: 'iphone-16-pro' },
    update: {},
    create: {
      product_family_id: iphone16Family.id,
      name: 'iPhone 16 Pro',
      slug: 'iphone-16-pro',
      internal_codename: 'D93',
      release_status_id: releasedStatus!.id,
      announcement_date: new Date('2024-09-09'),
      release_date: new Date('2024-09-20'),
      generation_label: 'Gen 18',
      description: 'iPhone 16 Pro với Apple A18 Pro, camera 48MP, Apple Intelligence',
    },
  })

  const galaxyS25Ultra = await prisma.device_models.upsert({
    where: { slug: 'galaxy-s25-ultra' },
    update: {},
    create: {
      product_family_id: galaxyS25Family.id,
      name: 'Galaxy S25 Ultra',
      slug: 'galaxy-s25-ultra',
      release_status_id: releasedStatus!.id,
      announcement_date: new Date('2025-01-22'),
      release_date: new Date('2025-02-07'),
      generation_label: 'Gen 25',
      description: 'Flagship của Samsung 2025 với Snapdragon 8 Elite, camera 200MP, S Pen',
    },
  })

  const pixel9Pro = await prisma.device_models.upsert({
    where: { slug: 'pixel-9-pro' },
    update: {},
    create: {
      product_family_id: pixel9Family.id,
      name: 'Pixel 9 Pro',
      slug: 'pixel-9-pro',
      release_status_id: releasedStatus!.id,
      announcement_date: new Date('2024-08-13'),
      release_date: new Date('2024-08-22'),
      generation_label: 'Gen 9',
      description: 'Pixel 9 Pro với Tensor G4, Gemini AI tích hợp sâu, camera AI nâng cao',
    },
  })

  const xiaomi14Ultra = await prisma.device_models.upsert({
    where: { slug: 'xiaomi-14-ultra' },
    update: {},
    create: {
      product_family_id: xiaomi14Family.id,
      name: 'Xiaomi 14 Ultra',
      slug: 'xiaomi-14-ultra',
      release_status_id: releasedStatus!.id,
      announcement_date: new Date('2024-02-22'),
      release_date: new Date('2024-03-12'),
      generation_label: 'Ultra Gen 14',
      description: 'Xiaomi 14 Ultra với camera Leica Summilux, 4 ống kính f/1.63',
    },
  })

  // ========================================================
  // 10. DEVICE VARIANTS + SPECS
  // ========================================================
  console.log('🎨 [10/12] Seeding device variants...')

  // iPhone 16 Pro 256GB Natural Titanium
  const iphone16Pro256 = await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: iphone16Pro.id, variant_name: '256GB Natural Titanium' } },
    update: {},
    create: {
      device_model_id: iphone16Pro.id,
      variant_name: '256GB Natural Titanium',
      sku_code: 'MYWX3LL/A',
      market_name: 'iPhone 16 Pro 256GB',
      color_name: 'Natural Titanium',
      color_hex: '#C5BFB5',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2024-09-20'),
      launch_price: 999,
      currency_id: usd!.id,
      is_default: true,
    },
  })

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: iphone16Pro256.id },
    update: {},
    create: {
      device_variant_id: iphone16Pro256.id,
      height_mm: 149.6,
      width_mm: 71.5,
      thickness_mm: 8.25,
      weight_g: 199,
      ingress_protection: 'IP68',
      frame_material: 'Titanium Grade 5',
      back_material: 'Textured matte glass',
      front_glass: 'Ceramic Shield 2',
    },
  })

  await prisma.variant_chipsets.create({
    data: {
      device_variant_id: iphone16Pro256.id,
      chipset_id: a18Pro.id,
      chip_role: 'soc',
      is_primary: true,
    },
  })

  await prisma.variant_displays.create({
    data: {
      device_variant_id: iphone16Pro256.id,
      display_unit_id: iphone16ProDisplay.id,
      display_role: 'main',
      display_order: 1,
    },
  })

  await prisma.variant_batteries.create({
    data: {
      device_variant_id: iphone16Pro256.id,
      battery_unit_id: iphone16ProBattery.id,
      battery_role: 'internal',
      is_primary: true,
    },
  })

  // iPhone 16 Pro 512GB Black Titanium
  const iphone16Pro512 = await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: iphone16Pro.id, variant_name: '512GB Black Titanium' } },
    update: {},
    create: {
      device_model_id: iphone16Pro.id,
      variant_name: '512GB Black Titanium',
      sku_code: 'MYWY3LL/A',
      color_name: 'Black Titanium',
      color_hex: '#3D3D3D',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2024-09-20'),
      launch_price: 1199,
      currency_id: usd!.id,
      is_default: false,
    },
  })

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: iphone16Pro512.id },
    update: {},
    create: {
      device_variant_id: iphone16Pro512.id,
      height_mm: 149.6,
      width_mm: 71.5,
      thickness_mm: 8.25,
      weight_g: 199,
      ingress_protection: 'IP68',
      frame_material: 'Titanium Grade 5',
    },
  })

  // Galaxy S25 Ultra 256GB Titanium Silverblue
  const galaxyS25Ultra256 = await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: galaxyS25Ultra.id, variant_name: '256GB Titanium Silverblue' } },
    update: {},
    create: {
      device_model_id: galaxyS25Ultra.id,
      variant_name: '256GB Titanium Silverblue',
      sku_code: 'SM-S938U',
      color_name: 'Titanium Silverblue',
      color_hex: '#A8B5C7',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2025-02-07'),
      launch_price: 1299,
      currency_id: usd!.id,
      is_default: true,
    },
  })

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: galaxyS25Ultra256.id },
    update: {},
    create: {
      device_variant_id: galaxyS25Ultra256.id,
      height_mm: 162.8,
      width_mm: 77.6,
      thickness_mm: 8.2,
      weight_g: 218,
      ingress_protection: 'IP68',
      frame_material: 'Titanium',
      back_material: 'Glass',
      front_glass: 'Corning Gorilla Armor 2',
    },
  })

  await prisma.variant_chipsets.create({
    data: {
      device_variant_id: galaxyS25Ultra256.id,
      chipset_id: snapdragon8Gen4.id,
      chip_role: 'soc',
      is_primary: true,
    },
  })

  await prisma.variant_displays.create({
    data: {
      device_variant_id: galaxyS25Ultra256.id,
      display_unit_id: galaxyS25UltraDisplay.id,
      display_role: 'main',
    },
  })

  await prisma.variant_batteries.create({
    data: {
      device_variant_id: galaxyS25Ultra256.id,
      battery_unit_id: galaxyS25UltraBattery.id,
      battery_role: 'internal',
    },
  })

  // Galaxy S25 Ultra 512GB Titanium Black
  await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: galaxyS25Ultra.id, variant_name: '512GB Titanium Black' } },
    update: {},
    create: {
      device_model_id: galaxyS25Ultra.id,
      variant_name: '512GB Titanium Black',
      sku_code: 'SM-S938U-512',
      color_name: 'Titanium Black',
      color_hex: '#1C1C1C',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2025-02-07'),
      launch_price: 1419,
      currency_id: usd!.id,
    },
  })

  // Pixel 9 Pro 128GB Obsidian
  const pixel9Pro128 = await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: pixel9Pro.id, variant_name: '128GB Obsidian' } },
    update: {},
    create: {
      device_model_id: pixel9Pro.id,
      variant_name: '128GB Obsidian',
      sku_code: 'GA05131-US',
      color_name: 'Obsidian',
      color_hex: '#000000',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2024-08-22'),
      launch_price: 999,
      currency_id: usd!.id,
      is_default: true,
    },
  })

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: pixel9Pro128.id },
    update: {},
    create: {
      device_variant_id: pixel9Pro128.id,
      height_mm: 152.8,
      width_mm: 72.0,
      thickness_mm: 8.5,
      weight_g: 199,
      ingress_protection: 'IP68',
      frame_material: 'Aluminum',
      back_material: 'Glass',
    },
  })

  await prisma.variant_chipsets.create({
    data: {
      device_variant_id: pixel9Pro128.id,
      chipset_id: tensorG4.id,
      chip_role: 'soc',
      is_primary: true,
    },
  })

  await prisma.variant_displays.create({
    data: {
      device_variant_id: pixel9Pro128.id,
      display_unit_id: pixel9ProDisplay.id,
      display_role: 'main',
    },
  })

  await prisma.variant_batteries.create({
    data: {
      device_variant_id: pixel9Pro128.id,
      battery_unit_id: pixel9ProBattery.id,
      battery_role: 'internal',
    },
  })

  // Pixel 9 Pro 256GB Hazel
  await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: pixel9Pro.id, variant_name: '256GB Hazel' } },
    update: {},
    create: {
      device_model_id: pixel9Pro.id,
      variant_name: '256GB Hazel',
      sku_code: 'GA05131-HZ',
      color_name: 'Hazel',
      color_hex: '#5E5C4E',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2024-08-22'),
      launch_price: 1099,
      currency_id: usd!.id,
    },
  })

  // Xiaomi 14 Ultra 16GB+512GB Black
  const xiaomi14Ultra512 = await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: xiaomi14Ultra.id, variant_name: '16GB/512GB Black' } },
    update: {},
    create: {
      device_model_id: xiaomi14Ultra.id,
      variant_name: '16GB/512GB Black',
      color_name: 'Black',
      color_hex: '#0F0F0F',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2024-03-12'),
      launch_price: 1499,
      currency_id: usd!.id,
      is_default: true,
    },
  })

  await prisma.variant_physical_specs.upsert({
    where: { device_variant_id: xiaomi14Ultra512.id },
    update: {},
    create: {
      device_variant_id: xiaomi14Ultra512.id,
      height_mm: 161.4,
      width_mm: 75.3,
      thickness_mm: 9.2,
      weight_g: 224,
      ingress_protection: 'IP68',
      frame_material: 'Aluminum',
      back_material: 'Vegan leather / Ceramic',
    },
  })

  await prisma.variant_chipsets.create({
    data: {
      device_variant_id: xiaomi14Ultra512.id,
      chipset_id: snapdragon8Gen3.id,
      chip_role: 'soc',
      is_primary: true,
    },
  })

  await prisma.variant_displays.create({
    data: {
      device_variant_id: xiaomi14Ultra512.id,
      display_unit_id: xiaomi14UltraDisplay.id,
      display_role: 'main',
    },
  })

  await prisma.variant_batteries.create({
    data: {
      device_variant_id: xiaomi14Ultra512.id,
      battery_unit_id: xiaomi14UltraBattery.id,
      battery_role: 'internal',
    },
  })

  // Xiaomi 14 Ultra 16GB+1TB White
  await prisma.device_variants.upsert({
    where: { device_model_id_variant_name: { device_model_id: xiaomi14Ultra.id, variant_name: '16GB/1TB White' } },
    update: {},
    create: {
      device_model_id: xiaomi14Ultra.id,
      variant_name: '16GB/1TB White',
      color_name: 'White',
      color_hex: '#FFFFFF',
      release_status_id: releasedStatus!.id,
      launch_date: new Date('2024-03-12'),
      launch_price: 1699,
      currency_id: usd!.id,
    },
  })

  // ========================================================
  // 11. ADMIN USER
  // ========================================================
  console.log('👤 [11/12] Seeding admin user...')

  const passwordHash = await bcrypt.hash('admin123', 12)

  await prisma.users.upsert({
    where: { email: 'admin@spechub.io' },
    update: {},
    create: {
      email: 'admin@spechub.io',
      password_hash: passwordHash,
      username: 'admin',
      display_name: 'SpecHub Admin',
      role: 'admin',
      email_verified_at: new Date(),
      is_active: true,
    },
  })

  // Sample contributor user
  const contributorHash = await bcrypt.hash('contributor123', 12)
  await prisma.users.upsert({
    where: { email: 'contributor@spechub.io' },
    update: {},
    create: {
      email: 'contributor@spechub.io',
      password_hash: contributorHash,
      username: 'contributor',
      display_name: 'Sample Contributor',
      role: 'contributor',
      email_verified_at: new Date(),
      is_active: true,
    },
  })

  // ========================================================
  // 12. SUBSCRIPTION PLANS
  // ========================================================
  console.log('💳 [12/12] Seeding subscription plans...')

  await prisma.subscription_plans.upsert({
    where: { code: 'free' },
    update: {},
    create: {
      code: 'free',
      name: 'Free',
      description: 'Truy cập cơ bản cho mọi user',
      price_monthly: 0,
      price_yearly: 0,
      currency_code: 'USD',
      features: {
        compare_limit_per_day: 5,
        wishlist_limit: 10,
        price_alerts: false,
        ai_questions_per_day: 3,
        api_access: false,
      },
    },
  })

  await prisma.subscription_plans.upsert({
    where: { code: 'pro' },
    update: {},
    create: {
      code: 'pro',
      name: 'Pro',
      description: 'Cho người dùng đam mê công nghệ',
      price_monthly: 4.99,
      price_yearly: 49.99,
      currency_code: 'USD',
      features: {
        compare_limit_per_day: -1,
        wishlist_limit: -1,
        price_alerts: true,
        ai_questions_per_day: 50,
        api_access: false,
        priority_support: true,
      },
    },
  })

  await prisma.subscription_plans.upsert({
    where: { code: 'team' },
    update: {},
    create: {
      code: 'team',
      name: 'Team',
      description: 'Cho doanh nghiệp và team retailers',
      price_monthly: 24.99,
      price_yearly: 249.99,
      currency_code: 'USD',
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
  })

  // ========================================================
  // SUMMARY
  // ========================================================
  console.log('\n✅ Seed completed!\n')
  console.log('📊 Summary:')
  console.log(`  - Languages:          ${await prisma.languages.count()}`)
  console.log(`  - Release statuses:   ${await prisma.release_statuses.count()}`)
  console.log(`  - Currencies:         ${await prisma.currencies.count()}`)
  console.log(`  - Regions:            ${await prisma.regions.count()}`)
  console.log(`  - Organizations:      ${await prisma.organizations.count()}`)
  console.log(`  - Categories:         ${await prisma.device_categories.count()}`)
  console.log(`  - Product families:   ${await prisma.product_families.count()}`)
  console.log(`  - Device models:      ${await prisma.device_models.count()}`)
  console.log(`  - Device variants:    ${await prisma.device_variants.count()}`)
  console.log(`  - Chipsets:           ${await prisma.chipsets.count()}`)
  console.log(`  - Displays:           ${await prisma.display_units.count()}`)
  console.log(`  - Batteries:          ${await prisma.battery_units.count()}`)
  console.log(`  - Users:              ${await prisma.users.count()}`)
  console.log(`  - Subscription plans: ${await prisma.subscription_plans.count()}`)
  console.log('\n🔐 Test credentials:')
  console.log('  - admin@spechub.io / admin123')
  console.log('  - contributor@spechub.io / contributor123')
  console.log('\n🎯 Try queries:')
  console.log('  - GET /api/v1/devices')
  console.log('  - GET /api/v1/devices/iphone-16-pro')
  console.log('  - GET /api/v1/organizations/apple')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })