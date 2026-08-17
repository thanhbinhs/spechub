import { BadRequestException, Injectable } from "@nestjs/common";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { PrismaService } from "../../prisma/prisma.service";
import type { PreviewQuickIntakeDto } from "./dto/catalog-studio.dto";
import {
  assertSupportedOfficialCatalogUrl,
  extractOfficialCatalogUrl,
} from "./official-catalog-url-extractor";

type QuickHardwareKind = NonNullable<PreviewQuickIntakeDto["hardware_kind"]>;
type IntakeField = {
  value: string;
  confidence: number;
  source_excerpt: string;
};
type QuickDuplicate = {
  id: string;
  name: string;
  slug: string;
  match: "name" | "slug" | "partial";
};

export type QuickIntakePreviewItem = {
  index: number;
  title: string;
  draft_type: "device" | "hardware-module";
  payload: Record<string, unknown>;
  fields: Record<string, IntakeField>;
  duplicates: QuickDuplicate[];
  warnings: string[];
};

type InputSource = {
  input_type: "url" | "text" | "csv";
  label: string;
  url?: string;
  retrieved_at: string;
};

const MAX_TEXT_LENGTH = 500_000;
const MAX_FETCH_BYTES = 5_000_000;
const MAX_REDIRECTS = 3;
const defaultDeviceSections = [
  { section_key: "highlights", title: "Điểm nổi bật", body_markdown: "" },
  {
    section_key: "design",
    title: "Thiết kế và trải nghiệm",
    body_markdown: "",
  },
  {
    section_key: "performance",
    title: "Hiệu năng và phần cứng",
    body_markdown: "",
  },
  {
    section_key: "experience",
    title: "Màn hình, âm thanh và tương tác",
    body_markdown: "",
  },
  { section_key: "battery", title: "Pin và kết nối", body_markdown: "" },
  {
    section_key: "software",
    title: "Phần mềm và hệ sinh thái",
    body_markdown: "",
  },
  {
    section_key: "limits",
    title: "Hạn chế và đối tượng phù hợp",
    body_markdown: "",
  },
];

