import { QuickCatalogIntakeService } from "./quick-catalog-intake.service";

describe("QuickCatalogIntakeService", () => {
  const prisma = {
    chipsets: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    product_families: {
      findFirst: jest.fn(),
    },
    release_statuses: {
      findFirst: jest.fn(),
    },
    device_models: {
      findMany: jest.fn(),
    },
    cpus: {
      findMany: jest.fn(),
    },
    os_versions: {
      findFirst: jest.fn(),
    },
  };
  let service: QuickCatalogIntakeService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.chipsets.findFirst.mockResolvedValue({ id: "chipset-1" });
    prisma.product_families.findFirst.mockResolvedValue({ id: "family-1" });
    prisma.release_statuses.findFirst.mockResolvedValue({ id: 2 });
    prisma.device_models.findMany.mockResolvedValue([]);
    prisma.cpus.findMany.mockResolvedValue([]);
    prisma.os_versions.findFirst.mockResolvedValue({ id: "ios-26" });
    service = new QuickCatalogIntakeService(prisma as any);
  });

  it("maps pasted device specifications to a reviewable wizard draft", async () => {
    const result = await service.preview({
      entity_type: "device",
      input_type: "text",
      source_label: "Thông số hãng",
      value: [
        "Tên: Example Phone Pro",
        "Dòng sản phẩm: Example Phone",
        "Chipset: Snapdragon Example",
        "Màn hình: 6.7 inch, 120Hz, 1440 x 3120",
        "Pin: 5000 mAh, 80W",
        "RAM: 12 GB",
        "Storage: 512 GB",
      ].join("\n"),
    });

    expect(result.meta.source.label).toBe("Thông số hãng");
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      title: "Example Phone Pro",
      draft_type: "device",
      payload: {
        general: {
          name: "Example Phone Pro",
          product_family_id: "family-1",
        },
        hardware: { chipset_id: "chipset-1" },
        configuration: { storage_capacity_gb: "512" },
        battery: { capacity_mah: "5000", wired_charging_w: "80" },
      },
    });
    expect(result.data[0]?.fields.display_refresh_rate_hz.value).toBe("120");
  });

  it("parses several CSV rows and retains them as distinct draft candidates", async () => {
    const result = await service.preview({
      entity_type: "device",
      input_type: "csv",
      value: [
        "name,chipset,battery",
        "Example One,Snapdragon Example,5000 mAh",
        "Example Two,Snapdragon Example,6000 mAh",
      ].join("\n"),
    });

    expect(result.data.map((item) => item.title)).toEqual([
      "Example One",
      "Example Two",
    ]);
    expect(result.data[1]?.payload).toMatchObject({
      battery: { capacity_mah: "6000" },
    });
  });

  it("creates hardware-module payloads without publishing the module", async () => {
    const result = await service.preview({
      entity_type: "hardware-module",
      hardware_kind: "cpu",
      input_type: "text",
      value: [
        "Name: Cortex Example",
        "Cores: 8 cores",
        "Clock: 3.2 GHz",
        "Description: CPU module used for test verification.",
      ].join("\n"),
    });

    expect(result.data[0]).toMatchObject({
      title: "Cortex Example",
      draft_type: "hardware-module",
      payload: {
        hardware_module: {
          kind: "cpu",
          name: "Cortex Example",
          core_count: "8",
          max_frequency_mhz: "3200",
        },
      },
    });
    expect(result.data[0]?.warnings).toContain(
      "Mô tả chưa đủ 120 ký tự để tạo mô-đun; hãy bổ sung trong form phần cứng.",
    );
  });

  it("maps rich official Apple evidence without inventing unpublished values", async () => {
    const fields = await (service as any).extractDevice({
      __official_source: "apple",
      name: "iPhone 16",
      summary:
        "View all technical specifications for iPhone 16 and iPhone 16 Plus.",
      chipset:
        "A18 chip 6-core CPU with 2 performance and 4 efficiency cores 5-core GPU",
      storage: "128GB 256GB",
      display:
        "6.1-inch OLED display 2556-by-1179-pixel resolution at 460 ppi 1000 nits max brightness (typical); 2000 nits peak brightness (outdoor) HDR display Wide color (P3)",
      dimensions:
        "Width: 2.82 inches (71.6 mm) Height: 5.81 inches (147.6 mm) Depth: 0.31 inch (7.80 mm) Weight: 6.00 ounces (170 grams)",
      ingress_protection: "Rated IP68 under IEC standard 60529",
      camera:
        "48MP Fusion Main: 26 mm, ƒ/1.6 aperture, sensor-shift optical image stabilization 12MP Ultra Wide: 13 mm, ƒ/2.2 aperture and 120° field of view",
      front_camera: "12MP camera ƒ/1.9 aperture Autofocus with Focus Pixels",
      battery:
        "Video playback Up to 22 hours Fast-charge capable with 20W adapter or higher",
      wireless_charging:
        "MagSafe wireless charging up to 25W Qi2 wireless charging up to 25W",
      connectivity: "Models A3081 and A3082 Wi‑Fi 7 (802.11be) Bluetooth 5.3",
      sim: "Dual eSIM (two active eSIMs)",
      operating_system: "iOS 26",
      finish: "Aluminum design Ceramic Shield front Color-infused glass back",
      raw_text: "official Apple specifications",
    });
    const payload = (service as any).devicePayload(fields, {
      input_type: "url",
      label: "Apple Tech Specs",
      url: "https://www.apple.com/iphone-16/specs/",
      retrieved_at: "2026-08-09T00:00:00.000Z",
    });

    expect(fields.summary.value).toContain("Apple A18");
    expect(fields.storage_options.value).toBe("128GB, 256GB");
    expect(fields.wired_charging_w.value).toBe("");
    expect(fields.battery_video_playback_hours.value).toBe("22");
    expect(payload).toMatchObject({
      configuration: {
        height_mm: "147.6",
        width_mm: "71.6",
        thickness_mm: "7.8",
        weight_g: "170",
        ingress_protection: "IP68",
        esim_supported: "true",
      },
      display: {
        technology: "OLED",
        size_inch: "6.1",
        resolution_width: "2556",
        resolution_height: "1179",
        pixel_density_ppi: "460",
        brightness_typical_nits: "1000",
        brightness_peak_nits: "2000",
      },
      camera: {
        rear_main: {
          effective_megapixel: "48",
          aperture: "1.6",
          focal_length_mm_eq: "26",
          has_ois: "true",
        },
        rear_ultrawide: {
          effective_megapixel: "12",
          aperture: "2.2",
          focal_length_mm_eq: "13",
          field_of_view_deg: "120",
        },
        front: {
          effective_megapixel: "12",
          aperture: "1.9",
          has_af: "true",
        },
      },
      battery: {
        capacity_mah: "",
        wired_charging_w: "",
        wireless_charging_w: "25",
        wireless_charging_protocol: "MagSafe, Qi2",
      },
      software: { launch_os_version_id: "ios-26" },
    });
  });
});
