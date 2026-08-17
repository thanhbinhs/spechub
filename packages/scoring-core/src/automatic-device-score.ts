import {
  normalizeMetric,
  type RawMetric,
  type RawMetricBag,
} from "./scoring-engine";

export const AUTOMATIC_DEVICE_SCORE_VERSION = "automatic-device-score-v1.0.0";

export const AUTOMATIC_DEVICE_SCORE_RATIONALE =
  "Điểm được hệ thống tự động tổng hợp từ benchmark đã xác minh, thông số phần cứng, đặc tính thiết bị và chính sách phần mềm. Người tạo thiết bị không nhập điểm 0–100 thủ công; dữ liệu còn thiếu dùng mốc tham chiếu trung tính và luôn được ghi rõ nguồn.";

/**
 * Converts a fully composed device variant into the normalized inputs consumed
 * by the category scorecard. The input deliberately stays structural so both
 * Prisma and API projections can use the same scoring standard.
 */
export function extractAutomaticDeviceMetrics(
  variant: Record<string, any>,
  categorySlug: string,
  currentYear = new Date().getUTCFullYear(),
): RawMetricBag {
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

  const chipset = preferred(variant.variant_chipsets)?.chipset;
  const cpu =
    preferred(variant.variant_cpus)?.cpu ??
    preferred(chipset?.chipset_cpu_links)?.cpu;
  const gpu =
    preferred(variant.variant_gpus)?.gpu ??
    preferred(chipset?.chipset_gpu_links)?.gpu;
  const npu =
    preferred(variant.variant_npus)?.npu ??
    preferred(chipset?.chipset_npu_links)?.npu;
  const modem =
    preferred(variant.variant_modems)?.modem ??
    preferred(chipset?.chipset_modem_links)?.modem;

  const benchmarks = [
    ...(variant.device_variant_benchmarks ?? []),
    ...(chipset?.chipset_benchmarks ?? []),
    ...(cpu?.cpu_benchmarks ?? []),
    ...(gpu?.gpu_benchmarks ?? []),
    ...(npu?.npu_benchmarks ?? []),
  ];
  const benchmark = (predicate: (item: any) => boolean) =>
    [...benchmarks]
      .filter(predicate)
      .sort(
        (left, right) =>
          Number(String(left.benchmark?.slug ?? "").includes("reference")) -
          Number(String(right.benchmark?.slug ?? "").includes("reference")),
      )[0];
  const cpuSingle = benchmark((item) =>
    /single[_\s-]?core|đơn[_\s-]?nhân/i.test(`${item.subscore_name ?? ""}`),
  );
  const cpuMulti = benchmark((item) =>
    /multi[_\s-]?core|đa[_\s-]?nhân/i.test(`${item.subscore_name ?? ""}`),
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

  const maxCpuFrequencyMhz =
    number(cpu?.max_frequency_mhz) ??
    Math.max(
      0,
      ...(cpu?.cpu_clusters ?? []).map(
        (cluster: any) => (number(cluster.clock_ghz) ?? 0) * 1000,
      ),
    );
  if (!metrics.cpu_single && maxCpuFrequencyMhz) {
    const score = normalizeMetric(maxCpuFrequencyMhz, {
      min: 1200,
      max: 5000,
      scale: "log",
    });
    put(
      "cpu_single",
      maxCpuFrequencyMhz,
      "MHz",
      "derived",
      `${cpu?.name ?? "CPU"} · xung tối đa`,
      score,
    );
  }
  const cpuThroughput = (cpu?.cpu_clusters ?? []).length
    ? (cpu.cpu_clusters as any[]).reduce(
        (total, cluster) =>
          total +
          (number(cluster.core_count) ?? 0) * (number(cluster.clock_ghz) ?? 0),
        0,
      )
    : (number(cpu?.core_count) ?? 0) * (maxCpuFrequencyMhz / 1000);
  if (!metrics.cpu_multi && cpuThroughput) {
    const score = normalizeMetric(cpuThroughput, {
      min: 2,
      max: 64,
      scale: "log",
    });
    put(
      "cpu_multi",
      cpuThroughput,
      "core·GHz",
      "derived",
      `${cpu?.name ?? "CPU"} · số nhân và xung`,
      score,
    );
  }

  const gpuBenchmark = benchmark(
    (item) =>
      item.benchmark?.benchmark_type === "gpu" ||
      /gpu|graphics|đồ[_\s-]?họa/i.test(`${item.subscore_name ?? ""}`),
  );
  const gpuCompute =
    number(gpu?.fp32_gflops) ??
    (number(gpu?.compute_units) && number(gpu?.clock_mhz)
      ? number(gpu.compute_units)! * number(gpu.clock_mhz)!
      : undefined);
  if (gpuBenchmark) {
    const raw = number(gpuBenchmark.score);
    put(
      "gpu",
      raw,
      "điểm",
      "benchmark",
      benchmarkLabel(gpuBenchmark),
      raw === undefined
        ? undefined
        : normalizeMetric(raw, { min: 800, max: 50000, scale: "log" }),
    );
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
    const score = Math.min(
      92,
      38 +
        normalizeMetric(shaderUnits, {
          min: 1,
          max: 16384,
          scale: "log",
        }) *
          0.42 +
        (gpu.ray_tracing_support ? 12 : 0),
    );
    put(
      "gpu",
      score,
      "/100",
      "derived",
      `${gpu.name ?? "GPU"} · hồ sơ phần cứng`,
      score,
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
    "feature",
    "Hỗ trợ dò tia phần cứng",
  );

  const npuBenchmark = benchmark(
    (item) =>
      item.benchmark?.benchmark_type === "npu" ||
      /npu|ai/i.test(`${item.subscore_name ?? ""}`),
  );
  if (npuBenchmark) {
    const raw = number(npuBenchmark.score);
    put(
      "npu_tops",
      raw,
      "điểm",
      "benchmark",
      benchmarkLabel(npuBenchmark),
      raw === undefined
        ? undefined
        : normalizeMetric(raw, { min: 100, max: 100000, scale: "log" }),
    );
  } else {
    put(
      "npu_tops",
      number(npu?.tops) ?? number(npu?.tops_int8) ?? number(npu?.tops_int4),
      "TOPS",
      "specification",
      npu?.name ?? "Thông số NPU",
    );
  }

  const thermal = variant.variant_thermal_specs;
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
            ? 84
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
  const noiseControl = thermal?.has_active_cooling ? 65 : 95;
  put(
    "noise_control",
    noiseControl,
    "/100",
    "derived",
    thermal?.has_active_cooling ? "Có quạt chủ động" : "Thiết kế không quạt",
    noiseControl,
  );

  const processNode = number(chipset?.process_node?.node_nm);
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

  const display = variant.variant_displays?.[0]?.display_unit;
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
    const technology = String(display.display_technology?.slug ?? "");
    const colorScore =
      (number(display.color_depth_bits) ?? 8) >= 10
        ? 95
        : display.color_gamut || display.color_gamuts?.length
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
    const hasHdr = Boolean(display.hdr_formats || display.hdr_support?.length);
    put(
      "display_hdr",
      Number(hasHdr),
      undefined,
      "feature",
      hasHdr ? "Có HDR" : "Không ghi nhận HDR",
    );
    const eyeComfort = display.has_dc_dimming
      ? 100
      : number(display.pwm_frequency_hz)
        ? normalizeMetric(number(display.pwm_frequency_hz)!, {
            min: 120,
            max: 3840,
            scale: "log",
          })
        : /e-ink|eink/i.test(technology)
          ? 100
          : 60;
    put(
      "display_eye_comfort",
      eyeComfort,
      "/100",
      "derived",
      "DC dimming, PWM và công nghệ tấm nền",
      eyeComfort,
    );
    const panelScore = /oled/.test(technology)
      ? 95
      : /mini-led|mini_led/.test(technology)
        ? 90
        : /e-ink|eink/.test(technology)
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
    const contrastScore = /oled|e-ink|eink/.test(technology)
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
    const responseScore = display.touch_sampling_hz
      ? 85
      : number(display.refresh_rate_hz) &&
          number(display.refresh_rate_hz)! >= 120
        ? 78
        : 60;
    put(
      "display_response",
      responseScore,
      "/100",
      "derived",
      "Tần số quét và lấy mẫu cảm ứng",
      responseScore,
    );
  }

  const cameraScores = new Map<string, number[]>();
  const videoScores: number[] = [];
  const cameraLinks = (variant.variant_camera_systems ?? []).flatMap(
    (system: any) => system.variant_camera_modules ?? [],
  );
  for (const cameraLink of cameraLinks) {
    const camera = cameraLink.camera_module;
    const role = normalizeCameraRole(cameraLink.role || cameraLink.position);
    const score = calculateCameraScore(camera);
    cameraScores.set(role, [...(cameraScores.get(role) ?? []), score]);
    const video = calculateVideoScore(camera);
    if (video !== undefined) videoScores.push(video);
  }
  for (const [role, scores] of cameraScores) {
    const score = Math.max(...scores);
    put(
      `camera_${role}`,
      score,
      "/100",
      "derived",
      `Thông số camera ${role}`,
      score,
    );
  }
  if (videoScores.length) {
    const score = Math.max(...videoScores);
    put("camera_video", score, "/100", "derived", "Khả năng quay phim", score);
  }

  const battery = preferred(variant.variant_batteries)?.battery_unit;
  const batteryBenchmark = benchmark(
    (item) => item.benchmark?.benchmark_type === "battery",
  );
  if (batteryBenchmark) {
    put(
      "battery_life",
      batteryBenchmark.score,
      "giờ",
      "benchmark",
      benchmarkLabel(batteryBenchmark),
    );
  } else if (battery?.capacity_mah) {
    const capacity = number(battery.capacity_mah)!;
    const score = normalizeMetric(capacity, {
      min: categorySlug === "smartwatch" ? 150 : 2500,
      max: categorySlug === "smartwatch" ? 800 : 7000,
      scale: "log",
    });
    put(
      "battery_life",
      capacity,
      "mAh tham chiếu",
      "derived",
      "Dung lượng pin khi chưa có bài đo thời lượng",
      score,
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
        "Công suất sạc trên năng lượng pin",
      );
    }
    const health = battery.cycle_life
      ? normalizeMetric(number(battery.cycle_life)!, { min: 500, max: 2000 })
      : battery.removable
        ? 90
        : battery.battery_chemistry
          ? 72
          : undefined;
    put(
      "battery_health",
      health,
      "/100",
      "derived",
      "Chu kỳ, hóa học và khả năng thay pin",
      health,
    );
  }

  const memories = variant.variant_memory_configs ?? [];
  const memory = highest(memories, "capacity_gb");
  if (memory) {
    put(
      "memory_capacity",
      memory.capacity_gb,
      "GB",
      "specification",
      "Mức RAM cao nhất của biến thể phần cứng",
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
      "Băng thông RAM",
    );
  }
  const storages = variant.variant_storage_configs ?? [];
  const storage = highest(storages, "total_capacity_gb");
  if (storage) {
    put(
      "storage_capacity",
      storage.total_capacity_gb,
      "GB",
      "specification",
      "Mức lưu trữ cao nhất của biến thể phần cứng",
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
      /upgrade|replace|socket|sodimm|nâng cấp/i.test(memory?.notes ?? "")
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

  const physical = variant.variant_physical_specs;
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
      "Vật liệu thân máy",
      materialScore,
    );
    const weight = number(physical.weight_g);
    if (weight !== undefined) {
      const [min, max] = weightRange(categorySlug);
      const score = normalizeMetric(weight, {
        min,
        max,
        direction: "lower",
        scale: "log",
      });
      put(
        "weight_score",
        weight,
        "g",
        "specification",
        "Trọng lượng thiết bị",
        score,
      );
    }
    const thickness = number(
      physical.thickness_mm ?? physical.thickness_max_mm,
    );
    if (thickness !== undefined) {
      const [min, max] = thicknessRange(categorySlug);
      const score = normalizeMetric(thickness, {
        min,
        max,
        direction: "lower",
      });
      put(
        "thinness_score",
        thickness,
        "mm",
        "specification",
        "Độ dày thiết bị",
        score,
      );
    }
    const ipScore = ingressProtectionScore(physical.ingress_protection);
    put(
      "ip_rating",
      ipScore,
      "/100",
      "derived",
      physical.ingress_protection ?? "Không ghi xếp hạng IP",
      ipScore,
    );
    const glassScore = protectionGlassScore(physical.front_glass);
    put(
      "glass_quality",
      glassScore,
      "/100",
      "derived",
      physical.front_glass ?? "Không ghi kính bảo vệ",
      glassScore,
    );
  }

  const io = variant.variant_io_specs;
  if (io) {
    put(
      "stereo_audio",
      booleanNumber(io.stereo_speakers),
      undefined,
      "feature",
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
      io.audio_brand_tuning ?? "Không ghi tinh chỉnh âm thanh",
    );
    put(
      "headphone_jack",
      booleanNumber(io.headphone_jack),
      undefined,
      "feature",
      "Cổng tai nghe",
    );
    put(
      "esim",
      booleanNumber(io.esim_supported),
      undefined,
      "feature",
      "Hỗ trợ eSIM",
    );
    put(
      "expansion_ports",
      io.has_microsd_slot ? 1 : 0,
      undefined,
      "feature",
      "Khe thẻ nhớ",
    );
  }

  const connectivity = (variant.connectivity_support ?? []).filter(
    (item: any) => item.is_supported !== false,
  );
  const connectivityText = connectivity
    .map(
      (item: any) =>
        `${item.connectivity_feature?.code ?? ""} ${item.connectivity_feature?.name ?? ""} ${item.version ?? ""}`,
    )
    .join(" ");
  const wifiVersion = extractVersion(
    connectivityText.match(/wi-?fi[^,;]*/i)?.[0],
  );
  if (wifiVersion !== undefined) {
    const wifiSpeed =
      wifiVersion >= 7
        ? 46000
        : wifiVersion >= 6
          ? 9600
          : wifiVersion >= 5
            ? 3500
            : 600;
    put(
      "wifi_speed",
      wifiSpeed,
      "Mb/s tham chiếu",
      "derived",
      `Wi‑Fi ${wifiVersion}`,
    );
  }
  const bluetoothVersion = extractVersion(
    connectivityText.match(/bluetooth[^,;]*/i)?.[0],
  );
  put(
    "bluetooth_version",
    bluetoothVersion,
    undefined,
    "specification",
    "Phiên bản Bluetooth",
  );
  const usbVersion = extractVersion(connectivityText.match(/usb[^,;]*/i)?.[0]);
  if (usbVersion !== undefined) {
    const usbSpeed =
      usbVersion >= 4
        ? 40
        : usbVersion >= 3.2
          ? 20
          : usbVersion >= 3
            ? 5
            : 0.48;
    put(
      "usb_speed",
      usbSpeed,
      "Gb/s tham chiếu",
      "derived",
      `USB ${usbVersion}`,
    );
  }
  put(
    "wireless_features",
    connectivity.length,
    "tính năng",
    "specification",
    "Số kết nối không dây đã xác minh",
  );
  put(
    "cellular_bands",
    variant.variant_cellular_band_support?.length,
    "băng tần",
    "specification",
    "Số băng tần di động",
  );
  if (!metrics.cellular_bands && modem) {
    put(
      "cellular_bands",
      modem.supports_5g_nr ? 15 : 8,
      "mức tham chiếu",
      "derived",
      modem.name ?? "Modem tích hợp",
    );
  }

  const defaultOs =
    variant.variant_operating_systems?.find((item: any) => item.is_default) ??
    variant.variant_operating_systems?.[0];
  const software = variant.software_profile;
  const osReleaseDate = defaultOs?.os_version?.release_date;
  const releaseYear = osReleaseDate
    ? new Date(osReleaseDate).getUTCFullYear()
    : undefined;
  if (defaultOs || software) {
    const recency =
      releaseYear === undefined
        ? 70
        : Math.max(20, 100 - Math.max(0, currentYear - releaseYear) * 15);
    put(
      "os_recency",
      recency,
      "/100",
      "derived",
      defaultOs?.os_version?.operating_system?.name ??
        software?.current_os_version?.operating_system?.name ??
        "Hệ điều hành",
      recency,
    );
    put(
      "update_policy",
      software?.promised_major_updates ?? defaultOs?.promised_major_updates,
      "bản cập nhật lớn",
      "specification",
      "Chính sách cập nhật hệ điều hành",
    );
    put(
      "security_policy",
      software?.promised_security_years ?? defaultOs?.promised_security_years,
      "năm",
      "specification",
      "Chính sách bảo mật",
    );
    const uiScore =
      software?.ui_layer_version || defaultOs?.ui_layer_version ? 85 : 72;
    put(
      "ui_optimization",
      uiScore,
      "/100",
      "derived",
      "Giao diện hệ điều hành",
      uiScore,
    );
    const openness = defaultOs?.os_version?.operating_system?.is_open_source
      ? 90
      : 65;
    put(
      "software_openness",
      openness,
      "/100",
      "derived",
      "Khả năng mở rộng nền tảng",
      openness,
    );
  }
  const aiScore = Math.min(
    100,
    (number(npu?.tops) ? 55 : npu ? 35 : 0) +
      (/ai|intelligence|trí tuệ/i.test(`${software?.notes ?? ""}`) ? 25 : 0),
  );
  put(
    "ai_features",
    aiScore,
    "/100",
    "derived",
    "NPU và tính năng AI",
    aiScore,
  );

  const portCount = connectivity.filter((item: any) =>
    /usb|thunderbolt|hdmi|displayport|ethernet|jack|port|cổng/i.test(
      `${item.connectivity_feature?.code ?? ""} ${item.connectivity_feature?.name ?? ""}`,
    ),
  ).length;
  put(
    "port_count",
    portCount || undefined,
    "cổng",
    "specification",
    "Số cổng kết nối đã khai báo",
  );
  put(
    "video_output",
    /hdmi|displayport|thunderbolt/i.test(connectivityText) ? 1 : 0,
    undefined,
    "feature",
    "Khả năng xuất hình",
  );
  put(
    "keyboard_touchpad",
    /keyboard|touchpad|trackpad|bàn phím/i.test(
      `${physical?.notes ?? ""} ${io?.notes ?? ""}`,
    )
      ? 86
      : 70,
    "/100",
    "derived",
    "Hồ sơ bàn phím và touchpad",
    /keyboard|touchpad|trackpad|bàn phím/i.test(
      `${physical?.notes ?? ""} ${io?.notes ?? ""}`,
    )
      ? 86
      : 70,
  );
  put(
    "repairability",
    storage?.is_expandable ? 82 : 48,
    "/100",
    "derived",
    "Khả năng thay thế và mở rộng",
    storage?.is_expandable ? 82 : 48,
  );

  return metrics;
}

