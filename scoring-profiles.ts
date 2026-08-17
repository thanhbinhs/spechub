import type {
  MetricDefinition,
  ScoreModuleDefinition,
  ScoringProfile,
} from "./scoring-engine";

const VERSION = "category-scorecard-v3.1.0";

const metric = (
  key: string,
  label: string,
  weight: number,
  min: number,
  max: number,
  options: Partial<Pick<MetricDefinition, "direction" | "scale">> = {},
): MetricDefinition => ({ key, label, weight, min, max, ...options });

function module(
  key: string,
  label: string,
  description: string,
  weight: number,
  metrics: MetricDefinition[],
): ScoreModuleDefinition {
  return {
    key,
    label,
    description,
    weight,
    metrics,
  };
}

const phonePerformance = module(
  "performance",
  "Hiệu năng",
  "CPU, GPU, AI và khả năng duy trì hiệu năng.",
  25,
  [
    metric("cpu_single", "CPU đơn nhân", 25, 400, 4000, { scale: "log" }),
    metric("cpu_multi", "CPU đa nhân", 30, 1000, 22000, { scale: "log" }),
    metric("gpu", "Đồ họa", 25, 0, 100),
    metric("npu_tops", "NPU / AI", 10, 0, 100, { scale: "log" }),
    metric("sustained", "Hiệu năng duy trì", 10, 0, 100),
  ],
);

const phoneDisplay = module(
  "display",
  "Màn hình",
  "Độ sáng, độ nét, màu sắc, HDR và độ thoải mái cho mắt.",
  15,
  [
    metric("display_brightness", "Độ sáng", 25, 300, 3000),
    metric("display_refresh", "Tần số quét", 15, 60, 165),
    metric("display_ppi", "Mật độ điểm ảnh", 20, 200, 550),
    metric("display_color", "Màu sắc", 20, 0, 100),
    metric("display_hdr", "HDR", 10, 0, 1),
    metric("display_eye_comfort", "Bảo vệ mắt / PWM", 10, 0, 100),
  ],
);

const phoneCamera = module(
  "camera",
  "Máy ảnh",
  "Camera chính, góc siêu rộng, tele, selfie và quay phim.",
  20,
  [
    metric("camera_main", "Camera chính", 40, 0, 100),
    metric("camera_ultrawide", "Camera góc siêu rộng", 20, 0, 100),
    metric("camera_telephoto", "Camera tele", 20, 0, 100),
    metric("camera_selfie", "Camera selfie", 10, 0, 100),
    metric("camera_video", "Quay phim", 10, 0, 100),
  ],
);

const phoneBattery = module(
  "battery",
  "Pin & sạc",
  "Thời lượng thực tế, tốc độ sạc, hiệu suất và độ bền pin.",
  15,
  [
    metric("battery_life", "Thời lượng pin", 50, 4, 48, { scale: "log" }),
    metric("charging_speed", "Tốc độ sạc", 30, 10, 240, { scale: "log" }),
    metric("charging_efficiency", "Hiệu suất sạc", 10, 0.4, 5),
    metric("battery_health", "Công nghệ bảo vệ pin", 10, 0, 100),
  ],
);

const connectivity = (weight: number) =>
  module(
    "connectivity",
    "Kết nối",
    "Wi‑Fi, Bluetooth, USB, mạng di động và các kết nối mở rộng.",
    weight,
    [
      metric("wifi_speed", "Wi‑Fi", 25, 300, 46000, { scale: "log" }),
      metric("bluetooth_version", "Bluetooth", 15, 4, 6),
      metric("usb_speed", "USB / cổng dữ liệu", 20, 0.48, 80, {
        scale: "log",
      }),
      metric("esim", "eSIM", 10, 0, 1),
      metric("cellular_bands", "Băng tần di động", 15, 0, 30),
      metric("wireless_features", "Tính năng không dây", 15, 1, 8),
    ],
  );

const buildQuality = (weight: number, portable = true) =>
  module(
    "build",
    portable ? "Hoàn thiện & di động" : "Chất lượng hoàn thiện",
    "Vật liệu, trọng lượng, độ mỏng, kháng nước và độ bền bề mặt.",
    weight,
    [
      metric("material_quality", "Vật liệu", 25, 0, 100),
      metric("weight_score", "Trọng lượng", 20, 0, 100),
      metric("thinness_score", "Độ mỏng", 15, 0, 100),
      metric("ip_rating", "Kháng bụi nước", 20, 0, 100),
      metric("glass_quality", "Kính bảo vệ", 20, 0, 100),
    ],
  );

