import type { PrismaClient } from "../../generated/client";
import {
  calculateScorecard,
  normalizeMetric,
  type RawMetric,
  type RawMetricBag,
} from "./scoring-engine";
import { SCORECARD_VERSION, SCORING_PROFILES } from "./scoring-profiles";

const SCORECARD_RATIONALE =
  "Điểm tổng hợp theo loại sản phẩm từ benchmark và thông số đã chuẩn hóa về 0–100. Mọi tiêu chí trong hồ sơ đều có đầu vào; chỉ số chưa có dữ liệu đo trực tiếp dùng mốc tham chiếu trung tính 50 và được đánh dấu rõ. Benchmark gốc luôn được giữ nguyên.";

export async function seedVariantScorecards(prisma: PrismaClient) {
  const variants = await prisma.device_variants.findMany({
    where: { deleted_at: null, device_model: { deleted_at: null } },
    select: {
      id: true,
      variant_name: true,
      device_model: {
        select: {
          name: true,
          description: true,
          release_date: true,
          product_family: {
            select: {
              device_category: { select: { slug: true } },
            },
          },
        },
      },
      device_variant_benchmarks: {
        select: {
          score: true,
          subscore_name: true,
          benchmark: {
            select: {
              name: true,
              slug: true,
              benchmark_type: true,
              version: true,
            },
          },
          benchmark_run: {
            select: { is_thermal_throttled: true },
          },
        },
      },
      variant_score_metric_inputs: {
        select: {
          metric_key: true,
          raw_value: true,
          unit: true,
          normalized_score: true,
          source_label: true,
        },
      },
      variant_physical_specs: true,
      variant_io_specs: true,
      variant_thermal_specs: true,
      variant_chipsets: {
        select: {
          is_primary: true,
          chipset: {
            select: {
              name: true,
              process_node: { select: { node_nm: true } },
            },
          },
        },
      },
      variant_cpus: {
        select: {
          is_primary: true,
          cpu: {
            select: {
              core_count: true,
              thread_count: true,
              cpu_clusters: {
                select: { clock_ghz: true, core_count: true },
              },
            },
          },
        },
      },
      variant_gpus: {
        select: {
          is_primary: true,
          gpu: {
            select: {
              name: true,
              shader_units: true,
              compute_units: true,
              clock_mhz: true,
              fp32_gflops: true,
              ray_tracing_support: true,
            },
          },
        },
      },
      variant_npus: {
        select: {
          is_primary: true,
          npu: {
            select: { name: true, tops: true, tops_int4: true },
          },
        },
      },
      variant_displays: {
        select: {
          display_order: true,
          display_unit: {
            select: {
              size_inch: true,
              resolution_width: true,
              resolution_height: true,
              pixel_density_ppi: true,
              refresh_rate_hz: true,
              touch_sampling_hz: true,
              brightness_typical_nits: true,
              brightness_hbm_nits: true,
              brightness_peak_nits: true,
              contrast_ratio: true,
              color_depth_bits: true,
              color_gamut: true,
              hdr_formats: true,
              has_dc_dimming: true,
              pwm_frequency_hz: true,
              display_technology: {
                select: { name: true, slug: true },
              },
            },
          },
        },
        orderBy: [{ display_order: "asc" }],
      },
      variant_batteries: {
        select: {
          is_primary: true,
          battery_unit: {
            select: {
              capacity_mah: true,
              energy_wh: true,
              cycle_life: true,
              wired_charging_w: true,
              wireless_charging_w: true,
              removable: true,
              battery_chemistry: {
                select: { name: true, slug: true },
              },
            },
          },
        },
      },
      variant_camera_modules: {
        select: {
          role: true,
          position: true,
          is_primary: true,
          camera_module: {
            select: {
              effective_megapixel: true,
              aperture: true,
              optical_zoom: true,
              has_ois: true,
              has_af: true,
              video_capabilities: true,
              camera_role: { select: { code: true } },
              camera_module_sensor_links: {
                select: {
                  is_primary: true,
                  camera_sensor: {
                    select: {
                      pixel_size_um: true,
                      supports_stacked: true,
                      supports_hdr: true,
                      max_video_fps: true,
                      max_video_resolution: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      variant_memory_configs: {
        select: {
          capacity_gb: true,
          speed_mhz: true,
          bandwidth_gbps: true,
          notes: true,
          memory_standard: {
            select: {
              name: true,
              max_data_rate_mtps: true,
              typical_data_rate_mtps: true,
              bandwidth_gbps: true,
            },
          },
        },
      },
      variant_storage_configs: {
        select: {
          total_capacity_gb: true,
          is_expandable: true,
          expansion_max_gb: true,
          storage_standard: {
            select: {
              name: true,
              sequential_read_mbps: true,
              sequential_write_mbps: true,
              random_read_iops: true,
              random_write_iops: true,
            },
          },
        },
      },
      variant_operating_systems: {
        select: {
          is_default: true,
          promised_major_updates: true,
          promised_security_years: true,
          notes: true,
          os_version: {
            select: {
              release_date: true,
              is_lts: true,
              operating_system: {
                select: {
                  name: true,
                  is_open_source: true,
                },
              },
            },
          },
          ui_layer_version: {
            select: { version_name: true },
          },
        },
      },
      variant_cellular_band_support: { select: { id: true } },
      variant_certifications: {
        select: {
          rating_value: true,
          certification: {
            select: {
              name: true,
              slug: true,
              certification_type: true,
            },
          },
        },
      },
      variant_software_features: {
        select: {
          level_or_tier: true,
          notes: true,
          software_feature: {
            select: {
              code: true,
              name: true,
              feature_category: true,
            },
          },
        },
      },
      device_variant_features: {
        select: {
          value_text: true,
          value_number: true,
          value_boolean: true,
          note: true,
          feature_definition: {
            select: {
              code: true,
              name: true,
              feature_group: true,
            },
          },
        },
      },
    },
  });

  let scorecardCount = 0;
  let moduleScoreCount = 0;

  for (const variant of variants) {
    const categorySlug =
      variant.device_model.product_family.device_category.slug;
    const profile = SCORING_PROFILES[categorySlug];
    if (!profile) {
      throw new Error(`Chưa có scoring profile cho ${categorySlug}.`);
    }

    const rawMetrics = extractRawMetrics(variant, categorySlug);
    for (const input of variant.variant_score_metric_inputs) {
      rawMetrics[input.metric_key] = {
        value: Number(input.raw_value),
        unit: input.unit ?? undefined,
        source: "manual",
        sourceLabel:
          input.source_label?.trim() ||
          "Giá trị do quản trị viên nhập trong hồ sơ thiết bị",
        normalizedScore:
          input.normalized_score == null
            ? undefined
            : Number(input.normalized_score),
      };
    }
    const calculated = calculateScorecard(profile, rawMetrics);
    const scorecard = await prisma.variant_scorecards.upsert({
      where: {
        device_variant_id_score_version: {
          device_variant_id: variant.id,
          score_version: SCORECARD_VERSION,
        },
      },
      update: {
        category_slug: categorySlug,
        overall_score: calculated.overallScore,
        coverage_percent: calculated.coverage,
        score_source: calculated.source,
        raw_metric_count: calculated.rawMetricCount,
        rationale: SCORECARD_RATIONALE,
        factors: {
          normalization: "min_max_with_log_for_wide_distributions",
          missing_data_policy: "category_reference_prior_50_full_coverage",
          coverage_definition: "required_scoring_inputs",
          observed_metric_count: calculated.observedMetricCount,
          reference_metric_count: calculated.referenceMetricCount,
          profile_label: profile.label,
          module_weights: Object.fromEntries(
            profile.modules.map((item) => [item.key, item.weight]),
          ),
        },
        calculated_at: new Date(),
      },
      create: {
        device_variant_id: variant.id,
        category_slug: categorySlug,
        score_version: SCORECARD_VERSION,
        overall_score: calculated.overallScore,
        coverage_percent: calculated.coverage,
        score_source: calculated.source,
        raw_metric_count: calculated.rawMetricCount,
        rationale: SCORECARD_RATIONALE,
        factors: {
          normalization: "min_max_with_log_for_wide_distributions",
          missing_data_policy: "category_reference_prior_50_full_coverage",
          coverage_definition: "required_scoring_inputs",
          observed_metric_count: calculated.observedMetricCount,
          reference_metric_count: calculated.referenceMetricCount,
          profile_label: profile.label,
          module_weights: Object.fromEntries(
            profile.modules.map((item) => [item.key, item.weight]),
          ),
        },
      },
    });

    await prisma.variant_scorecard_modules.deleteMany({
      where: { scorecard_id: scorecard.id },
    });
    await prisma.variant_scorecard_modules.createMany({
      data: calculated.modules.map((item) => ({
        scorecard_id: scorecard.id,
        module_key: item.key,
        module_name: item.label,
        score: item.score,
        weight_percent: item.weight,
        coverage_percent: item.coverage,
        rationale: item.description,
        raw_metrics: item.metrics,
      })),
    });

    scorecardCount += 1;
    moduleScoreCount += calculated.modules.length;
  }

  const uncovered = await prisma.device_variants.count({
    where: {
      deleted_at: null,
      device_model: { deleted_at: null },
      variant_scorecards: {
        none: { score_version: SCORECARD_VERSION },
      },
    },
  });
  if (uncovered) {
    throw new Error(
      `Vẫn còn ${uncovered} phiên bản chưa có scorecard ${SCORECARD_VERSION}.`,
    );
  }

  await prisma.variant_scorecards.deleteMany({
    where: {
      score_version: "category-scorecard-v3.0.0",
    },
  });

  return { scorecardCount, moduleScoreCount };
}

type ScoreVariant = Record<string, unknown>;

function extractRawMetrics(
  variant: ScoreVariant,
  categorySlug: string,
): RawMetricBag {
  const value = variant as Record<string, any>;
  const metrics: RawMetricBag = {};
  const put = (
    key: string,
    rawValue: unknown,
    unit: string | undefined,
    source: RawMetric["source"],
    sourceLabel: string,
    normalizedScore?: number,
  ) => {
    const numericValue = number(rawValue);
    if (numericValue === undefined) return;
    metrics[key] = {
      value: numericValue,
      unit,
      source,
      sourceLabel,
      normalizedScore,
    };
  };

  const benchmarks = (value.device_variant_benchmarks ?? []) as Array<any>;
  const benchmark = (predicate: (item: any) => boolean): any | undefined =>
    [...benchmarks].filter(predicate).sort((left, right) => {
      const leftReference = String(left.benchmark.slug).includes("reference");
      const rightReference = String(right.benchmark.slug).includes("reference");
      return Number(leftReference) - Number(rightReference);
    })[0];
  const cpuSingle = benchmark(
    (item) => normalizeKey(item.subscore_name) === "single_core",
  );
  const cpuMulti = benchmark(
    (item) => normalizeKey(item.subscore_name) === "multi_core",
  );
  if (cpuSingle) {
    put(
      "cpu_single",
      cpuSingle.score,
      "điểm",
      "benchmark",
      benchmarkLabel(cpuSingle),
    );
  }
  if (cpuMulti) {
    put(
      "cpu_multi",
      cpuMulti.score,
      "điểm",
      "benchmark",
      benchmarkLabel(cpuMulti),
    );
  }

  const gpuBenchmark = benchmark(
    (item) => item.benchmark.benchmark_type === "gpu",
  );
  const gpu = preferred(value.variant_gpus)?.gpu;
  const gpuCompute =
    number(gpu?.fp32_gflops) ??
    (number(gpu?.compute_units) && number(gpu?.clock_mhz)
      ? number(gpu.compute_units)! * number(gpu.clock_mhz)!
      : undefined);
  if (gpuBenchmark) {
    const gpuScore = number(gpuBenchmark.score);
    if (gpuScore !== undefined) {
      put(
        "gpu",
        gpuScore,
        "điểm",
        "benchmark",
        benchmarkLabel(gpuBenchmark),
        normalizeMetric(gpuScore, {
          min: 800,
          max: 50000,
          scale: "log",
        }),
      );
    }
  } else if (gpuCompute !== undefined) {
    put(
      "gpu",
      gpuCompute,
      "GFLOPS tham chiếu",
      "specification",
      gpu?.name ?? "Thông số GPU",
      normalizeMetric(gpuCompute, {
        min: 100,
        max: 60000,
        scale: "log",
      }),
    );
  } else if (gpu) {
    const shaderUnits =
      number(gpu.shader_units) ?? number(gpu.compute_units) ?? 1;
    const gpuProfileScore = Math.min(
      82,
      38 +
        normalizeMetric(shaderUnits, {
          min: 1,
          max: 16384,
          scale: "log",
        }) *
          0.32 +
        (gpu.ray_tracing_support ? 12 : 0),
    );
    put(
      "gpu",
      gpuProfileScore,
      "/100",
      "derived",
      `${gpu.name ?? "GPU"} · hồ sơ phần cứng khi chưa có benchmark GPU`,
      gpuProfileScore,
    );
  }
  put(
    "gpu_compute",
    gpuCompute,
    "GFLOPS",
    "specification",
    gpu?.name ?? "Thông số GPU",
  );
  put(
    "ray_tracing",
    booleanNumber(gpu?.ray_tracing_support),
    undefined,
    "specification",
    "Hỗ trợ dò tia phần cứng",
  );

  const npu = preferred(value.variant_npus)?.npu;
  put(
    "npu_tops",
    number(npu?.tops) ?? number(npu?.tops_int4),
    "TOPS",
    "specification",
    npu?.name ?? "Thông số NPU",
  );

  const thermal = value.variant_thermal_specs;
  const throttled = benchmarks
    .map((item) => item.benchmark_run?.is_thermal_throttled)
    .find((item) => typeof item === "boolean");
  const sustained =
    throttled === false
      ? 95
      : throttled === true
        ? 55
        : thermal?.has_active_cooling
          ? 92
          : /vapor|buồng hơi/i.test(thermal?.cooling_type ?? "")
            ? 85
            : /graphite/i.test(thermal?.cooling_type ?? "")
              ? 76
              : 65;
  put(
    "sustained",
    sustained,
    "/100",
    throttled === undefined ? "derived" : "benchmark",
    throttled === undefined
      ? "Thiết kế tản nhiệt"
      : "Trạng thái giới hạn nhiệt trong benchmark",
    sustained,
  );
  put(
    "thermal_design",
    sustained,
    "/100",
    "derived",
    "Kiểu tản nhiệt và làm mát chủ động",
    sustained,
  );
  put(
    "noise_control",
    thermal?.has_active_cooling ? 65 : 95,
    "/100",
    "derived",
    thermal?.has_active_cooling
      ? "Có quạt làm mát chủ động"
      : "Thiết kế không quạt",
    thermal?.has_active_cooling ? 65 : 95,
  );

  const processNode = number(
    preferred(value.variant_chipsets)?.chipset?.process_node?.node_nm,
  );
  if (processNode !== undefined) {
    const efficiency = normalizeMetric(processNode, {
      min: 2,
      max: 14,
      direction: "lower",
      scale: "log",
    });
    put(
      "cpu_efficiency",
      processNode,
      "nm",
      "specification",
      "Tiến trình sản xuất chipset",
      efficiency,
    );
    put(
      "gpu_efficiency",
      processNode,
      "nm",
      "specification",
      "Tiến trình sản xuất chipset",
      efficiency,
    );
  }

  const display = value.variant_displays?.[0]?.display_unit;
  if (display) {
    const brightness =
      number(display.brightness_peak_nits) ??
      number(display.brightness_hbm_nits) ??
      number(display.brightness_typical_nits);
    const ppi =
      number(display.pixel_density_ppi) ??
      calculatePpi(
        number(display.resolution_width),
        number(display.resolution_height),
        number(display.size_inch),
      );
    put(
      "display_brightness",
      brightness,
      "nit",
      "specification",
      "Độ sáng màn hình",
    );
    put(
      "display_refresh",
      display.refresh_rate_hz,
      "Hz",
      "specification",
      "Tần số quét màn hình",
    );
    put(
      "display_ppi",
      ppi,
      "ppi",
      "derived",
      "Độ phân giải và kích thước màn hình",
    );
    put(
      "display_size",
      display.size_inch,
      "inch",
      "specification",
      "Kích thước màn hình",
    );
    const displayTech = String(display.display_technology?.slug ?? "");
    const colorScore =
      (number(display.color_depth_bits) ?? 8) >= 10
        ? 95
        : display.color_gamut
          ? 84
          : 65;
    put(
      "display_color",
      colorScore,
      "/100",
      "derived",
      "Độ sâu màu và dải màu",
      colorScore,
    );
    put(
      "display_hdr",
      display.hdr_formats ? 1 : 0,
      undefined,
      "feature",
      display.hdr_formats || "Không ghi nhận HDR",
    );
    const eyeComfort = display.has_dc_dimming
      ? 100
      : number(display.pwm_frequency_hz)
        ? normalizeMetric(number(display.pwm_frequency_hz)!, {
            min: 120,
            max: 3840,
            scale: "log",
          })
        : /e-ink|eink/i.test(displayTech)
          ? 100
          : 60;
    put(
      "display_eye_comfort",
      eyeComfort,
      "/100",
      "derived",
      "DC dimming, PWM hoặc công nghệ mực điện tử",
      eyeComfort,
    );
    const panelScore = /oled/.test(displayTech)
      ? 95
      : /mini-led|mini_led/.test(displayTech)
        ? 90
        : /e-ink|eink/.test(displayTech)
          ? 92
          : 68;
    put(
      "panel_quality",
      panelScore,
      "/100",
      "derived",
      display.display_technology?.name ?? "Công nghệ tấm nền",
      panelScore,
    );
    const contrastScore = /oled|e-ink|eink/.test(displayTech)
      ? 100
      : display.contrast_ratio
        ? 82
        : 62;
    put(
      "display_contrast",
      contrastScore,
      "/100",
      "derived",
      "Công nghệ tấm nền và tương phản",
      contrastScore,
    );
    put(
      "display_response",
      display.touch_sampling_hz ? 85 : display.refresh_rate_hz >= 120 ? 78 : 60,
      "/100",
      "derived",
      "Tần số quét và tốc độ lấy mẫu cảm ứng",
      display.touch_sampling_hz ? 85 : display.refresh_rate_hz >= 120 ? 78 : 60,
    );
  }

  const cameraScores = new Map<string, number[]>();
  const videoScores: number[] = [];
  for (const cameraLink of value.variant_camera_modules ?? []) {
    const camera = cameraLink.camera_module;
    const cameraScore = calculateCameraScore(camera);
    const role = normalizeCameraRole(
      cameraLink.role || camera?.camera_role?.code || cameraLink.position,
    );
    const current = cameraScores.get(role) ?? [];
    current.push(cameraScore);
    cameraScores.set(role, current);
    const videoScore = calculateVideoScore(camera);
    if (videoScore !== undefined) videoScores.push(videoScore);
  }
  for (const [role, scores] of cameraScores) {
    put(
      `camera_${role}`,
      Math.max(...scores),
      "/100",
      "derived",
      `Thông số camera ${role}`,
      Math.max(...scores),
    );
  }
  if (videoScores.length) {
    const video = Math.max(...videoScores);
    put(
      "camera_video",
      video,
      "/100",
      "derived",
      "Khả năng quay phim của hệ thống camera",
      video,
    );
  }

  const battery = preferred(value.variant_batteries)?.battery_unit;
  const batteryBenchmark = benchmark(
    (item) => item.benchmark.benchmark_type === "battery",
  );
  if (batteryBenchmark) {
    put(
      "battery_life",
      batteryBenchmark.score,
      "giờ",
      "benchmark",
      benchmarkLabel(batteryBenchmark),
    );
  }
  if (battery) {
    const chargingSpeed = Math.max(
      number(battery.wired_charging_w) ?? 0,
      number(battery.wireless_charging_w) ?? 0,
    );
    put(
      "charging_speed",
      chargingSpeed || undefined,
      "W",
      "specification",
      "Công suất sạc tối đa",
    );
    put(
      "battery_capacity_wh",
      battery.energy_wh,
      "Wh",
      "specification",
      "Năng lượng danh định",
    );
    const energyWh =
      number(battery.energy_wh) ??
      (number(battery.capacity_mah)
        ? (number(battery.capacity_mah)! * 3.85) / 1000
        : undefined);
    if (chargingSpeed && energyWh) {
      put(
        "charging_efficiency",
        chargingSpeed / energyWh,
        "W/Wh",
        "derived",
        "Tỷ lệ công suất sạc trên năng lượng pin",
      );
    }
    const batteryHealth = battery.cycle_life
      ? normalizeMetric(number(battery.cycle_life)!, {
          min: 500,
          max: 2000,
        })
      : battery.removable
        ? 90
        : battery.battery_chemistry
          ? 72
          : undefined;
    put(
      "battery_health",
      batteryHealth,
      "/100",
      "derived",
      battery.cycle_life
        ? "Chu kỳ sạc công bố"
        : "Hóa học pin và khả năng thay thế",
      batteryHealth,
    );
  }

  const memory = value.variant_memory_configs?.[0];
  if (memory) {
    put(
      "memory_capacity",
      memory.capacity_gb,
      "GB",
      "specification",
      "Dung lượng RAM",
    );
    put(
      "memory_speed",
      memory.speed_mhz ??
        memory.memory_standard?.typical_data_rate_mtps ??
        memory.memory_standard?.max_data_rate_mtps,
      "MT/s",
      "specification",
      memory.memory_standard?.name ?? "Chuẩn RAM",
    );
    put(
      "memory_bandwidth",
      memory.bandwidth_gbps ?? memory.memory_standard?.bandwidth_gbps,
      "GB/s",
      "specification",
      "Băng thông bộ nhớ",
    );
  }
  const storage = value.variant_storage_configs?.[0];
  if (storage) {
    put(
      "storage_capacity",
      storage.total_capacity_gb,
      "GB",
      "specification",
      "Dung lượng lưu trữ",
    );
    put(
      "storage_read",
      storage.storage_standard?.sequential_read_mbps,
      "MB/s",
      "specification",
      storage.storage_standard?.name ?? "Chuẩn lưu trữ",
    );
    put(
      "storage_write",
      storage.storage_standard?.sequential_write_mbps,
      "MB/s",
      "specification",
      storage.storage_standard?.name ?? "Chuẩn lưu trữ",
    );
    put(
      "storage_iops",
      Math.max(
        number(storage.storage_standard?.random_read_iops) ?? 0,
        number(storage.storage_standard?.random_write_iops) ?? 0,
      ) || undefined,
      "IOPS",
      "specification",
      storage.storage_standard?.name ?? "Chuẩn lưu trữ",
    );
    const upgradeability =
      storage.is_expandable ||
      /upgrade|replace|socket|sodimm/i.test(memory?.notes ?? "")
        ? 100
        : categorySlug === "laptop"
          ? 45
          : 20;
    put(
      "upgradeability",
      upgradeability,
      "/100",
      "derived",
      "Khả năng mở rộng RAM hoặc lưu trữ",
      upgradeability,
    );
  }

  const physical = value.variant_physical_specs;
  if (physical) {
    const materialScore = materialQuality(
      [physical.frame_material, physical.back_material]
        .filter(Boolean)
        .join(" "),
    );
    put(
      "material_quality",
      materialScore,
      "/100",
      "derived",
      [physical.frame_material, physical.back_material]
        .filter(Boolean)
        .join(" · ") || "Vật liệu thân máy",
      materialScore,
    );
    const [weightMin, weightMax] = weightRange(categorySlug);
    const weight = number(physical.weight_g);
    if (weight !== undefined) {
      const weightScore = normalizeMetric(weight, {
        min: weightMin,
        max: weightMax,
        direction: "lower",
        scale: "log",
      });
      put(
        "weight_score",
        weight,
        "g",
        "specification",
        "Trọng lượng thiết bị",
        weightScore,
      );
    }
    const thickness = number(
      physical.thickness_mm ?? physical.thickness_max_mm,
    );
    if (thickness !== undefined) {
      const [thinMin, thinMax] = thicknessRange(categorySlug);
      const thinnessScore = normalizeMetric(thickness, {
        min: thinMin,
        max: thinMax,
        direction: "lower",
      });
      put(
        "thinness_score",
        thickness,
        "mm",
        "specification",
        "Độ dày thiết bị",
        thinnessScore,
      );
    }
    const ipScore = ingressProtectionScore(physical.ingress_protection);
    put(
      "ip_rating",
      ipScore,
      "/100",
      "derived",
      physical.ingress_protection ?? "Không có xếp hạng IP",
      ipScore,
    );
    const glassScore = protectionGlassScore(physical.front_glass);
    put(
      "glass_quality",
      glassScore,
      "/100",
      "derived",
      physical.front_glass ?? "Không ghi rõ kính bảo vệ",
      glassScore,
    );
  }

  const io = value.variant_io_specs;
  if (io) {
    put(
      "stereo_audio",
      booleanNumber(io.stereo_speakers),
      undefined,
      "specification",
      "Loa stereo",
    );
    put(
      "speaker_quality",
      io.speaker_count,
      "loa",
      "specification",
      "Số lượng loa",
    );
    put(
      "audio_tuning",
      io.audio_brand_tuning ? 1 : 0,
      undefined,
      "feature",
      io.audio_brand_tuning ?? "Không ghi nhận tinh chỉnh hãng",
    );
    put(
      "headphone_jack",
      booleanNumber(io.headphone_jack),
      undefined,
      "specification",
      "Cổng tai nghe",
    );
    put(
      "esim",
      booleanNumber(io.esim_supported),
      undefined,
      "specification",
      "Hỗ trợ eSIM",
    );
  }

  put(
    "cellular_bands",
    value.variant_cellular_band_support?.length,
    "băng tần",
    "specification",
    "Số băng tần di động",
  );
  put(
    "expansion_ports",
    io?.has_microsd_slot ? 1 : 0,
    undefined,
    "feature",
    "Khe thẻ nhớ",
  );

  const defaultOs =
    value.variant_operating_systems?.find((item: any) => item.is_default) ??
    value.variant_operating_systems?.[0];
  if (defaultOs) {
    const releaseYear = defaultOs.os_version?.release_date
      ? new Date(defaultOs.os_version.release_date).getUTCFullYear()
      : undefined;
    const recency =
      releaseYear === undefined
        ? 65
        : Math.max(20, 100 - Math.max(0, 2026 - releaseYear) * 15);
    put(
      "os_recency",
      recency,
      "/100",
      "derived",
      defaultOs.os_version?.operating_system?.name ?? "Hệ điều hành",
      recency,
    );
    put(
      "update_policy",
      defaultOs.promised_major_updates,
      "bản cập nhật lớn",
      "specification",
      "Chính sách cập nhật hệ điều hành",
    );
    put(
      "security_policy",
      defaultOs.promised_security_years,
      "năm",
      "specification",
      "Chính sách cập nhật bảo mật",
    );
    const uiScore = defaultOs.ui_layer_version ? 85 : 72;
    put(
      "ui_optimization",
      uiScore,
      "/100",
      "derived",
      defaultOs.ui_layer_version
        ? "Có giao diện được tối ưu riêng"
        : "Giao diện hệ điều hành tiêu chuẩn",
      uiScore,
    );
    const openness = defaultOs.os_version?.operating_system?.is_open_source
      ? 90
      : 65;
    put(
      "software_openness",
      openness,
      "/100",
      "derived",
      "Khả năng mở rộng của nền tảng",
      openness,
    );
  }

  const featureText = [
    value.device_model?.name,
    value.device_model?.description,
    value.variant_name,
    io?.notes,
    thermal?.notes,
    ...(value.variant_software_features ?? []).flatMap((item: any) => [
      item.software_feature?.code,
      item.software_feature?.name,
      item.software_feature?.feature_category,
      item.level_or_tier,
      item.notes,
    ]),
    ...(value.device_variant_features ?? []).flatMap((item: any) => [
      item.feature_definition?.code,
      item.feature_definition?.name,
      item.feature_definition?.feature_group,
      item.value_text,
      item.note,
    ]),
  ]
    .filter(Boolean)
    .join(" ");
  const softwareFeatures = value.variant_software_features ?? [];
  const aiFeatures = softwareFeatures.filter((item: any) =>
    /ai|intelligence|trí tuệ/i.test(
      `${item.software_feature?.code} ${item.software_feature?.name} ${item.software_feature?.feature_category}`,
    ),
  ).length;
  const aiScore = Math.min(100, aiFeatures * 20 + (number(npu?.tops) ? 45 : 0));
  put(
    "ai_features",
    aiScore,
    "/100",
    "derived",
    "NPU và tính năng AI phần mềm",
    aiScore,
  );
  const featureCount =
    softwareFeatures.length + (value.device_variant_features?.length ?? 0);
  put(
    "health_features",
    Math.min(100, featureCount * 12),
    "/100",
    "derived",
    "Tính năng sức khỏe đã ghi nhận",
    Math.min(100, featureCount * 12),
  );
  put(
    "fitness_features",
    Math.min(100, featureCount * 10),
    "/100",
    "derived",
    "Tính năng vận động đã ghi nhận",
    Math.min(100, featureCount * 10),
  );
  if (categorySlug === "laptop") {
    const inputScore = /keyboard|touchpad|trackpad|bàn phím/i.test(featureText)
      ? 86
      : 70;
    const repairability =
      storage?.is_expandable ||
      /replace|repair|socket|sodimm|upgrade|nâng cấp|sửa chữa/i.test(
        featureText,
      )
        ? 88
        : 48;
    put(
      "keyboard_touchpad",
      inputScore,
      "/100",
      "derived",
      "Hồ sơ bàn phím và touchpad",
      inputScore,
    );
    put(
      "repairability",
      repairability,
      "/100",
      "derived",
      "Khả năng tiếp cận, thay thế và nâng cấp linh kiện",
      repairability,
    );
  }
  put(
    "gps_support",
    /gps|gnss|galileo|beidou/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Hỗ trợ định vị",
  );
  put(
    "anc_support",
    /\banc\b|noise cancel|chống ồn/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Chống ồn chủ động",
  );
  put(
    "ambient_mode",
    /ambient|transparency|xuyên âm/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Chế độ xuyên âm",
  );
  put(
    "adaptive_audio",
    /adaptive|thích nghi/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Âm thanh thích nghi",
  );
  put(
    "hi_res_audio",
    /hi-res|ldac|lossless|aptx|dolby/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Codec và âm thanh độ phân giải cao",
  );
  put(
    "spatial_audio",
    /spatial|360 audio|âm thanh không gian/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Âm thanh không gian",
  );
  put(
    "multipoint",
    /multipoint|đa điểm/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Kết nối đa điểm",
  );
  put(
    "haptics",
    /haptic|rumble|rung/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Phản hồi rung",
  );
  put(
    "gaming_features",
    Math.min(
      100,
      (/vrr|allm|game mode|chế độ game/i.test(featureText) ? 55 : 0) +
        (number(display?.refresh_rate_hz) &&
        number(display.refresh_rate_hz)! >= 120
          ? 35
          : 0),
    ),
    "/100",
    "derived",
    "VRR, ALLM, chế độ trò chơi và tần số quét",
  );
  put(
    "control_features",
    Math.min(100, featureCount * 5),
    "/100",
    "derived",
    "Tính năng điều khiển",
  );
  const documentedAudioFeatures = [
    /\banc\b|noise cancel|chống ồn/i,
    /ambient|transparency|xuyên âm/i,
    /adaptive|thích nghi/i,
    /hi-res|ldac|lossless|aptx|dolby/i,
    /spatial|360 audio|âm thanh không gian/i,
    /multipoint|đa điểm/i,
  ].filter((pattern) => pattern.test(featureText)).length;
  const audioFeatureCount =
    softwareFeatures.filter((item: any) =>
      /audio|sound|âm thanh/i.test(
        `${item.software_feature?.feature_category} ${item.software_feature?.name}`,
      ),
    ).length + documentedAudioFeatures;
  put(
    "audio_feature_count",
    audioFeatureCount,
    "tính năng",
    "feature",
    "Tính năng âm thanh đã ghi nhận trong thông số",
  );
  put(
    "audio_processor",
    value.variant_chipsets?.length ? 80 : 55,
    "/100",
    "derived",
    "Bộ xử lý âm thanh tích hợp",
    value.variant_chipsets?.length ? 80 : 55,
  );
  const hasDocumentedMicrophone = /microphone|\bmic\b|micro/i.test(featureText);
  const microphoneScore = hasDocumentedMicrophone
    ? 80
    : categorySlug === "earbuds"
      ? 60
      : undefined;
  put(
    "microphone_quality",
    microphoneScore,
    "/100",
    hasDocumentedMicrophone ? "feature" : "derived",
    hasDocumentedMicrophone
      ? "Hệ thống microphone được ghi nhận"
      : "Mốc tham chiếu tối thiểu cho tai nghe có microphone",
    microphoneScore,
  );
  put(
    "call_noise_reduction",
    /call noise|voice isolation|lọc ồn cuộc gọi/i.test(featureText) ? 1 : 0,
    undefined,
    "feature",
    "Lọc ồn cuộc gọi",
  );
  put(
    "power_features",
    /power sav|eco|tiết kiệm pin|e-ink|eink/i.test(featureText) ||
      categorySlug === "e-reader"
      ? 90
      : 65,
    "/100",
    "derived",
    "Tính năng quản lý năng lượng",
    /power sav|eco|tiết kiệm pin|e-ink|eink/i.test(featureText) ||
      categorySlug === "e-reader"
      ? 90
      : 65,
  );

  const inputLag = benchmark(
    (item) => item.benchmark.benchmark_type === "latency",
  );
  if (inputLag) {
    put(
      "input_lag",
      inputLag.score,
      "ms",
      "benchmark",
      benchmarkLabel(inputLag),
    );
  }

  return metrics;
}

function preferred(
  items: Array<Record<string, any>> | undefined,
): Record<string, any> | undefined {
  return items?.find((item) => item.is_primary) ?? items?.[0];
}

function number(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanNumber(value: unknown) {
  return typeof value === "boolean" ? Number(value) : undefined;
}

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function benchmarkLabel(item: any) {
  return [
    item.benchmark?.name,
    item.benchmark?.version &&
    !String(item.benchmark?.name).includes(item.benchmark.version)
      ? item.benchmark.version
      : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function calculatePpi(
  width: number | undefined,
  height: number | undefined,
  size: number | undefined,
) {
  if (!width || !height || !size) return undefined;
  return Math.round(Math.sqrt(width ** 2 + height ** 2) / size);
}

function calculateCameraScore(camera: any) {
  const values: Array<{ score: number; weight: number }> = [];
  const megapixel = number(camera?.effective_megapixel);
  if (megapixel !== undefined) {
    values.push({
      score: normalizeMetric(megapixel, {
        min: 8,
        max: 200,
        scale: "log",
      }),
      weight: 25,
    });
  }
  const aperture = number(String(camera?.aperture ?? "").replace(/^f\/?/i, ""));
  if (aperture !== undefined) {
    values.push({
      score: normalizeMetric(aperture, {
        min: 1.4,
        max: 3.5,
        direction: "lower",
      }),
      weight: 15,
    });
  }
  values.push({ score: camera?.has_ois ? 100 : 45, weight: 15 });
  values.push({ score: camera?.has_af ? 100 : 50, weight: 10 });
  const sensor =
    camera?.camera_module_sensor_links?.find((item: any) => item.is_primary)
      ?.camera_sensor ?? camera?.camera_module_sensor_links?.[0]?.camera_sensor;
  if (sensor) {
    const pixelSize = number(sensor.pixel_size_um);
    if (pixelSize !== undefined) {
      values.push({
        score: normalizeMetric(pixelSize, { min: 0.6, max: 2.4 }),
        weight: 15,
      });
    }
    values.push({
      score:
        (sensor.supports_stacked ? 50 : 25) + (sensor.supports_hdr ? 50 : 25),
      weight: 10,
    });
  }
  const video = calculateVideoScore(camera);
  if (video !== undefined) values.push({ score: video, weight: 10 });
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  return totalWeight
    ? Math.round(
        (values.reduce((sum, item) => sum + item.score * item.weight, 0) /
          totalWeight) *
          10,
      ) / 10
    : 0;
}

function calculateVideoScore(camera: any) {
  const text = [
    camera?.video_capabilities,
    ...(camera?.camera_module_sensor_links ?? []).flatMap((item: any) => [
      item.camera_sensor?.max_video_resolution,
      item.camera_sensor?.max_video_fps,
    ]),
  ]
    .filter(Boolean)
    .join(" ");
  if (!text) return undefined;
  if (/8k/i.test(text)) return 100;
  if (/4k/i.test(text)) return /120|240/.test(text) ? 95 : 85;
  if (/1080|full hd/i.test(text)) return 65;
  return 45;
}

function normalizeCameraRole(value: unknown) {
  const role = normalizeKey(value);
  if (/ultra/.test(role)) return "ultrawide";
  if (/tele|zoom|periscope/.test(role)) return "telephoto";
  if (/selfie|front/.test(role)) return "selfie";
  return "main";
}

function materialQuality(value: string) {
  if (/titanium/i.test(value)) return 100;
  if (/magnesium|carbon/i.test(value)) return 94;
  if (/alumin|kim loại|metal/i.test(value)) return 88;
  if (/stainless|steel|thép/i.test(value)) return 84;
  if (/glass|kính/i.test(value)) return 76;
  if (/plastic|polycarbonate|nhựa/i.test(value)) return 58;
  return 65;
}

function weightRange(categorySlug: string): [number, number] {
  const ranges: Record<string, [number, number]> = {
    smartphone: [130, 280],
    tablet: [250, 900],
    laptop: [800, 3500],
    smartwatch: [20, 110],
    earbuds: [4, 90],
    television: [8000, 60000],
    "gaming-handheld": [200, 1000],
    "e-reader": [120, 500],
  };
  return ranges[categorySlug] ?? [100, 3000];
}

function thicknessRange(categorySlug: string): [number, number] {
  const ranges: Record<string, [number, number]> = {
    smartphone: [5, 15],
    tablet: [4, 12],
    laptop: [8, 35],
    smartwatch: [7, 18],
    earbuds: [10, 35],
    television: [20, 100],
    "gaming-handheld": [15, 60],
    "e-reader": [4, 14],
  };
  return ranges[categorySlug] ?? [4, 40];
}

function ingressProtectionScore(value: unknown) {
  const rating = String(value ?? "").toUpperCase();
  if (/IP6[89]/.test(rating)) return 100;
  if (/IP6[67]/.test(rating)) return 92;
  if (/IPX8/.test(rating)) return 88;
  if (/IP5[67]/.test(rating)) return 80;
  if (/IP54|IP55/.test(rating)) return 68;
  if (/IPX4/.test(rating)) return 58;
  return rating ? 50 : 25;
}

function protectionGlassScore(value: unknown) {
  const glass = String(value ?? "");
  if (/victus\s*2|ceramic shield/i.test(glass)) return 100;
  if (/victus/i.test(glass)) return 92;
  if (/gorilla|dragontrail/i.test(glass)) return 78;
  if (/glass|kính/i.test(glass)) return 65;
  return 40;
}

function extractVersion(value: unknown) {
  const match = String(value ?? "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
}