function preferred(items: any[] | undefined) {
  return items?.find((item) => item.is_primary) ?? items?.[0];
}

function highest(items: any[], key: string) {
  return [...items].sort(
    (left, right) => (number(right?.[key]) ?? 0) - (number(left?.[key]) ?? 0),
  )[0];
}

function number(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanNumber(value: unknown) {
  return typeof value === "boolean" ? Number(value) : undefined;
}

function benchmarkLabel(item: any) {
  return [item.benchmark?.name, item.benchmark?.version, item.subscore_name]
    .filter(Boolean)
    .join(" · ");
}

function calculatePpi(
  width: number | undefined,
  height: number | undefined,
  size: number | undefined,
) {
  if (!width || !height || !size) return undefined;
  return Math.round(Math.sqrt(width ** 2 + height ** 2) / size);
}

function normalizeCameraRole(value: unknown) {
  const role = String(value ?? "").toLowerCase();
  if (/ultra/.test(role)) return "ultrawide";
  if (/tele|zoom|periscope/.test(role)) return "telephoto";
  if (/selfie|front/.test(role)) return "selfie";
  return "main";
}

function calculateCameraScore(camera: any) {
  const values: Array<{ score: number; weight: number }> = [];
  const megapixel = number(camera?.effective_megapixel);
  if (megapixel !== undefined) {
    values.push({
      score: normalizeMetric(megapixel, { min: 8, max: 200, scale: "log" }),
      weight: 30,
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
  const sensor = preferred(camera?.camera_module_sensor_links)?.camera_sensor;
  const pixelSize = number(sensor?.pixel_size_um);
  if (pixelSize !== undefined) {
    values.push({
      score: normalizeMetric(pixelSize, { min: 0.6, max: 2.4 }),
      weight: 15,
    });
  }
  const video = calculateVideoScore(camera);
  if (video !== undefined) values.push({ score: video, weight: 15 });
  const totalWeight = values.reduce((total, item) => total + item.weight, 0);
  return totalWeight
    ? Math.round(
        (values.reduce((total, item) => total + item.score * item.weight, 0) /
          totalWeight) *
          10,
      ) / 10
    : 0;
}

function calculateVideoScore(camera: any) {
  const text = [
    camera?.video_capabilities,
    ...(camera?.camera_video_modes ?? []).flatMap((item: any) => [
      item.video_mode?.resolution_width,
      item.video_mode?.resolution_height,
      item.video_mode?.frame_rate_fps,
    ]),
  ]
    .filter(Boolean)
    .join(" ");
  if (!text) return undefined;
  if (/7680|8k/i.test(text)) return 100;
  if (/3840|4096|4k/i.test(text)) return /120|240/.test(text) ? 95 : 85;
  if (/1920|1080|full hd/i.test(text)) return 65;
  return 45;
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