const software = (weight: number) =>
  module(
    "software",
    "Phần mềm",
    "Độ mới hệ điều hành, chính sách cập nhật, bảo mật và tính năng AI.",
    weight,
    [
      metric("os_recency", "Phiên bản hệ điều hành", 20, 0, 100),
      metric("update_policy", "Cập nhật lớn", 25, 0, 7),
      metric("security_policy", "Cập nhật bảo mật", 20, 0, 8),
      metric("ai_features", "Tính năng AI", 15, 0, 100),
      metric("ui_optimization", "Tối ưu giao diện", 10, 0, 100),
      metric("software_openness", "Khả năng mở rộng", 10, 0, 100),
    ],
  );

const audio = (weight: number) =>
  module(
    "audio",
    "Âm thanh",
    "Loa, tinh chỉnh âm thanh, kết nối tai nghe và thu âm.",
    weight,
    [
      metric("stereo_audio", "Âm thanh nổi", 30, 0, 1),
      metric("speaker_quality", "Hệ thống loa", 20, 1, 6),
      metric("audio_tuning", "Tinh chỉnh âm thanh", 20, 0, 1),
      metric("headphone_jack", "Cổng tai nghe", 15, 0, 1),
      metric("microphone_quality", "Microphone", 15, 0, 100),
    ],
  );

const laptopCpu = module(
  "cpu",
  "Bộ xử lý",
  "Hiệu năng đơn nhân, đa nhân, hiệu suất điện và mức duy trì.",
  20,
  [
    metric("cpu_single", "Đơn nhân", 25, 800, 4500, { scale: "log" }),
    metric("cpu_multi", "Đa nhân", 35, 2500, 32000, { scale: "log" }),
    metric("cpu_efficiency", "Hiệu suất điện", 20, 0, 100),
    metric("sustained", "Hiệu năng duy trì", 20, 0, 100),
  ],
);

const laptopGpu = module(
  "gpu",
  "Đồ họa",
  "Hiệu năng 3D, dò tia, AI, tính toán và hiệu suất.",
  20,
  [
    metric("gpu", "Hiệu năng GPU", 45, 0, 100),
    metric("ray_tracing", "Dò tia", 15, 0, 1),
    metric("npu_tops", "AI / NPU", 15, 0, 100, { scale: "log" }),
    metric("gpu_compute", "Năng lực tính toán", 15, 100, 60000, {
      scale: "log",
    }),
    metric("gpu_efficiency", "Hiệu suất điện", 10, 0, 100),
  ],
);

const laptopDisplay = module(
  "display",
  "Màn hình",
  "Độ nét, độ sáng, màu sắc, tương phản, HDR và tốc độ phản hồi.",
  15,
  [
    metric("display_ppi", "Độ nét", 20, 100, 350),
    metric("display_brightness", "Độ sáng", 20, 200, 1600),
    metric("display_color", "Dải màu", 20, 0, 100),
    metric("display_refresh", "Tần số quét", 15, 60, 360),
    metric("display_contrast", "Tương phản", 10, 0, 100),
    metric("display_hdr", "HDR", 10, 0, 1),
    metric("display_response", "Phản hồi", 5, 0, 100),
  ],
);

const laptopBattery = module(
  "battery",
  "Pin & sạc",
  "Thời lượng văn phòng, video, hiệu suất năng lượng và sạc.",
  15,
  [
    metric("battery_life", "Thời lượng hỗn hợp", 50, 3, 30, { scale: "log" }),
    metric("battery_capacity_wh", "Dung lượng năng lượng", 15, 30, 100),
    metric("charging_speed", "Tốc độ sạc", 20, 30, 300, { scale: "log" }),
    metric("charging_efficiency", "Hiệu suất sạc", 15, 0.4, 5),
  ],
);

const memoryStorage = module(
  "memory-storage",
  "Bộ nhớ & lưu trữ",
  "Dung lượng, băng thông, tốc độ SSD và khả năng nâng cấp.",
  10,
  [
    metric("memory_capacity", "Dung lượng RAM", 20, 4, 128, { scale: "log" }),
    metric("memory_speed", "Tốc độ RAM", 15, 1600, 10000),
    metric("memory_bandwidth", "Băng thông RAM", 15, 20, 500, {
      scale: "log",
    }),
    metric("storage_capacity", "Dung lượng SSD", 10, 128, 8192, {
      scale: "log",
    }),
    metric("storage_read", "Đọc tuần tự", 15, 500, 14000, { scale: "log" }),
    metric("storage_write", "Ghi tuần tự", 10, 300, 12000, { scale: "log" }),
    metric("storage_iops", "IOPS", 5, 10000, 2000000, { scale: "log" }),
    metric("upgradeability", "Khả năng nâng cấp", 10, 0, 100),
  ],
);

