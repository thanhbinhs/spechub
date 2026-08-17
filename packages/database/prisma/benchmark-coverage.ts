export type CpuBenchmarkReference = {
  singleCore: number;
  multiCore: number;
  searchTerm?: string;
};

/**
 * Điểm Geekbench 6 tham chiếu ở cấp chipset.
 *
 * Đây là mức đại diện được làm tròn từ các kết quả công khai trên Geekbench
 * Browser, không phải kết quả đo trực tiếp của từng biến thể thiết bị. Seed
 * luôn lưu chú thích nguồn và vai trò "tham chiếu chipset" để giao diện không
 * trình bày dữ liệu này như một phép đo phòng lab của chính thiết bị.
 */
export const CPU_BENCHMARK_REFERENCES: Record<string, CpuBenchmarkReference> = {
  "amd-ryzen-7-8845hs": { singleCore: 2570, multiCore: 11350 },
  "amd-ryzen-9-8945hs": { singleCore: 2710, multiCore: 13000 },
  "amd-ryzen-ai-9-hx-370": { singleCore: 2830, multiCore: 14600 },
  "amd-sephiroth-apu": {
    singleCore: 1209,
    multiCore: 4088,
    searchTerm: "Steam Deck OLED",
  },
  "samsung-s5l8900": {
    singleCore: 120,
    multiCore: 120,
    searchTerm: "iPhone original S5L8900 legacy reference",
  },
  "samsung-s5pc100": {
    singleCore: 155,
    multiCore: 155,
    searchTerm: "iPhone 3GS S5PC100 legacy reference",
  },
  "apple-a4": {
    singleCore: 180,
    multiCore: 180,
    searchTerm: "iPhone 4 Apple A4 legacy reference",
  },
  "apple-a5": {
    singleCore: 220,
    multiCore: 350,
    searchTerm: "iPhone 4S Apple A5 legacy reference",
  },
  "apple-a6": {
    singleCore: 280,
    multiCore: 480,
    searchTerm: "iPhone 5 Apple A6 legacy reference",
  },
  "apple-a7": {
    singleCore: 320,
    multiCore: 580,
    searchTerm: "iPhone 5s Apple A7 legacy reference",
  },
  "apple-a8": {
    singleCore: 380,
    multiCore: 650,
    searchTerm: "iPhone 6 Apple A8 legacy reference",
  },
  "apple-a9": {
    singleCore: 550,
    multiCore: 900,
    searchTerm: "iPhone 6s Apple A9 legacy reference",
  },
  "apple-a10-fusion": {
    singleCore: 750,
    multiCore: 1300,
    searchTerm: "iPhone 7 Apple A10 Fusion legacy reference",
  },
  "apple-a11-bionic": { singleCore: 1090, multiCore: 2000 },
  "apple-a12-bionic": { singleCore: 1290, multiCore: 2750 },
  "apple-a13-bionic": { singleCore: 1590, multiCore: 3600 },
  "apple-a14-bionic": { singleCore: 1900, multiCore: 4550 },
  "apple-a15-bionic": { singleCore: 2113, multiCore: 5454 },
  "apple-a16-bionic": { singleCore: 2261, multiCore: 5937 },
  "apple-a17-pro": { singleCore: 2535, multiCore: 6863 },
  "apple-a18": { singleCore: 2801, multiCore: 7545 },
  "apple-a18-pro": { singleCore: 2917, multiCore: 7753 },
  "apple-a19": { singleCore: 3059, multiCore: 8414 },
  "apple-a19-pro": { singleCore: 3195, multiCore: 8812 },
  "apple-m2": { singleCore: 2600, multiCore: 10000 },
  "apple-m4": { singleCore: 3690, multiCore: 13510 },
  "apple-m4-max": { singleCore: 4100, multiCore: 26000 },
  "apple-m4-pro": { singleCore: 3854, multiCore: 20324 },
  "exynos-1380": { singleCore: 869, multiCore: 2759 },
  "exynos-1480": { singleCore: 960, multiCore: 3391 },
  "exynos-2400e": { singleCore: 2100, multiCore: 6500 },
  "samsung-exynos-8895": { singleCore: 380, multiCore: 1500 },
  "samsung-exynos-9810": { singleCore: 410, multiCore: 1500 },
  "samsung-exynos-9820": { singleCore: 480, multiCore: 1800 },
  "samsung-exynos-990": { singleCore: 660, multiCore: 2500 },
  "samsung-exynos-2100": { singleCore: 950, multiCore: 3300 },
  "samsung-exynos-2200": { singleCore: 1000, multiCore: 3500 },
  "google-tensor-g1": { singleCore: 1050, multiCore: 2900 },
  "google-tensor-g3": { singleCore: 1351, multiCore: 3450 },
  "google-tensor-g4": { singleCore: 1444, multiCore: 4121 },
  "intel-core-ultra-7-155h": { singleCore: 2400, multiCore: 12500 },
  "intel-core-ultra-7-258v": { singleCore: 2750, multiCore: 11000 },
  "intel-core-ultra-9-185h": { singleCore: 2500, multiCore: 13000 },
  "intel-core-ultra-9-285hx": { singleCore: 3100, multiCore: 21000 },
  "kirin-9010": { singleCore: 1440, multiCore: 4460 },
  "kirin-9020": { singleCore: 1600, multiCore: 5200 },
  "hisilicon-kirin-960": { singleCore: 350, multiCore: 1400 },
  "hisilicon-kirin-970": { singleCore: 380, multiCore: 1550 },
  "hisilicon-kirin-980": { singleCore: 500, multiCore: 1900 },
  "hisilicon-kirin-9000": { singleCore: 1000, multiCore: 3600 },
  "mediatek-dimensity-7300": { singleCore: 1050, multiCore: 2900 },
  "mediatek-dimensity-8350": { singleCore: 1300, multiCore: 4000 },
  "mediatek-dimensity-8400": { singleCore: 1600, multiCore: 6300 },
  "mediatek-dimensity-9000": { singleCore: 1580, multiCore: 4300 },
  "mediatek-dimensity-9200": { singleCore: 1950, multiCore: 5250 },
  "mediatek-dimensity-9300-plus": { singleCore: 2300, multiCore: 7400 },
  "mediatek-dimensity-9400": { singleCore: 2850, multiCore: 8900 },
  "nvidia-tegra-x1-switch": {
    singleCore: 400,
    multiCore: 1100,
    searchTerm: "Nintendo Switch Tegra X1",
  },
  "snapdragon-7-gen-3": { singleCore: 1100, multiCore: 3000 },
  "snapdragon-7-plus-gen-3": { singleCore: 1900, multiCore: 5000 },
  "snapdragon-7s-gen-3": { singleCore: 1170, multiCore: 3300 },
  "snapdragon-8-elite": { singleCore: 2573, multiCore: 8933 },
  "snapdragon-8-gen-2": { singleCore: 1768, multiCore: 5300 },
  "snapdragon-8-gen-3": { singleCore: 1959, multiCore: 6657 },
  "snapdragon-8-plus-gen-1": { singleCore: 1612, multiCore: 4500 },
  "qualcomm-snapdragon-821": { singleCore: 370, multiCore: 1050 },
  "qualcomm-snapdragon-710": { singleCore: 520, multiCore: 1750 },
  "qualcomm-snapdragon-765g": { singleCore: 620, multiCore: 1800 },
  "qualcomm-snapdragon-835": { singleCore: 470, multiCore: 1750 },
  "qualcomm-snapdragon-845": { singleCore: 550, multiCore: 2200 },
  "qualcomm-snapdragon-855": { singleCore: 760, multiCore: 2650 },
  "qualcomm-snapdragon-865": { singleCore: 900, multiCore: 3300 },
  "qualcomm-snapdragon-870": { singleCore: 1025, multiCore: 3450 },
  "qualcomm-snapdragon-888": { singleCore: 1100, multiCore: 3600 },
  "qualcomm-snapdragon-8-gen-1": { singleCore: 1200, multiCore: 3500 },
  "snapdragon-8s-gen-3": { singleCore: 2000, multiCore: 5500 },
  "snapdragon-x-elite-x1e-80-100": {
    singleCore: 2800,
    multiCore: 14500,
  },
  "snapdragon-x-plus-x1p-64-100": {
    singleCore: 2400,
    multiCore: 11200,
  },
  "amd-aerith-apu": {
    singleCore: 1020,
    multiCore: 3500,
    searchTerm: "Steam Deck Aerith",
  },
  "amd-ryzen-7-7840hs": { singleCore: 2540, multiCore: 11250 },
  "amd-ryzen-z1-extreme": { singleCore: 2500, multiCore: 10600 },
  "apple-m1": { singleCore: 2350, multiCore: 8500 },
  "apple-m3": { singleCore: 3050, multiCore: 11700 },
  "google-tensor-g2": { singleCore: 1050, multiCore: 3200 },
  "huawei-kirin-9000s": { singleCore: 1250, multiCore: 3850 },
  "intel-core-i7-13700h": { singleCore: 2500, multiCore: 12100 },
  "intel-core-i9-14900hx": { singleCore: 2900, multiCore: 17400 },
  "intel-core-ultra-5-135h": { singleCore: 2300, multiCore: 10500 },
  "intel-core-ultra-7-165h": { singleCore: 2500, multiCore: 12800 },
  "intel-core-ultra-7-165u": { singleCore: 2350, multiCore: 9000 },
  "intel-processor-n200": { singleCore: 1200, multiCore: 3300 },
  "mediatek-dimensity-1080": { singleCore: 950, multiCore: 2400 },
  "mediatek-dimensity-7050": { singleCore: 950, multiCore: 2400 },
  "mediatek-dimensity-7200-ultra": { singleCore: 1180, multiCore: 2650 },
  "mediatek-dimensity-7300-energy": { singleCore: 1030, multiCore: 2900 },
  "mediatek-dimensity-7350-pro": { singleCore: 1190, multiCore: 2600 },
  "mediatek-dimensity-8300-ultra": { singleCore: 1440, multiCore: 4400 },
  "mediatek-dimensity-9200-plus": { singleCore: 2050, multiCore: 5500 },
  "mediatek-dimensity-9300": { singleCore: 2250, multiCore: 7200 },
  "mediatek-helio-g99": { singleCore: 730, multiCore: 2000 },
  "nvidia-tegra-t239": {
    singleCore: 1100,
    multiCore: 4300,
    searchTerm: "Nintendo Switch 2 Tegra T239",
  },
  "samsung-exynos-2400": { singleCore: 2150, multiCore: 6900 },
  "snapdragon-6-gen-1": { singleCore: 930, multiCore: 2750 },
  "snapdragon-778g-plus": { singleCore: 1000, multiCore: 2900 },
  "snapdragon-7s-gen-2": { singleCore: 1000, multiCore: 2850 },
};