@Injectable()
export class QuickCatalogIntakeService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(dto: PreviewQuickIntakeDto): Promise<{
    data: QuickIntakePreviewItem[];
    meta: { source: InputSource; count: number };
  }> {
    if (dto.entity_type === "hardware-module" && !dto.hardware_kind) {
      throw new BadRequestException("Hãy chọn loại mô-đun phần cứng.");
    }

    const { rows, source } = await this.readInput(dto);
    const items = await Promise.all(
      rows.slice(0, 100).map(async (row, index) => {
        const fields =
          dto.entity_type === "device"
            ? await this.extractDevice(row)
            : this.extractHardware(row, dto.hardware_kind!);
        const name = fields.name?.value ?? "Bản ghi chưa xác định";
        const slug = fields.slug?.value ?? this.slugify(name);
        const duplicates = await this.findDuplicates(
          dto.entity_type,
          name,
          slug,
          dto.hardware_kind,
        );
        const payload =
          dto.entity_type === "device"
            ? this.devicePayload(fields, source)
            : this.hardwarePayload(fields, source, dto.hardware_kind!);
        return {
          index,
          title: name,
          draft_type: dto.entity_type,
          payload,
          fields,
          duplicates,
          warnings: this.warningsFor(fields, dto.entity_type),
        } satisfies QuickIntakePreviewItem;
      }),
    );
    return { data: items, meta: { source, count: items.length } };
  }

  private async readInput(dto: PreviewQuickIntakeDto): Promise<{
    rows: Array<Record<string, string>>;
    source: InputSource;
  }> {
    const retrieved_at = new Date().toISOString();
    if (dto.input_type === "url") {
      assertSupportedOfficialCatalogUrl(dto.entity_type, dto.value.trim());
      const page = await this.fetchPublicPage(dto.value.trim());
      const extraction = extractOfficialCatalogUrl(
        dto.entity_type,
        page.url,
        page.html,
      );
      return {
        rows: [extraction.values],
        source: {
          input_type: "url",
          label: dto.source_label?.trim() || extraction.sourceLabel,
          url: page.url,
          retrieved_at,
        },
      };
    }

    if (dto.input_type === "csv") {
      const rows = this.parseCsv(dto.value);
      if (!rows.length) {
        throw new BadRequestException("CSV chưa có dòng dữ liệu hợp lệ.");
      }
      return {
        rows,
        source: {
          input_type: "csv",
          label: dto.source_label?.trim() || "Tệp CSV được nhập thủ công",
          retrieved_at,
        },
      };
    }

    const content = dto.value.trim();
    if (!content)
      throw new BadRequestException("Nội dung nhập không được để trống.");
    return {
      rows: [this.labelValuePairs(content)],
      source: {
        input_type: "text",
        label: dto.source_label?.trim() || "Nội dung được dán thủ công",
        retrieved_at,
      },
    };
  }

  private async extractDevice(
    row: Record<string, string>,
  ): Promise<Record<string, IntakeField>> {
    const original = this.asSourceText(row);
    const isOfficialUrl = Boolean(row.__official_source);
    const value = (keys: string[], fallback?: string) =>
      this.pick(row, keys) || fallback || "";
    const name =
      value([
        "name",
        "device",
        "device name",
        "model",
        "product",
        "tên",
        "ten",
        "thiết bị",
      ]) || (isOfficialUrl ? "" : this.firstMeaningfulLine(original));
    const chipset = value([
      "chipset",
      "soc",
      "processor",
      "bộ xử lý",
      "vi xử lý",
    ]);
    const display = value(["display", "screen", "màn hình", "man hinh"]);
    const battery = value(["battery", "pin"]);
    const camera = value(["camera", "rear camera", "máy ảnh", "may anh"]);
    const frontCamera = value([
      "front_camera",
      "front camera",
      "selfie camera",
      "truedepth camera",
    ]);
    const memory = value(["ram", "memory", "bộ nhớ ram", "bo nho ram"]);
    const storage = value([
      "storage",
      "rom",
      "internal storage",
      "bộ nhớ trong",
      "bo nho trong",
    ]);
    const dimensions = value([
      "dimensions",
      "size and weight",
      "kích thước và trọng lượng",
    ]);
    const ingressProtection = value([
      "ingress_protection",
      "ingress protection",
      "water resistance",
    ]);
    const connectivity = value([
      "connectivity",
      "cellular and wireless",
      "wireless",
    ]);
    const wirelessCharging = value(
      [
        "wireless_charging",
        "wireless charging",
        "magsafe and wireless charging",
      ],
      /wireless charging/i.test(battery) ? battery : undefined,
    );
    const sim = value(["sim", "sim card"]);
    const operatingSystem = value([
      "operating_system",
      "operating system",
      "launch os",
      "os",
    ]);
    const finish = value(["finish", "colors", "colours"]);
    const announcement = this.dateValue(
      value(["announcement date", "announced", "ngày công bố", "ngay cong bo"]),
    );
    const release = this.dateValue(
      value(["release date", "released", "ngày ra mắt", "ngay ra mat"]),
    );
    const sourceSummary = value(
      ["summary", "description", "mô tả", "mo ta"],
      isOfficialUrl
        ? undefined
        : this.summaryFromSpecs(name, chipset, display, battery),
    );
    const chipsetLookupName = this.chipsetLookupName(chipset);
    const osLabel = this.operatingSystemLabel(operatingSystem);
    const explicitFamily = value([
      "product family",
      "series",
      "dòng sản phẩm",
      "dong san pham",
    ]);
    const [chipsetId, familyId, launchOsVersionId] = await Promise.all([
      this.findModuleId("chipset", chipsetLookupName),
      this.findFamilyId(
        explicitFamily
          ? [explicitFamily]
          : isOfficialUrl
            ? this.familyCandidates(name)
            : [],
      ),
      this.findOsVersionId(osLabel),
    ]);

    const memoryCapacity = this.numberFrom(
      memory,
      /(?:ram|memory)?\s*(\d+(?:\.\d+)?)\s*gb/i,
    );
    const storageValues = this.storageValues(storage);
    const storageCapacity = this.numberFrom(
      storageValues[0] ?? "",
      /(\d+(?:\.\d+)?)\s*(gb|tb)/i,
    );
    const displaySize = this.numberFrom(
      display,
      /(\d+(?:\.\d+)?)\s*[-‐‑‒–—]?\s*(?:inch|inches|")/i,
    );
    const displayRefreshRate = this.numberFrom(display, /(\d{2,3})\s*hz/i);
    const displayTechnology = this.displayTechnology(display);
    const displayPpi = this.numberFrom(display, /(\d{2,4})\s*ppi/i);
    const brightnessTypical = this.numberFrom(
      display,
      /(\d{2,5})\s*nits?\s+(?:max\s+)?brightness\s*\(typical\)/i,
    );
    const brightnessPeak = this.maxNumberFrom(display, /(\d{2,5})\s*nits?/gi);
    const resolution = display.match(
      /(\d{3,4})\s*(?:x|×|[-‐‑‒–—]?by[-‐‑‒–—]?)\s*(\d{3,4})/i,
    );
    const batteryCapacity = this.numberFrom(battery, /(\d{3,5})\s*mah/i);
    const wiredCharging = this.wiredChargingPower(battery, isOfficialUrl);
    const wirelessChargingPower = this.numberFrom(
      wirelessCharging,
      /(?:wireless charging|magsafe|qi2?)[^\d]{0,30}(?:up to\s*)?(\d{1,3})\s*w/i,
    );
    const wirelessChargingProtocol = [
      /\bMagSafe\b/i.test(wirelessCharging) ? "MagSafe" : "",
      /\bQi2\b/i.test(wirelessCharging) ? "Qi2" : "",
      /\bQi\b/i.test(wirelessCharging) && !/\bQi2\b/i.test(wirelessCharging)
        ? "Qi"
        : "",
    ]
      .filter(Boolean)
      .join(", ");
    const batteryVideoPlaybackHours = this.numberFrom(
      battery,
      /video playback\s*(?:up to\s*)?(\d+(?:\.\d+)?)\s*hours?/i,
    );
    const rearMainCameraSegment = this.sectionBetween(camera, "Wide camera", [
      "Ultrawide camera",
    ]);
    const rearUltrawideCameraSegment = this.sectionBetween(
      camera,
      "Ultrawide camera",
      ["Telephoto camera", "All rear cameras"],
    );
    const rearMainMegapixel = this.numberFrom(
      rearMainCameraSegment || camera,
      /(\d{1,3}(?:\.\d+)?)\s*mp/i,
    );
    const rearMainAperture =
      this.numberFrom(
        rearMainCameraSegment || camera,
        /(?:fusion\s+)?main[^\u0192f]{0,120}[ƒf]\/(\d+(?:\.\d+)?)/i,
      ) || this.numberFrom(rearMainCameraSegment, /[ƒf]\/(\d+(?:\.\d+)?)/i);
    const rearMainFocalLength = this.numberFrom(
      camera,
      /(?:fusion\s+)?main\s*:\s*(\d+(?:\.\d+)?)\s*mm/i,
    );
    const rearUltrawideMegapixel = rearUltrawideCameraSegment
      ? this.numberFrom(rearUltrawideCameraSegment, /(\d{1,3}(?:\.\d+)?)\s*mp/i)
      : this.numberFrom(camera, /(\d{1,3}(?:\.\d+)?)\s*mp\s*ultra[\s‑-]*wide/i);
    const rearUltrawideAperture = rearUltrawideCameraSegment
      ? this.numberFrom(rearUltrawideCameraSegment, /[ƒf]\/(\d+(?:\.\d+)?)/i)
      : this.numberFrom(
          camera,
          /ultra[\s‑-]*wide[^\u0192f]{0,120}[ƒf]\/(\d+(?:\.\d+)?)/i,
        );
    const rearUltrawideFocalLength = this.numberFrom(
      camera,
      /ultra[\s‑-]*wide\s*:\s*(\d+(?:\.\d+)?)\s*mm/i,
    );
    const rearUltrawideFieldOfView = rearUltrawideCameraSegment
      ? this.numberFrom(
          rearUltrawideCameraSegment,
          /(\d+(?:\.\d+)?)°\s*field of view/i,
        )
      : this.numberFrom(
          camera,
          /ultra[\s‑-]*wide[^\u00b0]{0,180}?(\d+(?:\.\d+)?)°/i,
        );
    const rearMainHasOis =
      /(?:fusion\s+)?main.{0,220}optical image stabilization/i.test(camera) ||
      /optical(?:\s*\+\s*electronic)? image stabilization on wide/i.test(
        camera,
      ) ||
      /wide camera.{0,220}optical image stabilization/i.test(camera);
    const frontMegapixel = this.numberFrom(
      frontCamera,
      /(\d{1,3}(?:\.\d+)?)\s*mp/i,
    );
    const frontAperture = this.numberFrom(
      frontCamera,
      /[ƒf]\/(\d+(?:\.\d+)?)/i,
    );
    const widthMm =
      this.numberFrom(
        dimensions,
        /width\s*:[^()]{0,80}\((\d+(?:\.\d+)?)\s*mm\)/i,
      ) ||
      this.convertedNumberFrom(
        dimensions,
        /(\d+(?:\.\d+)?)\s*in(?:ches)?\s*\(width\)/i,
        25.4,
      );
    const heightMm =
      this.numberFrom(
        dimensions,
        /height\s*:[^()]{0,80}\((\d+(?:\.\d+)?)\s*mm\)/i,
      ) ||
      this.convertedNumberFrom(
        dimensions,
        /(\d+(?:\.\d+)?)\s*in(?:ches)?\s*\(height\)/i,
        25.4,
      );
    const thicknessMm =
      this.numberFrom(
        dimensions,
        /(?:depth|thickness)\s*:[^()]{0,80}\((\d+(?:\.\d+)?)\s*mm\)/i,
      ) ||
      this.convertedNumberFrom(
        dimensions,
        /(\d+(?:\.\d+)?)\s*in(?:ches)?\s*\((?:depth|thickness)\)/i,
        25.4,
      );
    const weightG =
      this.numberFrom(
        dimensions,
        /weight\s*:[^()]{0,80}\((\d+(?:\.\d+)?)\s*(?:g|grams?)\)/i,
      ) ||
      this.convertedNumberFrom(
        dimensions,
        /(\d+(?:\.\d+)?)\s*(?:oz|ounces?)\b/i,
        28.349523125,
      );
    const ingressProtectionCode =
      ingressProtection.match(/\bIP\d{2}\b/i)?.[0]?.toUpperCase() ?? "";
    const wifiStandard =
      connectivity.match(/\bWi[‐‑‒–—-]?Fi\s*(\d+(?:\.\d+)?)/i)?.[1] ?? "";
    const bluetoothVersion =
      connectivity.match(/\bBluetooth\s*(\d+(?:\.\d+)?)/i)?.[1] ?? "";
    const modelNumbers =
      connectivity.match(
        /\bModels?\s+([A-Z]\d+(?:\s*(?:,|and)\s*[A-Z]\d+)*)/i,
      )?.[1] ?? "";
    const esimSupported = /\beSIM\b/i.test(sim) ? "true" : "";
    const simSlots = /\bdual\s+eSIM\b/i.test(sim) ? "2" : "";
    const explicitVariant = value([
      "variant",
      "sku",
      "configuration",
      "phiên bản",
      "phien ban",
    ]);
    const variantName =
      explicitVariant ||
      (isOfficialUrl && storageCapacity ? `${storageCapacity} GB` : name);
    const storageOptions = storageValues.join(", ");
    const summaryIsDerived =
      isOfficialUrl &&
      /^(?:view|see)\s+all\s+technical specifications/i.test(sourceSummary);
    const summary = summaryIsDerived
      ? [
          `${name}${chipsetLookupName ? ` dùng ${chipsetLookupName}` : ""}`,
          displaySize &&
            `màn hình ${displayTechnology ? `${displayTechnology} ` : ""}${displaySize} inch`,
          rearMainMegapixel && `camera chính ${rearMainMegapixel} MP`,
          batteryVideoPlaybackHours &&
            `phát video tối đa ${batteryVideoPlaybackHours} giờ`,
        ]
          .filter(Boolean)
          .join(" · ")
      : sourceSummary;

    const result: Record<string, IntakeField> = {};
    this.assign(
      result,
      "name",
      name,
      this.evidenceFor(row, ["name", "title"], original),
      name ? 1 : 0,
    );
    this.assign(
      result,
      "slug",
      this.slugify(name),
      this.evidenceFor(row, ["name", "title"], name),
      name ? 1 : 0,
    );
    this.assign(
      result,
      "summary",
      summary,
      this.evidenceFor(row, ["summary", "description"], original),
      summary ? (summaryIsDerived ? 0.9 : isOfficialUrl ? 1 : 0.75) : 0,
    );
    this.assign(
      result,
      "variant_name",
      variantName,
      this.evidenceFor(
        row,
        explicitVariant ? ["variant", "sku", "configuration"] : ["storage"],
        original,
      ),
      explicitVariant ? 1 : variantName ? (isOfficialUrl ? 0.9 : 0.75) : 0,
    );
    this.assign(
      result,
      "sku_code",
      value(["sku", "model number", "model code", "mã máy", "ma may"]),
      this.evidenceFor(row, ["sku", "model number", "model code"], original),
      value(["sku", "model number", "model code", "mã máy", "ma may"]) ? 1 : 0,
    );
    this.assign(
      result,
      "market_name",
      value([
        "market name",
        "marketing name",
        "tên thương mại",
        "ten thuong mai",
      ]),
      this.evidenceFor(row, ["market name", "marketing name"], original),
      value([
        "market name",
        "marketing name",
        "tên thương mại",
        "ten thuong mai",
      ])
        ? 1
        : 0,
    );
    this.assign(
      result,
      "announcement_date",
      announcement,
      this.evidenceFor(row, ["announcement date", "announced"], original),
      announcement ? 1 : 0,
    );
    this.assign(
      result,
      "release_date",
      release,
      this.evidenceFor(row, ["release date", "released"], original),
      release ? 1 : 0,
    );
    this.assign(
      result,
      "chipset",
      chipset,
      this.evidenceFor(row, ["chipset", "chip", "processor", "soc"], original),
      chipset ? 1 : 0,
    );
    this.assign(
      result,
      "chipset_id",
      chipsetId ?? "",
      this.evidenceFor(row, ["chipset", "chip", "processor", "soc"], chipset),
      chipsetId ? 1 : 0,
    );
    this.assign(
      result,
      "product_family_id",
      familyId ?? "",
      this.evidenceFor(row, ["product family", "series", "dòng sản phẩm"], ""),
      familyId ? 1 : 0,
    );
    this.assign(
      result,
      "memory_capacity_gb",
      memoryCapacity,
      this.evidenceFor(row, ["ram", "memory"], memory),
      memoryCapacity ? 1 : 0,
    );
    this.assign(
      result,
      "storage_capacity_gb",
      storageCapacity,
      this.evidenceFor(row, ["storage", "rom", "internal storage"], storage),
      storageCapacity ? 1 : 0,
    );
    this.assign(
      result,
      "display_size_inch",
      displaySize,
      this.evidenceFor(row, ["display", "screen"], display),
      displaySize ? 1 : 0,
    );
    this.assign(
      result,
      "display_refresh_rate_hz",
      displayRefreshRate,
      this.evidenceFor(row, ["display", "screen"], display),
      displayRefreshRate ? 1 : 0,
    );
    this.assign(
      result,
      "resolution_width",
      resolution?.[1] ?? "",
      this.evidenceFor(row, ["display", "screen"], display),
      resolution ? 1 : 0,
    );
    this.assign(
      result,
      "resolution_height",
      resolution?.[2] ?? "",
      this.evidenceFor(row, ["display", "screen"], display),
      resolution ? 1 : 0,
    );
    this.assign(
      result,
      "battery_capacity_mah",
      batteryCapacity,
      this.evidenceFor(row, ["battery", "charging"], battery),
      batteryCapacity ? 1 : 0,
    );
    this.assign(
      result,
      "wired_charging_w",
      wiredCharging,
      this.evidenceFor(row, ["battery", "charging"], battery),
      wiredCharging ? 1 : 0,
    );
    this.assign(
      result,
      "rear_main_megapixel",
      rearMainMegapixel,
      this.evidenceFor(row, ["camera", "rear camera"], camera),
      rearMainMegapixel ? 1 : 0,
    );
    const displayEvidence = this.evidenceFor(
      row,
      ["display", "screen"],
      display,
    );
    const cameraEvidence = this.evidenceFor(
      row,
      ["camera", "rear camera"],
      camera,
    );
    const frontCameraEvidence = this.evidenceFor(
      row,
      ["front_camera", "front camera", "truedepth camera"],
      frontCamera,
    );
    const dimensionsEvidence = this.evidenceFor(
      row,
      ["dimensions", "size and weight"],
      dimensions,
    );
    const connectivityEvidence = this.evidenceFor(
      row,
      ["connectivity", "cellular and wireless"],
      connectivity,
    );
    const wirelessChargingEvidence = this.evidenceFor(
      row,
      ["wireless_charging", "wireless charging"],
      wirelessCharging,
    );
    const richFields: Array<[string, string, string, number]> = [
      [
        "storage_options",
        storageOptions,
        this.evidenceFor(row, ["storage"], storage),
        1,
      ],
      ["display_technology", displayTechnology, displayEvidence, 1],
      ["display_pixel_density_ppi", displayPpi, displayEvidence, 1],
      [
        "display_brightness_typical_nits",
        brightnessTypical,
        displayEvidence,
        1,
      ],
      ["display_brightness_peak_nits", brightnessPeak, displayEvidence, 1],
      [
        "display_hdr_formats",
        /\bHDR\b/i.test(display) ? "HDR" : "",
        displayEvidence,
        1,
      ],
      [
        "display_color_gamut",
        /\bP3\b/i.test(display) ? "P3" : "",
        displayEvidence,
        1,
      ],
      ["height_mm", heightMm, dimensionsEvidence, 1],
      ["width_mm", widthMm, dimensionsEvidence, 1],
      ["thickness_mm", thicknessMm, dimensionsEvidence, 1],
      ["weight_g", weightG, dimensionsEvidence, 1],
      [
        "frame_material",
        /\baluminum\b/i.test(finish) ? "Aluminum" : "",
        this.evidenceFor(row, ["finish"], finish),
        1,
      ],
      [
        "back_material",
        /color-infused glass back/i.test(finish) ? "Color-infused glass" : "",
        this.evidenceFor(row, ["finish"], finish),
        1,
      ],
      [
        "front_glass",
        /ceramic shield/i.test(finish) ? "Ceramic Shield" : "",
        this.evidenceFor(row, ["finish"], finish),
        1,
      ],
      [
        "ingress_protection",
        ingressProtectionCode,
        this.evidenceFor(
          row,
          ["ingress_protection", "ingress protection"],
          ingressProtection,
        ),
        1,
      ],
      ["wifi_standard", wifiStandard, connectivityEvidence, 1],
      ["bluetooth_version", bluetoothVersion, connectivityEvidence, 1],
      ["model_numbers", modelNumbers, connectivityEvidence, 1],
      ["esim_supported", esimSupported, this.evidenceFor(row, ["sim"], sim), 1],
      ["sim_slots", simSlots, this.evidenceFor(row, ["sim"], sim), 1],
      [
        "sim_type",
        esimSupported ? "eSIM" : "",
        this.evidenceFor(row, ["sim"], sim),
        1,
      ],
      [
        "launch_os_name",
        osLabel,
        this.evidenceFor(row, ["operating_system"], operatingSystem),
        1,
      ],
      [
        "launch_os_version_id",
        launchOsVersionId ?? "",
        this.evidenceFor(row, ["operating_system"], operatingSystem),
        launchOsVersionId ? 1 : 0,
      ],
      [
        "battery_video_playback_hours",
        batteryVideoPlaybackHours,
        this.evidenceFor(row, ["battery"], battery),
        1,
      ],
      [
        "wireless_charging_w",
        wirelessChargingPower,
        wirelessChargingEvidence,
        1,
      ],
      [
        "wireless_charging_protocol",
        wirelessChargingProtocol,
        wirelessChargingEvidence,
        1,
      ],
      ["rear_main_aperture", rearMainAperture, cameraEvidence, 1],
      ["rear_main_focal_length_mm", rearMainFocalLength, cameraEvidence, 1],
      ["rear_main_has_ois", rearMainHasOis ? "true" : "", cameraEvidence, 1],
      ["rear_ultrawide_megapixel", rearUltrawideMegapixel, cameraEvidence, 1],
      ["rear_ultrawide_aperture", rearUltrawideAperture, cameraEvidence, 1],
      [
        "rear_ultrawide_focal_length_mm",
        rearUltrawideFocalLength,
        cameraEvidence,
        1,
      ],
      [
        "rear_ultrawide_field_of_view_deg",
        rearUltrawideFieldOfView,
        cameraEvidence,
        1,
      ],
      ["front_megapixel", frontMegapixel, frontCameraEvidence, 1],
      ["front_aperture", frontAperture, frontCameraEvidence, 1],
      [
        "front_has_af",
        /autofocus/i.test(frontCamera) ? "true" : "",
        frontCameraEvidence,
        1,
      ],
    ];
    for (const [key, parsedValue, excerpt, confidence] of richFields) {
      this.assign(
        result,
        key,
        parsedValue,
        excerpt,
        parsedValue ? confidence : 0,
      );
    }
    return result;
  }

  private extractHardware(
    row: Record<string, string>,
    kind: QuickHardwareKind,
  ): Record<string, IntakeField> {
    const original = this.asSourceText(row);
    const isOfficialUrl = Boolean(row.__official_source);
    const value = (keys: string[], fallback?: string) =>
      this.pick(row, keys) || fallback || "";
    const name =
      value([
        "name",
        "module",
        "model",
        "product",
        "tên",
        "ten",
        "mô đun",
        "mo dun",
      ]) || (isOfficialUrl ? "" : this.firstMeaningfulLine(original));
    const description = value(
      ["description", "summary", "mô tả", "mo ta"],
      isOfficialUrl ? undefined : original.slice(0, 1_500),
    );
    const fields: Record<string, IntakeField> = {};
    this.assign(fields, "kind", kind, "Loại mô-đun được chọn", 1);
    this.assign(
      fields,
      "name",
      name,
      this.evidenceFor(row, ["name", "title"], original),
      name ? 1 : 0,
    );
    this.assign(
      fields,
      "slug",
      this.slugify(name),
      this.evidenceFor(row, ["name", "title"], name),
      name ? 1 : 0,
    );
    this.assign(
      fields,
      "description",
      description,
      this.evidenceFor(row, ["description", "summary"], original),
      description ? (isOfficialUrl ? 1 : 0.72) : 0,
    );
    this.assign(
      fields,
      "category",
      value(
        ["category", "type", "loại", "loai"],
        isOfficialUrl || kind !== "chipset" ? "" : "soc",
      ),
      this.evidenceFor(row, ["category", "type"], original),
      value(["category", "type", "loại", "loai"]) ? 1 : 0,
    );
    this.assign(
      fields,
      "model_code",
      value(["model code", "model number", "sku", "mã mẫu", "ma mau"]),
      original,
      0.9,
    );
    this.assign(
      fields,
      "organization_name",
      value([
        "manufacturer",
        "vendor",
        "brand",
        "hãng",
        "hang",
        "nhà sản xuất",
      ]),
      original,
      0.82,
    );

    const definitions: Record<
      QuickHardwareKind,
      Array<[string, string[], RegExp?]>
    > = {
      chipset: [
        [
          "announcement_date",
          ["announcement date", "announced", "ngày công bố"],
          undefined,
        ],
        [
          "release_date",
          ["release date", "released", "ngày ra mắt"],
          undefined,
        ],
        ["max_ram_gb", ["max ram", "ram tối đa"], /(\d+)\s*gb/i],
        ["max_camera_mp", ["max camera", "camera tối đa"], /(\d+)\s*mp/i],
        [
          "max_display_resolution",
          ["max display", "display resolution", "độ phân giải tối đa"],
          undefined,
        ],
      ],
      cpu: [
        [
          "core_count",
          ["cores", "core count", "số nhân"],
          /(\d+)\s*(?:core|nhân)/i,
        ],
        [
          "thread_count",
          ["threads", "thread count", "số luồng"],
          /(\d+)\s*(?:thread|luồng)/i,
        ],
        [
          "max_frequency_mhz",
          ["max frequency", "clock", "xung nhịp"],
          /(\d+(?:\.\d+)?)\s*ghz/i,
        ],
        ["isa_name", ["isa", "instruction set", "tập lệnh"], undefined],
        ["microarchitecture", ["microarchitecture", "vi kiến trúc"], undefined],
      ],
      gpu: [
        [
          "clock_mhz",
          ["clock", "frequency", "xung nhịp"],
          /(\d+(?:\.\d+)?)\s*ghz/i,
        ],
        ["fp32_gflops", ["fp32", "gflops"], /(\d+(?:\.\d+)?)\s*gflops/i],
        ["vulkan_version", ["vulkan"], /vulkan\s*([\d.]+)/i],
        ["api_support", ["api", "api support", "apis"], undefined],
      ],
      npu: [
        ["tops", ["tops", "ai performance"], /(\d+(?:\.\d+)?)\s*tops/i],
        ["tops_int8", ["int8 tops"], /(\d+(?:\.\d+)?)\s*tops/i],
        ["ai_engine_version", ["ai engine"], undefined],
        ["dsp_name", ["dsp"], undefined],
      ],
      modem: [
        [
          "max_downlink_mbps",
          ["downlink", "download", "tải xuống"],
          /(\d+(?:\.\d+)?)\s*(?:mbps|gbps)/i,
        ],
        [
          "max_uplink_mbps",
          ["uplink", "upload", "tải lên"],
          /(\d+(?:\.\d+)?)\s*(?:mbps|gbps)/i,
        ],
        ["lte_category", ["lte category", "lte cat"], undefined],
        ["supported_5g_modes", ["5g modes", "5g"], undefined],
      ],
      "memory-standard": [
        ["generation", ["generation", "thế hệ"], undefined],
        [
          "max_data_rate_mtps",
          ["max data rate", "data rate"],
          /(\d+(?:\.\d+)?)\s*mtps/i,
        ],
        [
          "bandwidth_gbps",
          ["bandwidth", "băng thông"],
          /(\d+(?:\.\d+)?)\s*gbps/i,
        ],
        ["voltage", ["voltage", "điện áp"], /(\d+(?:\.\d+)?)\s*v/i],
      ],
      "storage-standard": [
        ["generation", ["generation", "thế hệ"], undefined],
        ["interface", ["interface", "giao tiếp"], undefined],
        ["release_year", ["release year", "năm ra mắt"], /(19\d{2}|20\d{2})/],
      ],
      "operating-system": [
        ["kernel_type", ["kernel type", "loại kernel"], undefined],
        ["kernel_name", ["kernel", "tên kernel"], undefined],
        ["license_name", ["license", "giấy phép"], undefined],
        ["os_type", ["os type", "loại hệ điều hành"], undefined],
      ],
    };
    for (const [key, keys, pattern] of definitions[kind]) {
      const raw = value(keys);
      let parsed = raw;
      if (pattern) {
        parsed = this.numberFrom(raw || original, pattern);
        if (!parsed && raw) parsed = this.bareNumber(raw);
        if (
          ["max_frequency_mhz", "clock_mhz"].includes(key) &&
          /ghz/i.test(raw || original)
        ) {
          parsed = String(Number(parsed || 0) * 1000 || "");
        }
        if (
          ["max_downlink_mbps", "max_uplink_mbps"].includes(key) &&
          /gbps/i.test(raw || original)
        ) {
          parsed = String(Number(parsed || 0) * 1000 || "");
        }
      }
      this.assign(
        fields,
        key,
        parsed,
        this.evidenceFor(row, keys, raw || original),
        parsed ? (isOfficialUrl ? 1 : 0.82) : 0,
      );
    }
    return fields;
  }

  private devicePayload(
    fields: Record<string, IntakeField>,
    source: InputSource,
  ) {
    const value = (key: string) => fields[key]?.value ?? "";
    return {
      general: {
        name: value("name"),
        slug: value("slug"),
        product_family_id: value("product_family_id"),
        release_status_id: value("release_status_id"),
        summary: value("summary"),
      },
      model: {
        variant_name: value("variant_name"),
        sku_code: value("sku_code"),
        market_name: value("market_name"),
        alias: "",
        internal_codename: "",
        generation_label: "",
        announcement_date: value("announcement_date"),
        release_date: value("release_date"),
        color_name: "",
        color_hex: "",
        launch_date: value("release_date"),
        launch_price: "",
        currency_id: "",
      },
      hardware: {
        chipset_id: value("chipset_id"),
        cpu_id: "",
        gpu_id: "",
        npu_id: "",
        modem_id: "",
      },
      configuration: {
        memory_standard_id: "",
        memory_capacity_gb: value("memory_capacity_gb"),
        memory_speed_mhz: "",
        storage_standard_id: "",
        storage_capacity_gb: value("storage_capacity_gb"),
        storage_expandable: "",
        storage_expansion_max_gb: "",
        height_mm: value("height_mm"),
        width_mm: value("width_mm"),
        thickness_mm: value("thickness_mm"),
        weight_g: value("weight_g"),
        frame_material: value("frame_material"),
        back_material: value("back_material"),
        front_glass: value("front_glass"),
        ingress_protection: value("ingress_protection"),
        sim_slots: value("sim_slots"),
        sim_type: value("sim_type"),
        esim_supported: value("esim_supported"),
        stereo_speakers: "",
        headphone_jack: "",
        has_microsd_slot: "",
        has_ir_blaster: "",
        cooling_type: "",
        vc_area_mm2: "",
        has_active_cooling: "",
      },
      display: {
        technology: value("display_technology"),
        size_inch: value("display_size_inch"),
        aspect_ratio: "",
        resolution_width: value("resolution_width"),
        resolution_height: value("resolution_height"),
        pixel_density_ppi: value("display_pixel_density_ppi"),
        refresh_rate_hz: value("display_refresh_rate_hz"),
        refresh_rate_min_hz: "",
        ltpo_version: "",
        touch_sampling_hz: "",
        brightness_typical_nits: value("display_brightness_typical_nits"),
        brightness_hbm_nits: "",
        brightness_peak_nits: value("display_brightness_peak_nits"),
        color_gamut: value("display_color_gamut"),
        hdr_formats: value("display_hdr_formats"),
        protection_glass: "",
        has_always_on: "",
        has_dc_dimming: "",
        pwm_frequency_hz: "",
      },
      camera: {
        rear_main: {
          effective_megapixel: value("rear_main_megapixel"),
          aperture: value("rear_main_aperture"),
          focal_length_mm_eq: value("rear_main_focal_length_mm"),
          optical_zoom: "",
          field_of_view_deg: "",
          has_ois: value("rear_main_has_ois"),
          has_eis: "",
          has_af: "",
          video_capabilities: "",
        },
        rear_ultrawide: {
          effective_megapixel: value("rear_ultrawide_megapixel"),
          aperture: value("rear_ultrawide_aperture"),
          focal_length_mm_eq: value("rear_ultrawide_focal_length_mm"),
          optical_zoom: "",
          field_of_view_deg: value("rear_ultrawide_field_of_view_deg"),
          has_ois: "",
          has_eis: "",
          has_af: "",
          video_capabilities: "",
        },
        rear_telephoto: {
          effective_megapixel: "",
          aperture: "",
          focal_length_mm_eq: "",
          optical_zoom: "",
          field_of_view_deg: "",
          has_ois: "",
          has_eis: "",
          has_af: "",
          video_capabilities: "",
        },
        front: {
          effective_megapixel: value("front_megapixel"),
          aperture: value("front_aperture"),
          focal_length_mm_eq: "",
          optical_zoom: "",
          field_of_view_deg: "",
          has_ois: "",
          has_eis: "",
          has_af: value("front_has_af"),
          video_capabilities: "",
        },
      },
      battery: {
        capacity_mah: value("battery_capacity_mah"),
        energy_wh: "",
        wired_charging_w: value("wired_charging_w"),
        wired_charging_protocol: "",
        wireless_charging_w: value("wireless_charging_w"),
        wireless_charging_protocol: value("wireless_charging_protocol"),
        removable: "",
      },
      software: {
        launch_os_version_id: value("launch_os_version_id"),
        current_os_version_id: "",
        highest_official_version_id: "",
        ui_layer_version_id: "",
        promised_major_updates: "",
        promised_security_years: "",
        security_patch_date: "",
        bootloader_status: "",
        root_status: "",
      },
      media: { cover_asset_id: "", cover_filename: "", cover_alt: "" },
      commerce: { links: [] },
      description: {
        summary: value("summary"),
        sections: defaultDeviceSections,
      },
      provenance: this.provenance(fields, source),
    };
  }

  private hardwarePayload(
    fields: Record<string, IntakeField>,
    source: InputSource,
    kind: QuickHardwareKind,
  ) {
    const mapped = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value]),
    );
    return {
      hardware_module: { ...mapped, kind },
      provenance: this.provenance(fields, source),
    };
  }

  private provenance(fields: Record<string, IntakeField>, source: InputSource) {
    return {
      intake_version: 1,
      imported_at: new Date().toISOString(),
      source,
      fields,
    };
  }

  private warningsFor(
    fields: Record<string, IntakeField>,
    type: "device" | "hardware-module",
  ) {
    const warnings: string[] = [];
    if (!fields.name?.value)
      warnings.push(
        "Không nhận diện được tên; hãy chỉnh sửa trước khi lưu nháp.",
      );
    if (type === "device" && !fields.product_family_id?.value)
      warnings.push(
        "Chưa ghép được dòng sản phẩm; cần chọn trong wizard trước khi xuất bản.",
      );
    if (
      type === "device" &&
      (fields.storage_options?.value.split(",").length ?? 0) > 1
    )
      warnings.push(
        "Nguồn liệt kê nhiều dung lượng; bản nháp này dùng tùy chọn đầu tiên. Hãy nhân bản biến thể cho các dung lượng còn lại.",
      );
    if (
      type === "device" &&
      fields.launch_os_name?.value &&
      !fields.launch_os_version_id?.value
    )
      warnings.push(
        `Nguồn ghi ${fields.launch_os_name.value} nhưng catalog chưa có bản OS khớp chính xác; SpecHub không tự gán nhầm ID.`,
      );
    if (
      type === "device" &&
      fields.battery_video_playback_hours?.value &&
      !fields.battery_capacity_mah?.value
    )
      warnings.push(
        "Nguồn chính thức chỉ công bố thời lượng pin, không công bố mAh; trường dung lượng được để trống thay vì suy đoán.",
      );
    if (
      type === "hardware-module" &&
      (fields.description?.value.length ?? 0) < 120
    )
      warnings.push(
        "Mô tả chưa đủ 120 ký tự để tạo mô-đun; hãy bổ sung trong form phần cứng.",
      );
    if (
      Object.values(fields).some(
        (field) =>
          field.value && field.confidence > 0 && field.confidence < 0.7,
      )
    )
      warnings.push(
        "Một số giá trị được suy luận; kiểm tra lại nguồn trước khi xuất bản.",
      );
    return warnings;
  }

  private async findDuplicates(
    entityType: "device" | "hardware-module",
    name: string,
    slug: string,
    hardwareKind?: QuickHardwareKind,
  ): Promise<QuickDuplicate[]> {
    if (!name && !slug) return [];
    const toDuplicates = (
      items: Array<{ id: string; name: string; slug: string }>,
    ) =>
      items.map((item) => ({
        ...item,
        match:
          item.slug === slug
            ? ("slug" as const)
            : this.normalize(item.name) === this.normalize(name)
              ? ("name" as const)
              : ("partial" as const),
      }));
    const where = {
      OR: [
        { name: { contains: name || slug, mode: "insensitive" as const } },
        {
          slug: {
            contains: slug || this.slugify(name),
            mode: "insensitive" as const,
          },
        },
      ],
    };
    if (entityType === "device") {
      return toDuplicates(
        await this.prisma.device_models.findMany({
          where: { ...where, deleted_at: null },
          select: { id: true, name: true, slug: true },
          take: 5,
        }),
      );
    }
    switch (hardwareKind) {
      case "chipset":
        return toDuplicates(
          await this.prisma.chipsets.findMany({
            where: { ...where, deleted_at: null },
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      case "cpu":
        return toDuplicates(
          await this.prisma.cpus.findMany({
            where,
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      case "gpu":
        return toDuplicates(
          await this.prisma.gpus.findMany({
            where,
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      case "npu":
        return toDuplicates(
          await this.prisma.npus.findMany({
            where,
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      case "modem":
        return toDuplicates(
          await this.prisma.modems.findMany({
            where,
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      case "memory-standard":
        return toDuplicates(
          await this.prisma.memory_standards.findMany({
            where,
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      case "storage-standard":
        return toDuplicates(
          await this.prisma.storage_standards.findMany({
            where,
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      case "operating-system":
        return toDuplicates(
          await this.prisma.operating_systems.findMany({
            where,
            select: { id: true, name: true, slug: true },
            take: 5,
          }),
        );
      default:
        return [];
    }
  }

  private async findModuleId(kind: QuickHardwareKind, name: string) {
    if (!name) return null;
    const where = {
      name: { equals: name.trim(), mode: "insensitive" as const },
    };
    switch (kind) {
      case "chipset":
        return (
          (
            await this.prisma.chipsets.findFirst({
              where: { ...where, deleted_at: null },
              select: { id: true },
            })
          )?.id ?? null
        );
      case "cpu":
        return (
          (await this.prisma.cpus.findFirst({ where, select: { id: true } }))
            ?.id ?? null
        );
      case "gpu":
        return (
          (await this.prisma.gpus.findFirst({ where, select: { id: true } }))
            ?.id ?? null
        );
      case "npu":
        return (
          (await this.prisma.npus.findFirst({ where, select: { id: true } }))
            ?.id ?? null
        );
      case "modem":
        return (
          (await this.prisma.modems.findFirst({ where, select: { id: true } }))
            ?.id ?? null
        );
      case "memory-standard":
        return (
          (
            await this.prisma.memory_standards.findFirst({
              where,
              select: { id: true },
            })
          )?.id ?? null
        );
      case "storage-standard":
        return (
          (
            await this.prisma.storage_standards.findFirst({
              where,
              select: { id: true },
            })
          )?.id ?? null
        );
      case "operating-system":
        return (
          (
            await this.prisma.operating_systems.findFirst({
              where,
              select: { id: true },
            })
          )?.id ?? null
        );
    }
  }

  private async findFamilyId(names: string[]) {
    const candidates = names.map((name) => name.trim()).filter(Boolean);
    if (!candidates.length) return null;
    return (
      (
        await this.prisma.product_families.findFirst({
          where: {
            OR: candidates.map((name) => ({
              name: { equals: name, mode: "insensitive" as const },
            })),
            deleted_at: null,
          },
          select: { id: true },
        })
      )?.id ?? null
    );
  }

  private async findOsVersionId(label: string) {
    const match = label.match(/^(iOS|Android|macOS|Windows|ChromeOS)\s+(.+)$/i);
    if (!match) return null;
    return (
      (
        await this.prisma.os_versions.findFirst({
          where: {
            version_name: {
              equals: match[2].trim(),
              mode: "insensitive",
            },
            operating_system: {
              name: { equals: match[1], mode: "insensitive" },
            },
          },
          select: { id: true },
        })
      )?.id ?? null
    );
  }

  private familyCandidates(name: string) {
    const normalized = name.trim();
    const base =
      normalized.match(/^iPhone\s+\d+[A-Za-z]?/i)?.[0] ??
      normalized.match(/^Pixel\s+\d+[A-Za-z]?/i)?.[0] ??
      normalized.match(/^Galaxy\s+[A-Za-z]+\d+/i)?.[0] ??
      normalized;
    return [`${base} Series`, base];
  }

  private chipsetLookupName(value: string) {
    const apple = value.match(/\b(A\d+(?:\s+(?:Pro|Bionic))?)\b/i)?.[1];
    if (apple) return `Apple ${apple}`;
    return value.match(/\bGoogle Tensor G\d+\b/i)?.[0] ?? value;
  }

  private operatingSystemLabel(value: string) {
    return (
      value.match(/\b(iOS|Android|macOS|Windows|ChromeOS)\s+[\d.]+/i)?.[0] ?? ""
    );
  }

  private labelValuePairs(text: string, title?: string) {
    const pairs: Record<string, string> = {};
    if (title) pairs.title = title;
    for (const line of text.split(/\r?\n/)) {
      const match = line
        .trim()
        .match(/^([^:–—|]{1,80})\s*[:–—|]\s*(.{1,2000})$/);
      if (match) pairs[this.normalizeKey(match[1])] = match[2].trim();
    }
    pairs.raw_text = text.slice(0, MAX_TEXT_LENGTH);
    return pairs;
  }

  private parseCsv(value: string) {
    const delimiter = this.detectDelimiter(value);
    const rows = this.parseDelimited(value, delimiter).filter((row) =>
      row.some((cell) => cell.trim()),
    );
    if (rows.length < 2) return [];
    const headers = rows[0].map(
      (header, index) => this.normalizeKey(header) || `column_${index + 1}`,
    );
    return rows
      .slice(1)
      .map((row) =>
        Object.fromEntries(
          headers.map((header, index) => [header, row[index]?.trim() ?? ""]),
        ),
      );
  }

  private parseDelimited(value: string, delimiter: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      if (char === '"') {
        if (quoted && value[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && value[index + 1] === "\n") index += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else cell += char;
    }
    row.push(cell);
    rows.push(row);
    return rows;
  }

  private detectDelimiter(value: string) {
    const firstLine = value.split(/\r?\n/, 1)[0] ?? "";
    return (
      [",", ";", "\t"].sort(
        (left, right) =>
          firstLine.split(right).length - firstLine.split(left).length,
      )[0] ?? ","
    );
  }

  private async fetchPublicPage(input: string) {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new BadRequestException("URL không hợp lệ.");
    }
    await this.assertSafeUrl(url);
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
        headers: {
          Accept: "text/html,text/plain;q=0.9",
          "User-Agent": "SpecHubCatalogIntake/1.0",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location)
          throw new BadRequestException("URL chuyển hướng không hợp lệ.");
        url = new URL(location, url);
        await this.assertSafeUrl(url);
        continue;
      }
      if (!response.ok)
        throw new BadRequestException(
          `Không thể đọc nguồn (HTTP ${response.status}).`,
        );
      const contentType =
        response.headers.get("content-type")?.toLowerCase() ?? "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("text/plain")
      )
        throw new BadRequestException("Nguồn phải là trang HTML hoặc văn bản.");
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > MAX_FETCH_BYTES)
        throw new BadRequestException("Nguồn vượt quá giới hạn 5 MB.");
      return {
        url: url.href,
        html: await this.readLimited(response, MAX_FETCH_BYTES),
      };
    }
    throw new BadRequestException("Nguồn chuyển hướng quá nhiều lần.");
  }

  private async assertSafeUrl(url: URL) {
    if (url.protocol !== "https:" || url.username || url.password)
      throw new BadRequestException(
        "Chỉ chấp nhận URL HTTPS công khai, không kèm thông tin đăng nhập.",
      );
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".localhost"))
      throw new BadRequestException("Không thể đọc localhost.");
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (
      !addresses.length ||
      addresses.some((entry) => this.isPrivateAddress(entry.address))
    )
      throw new BadRequestException(
        "Tên miền nguồn trỏ đến địa chỉ private hoặc bị hạn chế.",
      );
  }

  private isPrivateAddress(address: string) {
    if (isIP(address) === 4) {
      const [first = 0, second = 0] = address.split(".").map(Number);
      return (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 100 && second >= 64 && second <= 127) ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168) ||
        (first === 198 && (second === 18 || second === 19)) ||
        first >= 224
      );
    }
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.") ||
      normalized.startsWith("::ffff:169.254.")
    );
  }

  private async readLimited(response: Response, maxBytes: number) {
    const reader = response.body?.getReader();
    if (!reader) return "";
    const decoder = new TextDecoder();
    let total = 0;
    let result = "";
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new BadRequestException("Nguồn vượt quá giới hạn 5 MB.");
      }
      result += decoder.decode(next.value, { stream: true });
    }
    return result + decoder.decode();
  }

  private pick(row: Record<string, string>, keys: string[]) {
    for (const key of keys) {
      const normalized = this.normalizeKey(key);
      const underscored = normalized.replace(/\s+/g, "_");
      for (const candidate of [key, normalized, underscored]) {
        if (row[candidate]?.trim()) return row[candidate].trim();
      }
    }
    const raw = row.raw_text ?? "";
    for (const key of keys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = raw.match(
        new RegExp(`${escaped}\\s*[:–—-]\\s*([^\\n|]{1,300})`, "i"),
      );
      if (match?.[1]?.trim()) return match[1].trim();
    }
    return "";
  }

  private evidenceFor(
    row: Record<string, string>,
    keys: string[],
    fallback: string,
  ) {
    for (const key of keys) {
      const normalized = this.normalizeKey(key);
      for (const candidate of [
        `__evidence_${key}`,
        `__evidence_${normalized}`,
        `__evidence_${normalized.replace(/\s+/g, "_")}`,
      ]) {
        const excerpt = row[candidate];
        if (excerpt?.trim()) return excerpt.trim();
      }
    }
    return fallback;
  }

  private assign(
    fields: Record<string, IntakeField>,
    key: string,
    value: string,
    source_excerpt: string,
    confidence: number,
  ) {
    fields[key] = {
      value: value.trim(),
      confidence: Math.max(0, Math.min(1, confidence)),
      source_excerpt: source_excerpt.slice(0, 500),
    };
  }

  private asSourceText(row: Record<string, string>) {
    return (
      row.raw_text ??
      Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    );
  }
  private firstMeaningfulLine(value: string) {
    return (
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length >= 3 && line.length <= 160) ?? ""
    );
  }
  private summaryFromSpecs(
    name: string,
    chipset: string,
    display: string,
    battery: string,
  ) {
    return [
      name,
      chipset && `dùng ${chipset}`,
      display && `màn hình ${display}`,
      battery && `pin ${battery}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  private dateValue(value: string) {
    const match = value.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
    return match
      ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
      : "";
  }
  private numberFrom(value: string, pattern: RegExp) {
    const match = value.match(pattern);
    if (!match?.[1]) return "";
    const number =
      Number(match[1]) * (match[2]?.toLowerCase() === "tb" ? 1024 : 1);
    return Number.isFinite(number) ? String(number) : "";
  }
  private maxNumberFrom(value: string, pattern: RegExp) {
    const matches = Array.from(
      value.matchAll(
        new RegExp(
          pattern.source,
          pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
        ),
      ),
    )
      .map((match) => Number(match[1]))
      .filter(Number.isFinite);
    return matches.length ? String(Math.max(...matches)) : "";
  }
  private convertedNumberFrom(value: string, pattern: RegExp, factor: number) {
    const raw = this.numberFrom(value, pattern);
    if (!raw) return "";
    const converted = Number(raw) * factor;
    return Number.isFinite(converted)
      ? String(Math.round(converted * 100) / 100)
      : "";
  }
  private wiredChargingPower(value: string, isOfficialUrl: boolean) {
    if (!isOfficialUrl) {
      return this.numberFrom(value, /(\d{1,3})\s*w(?:att)?/i);
    }
    return this.numberFrom(
      value,
      /(?:wired charging|super fast charging|fast charging)[^\d]{0,40}(\d{1,3})\s*w/i,
    );
  }
  private displayTechnology(value: string) {
    const technologies: Array<[RegExp, string]> = [
      [/\bLTPO\s+AMOLED\b/i, "LTPO AMOLED"],
      [/\bAMOLED\b/i, "AMOLED"],
      [/\bOLED\b/i, "OLED"],
      [/\bmini[\s-]?LED\b/i, "Mini-LED"],
      [/\bIPS\s+LCD\b/i, "IPS LCD"],
      [/\bLCD\b/i, "LCD"],
    ];
    return technologies.find(([pattern]) => pattern.test(value))?.[1] ?? "";
  }
  private storageValues(value: string) {
    const values = Array.from(value.matchAll(/\b\d+(?:\.\d+)?\s*(?:gb|tb)\b/gi))
      .filter((match) => {
        const end = (match.index ?? 0) + match[0].length;
        return !/^\s*ram\b/i.test(value.slice(end, end + 12));
      })
      .map((match) => match[0].replace(/\s+/g, "").toUpperCase());
    return Array.from(new Set(values));
  }
  private sectionBetween(
    value: string,
    startLabel: string,
    endLabels: string[],
  ) {
    const normalized = value.toLowerCase();
    const start = normalized.indexOf(startLabel.toLowerCase());
    if (start < 0) return "";
    const end = endLabels
      .map((label) => normalized.indexOf(label.toLowerCase(), start + 1))
      .filter((index) => index > start)
      .sort((left, right) => left - right)[0];
    return value.slice(start, end ?? value.length);
  }
  private bareNumber(value: string) {
    const normalized = value.trim();
    return /^\d+(?:\.\d+)?$/.test(normalized) ? normalized : "";
  }
  private normalize(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }
  private normalizeKey(value: string) {
    return this.normalize(value);
  }
  private slugify(value: string) {
    return this.normalize(value).replace(/\s+/g, "-").slice(0, 180);
  }
}