const thermals = module(
  "thermals",
  "Tản nhiệt & tiếng ồn",
  "Khả năng làm mát, duy trì hiệu năng và kiểm soát tiếng ồn.",
  5,
  [
    metric("thermal_design", "Thiết kế tản nhiệt", 35, 0, 100),
    metric("sustained", "Giới hạn hiệu năng", 40, 0, 100),
    metric("noise_control", "Kiểm soát tiếng ồn", 25, 0, 100),
  ],
);

const laptopBuild = module(
  "build",
  "Hoàn thiện & tính di động",
  "Vật liệu, trọng lượng, độ mỏng, bàn phím, touchpad và khả năng sửa chữa.",
  10,
  [
    metric("material_quality", "Vật liệu", 20, 0, 100),
    metric("weight_score", "Trọng lượng", 20, 0, 100),
    metric("thinness_score", "Độ mỏng", 15, 0, 100),
    metric("keyboard_touchpad", "Bàn phím & touchpad", 20, 0, 100),
    metric("repairability", "Khả năng sửa chữa", 15, 0, 100),
    metric("upgradeability", "Khả năng nâng cấp", 10, 0, 100),
  ],
);

const laptopConnectivity = module(
  "connectivity",
  "Cổng & kết nối",
  "Số cổng, USB/Thunderbolt, xuất hình, mở rộng, Wi‑Fi và Bluetooth.",
  5,
  [
    metric("port_count", "Số lượng cổng", 20, 1, 10),
    metric("usb_speed", "USB / Thunderbolt", 25, 0.48, 80, {
      scale: "log",
    }),
    metric("video_output", "Xuất hình", 15, 0, 1),
    metric("expansion_ports", "LAN / khe thẻ", 10, 0, 1),
    metric("wifi_speed", "Wi‑Fi", 20, 300, 46000, { scale: "log" }),
    metric("bluetooth_version", "Bluetooth", 10, 4, 6),
  ],
);

