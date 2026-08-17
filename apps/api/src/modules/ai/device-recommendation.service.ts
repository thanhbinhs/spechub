import { Injectable } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import {
  type DeviceMustHave,
  type DeviceOperatingSystem,
  type DevicePriority,
  type DeviceUseCase,
  type RecommendDevicesDto,
} from "./dto/recommend-devices.dto";

const RECOMMENDATION_MODEL_SELECT = {
  id: true,
  name: true,
  slug: true,
  summary: true,
  cover_image_url: true,
  release_date: true,
  product_family: {
    select: {
      id: true,
      name: true,
      slug: true,
      brand_org: {
        select: { id: true, name: true, short_name: true, slug: true },
      },
      device_category: { select: { id: true, name: true, slug: true } },
    },
  },
  release_status: { select: { id: true, code: true, name: true } },
  device_variants: {
    where: { deleted_at: null },
    select: {
      id: true,
      variant_name: true,
      market_name: true,
      color_name: true,
      color_hex: true,
      launch_price: true,
      launch_date: true,
      is_default: true,
      currency: {
        select: { code: true, symbol: true, decimal_digits: true },
      },
      variant_physical_specs: {
        select: { weight_g: true, thickness_mm: true },
      },
      variant_module_scores: {
        select: { module_kind: true, score: true, score_source: true },
      },
      variant_scorecards: {
        select: {
          overall_score: true,
          coverage_percent: true,
          score_source: true,
          module_scores: {
            select: {
              module_key: true,
              module_name: true,
              score: true,
              coverage_percent: true,
              rationale: true,
            },
          },
        },
        orderBy: [{ calculated_at: "desc" as const }],
        take: 1,
      },
      variant_chipsets: {
        select: {
          chipset: {
            select: {
              integrated_5g: true,
              chipset_modem_links: {
                select: { modem: { select: { supports_5g_nr: true } } },
              },
            },
          },
        },
      },
      variant_modems: {
        select: { modem: { select: { supports_5g_nr: true } } },
      },
      variant_displays: {
        select: {
          display_unit: {
            select: {
              refresh_rate_hz: true,
              brightness_peak_nits: true,
              display_technology: { select: { name: true, slug: true } },
            },
          },
        },
      },
      variant_batteries: {
        select: {
          battery_unit: {
            select: {
              capacity_mah: true,
              energy_wh: true,
              wired_charging_w: true,
              wireless_charging_w: true,
            },
          },
        },
      },
      variant_camera_modules: {
        where: { is_active: { not: false } },
        select: {
          camera_module: {
            select: {
              effective_megapixel: true,
              optical_zoom: true,
              has_ois: true,
            },
          },
        },
      },
      variant_storage_configs: {
        select: {
          total_capacity_gb: true,
          is_expandable: true,
          expansion_max_gb: true,
        },
      },
      variant_operating_systems: {
        select: {
          is_default: true,
          promised_major_updates: true,
          promised_security_years: true,
          os_version: {
            select: {
              version_name: true,
              operating_system: {
                select: { name: true, slug: true, os_family: true },
              },
            },
          },
        },
        orderBy: [{ is_default: "desc" as const }],
      },
      software_profile: {
        select: {
          promised_major_updates: true,
          promised_security_years: true,
          current_os_version: {
            select: {
              version_name: true,
              operating_system: {
                select: { name: true, slug: true, os_family: true },
              },
            },
          },
          launch_os_version: {
            select: {
              version_name: true,
              operating_system: {
                select: { name: true, slug: true, os_family: true },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { is_default: "desc" as const },
      { launch_date: "desc" as const },
    ],
  },
} satisfies Prisma.device_modelsSelect;

type RecommendationModel = Prisma.device_modelsGetPayload<{
  select: typeof RECOMMENDATION_MODEL_SELECT;
}>;
type RecommendationVariant = RecommendationModel["device_variants"][number];

type Signal = {
  score: number;
  evidence: string;
  source: "scorecard" | "specification" | "missing";
};

type RankedCandidate = {
  model: RecommendationModel;
  variant: RecommendationVariant;
  price: number | null;
  operatingSystem: ReturnType<typeof operatingSystemOf>;
  storageGb: number | null;
  matchScore: number;
  coverage: number;
  breakdown: Array<
    Signal & { key: DevicePriority; label: string; weight: number }
  >;
  matchedRequirements: string[];
};

const PRIORITY_LABELS: Record<DevicePriority, string> = {
  performance: "Hiệu năng",
  battery: "Pin và sạc",
  camera: "Camera",
  display: "Màn hình",
  price: "Giá trị trong ngân sách",
  portability: "Tính di động",
  software: "Phần mềm lâu dài",
  storage: "Lưu trữ",
};

const MUST_HAVE_LABELS: Record<DeviceMustHave, string> = {
  "5g": "Có 5G",
  oled: "Màn hình OLED",
  high_refresh: "Màn hình từ 120 Hz",
  wireless_charging: "Sạc không dây",
  ois: "Camera có OIS",
  expandable_storage: "Hỗ trợ mở rộng bộ nhớ",
  lightweight: "Trọng lượng nhẹ",
};

const USE_CASE_WEIGHTS: Record<
  DeviceUseCase,
  Partial<Record<DevicePriority, number>>
> = {
  gaming: { performance: 40, display: 25, battery: 15, storage: 10, price: 10 },
  photography: {
    camera: 45,
    display: 15,
    battery: 15,
    storage: 15,
    software: 10,
  },
  productivity: {
    performance: 25,
    battery: 20,
    software: 20,
    portability: 15,
    storage: 10,
    display: 10,
  },
  travel: { portability: 30, battery: 30, camera: 15, software: 10, price: 15 },
  long_term: {
    software: 30,
    performance: 25,
    battery: 20,
    portability: 10,
    price: 15,
  },
  value: { price: 35, performance: 25, battery: 20, display: 10, software: 10 },
};

@Injectable()
export class DeviceRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async recommend(dto: RecommendDevicesDto) {
    const currencyCode = (dto.currency_code ?? "USD").toUpperCase();
    const operatingSystem = dto.operating_system ?? "any";
    const priorities = dto.priorities ?? [];
    const mustHaves = dto.must_haves ?? [];
    const weights = buildWeights(dto.use_cases, priorities);

    const models = await this.prisma.device_models.findMany({
      where: {
        deleted_at: null,
        product_family: { device_category: { slug: dto.category_slug } },
        device_variants: { some: { deleted_at: null } },
      },
      select: RECOMMENDATION_MODEL_SELECT,
      orderBy: [{ release_date: "desc" }, { name: "asc" }],
      take: 300,
    });

    const selected = models.flatMap((model) => {
      const variants = model.device_variants
        .filter((variant) =>
          variantMatches(
            variant,
            dto.category_slug,
            operatingSystem,
            mustHaves,
            dto.min_storage_gb,
            dto.budget_max,
            currencyCode,
          ),
        )
        .sort((left, right) =>
          compareVariants(left, right, dto.budget_max !== undefined),
        );
      return variants[0] ? [{ model, variant: variants[0] }] : [];
    });

    const knownPrices = selected
      .map(({ variant }) => decimalToNumber(variant.launch_price))
      .filter((price): price is number => price !== null);
    const priceRange = {
      min: knownPrices.length ? Math.min(...knownPrices) : null,
      max: knownPrices.length ? Math.max(...knownPrices) : null,
    };

    const ranked: RankedCandidate[] = selected.map(({ model, variant }) => {
      const price = decimalToNumber(variant.launch_price);
      const breakdown = (
        Object.entries(weights) as Array<[DevicePriority, number]>
      ).map(([key, weight]) => ({
        key,
        label: PRIORITY_LABELS[key],
        weight,
        ...signalFor(
          key,
          variant,
          dto.category_slug,
          price,
          dto.budget_max,
          priceRange,
        ),
      }));
      const matchScore = round(
        breakdown.reduce((sum, item) => sum + item.score * item.weight, 0) /
          100,
      );
      const coverage = round(
        breakdown.reduce(
          (sum, item) => sum + (item.source === "missing" ? 0 : item.weight),
          0,
        ),
      );
      return {
        model,
        variant,
        price,
        operatingSystem: operatingSystemOf(variant),
        storageGb: maxStorage(variant),
        matchScore,
        coverage,
        breakdown,
        matchedRequirements: matchedRequirementLabels(
          variant,
          dto.category_slug,
          operatingSystem,
          mustHaves,
          dto.min_storage_gb,
        ),
      };
    });

    ranked.sort(
      (left, right) =>
        right.matchScore - left.matchScore ||
        right.coverage - left.coverage ||
        compareNullableNumbers(left.price, right.price),
    );

    const recommendations = ranked
      .slice(0, dto.limit ?? 3)
      .map((item, index) => ({
        rank: index + 1,
        match_score: item.matchScore,
        confidence_label: confidenceLabel(item.coverage),
        evidence_coverage: item.coverage,
        model: {
          id: item.model.id,
          name: item.model.name,
          slug: item.model.slug,
          summary: item.model.summary,
          cover_image_url: item.model.cover_image_url,
          release_date: item.model.release_date,
          product_family: item.model.product_family,
          release_status: item.model.release_status,
        },
        variant: {
          id: item.variant.id,
          variant_name: item.variant.variant_name,
          market_name: item.variant.market_name,
          color_name: item.variant.color_name,
          color_hex: item.variant.color_hex,
          launch_price: item.price,
          currency: item.variant.currency,
          storage_gb: item.storageGb,
          operating_system: item.operatingSystem,
        },
        reasons: buildReasons(item, dto.budget_max, currencyCode),
        trade_offs: buildTradeOffs(item, dto.budget_max, currencyCode),
        matched_requirements: item.matchedRequirements,
        score_breakdown: item.breakdown,
      }));

    return {
      data: {
        preferences: {
          category_slug: dto.category_slug,
          budget_max: dto.budget_max ?? null,
          currency_code: currencyCode,
          operating_system: operatingSystem,
          use_cases: dto.use_cases,
          priorities,
          must_haves: mustHaves,
          min_storage_gb: dto.min_storage_gb ?? null,
        },
        recommendations,
      },
      meta: {
        candidate_count: models.length,
        eligible_count: ranked.length,
        returned_count: recommendations.length,
        excluded_count: models.length - ranked.length,
        generated_at: new Date().toISOString(),
        scoring_version: "needs-match-v1",
      },
    };
  }
}

function buildWeights(
  useCases: DeviceUseCase[],
  priorities: DevicePriority[],
): Record<DevicePriority, number> {
  const totals = Object.fromEntries(
    Object.keys(PRIORITY_LABELS).map((key) => [key, 0]),
  ) as Record<DevicePriority, number>;
  for (const useCase of useCases) {
    for (const [key, value] of Object.entries(USE_CASE_WEIGHTS[useCase])) {
      totals[key as DevicePriority] += value ?? 0;
    }
  }
  const priorityBoosts = [35, 25, 15];
  priorities.forEach((key, index) => {
    totals[key] += priorityBoosts[index] ?? 10;
  });
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const normalized = { ...totals };
  for (const key of Object.keys(normalized) as DevicePriority[]) {
    normalized[key] = round((normalized[key] / Math.max(total, 1)) * 100, 2);
  }
  return normalized;
}

function variantMatches(
  variant: RecommendationVariant,
  categorySlug: string,
  operatingSystem: DeviceOperatingSystem,
  mustHaves: DeviceMustHave[],
  minStorageGb: number | undefined,
  budgetMax: number | undefined,
  currencyCode: string,
) {
  if (
    operatingSystem !== "any" &&
    !matchesOperatingSystem(variant, operatingSystem)
  ) {
    return false;
  }
  if (minStorageGb !== undefined && (maxStorage(variant) ?? 0) < minStorageGb) {
    return false;
  }
  if (
    !mustHaves.every((mustHave) =>
      hasRequirement(variant, categorySlug, mustHave),
    )
  ) {
    return false;
  }
  if (budgetMax !== undefined) {
    const price = decimalToNumber(variant.launch_price);
    if (price === null || variant.currency?.code.toUpperCase() !== currencyCode)
      return false;
    if (price > budgetMax) return false;
  }
  return true;
}

function compareVariants(
  left: RecommendationVariant,
  right: RecommendationVariant,
  preferPrice: boolean,
) {
  if (preferPrice) {
    const priceDifference =
      (decimalToNumber(left.launch_price) ?? Number.MAX_SAFE_INTEGER) -
      (decimalToNumber(right.launch_price) ?? Number.MAX_SAFE_INTEGER);
    if (priceDifference !== 0) return priceDifference;
  }
  if (left.is_default !== right.is_default) return left.is_default ? -1 : 1;
  return (maxStorage(right) ?? 0) - (maxStorage(left) ?? 0);
}

function hasRequirement(
  variant: RecommendationVariant,
  categorySlug: string,
  requirement: DeviceMustHave,
) {
  switch (requirement) {
    case "5g":
      return (
        variant.variant_modems.some(
          ({ modem }) => modem.supports_5g_nr === true,
        ) ||
        variant.variant_chipsets.some(
          ({ chipset }) =>
            chipset.integrated_5g === true ||
            chipset.chipset_modem_links.some(
              ({ modem }) => modem.supports_5g_nr === true,
            ),
        )
      );
    case "oled":
      return variant.variant_displays.some(({ display_unit }) => {
        const technology =
          `${display_unit.display_technology.name} ${display_unit.display_technology.slug}`.toLowerCase();
        return technology.includes("oled") || technology.includes("amoled");
      });
    case "high_refresh":
      return variant.variant_displays.some(
        ({ display_unit }) => (display_unit.refresh_rate_hz ?? 0) >= 120,
      );
    case "wireless_charging":
      return variant.variant_batteries.some(
        ({ battery_unit }) => (battery_unit.wireless_charging_w ?? 0) > 0,
      );
    case "ois":
      return variant.variant_camera_modules.some(
        ({ camera_module }) => camera_module.has_ois === true,
      );
    case "expandable_storage":
      return variant.variant_storage_configs.some(
        ({ is_expandable }) => is_expandable,
      );
    case "lightweight": {
      const weight = decimalToNumber(variant.variant_physical_specs?.weight_g);
      return weight !== null && weight <= lightweightThreshold(categorySlug);
    }
  }
}

function matchedRequirementLabels(
  variant: RecommendationVariant,
  categorySlug: string,
  operatingSystem: DeviceOperatingSystem,
  mustHaves: DeviceMustHave[],
  minStorageGb: number | undefined,
) {
  const labels = mustHaves
    .filter((item) => hasRequirement(variant, categorySlug, item))
    .map((item) => MUST_HAVE_LABELS[item]);
  if (operatingSystem !== "any") {
    labels.unshift(
      `Đúng hệ điều hành ${operatingSystemLabel(operatingSystem)}`,
    );
  }
  if (minStorageGb !== undefined) labels.push(`Bộ nhớ từ ${minStorageGb} GB`);
  return labels;
}

function matchesOperatingSystem(
  variant: RecommendationVariant,
  requested: DeviceOperatingSystem,
) {
  const os = operatingSystemOf(variant);
  if (!os) return false;
  return [os.slug, os.family, os.name]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(requested));
}

function operatingSystemOf(variant: RecommendationVariant) {
  const profileVersion =
    variant.software_profile?.current_os_version ??
    variant.software_profile?.launch_os_version;
  const version =
    profileVersion ?? variant.variant_operating_systems[0]?.os_version;
  if (!version) return null;
  return {
    name: version.operating_system.name,
    slug: version.operating_system.slug,
    family: version.operating_system.os_family,
    version_name: version.version_name,
  };
}

function signalFor(
  key: DevicePriority,
  variant: RecommendationVariant,
  categorySlug: string,
  price: number | null,
  budgetMax: number | undefined,
  priceRange: { min: number | null; max: number | null },
): Signal {
  if (key === "price") return priceSignal(price, budgetMax, priceRange);
  if (key === "storage") {
    return specificationSignal(key, variant, categorySlug);
  }
  const scorecard = variant.variant_scorecards[0];
  const module = scorecardModule(scorecard?.module_scores ?? [], key);
  if (module) {
    return {
      score: clamp(decimalToNumber(module.score) ?? 0),
      source: "scorecard",
      evidence:
        module.rationale?.trim() ||
        `${module.module_name} đạt ${round(decimalToNumber(module.score) ?? 0)}/100.`,
    };
  }
  return specificationSignal(key, variant, categorySlug);
}

function scorecardModule(
  modules: RecommendationVariant["variant_scorecards"][number]["module_scores"],
  key: DevicePriority,
) {
  const directKeys: Partial<Record<DevicePriority, string[]>> = {
    performance: ["performance", "cpu", "gpu"],
    battery: ["battery"],
    camera: ["camera"],
    display: ["display"],
    portability: ["build", "portability"],
    software: ["software"],
    storage: ["memory-storage", "storage"],
  };
  const wanted = directKeys[key] ?? [];
  const direct = wanted
    .map((moduleKey) => modules.find((item) => item.module_key === moduleKey))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (!direct.length) return null;
  if (
    direct.some(
      (item) =>
        item.module_key === key ||
        item.module_key === "memory-storage" ||
        item.module_key === "build",
    )
  ) {
    return direct[0]!;
  }
  return direct.sort(
    (left, right) =>
      (decimalToNumber(right.score) ?? 0) - (decimalToNumber(left.score) ?? 0),
  )[0]!;
}

function specificationSignal(
  key: DevicePriority,
  variant: RecommendationVariant,
  categorySlug: string,
): Signal {
  switch (key) {
    case "performance": {
      const scores = variant.variant_module_scores
        .filter(({ module_kind }) =>
          [
            "chipset",
            "cpu",
            "gpu",
            "npu",
            "memory-standard",
            "storage-standard",
          ].includes(module_kind),
        )
        .map(({ score }) => decimalToNumber(score))
        .filter((score): score is number => score !== null);
      if (!scores.length)
        return missingSignal("Chưa đủ điểm hiệu năng chuẩn hóa.");
      return specification(
        average(scores),
        `Điểm phần cứng tổng hợp ${round(average(scores))}/100 từ ${scores.length} mô-đun.`,
      );
    }
    case "battery": {
      const battery = variant.variant_batteries[0]?.battery_unit;
      if (!battery) return missingSignal("Chưa có dữ liệu pin và sạc.");
      const capacity = normalize(battery.capacity_mah, 2_000, 6_000);
      const charging = normalize(battery.wired_charging_w ?? 10, 10, 150);
      return specification(
        capacity * 0.7 + charging * 0.3,
        `${battery.capacity_mah.toLocaleString("vi-VN")} mAh${battery.wired_charging_w ? `, sạc ${battery.wired_charging_w} W` : ""}.`,
      );
    }
    case "display": {
      const display = variant.variant_displays[0]?.display_unit;
      if (!display) return missingSignal("Chưa có dữ liệu màn hình.");
      const refresh = normalize(display.refresh_rate_hz ?? 60, 60, 165);
      const brightness = normalize(
        display.brightness_peak_nits ?? 300,
        300,
        3_000,
      );
      return specification(
        refresh * 0.55 + brightness * 0.45,
        `${display.display_technology.name}${display.refresh_rate_hz ? `, ${display.refresh_rate_hz} Hz` : ""}${display.brightness_peak_nits ? `, sáng đỉnh ${display.brightness_peak_nits} nit` : ""}.`,
      );
    }
    case "camera": {
      const cameras = variant.variant_camera_modules.map(
        ({ camera_module }) => camera_module,
      );
      if (!cameras.length) return missingSignal("Chưa có dữ liệu camera.");
      const megapixel = Math.max(
        ...cameras.map(
          (camera) => decimalToNumber(camera.effective_megapixel) ?? 0,
        ),
      );
      const hasOis = cameras.some((camera) => camera.has_ois === true);
      const zoom = Math.max(
        ...cameras.map((camera) => decimalToNumber(camera.optical_zoom) ?? 0),
      );
      return specification(
        normalize(megapixel, 12, 108) * 0.5 +
          (hasOis ? 30 : 0) +
          normalize(zoom, 1, 10) * 0.2,
        `${cameras.length} camera, tối đa ${round(megapixel, 1)} MP${hasOis ? ", có OIS" : ""}${zoom > 1 ? `, zoom quang ${round(zoom, 1)}x` : ""}.`,
      );
    }
    case "portability": {
      const weight = decimalToNumber(variant.variant_physical_specs?.weight_g);
      if (weight === null) return missingSignal("Chưa có dữ liệu trọng lượng.");
      const threshold = lightweightThreshold(categorySlug);
      const upper = Math.max(threshold * 1.8, threshold + 300);
      return specification(
        100 - normalize(weight, threshold * 0.7, upper),
        `Trọng lượng ${round(weight)} g${variant.variant_physical_specs?.thickness_mm ? `, dày ${round(decimalToNumber(variant.variant_physical_specs.thickness_mm) ?? 0, 1)} mm` : ""}.`,
      );
    }
    case "software": {
      const support = Math.max(
        variant.software_profile?.promised_security_years ?? 0,
        ...variant.variant_operating_systems.map(
          (item) => item.promised_security_years ?? 0,
        ),
      );
      const updates = Math.max(
        variant.software_profile?.promised_major_updates ?? 0,
        ...variant.variant_operating_systems.map(
          (item) => item.promised_major_updates ?? 0,
        ),
      );
      if (!support && !updates)
        return missingSignal("Chưa có cam kết cập nhật phần mềm.");
      return specification(
        normalize(Math.max(support, updates), 1, 8),
        `${support ? `${support} năm cập nhật bảo mật` : ""}${support && updates ? ", " : ""}${updates ? `${updates} bản nâng cấp lớn` : ""}.`,
      );
    }
    case "storage": {
      const storage = maxStorage(variant);
      if (storage === null) return missingSignal("Chưa có dữ liệu lưu trữ.");
      const expandable = variant.variant_storage_configs.some(
        (item) => item.is_expandable,
      );
      return specification(
        Math.min(
          100,
          35 +
            Math.log2(Math.max(storage, 64) / 64) * 16.25 +
            (expandable ? 15 : 0),
        ),
        `${storage.toLocaleString("vi-VN")} GB${expandable ? ", có thể mở rộng" : ""}.`,
      );
    }
    case "price":
      return missingSignal("Chưa có dữ liệu giá.");
  }
}

function priceSignal(
  price: number | null,
  budgetMax: number | undefined,
  range: { min: number | null; max: number | null },
): Signal {
  if (price === null) return missingSignal("Chưa có giá ra mắt để đối chiếu.");
  if (budgetMax !== undefined) {
    const ratio = price / Math.max(budgetMax, 1);
    return specification(
      clamp(115 - ratio * 70),
      `Dùng ${round(ratio * 100)}% ngân sách tối đa.`,
    );
  }
  if (range.min === null || range.max === null || range.min === range.max) {
    return specification(70, "Mức giá đã được catalog xác minh.");
  }
  const position = (price - range.min) / (range.max - range.min);
  return specification(
    100 - position * 60,
    "Giá được so sánh với các máy cùng danh mục.",
  );
}

function buildReasons(
  item: RankedCandidate,
  budgetMax: number | undefined,
  currencyCode: string,
) {
  const topSignals = [...item.breakdown]
    .filter((signal) => signal.source !== "missing")
    .sort(
      (left, right) => right.weight - left.weight || right.score - left.score,
    )
    .slice(0, 3)
    .map((signal) => `${signal.label}: ${signal.evidence}`);
  if (budgetMax !== undefined && item.price !== null) {
    topSignals.unshift(
      `Trong ngân sách: ${formatMoney(item.price, currencyCode)} / ${formatMoney(budgetMax, currencyCode)}.`,
    );
  }
  if (item.matchedRequirements.length) {
    topSignals.push(`Đáp ứng: ${item.matchedRequirements.join(", ")}.`);
  }
  return topSignals.slice(0, 4);
}

function buildTradeOffs(
  item: RankedCandidate,
  budgetMax: number | undefined,
  currencyCode: string,
) {
  const tradeOffs: string[] = [];
  if (item.coverage < 70) {
    tradeOffs.push(
      `Độ phủ dữ liệu hiện ở mức ${round(item.coverage)}%; nên mở trang chi tiết để kiểm tra thêm.`,
    );
  }
  if (
    budgetMax !== undefined &&
    item.price !== null &&
    item.price / budgetMax > 0.9
  ) {
    tradeOffs.push(
      `Giá ${formatMoney(item.price, currencyCode)} khá sát trần ngân sách.`,
    );
  }
  const weak = [...item.breakdown]
    .filter((signal) => signal.source !== "missing" && signal.score < 55)
    .sort((left, right) => right.weight - left.weight)[0];
  if (weak)
    tradeOffs.push(
      `${weak.label} chưa phải thế mạnh nổi bật (${round(weak.score)}/100).`,
    );
  if (item.price === null)
    tradeOffs.push("Catalog chưa có giá ra mắt cho phiên bản này.");
  return tradeOffs.slice(0, 2);
}

function maxStorage(variant: RecommendationVariant) {
  const values = variant.variant_storage_configs.map(
    (item) => item.total_capacity_gb,
  );
  return values.length ? Math.max(...values) : null;
}

function lightweightThreshold(categorySlug: string) {
  if (categorySlug.includes("laptop") || categorySlug.includes("notebook"))
    return 1_500;
  if (categorySlug.includes("tablet")) return 550;
  if (categorySlug.includes("watch")) return 55;
  if (categorySlug.includes("phone") || categorySlug.includes("smartphone"))
    return 190;
  return 1_000;
}

function operatingSystemLabel(value: DeviceOperatingSystem) {
  return {
    any: "Bất kỳ",
    android: "Android",
    ios: "iOS",
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
  }[value];
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : value.toNumber();
}

function specification(score: number, evidence: string): Signal {
  return { score: round(clamp(score)), evidence, source: "specification" };
}

function missingSignal(evidence: string): Signal {
  return { score: 50, evidence, source: "missing" };
}

function normalize(value: number, minimum: number, maximum: number) {
  return clamp(((value - minimum) / Math.max(maximum - minimum, 1)) * 100);
}

function average(values: number[]) {
  return (
    values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
  );
}

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function compareNullableNumbers(left: number | null, right: number | null) {
  return (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER);
}

function confidenceLabel(coverage: number) {
  if (coverage >= 80) return "high" as const;
  if (coverage >= 55) return "medium" as const;
  return "low" as const;
}

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString("vi-VN")} ${currencyCode}`;
  }
}