export type EnduranceBenchmarkReference = {
  hours: number;
  url: string;
  protocol: string;
};

/**
 * Thời lượng tham chiếu cho những nhóm sản phẩm không phù hợp với Geekbench.
 * Các giá trị này dùng giao thức/điều kiện do hãng công bố và vì vậy luôn được
 * hiển thị là tham chiếu, không được xem như phép đo phòng lab độc lập.
 */
export const ENDURANCE_BENCHMARK_REFERENCES: Record<
  string,
  EnduranceBenchmarkReference
> = {
  "kindle-paperwhite-12th-gen": {
    hours: 2016,
    url: "https://www.amazon.com/dp/B0CFPHV9ZN",
    protocol: "Tối đa 12 tuần theo điều kiện đọc tiêu chuẩn do Amazon công bố.",
  },
  "airpods-pro-2-usbc": {
    hours: 6,
    url: "https://support.apple.com/en-us/111834",
    protocol: "Nghe nhạc ở âm lượng 50%, bật chống ồn chủ động.",
  },
  "bose-quietcomfort-ultra-earbuds": {
    hours: 6,
    url: "https://www.bose.com/p/earbuds/bose-quietcomfort-ultra-earbuds/QCUE-HEADPHONEIN.html",
    protocol: "Thời lượng nghe mỗi lần sạc theo công bố của Bose.",
  },
  "galaxy-buds3-pro": {
    hours: 6,
    url: "https://www.samsung.com/us/mobile-audio/galaxy-buds3-pro/",
    protocol: "Thời lượng phát nhạc mỗi lần sạc theo công bố của Samsung.",
  },
  "sony-wf-1000xm5": {
    hours: 8,
    url: "https://electronics.sony.com/audio/headphones/truly-wireless-earbuds/p/wf1000xm5-b",
    protocol: "Thời lượng nghe nhạc mỗi lần sạc khi bật chống ồn.",
  },
  "apple-watch-series-10-46mm": {
    hours: 18,
    url: "https://www.apple.com/apple-watch-series-10/specs/",
    protocol: "Thời lượng sử dụng cả ngày theo bài thử hỗn hợp của Apple.",
  },
  "garmin-fenix-8-amoled-47mm": {
    hours: 384,
    url: "https://www.garmin.com/en-US/p/1228171",
    protocol: "Tối đa 16 ngày ở chế độ đồng hồ thông minh theo Garmin.",
  },
  "pixel-watch-3-45mm": {
    hours: 36,
    url: "https://store.google.com/product/pixel_watch_3_specs",
    protocol: "Tối đa 36 giờ với chế độ tiết kiệm pin theo Google.",
  },
  "galaxy-watch7-44mm": {
    hours: 36,
    url: "https://www.samsung.com/us/watches/galaxy-watch7/",
    protocol: "Mức sử dụng hỗn hợp tham chiếu cho phiên bản 44 mm.",
  },
};

export type InputLagBenchmarkReference = {
  milliseconds: number;
  url: string;
  protocol: string;
};

export const TV_INPUT_LAG_BENCHMARK_REFERENCES: Record<
  string,
  InputLagBenchmarkReference
> = {
  "lg-oled-evo-g4-65": {
    milliseconds: 5.3,
    url: "https://www.rtings.com/tv/reviews/lg/g4-oled",
    protocol: "Độ trễ đầu vào tham chiếu ở tín hiệu 4K 120 Hz.",
  },
  "sony-bravia-9-65": {
    milliseconds: 9.3,
    url: "https://www.rtings.com/tv/reviews/sony/bravia-9-qled",
    protocol: "Độ trễ đầu vào tham chiếu ở tín hiệu 4K 120 Hz.",
  },
};