const profiles: ScoringProfile[] = [
  {
    categorySlug: "smartphone",
    label: "Điện thoại",
    version: VERSION,
    modules: [
      phonePerformance,
      phoneCamera,
      phoneDisplay,
      phoneBattery,
      software(10),
      connectivity(5),
      buildQuality(5),
      audio(5),
    ],
  },
  {
    categorySlug: "laptop",
    label: "Laptop",
    version: VERSION,
    modules: [
      laptopCpu,
      laptopGpu,
      laptopDisplay,
      laptopBattery,
      memoryStorage,
      laptopBuild,
      laptopConnectivity,
      thermals,
    ],
  },
  {
    categorySlug: "tablet",
    label: "Máy tính bảng",
    version: VERSION,
    modules: [
      { ...phonePerformance, weight: 25 },
      { ...phoneDisplay, weight: 20 },
      { ...phoneBattery, weight: 20 },
      software(10),
      buildQuality(10),
      audio(5),
      connectivity(5),
      { ...phoneCamera, weight: 5 },
    ],
  },
  {
    categorySlug: "smartwatch",
    label: "Đồng hồ thông minh",
    version: VERSION,
    modules: [
      module(
        "health-sensors",
        "Sức khỏe & cảm biến",
        "Độ phủ cảm biến sức khỏe, vận động và môi trường.",
        25,
        [
          metric("health_sensor_count", "Cảm biến sức khỏe", 55, 0, 8),
          metric("sensor_count", "Tổng số cảm biến", 25, 1, 15),
          metric("health_features", "Tính năng sức khỏe", 20, 0, 100),
        ],
      ),
      module("battery", "Pin", "Thời lượng sử dụng và tốc độ sạc.", 20, [
        metric("battery_life", "Thời lượng pin", 75, 12, 504, {
          scale: "log",
        }),
        metric("charging_speed", "Tốc độ sạc", 25, 2, 30),
      ]),
      { ...phoneDisplay, weight: 15 },
      {
        ...phonePerformance,
        weight: 10,
        metrics: [
          metric("cpu_single", "Hiệu năng đơn nhân", 40, 100, 2500, {
            scale: "log",
          }),
          metric("sustained", "Hiệu năng duy trì", 30, 0, 100),
          metric("npu_tops", "AI tại thiết bị", 30, 0, 30, {
            scale: "log",
          }),
        ],
      },
      module(
        "fitness-gps",
        "Thể thao & định vị",
        "GPS, cảm biến vận động và tính năng luyện tập.",
        10,
        [
          metric("gps_support", "GPS", 40, 0, 1),
          metric("motion_sensor_count", "Cảm biến vận động", 30, 0, 6),
          metric("fitness_features", "Tính năng luyện tập", 30, 0, 100),
        ],
      ),
      buildQuality(10),
      software(7),
      connectivity(3),
    ],
  },
  {
    categorySlug: "earbuds",
    label: "Tai nghe",
    version: VERSION,
    modules: [
      module(
        "sound",
        "Chất âm",
        "Âm thanh nổi, tinh chỉnh, độ phân giải và năng lực xử lý âm thanh.",
        35,
        [
          metric("stereo_audio", "Âm thanh nổi", 25, 0, 1),
          metric("audio_tuning", "Tinh chỉnh âm thanh", 25, 0, 1),
          metric("audio_processor", "Bộ xử lý âm thanh", 25, 0, 100),
          metric("hi_res_audio", "Âm thanh độ phân giải cao", 25, 0, 1),
        ],
      ),
      module(
        "noise-cancelling",
        "Chống ồn",
        "Chống ồn chủ động, xuyên âm và khả năng thích nghi.",
        20,
        [
          metric("anc_support", "Chống ồn chủ động", 60, 0, 1),
          metric("ambient_mode", "Xuyên âm", 20, 0, 1),
          metric("adaptive_audio", "Âm thanh thích nghi", 20, 0, 1),
        ],
      ),
      module(
        "battery",
        "Pin",
        "Thời lượng mỗi lần sạc và khả năng sạc nhanh.",
        15,
        [
          metric("battery_life", "Thời lượng nghe", 75, 3, 15),
          metric("charging_speed", "Sạc", 25, 1, 15),
        ],
      ),
      module(
        "microphone",
        "Microphone",
        "Khả năng thu giọng nói và lọc tiếng ồn cuộc gọi.",
        10,
        [
          metric("microphone_quality", "Chất lượng thu âm", 70, 0, 100),
          metric("call_noise_reduction", "Lọc ồn cuộc gọi", 30, 0, 1),
        ],
      ),
      buildQuality(10),
      connectivity(5),
      module(
        "features",
        "Tính năng",
        "Điều khiển, âm thanh không gian và kết nối đa thiết bị.",
        5,
        [
          metric("audio_feature_count", "Tính năng âm thanh", 50, 0, 8),
          metric("spatial_audio", "Âm thanh không gian", 25, 0, 1),
          metric("multipoint", "Kết nối đa điểm", 25, 0, 1),
        ],
      ),
    ],
  },
  {
    categorySlug: "television",
    label: "TV",
    version: VERSION,
    modules: [
      module(
        "picture",
        "Chất lượng hình ảnh",
        "Độ sáng, độ nét, tương phản, màu sắc và công nghệ tấm nền.",
        35,
        [
          metric("display_brightness", "Độ sáng", 25, 300, 4000),
          metric("display_ppi", "Độ nét", 15, 40, 150),
          metric("display_contrast", "Tương phản", 25, 0, 100),
          metric("display_color", "Màu sắc", 20, 0, 100),
          metric("panel_quality", "Công nghệ tấm nền", 15, 0, 100),
        ],
      ),
      module(
        "hdr",
        "HDR",
        "Định dạng HDR, độ sáng đỉnh và chiều sâu màu.",
        15,
        [
          metric("display_hdr", "Hỗ trợ HDR", 30, 0, 1),
          metric("display_brightness", "Độ sáng HDR", 45, 300, 4000),
          metric("display_color", "Chiều sâu màu", 25, 0, 100),
        ],
      ),
      module(
        "gaming",
        "Chơi game",
        "Độ trễ đầu vào, tần số quét và kết nối hình ảnh tốc độ cao.",
        15,
        [
          metric("input_lag", "Độ trễ đầu vào", 50, 3, 30, {
            direction: "lower",
          }),
          metric("display_refresh", "Tần số quét", 25, 60, 144),
          metric("usb_speed", "Cổng tốc độ cao", 10, 0.48, 80, {
            scale: "log",
          }),
          metric("gaming_features", "Tính năng chơi game", 15, 0, 100),
        ],
      ),
      software(10),
      audio(10),
      connectivity(5),
      buildQuality(5, false),
      module(
        "efficiency",
        "Hiệu suất năng lượng",
        "Hiệu suất xử lý và khả năng quản lý năng lượng.",
        5,
        [
          metric("cpu_efficiency", "Hiệu suất bộ xử lý", 50, 0, 100),
          metric("power_features", "Quản lý năng lượng", 50, 0, 100),
        ],
      ),
    ],
  },
  {
    categorySlug: "gaming-handheld",
    label: "Máy chơi game cầm tay",
    version: VERSION,
    modules: [
      {
        ...phonePerformance,
        weight: 30,
        metrics: [
          metric("cpu_single", "CPU đơn nhân", 20, 300, 3500, {
            scale: "log",
          }),
          metric("cpu_multi", "CPU đa nhân", 25, 800, 16000, {
            scale: "log",
          }),
          metric("gpu", "Hiệu năng GPU", 35, 0, 100),
          metric("sustained", "Hiệu năng duy trì", 20, 0, 100),
        ],
      },
      { ...laptopDisplay, weight: 15 },
      {
        ...phoneBattery,
        weight: 15,
        metrics: [
          metric("battery_life", "Thời lượng chơi", 55, 1.5, 12),
          metric("battery_capacity_wh", "Dung lượng", 20, 20, 80),
          metric("charging_speed", "Sạc", 25, 15, 100),
        ],
      },
      module(
        "controls",
        "Điều khiển",
        "Cảm biến điều khiển, phản hồi và khả năng nhập liệu.",
        15,
        [
          metric("control_sensor_count", "Cảm biến điều khiển", 40, 0, 8),
          metric("haptics", "Phản hồi rung", 30, 0, 1),
          metric("control_features", "Tính năng điều khiển", 30, 0, 100),
        ],
      ),
      { ...thermals, weight: 10 },
      { ...memoryStorage, weight: 5 },
      software(5),
      connectivity(5),
    ],
  },
  {
    categorySlug: "e-reader",
    label: "Máy đọc sách",
    version: VERSION,
    modules: [
      module(
        "display",
        "Màn hình đọc",
        "Độ nét, công nghệ mực điện tử và khả năng bảo vệ mắt.",
        30,
        [
          metric("display_ppi", "Độ nét", 30, 150, 400),
          metric("panel_quality", "Công nghệ hiển thị", 30, 0, 100),
          metric("display_eye_comfort", "Thoải mái cho mắt", 25, 0, 100),
          metric("display_brightness", "Đèn đọc", 15, 0, 500),
        ],
      ),
      module(
        "reading-comfort",
        "Trải nghiệm đọc",
        "Trọng lượng, kích thước, chống nước và khả năng cầm lâu.",
        20,
        [
          metric("weight_score", "Trọng lượng", 35, 0, 100),
          metric("thinness_score", "Độ mỏng", 20, 0, 100),
          metric("ip_rating", "Chống nước", 20, 0, 100),
          metric("display_size", "Kích thước đọc", 25, 5, 12),
        ],
      ),
      module(
        "battery",
        "Pin",
        "Thời lượng đọc và hiệu quả sử dụng năng lượng.",
        20,
        [
          metric("battery_life", "Thời lượng đọc", 80, 168, 3360, {
            scale: "log",
          }),
          metric("power_features", "Tiết kiệm điện", 20, 0, 100),
        ],
      ),
      module(
        "performance",
        "Tốc độ phản hồi",
        "Tốc độ xử lý, bộ nhớ và phản hồi khi chuyển trang.",
        10,
        [
          metric("cpu_single", "Xử lý đơn nhân", 40, 100, 1500, {
            scale: "log",
          }),
          metric("memory_capacity", "Bộ nhớ", 30, 0.5, 8, {
            scale: "log",
          }),
          metric("storage_capacity", "Lưu trữ", 30, 8, 128, {
            scale: "log",
          }),
        ],
      ),
      software(10),
      buildQuality(5),
      connectivity(5),
    ],
  },
];

export const SCORING_PROFILES = Object.fromEntries(
  profiles.map((profile) => [profile.categorySlug, profile]),
) as Record<string, ScoringProfile>;

export const SCORECARD_VERSION = VERSION;
