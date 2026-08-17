import { Prisma, PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

type OrganizationSeed = {
  name: string;
  slug: string;
  shortName: string;
  legalName?: string;
  countryCode: string;
  foundedYear: number;
  websiteUrl: string;
  description: string;
  roles: string[];
};

type DescriptionParts = {
  highlights: string;
  design: string;
  performance: string;
  experience: string;
  battery: string;
  software: string;
  limits: string;
};

type DeviceSeed = {
  brandSlug: string;
  categorySlug: string;
  family: {
    name: string;
    slug: string;
    description: string;
    firstReleaseYear: number;
  };
  model: {
    name: string;
    slug: string;
    summary: string;
    generation: string;
    announcementDate: string;
    releaseDate: string;
    coverImageUrl: string;
    description: DescriptionParts;
    aliases?: string[];
  };
  variant: {
    name: string;
    skuCode?: string;
    marketName: string;
    colorName: string;
    colorHex: string;
    launchPriceUsd: number;
    heightMm?: number;
    widthMm?: number;
    thicknessMm?: number;
    weightG?: number;
    frameMaterial?: string;
    backMaterial?: string;
    frontGlass?: string;
    ingressProtection?: string;
    io?: {
      simSlots?: number;
      esimSupported?: boolean;
      stereoSpeakers?: boolean;
      speakerCount?: number;
      headphoneJack?: boolean;
      hasMicrosdSlot?: boolean;
      microsdMaxCapacityGb?: number;
      notes?: string;
    };
  };
  modules: {
    chipset?: string;
    cpu?: string;
    gpu?: string;
    npu?: string;
    display?: string;
    battery?: string;
    memory?: { slug: string; capacityGb: number; speedMhz?: number };
    storage?: {
      slug: string;
      capacityGb: number;
      expandable?: boolean;
      expansionMaxGb?: number;
    };
  };
  sourceUrl: string;
};

const organizations: OrganizationSeed[] = [
  {
    name: "Apple Inc.",
    slug: "apple",
    shortName: "Apple",
    legalName: "Apple Inc.",
    countryCode: "US",
    foundedYear: 1976,
    websiteUrl: "https://www.apple.com",
    description:
      "Apple thiết kế thiết bị điện tử tiêu dùng, hệ điều hành và dịch vụ số với mô hình tích hợp chặt chẽ giữa phần cứng, phần mềm và hệ sinh thái ứng dụng.",
    roles: ["brand", "manufacturer", "software_vendor"],
  },
  {
    name: "Samsung Electronics",
    slug: "samsung",
    shortName: "Samsung",
    legalName: "Samsung Electronics Co., Ltd.",
    countryCode: "KR",
    foundedYear: 1969,
    websiteUrl: "https://www.samsung.com",
    description:
      "Samsung Electronics phát triển điện thoại, thiết bị đeo, TV, màn hình và linh kiện bán dẫn; hãng nổi bật với năng lực sản xuất quy mô lớn và hệ sinh thái Galaxy.",
    roles: ["brand", "manufacturer", "display_maker"],
  },
  {
    name: "Sony Corporation",
    slug: "sony",
    shortName: "Sony",
    legalName: "Sony Corporation",
    countryCode: "JP",
    foundedYear: 1946,
    websiteUrl: "https://www.sony.com",
    description:
      "Sony phát triển sản phẩm nghe nhìn, cảm biến hình ảnh, thiết bị giải trí và nền tảng nội dung; thế mạnh chính nằm ở xử lý hình ảnh, âm thanh và trải nghiệm giải trí.",
    roles: ["brand", "manufacturer", "display_maker", "sensor_maker"],
  },
  {
    name: "Valve Corporation",
    slug: "valve",
    shortName: "Valve",
    legalName: "Valve Corporation",
    countryCode: "US",
    foundedYear: 1996,
    websiteUrl: "https://www.valvesoftware.com",
    description:
      "Valve phát triển trò chơi, nền tảng phân phối Steam và phần cứng chơi game; Steam Deck kết hợp hệ sinh thái PC với thiết kế cầm tay và hệ điều hành SteamOS.",
    roles: ["brand", "manufacturer", "software_vendor"],
  },
  {
    name: "Amazon Devices",
    slug: "amazon-devices",
    shortName: "Amazon",
    countryCode: "US",
    foundedYear: 2007,
    websiteUrl: "https://www.amazon.com/kindle",
    description:
      "Amazon Devices phát triển dòng máy đọc sách Kindle và các thiết bị gia dụng kết nối, tập trung vào nội dung số, đồng bộ tài khoản và trải nghiệm sử dụng đơn giản.",
    roles: ["brand", "manufacturer", "software_vendor"],
  },
  {
    name: "Advanced Micro Devices",
    slug: "amd",
    shortName: "AMD",
    legalName: "Advanced Micro Devices, Inc.",
    countryCode: "US",
    foundedYear: 1969,
    websiteUrl: "https://www.amd.com",
    description:
      "AMD thiết kế CPU, GPU và nền tảng xử lý bán tùy biến cho máy tính cá nhân, trung tâm dữ liệu và máy chơi game; các kiến trúc Zen và RDNA là nhóm công nghệ chủ lực.",
    roles: ["manufacturer"],
  },
  {
    name: "MediaTek Inc.",
    slug: "mediatek",
    shortName: "MediaTek",
    legalName: "MediaTek Inc.",
    countryCode: "TW",
    foundedYear: 1997,
    websiteUrl: "https://www.mediatek.com",
    description:
      "MediaTek thiết kế nền tảng bán dẫn cho thiết bị di động, TV, kết nối không dây và thiết bị đọc sách; sản phẩm tập trung vào khả năng tích hợp và hiệu quả năng lượng.",
    roles: ["manufacturer"],
  },
];

const devices: DeviceSeed[] = [
  {
    brandSlug: "apple",
    categorySlug: "smartphone",
    family: {
      name: "iPhone 16 Pro Series",
      slug: "iphone-16-pro-series",
      description:
        "Dòng iPhone 16 Pro hướng đến người dùng cần hiệu năng cao, hệ thống camera linh hoạt, vật liệu cao cấp và thời gian hỗ trợ phần mềm dài trong hệ sinh thái Apple.",
      firstReleaseYear: 2024,
    },
    model: {
      name: "iPhone 16 Pro",
      slug: "iphone-16-pro",
      summary:
        "iPhone 16 Pro kết hợp chip A18 Pro, màn hình OLED 6,3 inch 120 Hz, khung titanium và hệ thống camera chuyên nghiệp trong một thân máy gọn hơn bản Pro Max.",
      generation: "16 Pro",
      announcementDate: "2024-09-09",
      releaseDate: "2024-09-20",
      coverImageUrl: "/images/devices/iphone-16-pro.webp",
      aliases: ["Apple iPhone 16 Pro"],
      description: {
        highlights:
          "iPhone 16 Pro là mẫu flagship kích thước vừa của Apple, nổi bật với chip A18 Pro, màn hình ProMotion 120 Hz, nút Camera Control và hệ thống camera có ống kính tele 5x.",
        design:
          "Máy dùng khung titanium, mặt trước Ceramic Shield và mặt lưng kính nhám. Kích thước 149,6 × 71,5 × 8,25 mm cùng khối lượng 199 g giúp thiết bị dễ cầm hơn bản Pro Max nhưng vẫn giữ chuẩn hoàn thiện cao cấp.",
        performance:
          "A18 Pro tích hợp CPU, GPU 6 lõi và Neural Engine cho tác vụ nặng, trò chơi và xử lý AI trên thiết bị. Phiên bản chuẩn hóa sử dụng 8 GB RAM và 256 GB bộ nhớ, phù hợp quay video và lưu ảnh ProRAW.",
        experience:
          "Màn hình Super Retina XDR OLED 6,3 inch có độ phân giải 2622 × 1206, mật độ 460 ppi, Always-On và ProMotion thích ứng đến 120 Hz. Hệ thống camera hỗ trợ nhiều tiêu cự, quay video chất lượng cao và xử lý màu nhất quán.",
        battery:
          "Pin tích hợp hỗ trợ sạc có dây, MagSafe và sạc không dây Qi2. Thiết bị có 5G, Wi-Fi, Bluetooth, NFC, eSIM và cổng USB-C; thời lượng thực tế phụ thuộc độ sáng, sóng di động và cường độ quay phim.",
        software:
          "Máy xuất xưởng với iOS 18 và được tích hợp sâu với iCloud, AirDrop, Apple Watch, Mac và các dịch vụ bảo mật của Apple. Chính sách cập nhật dài là lợi thế với người dùng giữ máy nhiều năm.",
        limits:
          "Thiết bị không có khe thẻ nhớ hay jack tai nghe; chi phí sửa chữa và phụ kiện chính hãng tương đối cao. Phù hợp với người cần flagship nhỏ gọn, quay chụp ổn định và đã sử dụng hệ sinh thái Apple.",
      },
    },
    variant: {
      name: "256GB Natural Titanium",
      skuCode: "MYNH3",
      marketName: "iPhone 16 Pro 256GB",
      colorName: "Natural Titanium",
      colorHex: "#B7B1A7",
      launchPriceUsd: 1099,
      heightMm: 149.6,
      widthMm: 71.5,
      thicknessMm: 8.25,
      weightG: 199,
      frameMaterial: "Titanium",
      backMaterial: "Textured matte glass",
      frontGlass: "Ceramic Shield",
      ingressProtection: "IP68",
      io: {
        simSlots: 1,
        esimSupported: true,
        stereoSpeakers: true,
        speakerCount: 2,
        headphoneJack: false,
        hasMicrosdSlot: false,
        notes: "USB-C; cấu hình SIM vật lý thay đổi theo khu vực.",
      },
    },
    modules: {
      chipset: "apple-a18-pro",
      cpu: "apple-a18-pro-cpu",
      gpu: "apple-gpu-a18-pro-6core",
      npu: "apple-neural-engine-a18-pro",
      display: "iphone-16-pro-display",
      battery: "iphone-16-pro-battery",
      memory: { slug: "lpddr5x", capacityGb: 8 },
      storage: { slug: "apple-nvme", capacityGb: 256 },
    },
    sourceUrl: "https://support.apple.com/en-us/121031",
  },
  {
    brandSlug: "apple",
    categorySlug: "tablet",
    family: {
      name: "iPad Pro M4 Series",
      slug: "ipad-pro-m4-series",
      description:
        "Dòng iPad Pro M4 dành cho sáng tạo nội dung và công việc di động, kết hợp Apple Silicon, màn hình Tandem OLED, phụ kiện bút và bàn phím trong thiết kế rất mỏng.",
      firstReleaseYear: 2024,
    },
    model: {
      name: "iPad Pro 13-inch M4",
      slug: "ipad-pro-13-m4",
      summary:
        "iPad Pro 13-inch M4 là máy tính bảng chuyên nghiệp với màn hình Tandem OLED 13 inch, chip Apple M4 và thân máy 5,1 mm dành cho sáng tạo nội dung.",
      generation: "M4",
      announcementDate: "2024-05-07",
      releaseDate: "2024-05-15",
      coverImageUrl: "/images/devices/ipad-pro-13-m4.webp",
      aliases: ["iPad Pro 13 M4"],
      description: {
        highlights:
          "iPad Pro 13-inch M4 đưa chip M4 và màn hình Ultra Retina XDR Tandem OLED lên một thiết bị chỉ dày 5,1 mm. Đây là cấu hình hướng đến họa sĩ, nhà thiết kế, dựng phim và người cần không gian làm việc cảm ứng lớn.",
        design:
          "Thân nhôm nguyên khối có kích thước 281,6 × 215,5 × 5,1 mm; bản Wi-Fi nặng 579 g. Máy hỗ trợ Apple Pencil Pro và Magic Keyboard, nhưng các phụ kiện này được bán riêng và làm tăng tổng chi phí sử dụng.",
        performance:
          "Apple M4 dùng kiến trúc bộ nhớ hợp nhất, GPU tăng tốc ray tracing và Neural Engine cho chỉnh ảnh, dựng video, nhạc và mô hình AI trên thiết bị. Bản 256 GB được chuẩn hóa với 8 GB bộ nhớ hợp nhất.",
        experience:
          "Màn hình 13 inch có độ phân giải 2752 × 2064, ProMotion 10–120 Hz, dải màu P3 và độ sáng HDR cực đại 1600 nit. Tấm nền Tandem OLED tạo màu đen sâu, độ tương phản cao và phản hồi tốt cho bút.",
        battery:
          "Pin 38,99 Wh được thiết kế cho một ngày làm việc hỗn hợp; sạc qua USB-C/Thunderbolt. Máy hỗ trợ Wi-Fi, Bluetooth và có tùy chọn Cellular, nhưng phiên bản trong catalog là Wi-Fi 256 GB.",
        software:
          "iPadOS cung cấp Stage Manager, ứng dụng sáng tạo chuyên nghiệp và đồng bộ với iPhone, Mac, iCloud. Trải nghiệm cảm ứng và bút rất mạnh, trong khi một số quy trình desktop vẫn phụ thuộc cách ứng dụng được tối ưu.",
        limits:
          "Giá máy và phụ kiện cao; hệ thống tệp, đa nhiệm và phần mềm chuyên ngành chưa thay thế hoàn toàn laptop cho mọi người. Phù hợp nhất với sáng tạo trực quan, ghi chú, trình diễn và làm việc di động.",
      },
    },
    variant: {
      name: "256GB Wi-Fi Silver",
      skuCode: "MVX33",
      marketName: "iPad Pro 13-inch M4 Wi-Fi",
      colorName: "Silver",
      colorHex: "#D7D8DA",
      launchPriceUsd: 1299,
      heightMm: 281.6,
      widthMm: 215.5,
      thicknessMm: 5.1,
      weightG: 579,
      frameMaterial: "Aluminum",
      backMaterial: "Aluminum",
      frontGlass: "Fully laminated glass",
      io: {
        simSlots: 0,
        esimSupported: false,
        stereoSpeakers: true,
        speakerCount: 4,
        headphoneJack: false,
        hasMicrosdSlot: false,
        notes: "Thunderbolt / USB 4 và Smart Connector.",
      },
    },
    modules: {
      chipset: "apple-m4",
      cpu: "apple-m4-cpu",
      gpu: "apple-m4-gpu",
      npu: "apple-neural-engine-m4",
      display: "ipad-pro-13-m4-display",
      battery: "ipad-pro-13-m4-battery",
      memory: { slug: "apple-unified-memory", capacityGb: 8 },
      storage: { slug: "apple-nvme", capacityGb: 256 },
    },
    sourceUrl: "https://support.apple.com/en-us/119891",
  },
  {
    brandSlug: "apple",
    categorySlug: "laptop",
    family: {
      name: "MacBook Pro M4 Series",
      slug: "macbook-pro-m4-series",
      description:
        "Dòng MacBook Pro M4 tập trung vào công việc chuyên nghiệp, hiệu năng duy trì, màn hình Liquid Retina XDR, thời lượng pin dài và hệ thống cổng kết nối thực dụng.",
      firstReleaseYear: 2024,
    },
    model: {
      name: "MacBook Pro 14-inch M4 Pro",
      slug: "macbook-pro-14-m4-pro",
      summary:
        "MacBook Pro 14-inch M4 Pro là laptop chuyên nghiệp cân bằng giữa hiệu năng, màn hình Liquid Retina XDR, hệ thống cổng đầy đủ và thời lượng pin dài.",
      generation: "M4 Pro",
      announcementDate: "2024-10-30",
      releaseDate: "2024-11-08",
      coverImageUrl: "/images/devices/macbook-pro-14-m4-pro.webp",
      aliases: ["MacBook Pro 14 M4 Pro"],
      description: {
        highlights:
          "MacBook Pro 14-inch M4 Pro kết hợp Apple Silicon hiệu năng cao với màn hình mini-LED, hệ thống tản nhiệt chủ động và bộ cổng dành cho công việc. Kích thước 14 inch phù hợp người thường xuyên di chuyển.",
        design:
          "Vỏ nhôm nguyên khối có hai màu Space Black và Silver. Máy dày khoảng 15,5 mm, nặng khoảng 1,6 kg, dùng bàn phím có Touch ID, trackpad lớn và bố trí cổng gồm Thunderbolt 5, HDMI, SDXC, MagSafe và jack tai nghe.",
        performance:
          "M4 Pro cung cấp các tùy chọn CPU và GPU nhiều lõi, Neural Engine 16 lõi cùng băng thông bộ nhớ cao. Cấu hình 24 GB bộ nhớ hợp nhất và SSD 512 GB phù hợp biên dịch, dựng video, thiết kế 3D và xử lý dữ liệu.",
        experience:
          "Màn hình Liquid Retina XDR 14,2 inch có ProMotion đến 120 Hz, độ tương phản cao và khả năng hiển thị HDR tốt. Hệ thống loa, webcam và micro phục vụ họp trực tuyến lẫn biên tập nội dung.",
        battery:
          "Pin 72,4 Wh hỗ trợ sạc qua MagSafe hoặc USB-C; bộ nguồn công suất cao có thể sạc nhanh. Hiệu suất trên mỗi watt là ưu điểm khi chạy tác vụ nặng mà không cắm điện.",
        software:
          "macOS tích hợp tốt với iPhone, iPad và các công cụ sáng tạo, phát triển phần mềm. Nền tảng Apple Silicon chạy ứng dụng native hiệu quả; phần mềm x86 cũ có thể dùng lớp tương thích Rosetta khi được hỗ trợ.",
        limits:
          "Bộ nhớ và SSD không thể nâng cấp sau khi mua, giá nâng cấu hình cao và khả năng chơi game vẫn hạn chế hơn laptop Windows. Phù hợp với lập trình viên, nhà sáng tạo và người cần máy làm việc ổn định lâu dài.",
      },
    },
    variant: {
      name: "24GB 512GB Space Black",
      skuCode: "MX2H3",
      marketName: "MacBook Pro 14-inch M4 Pro",
      colorName: "Space Black",
      colorHex: "#2E2C2B",
      launchPriceUsd: 1999,
      heightMm: 221.2,
      widthMm: 312.6,
      thicknessMm: 15.5,
      weightG: 1600,
      frameMaterial: "Aluminum",
      backMaterial: "Aluminum",
      frontGlass: "Display glass",
      io: {
        stereoSpeakers: true,
        speakerCount: 6,
        headphoneJack: true,
        hasMicrosdSlot: true,
        notes: "Ba cổng Thunderbolt 5, HDMI, SDXC, MagSafe 3 và jack 3,5 mm.",
      },
    },
    modules: {
      chipset: "apple-m4-pro",
      cpu: "apple-m4-pro-cpu",
      gpu: "apple-gpu-m4-pro",
      npu: "apple-neural-engine-m4",
      display: "macbook-pro-14-m4-display",
      battery: "macbook-pro-14-m4-battery",
      memory: { slug: "apple-unified-memory", capacityGb: 24 },
      storage: { slug: "apple-nvme", capacityGb: 512 },
    },
    sourceUrl: "https://support.apple.com/en-us/121553",
  },
  {
    brandSlug: "samsung",
    categorySlug: "smartwatch",
    family: {
      name: "Galaxy Watch7 Series",
      slug: "galaxy-watch7-series",
      description:
        "Galaxy Watch7 là dòng đồng hồ Wear OS tập trung vào theo dõi sức khỏe, luyện tập, định vị và liên kết với điện thoại Android, đặc biệt là hệ sinh thái Samsung Galaxy.",
      firstReleaseYear: 2024,
    },
    model: {
      name: "Galaxy Watch7 44mm",
      slug: "galaxy-watch7-44mm",
      summary:
        "Galaxy Watch7 44mm sử dụng Exynos W1000, màn hình Super AMOLED, GPS băng tần kép và cảm biến sức khỏe BioActive trong thiết kế nhẹ.",
      generation: "Watch7",
      announcementDate: "2024-07-10",
      releaseDate: "2024-07-24",
      coverImageUrl: "/images/devices/galaxy-watch7-44mm.webp",
      aliases: ["Samsung Galaxy Watch7 44mm"],
      description: {
        highlights:
          "Galaxy Watch7 44mm là mẫu smartwatch phổ thông cao cấp của Samsung, có màn hình Super AMOLED, nền tảng Exynos W1000 và hệ thống cảm biến BioActive phục vụ theo dõi sức khỏe, giấc ngủ và luyện tập.",
        design:
          "Vỏ nhôm 44 mm có khối lượng nhẹ, hai nút vật lý và dây đeo thay nhanh. Kính sapphire tăng khả năng chống xước; chuẩn chống nước và bụi giúp đồng hồ phù hợp hoạt động hằng ngày.",
        performance:
          "Exynos W1000 cải thiện tốc độ mở ứng dụng và hiệu quả năng lượng so với thế hệ trước. Bộ nhớ trong lưu ứng dụng, bản đồ và nhạc, trong khi kết nối LTE trên phiên bản này cho phép sử dụng độc lập ở một số tình huống.",
        experience:
          "Màn hình tròn Super AMOLED hiển thị rõ ngoài trời và hỗ trợ Always-On. GPS băng tần kép tăng độ ổn định khi chạy bộ; cảm biến sức khỏe cung cấp dữ liệu xu hướng nhưng không thay thế thiết bị y tế chuyên dụng.",
        battery:
          "Pin 425 mAh hỗ trợ sạc không dây. Thời lượng phụ thuộc Always-On, LTE, GPS và tần suất đo sức khỏe; người dùng tập luyện dài nên cân nhắc lịch sạc phù hợp.",
        software:
          "Wear OS với giao diện One UI Watch hỗ trợ Google Play, thông báo, thanh toán và đồng bộ Samsung Health. Một số chức năng sức khỏe nâng cao có thể yêu cầu điện thoại Samsung hoặc phụ thuộc khu vực.",
        limits:
          "Thời lượng pin không dài bằng đồng hồ thể thao chuyên dụng và tính tương thích với iPhone rất hạn chế. Phù hợp người dùng Android cần smartwatch đa năng, theo dõi sức khỏe và kết nối hệ sinh thái Galaxy.",
      },
    },
    variant: {
      name: "44mm LTE Green",
      skuCode: "SM-L315",
      marketName: "Galaxy Watch7 44mm LTE",
      colorName: "Green",
      colorHex: "#6E756D",
      launchPriceUsd: 329.99,
      heightMm: 44.4,
      widthMm: 44.4,
      thicknessMm: 9.7,
      weightG: 33.8,
      frameMaterial: "Armor Aluminum",
      frontGlass: "Sapphire crystal",
      ingressProtection: "5ATM + IP68",
      io: {
        esimSupported: true,
        speakerCount: 1,
        notes: "LTE/eSIM, Bluetooth, Wi-Fi, NFC và GPS băng tần kép.",
      },
    },
    modules: {
      chipset: "exynos-w1000",
      cpu: "exynos-w1000-cpu",
      npu: "exynos-w1000-npu",
      display: "galaxy-watch7-44-display",
      battery: "galaxy-watch7-44-battery",
    },
    sourceUrl: "https://www.samsung.com/us/watches/galaxy-watch7/",
  },
  {
    brandSlug: "apple",
    categorySlug: "earbuds",
    family: {
      name: "AirPods Pro Series",
      slug: "airpods-pro-series",
      description:
        "AirPods Pro là dòng tai nghe true wireless cao cấp của Apple, tập trung vào chống ồn chủ động, âm thanh thích ứng, khả năng chuyển đổi thiết bị và tích hợp hệ sinh thái.",
      firstReleaseYear: 2019,
    },
    model: {
      name: "AirPods Pro 2 USB-C",
      slug: "airpods-pro-2-usbc",
      summary:
        "AirPods Pro 2 USB-C kết hợp chip H2, chống ồn chủ động, âm thanh thích ứng và hộp sạc MagSafe dùng USB-C trong thiết kế nhỏ gọn.",
      generation: "2nd gen USB-C",
      announcementDate: "2023-09-12",
      releaseDate: "2023-09-22",
      coverImageUrl: "/images/devices/airpods-pro-2-usbc.webp",
      aliases: ["AirPods Pro (2nd generation) USB-C"],
      description: {
        highlights:
          "AirPods Pro 2 USB-C sử dụng chip H2 để điều khiển chống ồn chủ động, Transparency, Adaptive Audio và Spatial Audio. Hộp sạc hỗ trợ USB-C, MagSafe, sạc Qi và có loa phục vụ tính năng tìm kiếm.",
        design:
          "Mỗi tai nghe nặng khoảng 5,3 g, dùng nút silicone nhiều kích cỡ và điều khiển cảm ứng lực kết hợp vuốt âm lượng. Tai nghe cùng hộp sạc có khả năng kháng bụi, nước và mồ hôi theo chuẩn được công bố.",
        performance:
          "Chip H2 xử lý âm thanh, micro và thuật toán chống ồn theo thời gian thực. Chất lượng kết nối và độ trễ tốt nhất khi dùng với thiết bị Apple; codec và tính năng trên nền tảng khác bị giới hạn.",
        experience:
          "Chống ồn phù hợp đi lại, văn phòng và chuyến bay; Transparency giúp nghe môi trường khi cần. Personalized Spatial Audio và chuyển đổi thiết bị tự động tạo trải nghiệm liền mạch trong hệ sinh thái.",
        battery:
          "Tai nghe đạt tối đa khoảng 6 giờ nghe trong điều kiện thử nghiệm; tổng thời gian với hộp sạc có thể đạt khoảng 30 giờ. Sạc nhanh trong hộp phù hợp các phiên nghe ngắn.",
        software:
          "Các thiết lập được tích hợp trực tiếp trong iOS, iPadOS và macOS; cập nhật firmware diễn ra tự động. Find My hỗ trợ xác định tai nghe và hộp sạc trong các điều kiện tương thích.",
        limits:
          "Không có ứng dụng quản lý đầy đủ cho Android, pin không thể tự thay dễ dàng và chất âm phụ thuộc độ kín của nút tai. Phù hợp nhất với người dùng Apple cần ANC gọn nhẹ và thao tác đơn giản.",
      },
    },
    variant: {
      name: "USB-C White",
      skuCode: "MTJV3",
      marketName: "AirPods Pro 2 with MagSafe Charging Case USB-C",
      colorName: "White",
      colorHex: "#F5F5F2",
      launchPriceUsd: 249,
      heightMm: 45.2,
      widthMm: 60.6,
      thicknessMm: 21.7,
      weightG: 50.8,
      backMaterial: "Polycarbonate",
      ingressProtection: "IP54",
      io: {
        speakerCount: 2,
        notes: "Kích thước và khối lượng tính theo hộp sạc; Bluetooth 5.3.",
      },
    },
    modules: {
      chipset: "apple-h2",
      cpu: "apple-h2-audio-controller",
      battery: "airpods-pro-2-usbc-battery",
    },
    sourceUrl: "https://support.apple.com/en-us/111834",
  },
  {
    brandSlug: "sony",
    categorySlug: "television",
    family: {
      name: "Sony BRAVIA 9 Series",
      slug: "sony-bravia-9-series",
      description:
        "BRAVIA 9 là dòng TV Mini LED 4K cao cấp của Sony, ưu tiên kiểm soát đèn nền, xử lý hình ảnh XR, nội dung điện ảnh và hệ thống âm thanh tích hợp.",
      firstReleaseYear: 2024,
    },
    model: {
      name: "Sony BRAVIA 9 65-inch",
      slug: "sony-bravia-9-65",
      summary:
        "Sony BRAVIA 9 65-inch là TV Mini LED 4K cao cấp với XR Backlight Master Drive, Google TV, tần số quét 120 Hz và âm thanh đa hướng.",
      generation: "BRAVIA 9",
      announcementDate: "2024-04-17",
      releaseDate: "2024-05-01",
      coverImageUrl: "/images/devices/sony-bravia-9-65.webp",
      aliases: ["Sony K-65XR90"],
      description: {
        highlights:
          "Sony BRAVIA 9 65-inch sử dụng tấm nền Mini LED 4K cùng XR Backlight Master Drive để kiểm soát vùng sáng, nâng độ tương phản và duy trì độ sáng cao cho nội dung HDR.",
        design:
          "Thiết kế viền mỏng, chân đế linh hoạt và hệ thống quản lý cáp phù hợp phòng khách cao cấp. Kích thước, khối lượng và khoảng cách lắp đặt cần được kiểm tra trước khi treo tường hoặc đặt trên kệ.",
        performance:
          "Bộ xử lý Sony XR phân tích hình ảnh, nâng cấp nội dung độ phân giải thấp và điều chỉnh chuyển động. Hai cổng HDMI 2.1 phục vụ 4K 120 Hz, VRR và ALLM cho máy chơi game tương thích.",
        experience:
          "Tấm nền 65 inch có độ phân giải 3840 × 2160 và tần số quét 120 Hz. Acoustic Multi-Audio+ định vị âm thanh theo hình ảnh; người dùng phòng lớn vẫn có thể bổ sung soundbar để tăng dải trầm.",
        battery:
          "TV dùng nguồn điện trực tiếp, hỗ trợ Wi-Fi, Bluetooth, Ethernet và nhiều cổng HDMI/USB. Mức điện năng thay đổi đáng kể theo độ sáng HDR, chế độ hình ảnh và thời gian hoạt động.",
        software:
          "Google TV cung cấp ứng dụng phát trực tuyến, tìm kiếm giọng nói, Chromecast và quản lý nội dung. Tính sẵn có của ứng dụng, tính năng quảng cáo và cập nhật phụ thuộc khu vực.",
        limits:
          "Giá cao, chỉ hai cổng HDMI hỗ trợ đầy đủ tính năng chơi game thế hệ mới và Mini LED vẫn có thể xuất hiện quầng sáng trong cảnh khó. Phù hợp người ưu tiên phim HDR, thể thao và xử lý hình ảnh tự nhiên.",
      },
    },
    variant: {
      name: "65-inch Black",
      skuCode: "K-65XR90",
      marketName: "Sony BRAVIA 9 65-inch",
      colorName: "Black",
      colorHex: "#171819",
      launchPriceUsd: 3299.99,
      heightMm: 862,
      widthMm: 1447,
      thicknessMm: 345,
      weightG: 32900,
      frameMaterial: "Aluminum",
      backMaterial: "Composite",
      io: {
        stereoSpeakers: true,
        speakerCount: 8,
        notes: "Bốn HDMI; hai cổng hỗ trợ HDMI 2.1, eARC, Ethernet và USB.",
      },
    },
    modules: {
      chipset: "sony-xr-processor-2024",
      cpu: "sony-xr-cpu-2024",
      gpu: "sony-xr-graphics-2024",
      display: "sony-bravia-9-65-display",
      memory: { slug: "lpddr4x", capacityGb: 4, speedMhz: 2133 },
      storage: { slug: "emmc-5-1", capacityGb: 32 },
    },
    sourceUrl:
      "https://www.sony.com/electronics/support/televisions-projectors-lcd-tvs-android-/k-65xr90/specifications",
  },
  {
    brandSlug: "valve",
    categorySlug: "gaming-handheld",
    family: {
      name: "Steam Deck Series",
      slug: "steam-deck-series",
      description:
        "Steam Deck là dòng PC chơi game cầm tay do Valve phát triển, kết hợp thư viện Steam, hệ điều hành SteamOS, điều khiển tích hợp và khả năng mở rộng theo hướng máy tính cá nhân.",
      firstReleaseYear: 2022,
    },
    model: {
      name: "Steam Deck OLED",
      slug: "steam-deck-oled",
      summary:
        "Steam Deck OLED là PC gaming cầm tay với màn hình OLED HDR 7,4 inch 90 Hz, APU AMD Zen 2/RDNA 2, RAM 16 GB và hệ điều hành SteamOS.",
      generation: "OLED",
      announcementDate: "2023-11-09",
      releaseDate: "2023-11-16",
      coverImageUrl: "/images/devices/steam-deck-oled.webp",
      aliases: ["Valve Steam Deck OLED"],
      description: {
        highlights:
          "Steam Deck OLED nâng cấp màn hình, pin, kết nối và nhiệt độ hoạt động so với bản LCD nhưng giữ nền tảng hiệu năng tương tự. Máy chạy trực tiếp thư viện Steam trong giao diện tối ưu cho tay cầm.",
        design:
          "Thân máy 298 × 117 × 49 mm nặng khoảng 640 g, có cần analog, trackpad, gyro và bốn nút lưng tùy biến. Kích thước lớn tạo độ thoải mái khi chơi lâu nhưng kém gọn hơn máy chơi game cầm tay truyền thống.",
        performance:
          "APU AMD 6 nm gồm CPU Zen 2 bốn lõi/tám luồng và GPU RDNA 2 tám compute unit trong giới hạn công suất 4–15 W. RAM LPDDR5 16 GB và SSD NVMe 512 GB đáp ứng nhiều trò chơi ở độ phân giải gốc 1280 × 800.",
        experience:
          "Màn hình OLED HDR 7,4 inch đạt 90 Hz, độ sáng HDR cực đại khoảng 1000 nit và dải màu rộng. Loa stereo, rung, trackpad và khả năng tạm dừng nhanh giúp trải nghiệm gần máy console.",
        battery:
          "Pin 50 Wh được công bố cho khoảng 3–12 giờ tùy trò chơi. Máy hỗ trợ sạc USB-C PD 45 W, Wi-Fi 6E, Bluetooth 5.3 và khe microSD để mở rộng thư viện.",
        software:
          "SteamOS 3 dựa trên Linux, có giao diện Gaming Mode và KDE Plasma ở Desktop Mode. Khả năng tương thích trò chơi phụ thuộc Proton, hệ thống chống gian lận và trạng thái Deck Verified.",
        limits:
          "Hiệu năng không nhắm đến độ phân giải cao, một số trò chơi trực tuyến không tương thích và thân máy khá lớn. Phù hợp người có thư viện Steam, thích tùy biến PC và ưu tiên trải nghiệm cầm tay linh hoạt.",
      },
    },
    variant: {
      name: "512GB OLED Black",
      skuCode: "STEAM-DECK-OLED-512",
      marketName: "Steam Deck OLED 512GB",
      colorName: "Black",
      colorHex: "#1B1C1D",
      launchPriceUsd: 549,
      heightMm: 117,
      widthMm: 298,
      thicknessMm: 49,
      weightG: 640,
      frameMaterial: "Polycarbonate",
      backMaterial: "Polycarbonate",
      frontGlass: "Optically bonded display glass",
      io: {
        stereoSpeakers: true,
        speakerCount: 2,
        headphoneJack: true,
        hasMicrosdSlot: true,
        microsdMaxCapacityGb: 2048,
        notes: "USB-C DisplayPort 1.4, microSD UHS-I và jack 3,5 mm.",
      },
    },
    modules: {
      chipset: "amd-sephiroth-apu",
      cpu: "amd-zen2-steam-deck-cpu",
      gpu: "amd-rdna2-8cu",
      display: "steam-deck-oled-display",
      battery: "steam-deck-oled-battery",
      memory: { slug: "lpddr5", capacityGb: 16, speedMhz: 6400 },
      storage: {
        slug: "pcie-4-nvme",
        capacityGb: 512,
        expandable: true,
        expansionMaxGb: 2048,
      },
    },
    sourceUrl: "https://www.steamdeck.com/en/tech/oled",
  },
  {
    brandSlug: "amazon-devices",
    categorySlug: "e-reader",
    family: {
      name: "Kindle Paperwhite Series",
      slug: "kindle-paperwhite-series",
      description:
        "Kindle Paperwhite là dòng máy đọc sách phổ thông cao cấp với màn hình E Ink chống chói, đèn nền điều chỉnh ấm, khả năng chống nước và tích hợp thư viện Kindle.",
      firstReleaseYear: 2012,
    },
    model: {
      name: "Kindle Paperwhite 12th Gen",
      slug: "kindle-paperwhite-12th-gen",
      summary:
        "Kindle Paperwhite 12th Gen có màn hình E Ink 7 inch chống chói, đèn nền điều chỉnh ấm, bộ nhớ 16 GB, chuẩn IPX8 và pin nhiều tuần.",
      generation: "12th gen",
      announcementDate: "2024-10-16",
      releaseDate: "2024-10-16",
      coverImageUrl: "/images/devices/kindle-paperwhite-12th-gen.webp",
      aliases: ["Kindle Paperwhite 2024"],
      description: {
        highlights:
          "Kindle Paperwhite thế hệ 12 tập trung vào trải nghiệm đọc với màn hình E Ink 7 inch, phản hồi nhanh hơn, đèn nền điều chỉnh nhiệt độ màu và khả năng chống nước IPX8.",
        design:
          "Thân máy mỏng, nhẹ khoảng 211 g và mặt trước phẳng giúp lật trang thuận tiện. Vật liệu tối màu giảm phản xạ nhưng bề mặt có thể bám dấu tay; bao bảo vệ hữu ích khi mang theo.",
        performance:
          "Nền tảng MediaTek điều khiển giao diện đọc, đồng bộ thư viện và xử lý chuyển trang; đây không phải thiết bị dành cho ứng dụng đa nhiệm. Bộ nhớ 16 GB đủ cho hàng nghìn ebook và một lượng sách nói tùy dung lượng.",
        experience:
          "Màn hình E Ink 7 inch có mật độ cao, chống chói và dễ đọc ngoài trời. Đèn nền ấm hỗ trợ đọc ban đêm; tốc độ làm mới thấp hơn LCD/OLED là đặc tính của công nghệ E Ink.",
        battery:
          "Pin được công bố có thể kéo dài đến nhiều tuần trong điều kiện tham chiếu. Sạc qua USB-C; Wi-Fi và độ sáng cao sẽ làm thời lượng giảm nhanh hơn.",
        software:
          "Kindle OS tích hợp cửa hàng Kindle, đồng bộ vị trí đọc, từ điển, ghi chú và dịch vụ tài khoản Amazon. Hỗ trợ định dạng và khả năng chuyển tài liệu phụ thuộc phần mềm cùng chính sách dịch vụ.",
        limits:
          "Màn hình đơn sắc, tốc độ phản hồi không phù hợp video hoặc ứng dụng tương tác và hệ sinh thái nội dung gắn chặt với Amazon. Phù hợp người đọc sách dài, cần pin lâu và muốn giảm xao nhãng.",
      },
    },
    variant: {
      name: "16GB Black",
      skuCode: "B0CFPHV9ZN",
      marketName: "Kindle Paperwhite 12th Gen 16GB",
      colorName: "Black",
      colorHex: "#202122",
      launchPriceUsd: 159.99,
      heightMm: 176.7,
      widthMm: 127.6,
      thicknessMm: 7.8,
      weightG: 211,
      frameMaterial: "Recycled magnesium",
      backMaterial: "Recycled plastic",
      frontGlass: "Anti-glare display surface",
      ingressProtection: "IPX8",
      io: {
        stereoSpeakers: false,
        headphoneJack: false,
        hasMicrosdSlot: false,
        notes: "USB-C, Wi-Fi và Bluetooth cho VoiceView hoặc sách nói.",
      },
    },
    modules: {
      chipset: "mediatek-mt8113",
      cpu: "mediatek-mt8113-cpu",
      gpu: "mediatek-mt8113-display-engine",
      display: "kindle-paperwhite-12-display",
      battery: "kindle-paperwhite-12th-gen-battery",
      memory: { slug: "lpddr4", capacityGb: 1, speedMhz: 800 },
      storage: { slug: "emmc-5-1", capacityGb: 16 },
    },
    sourceUrl:
      "https://www.amazon.com/gp/help/customer/display.html?nodeId=GK33S847NN4V6Y83",
  },
];

const moduleDescriptions = {
  chipsets: [
    {
      slug: "apple-a18-pro",
      organization: "apple",
      description:
        "Apple A18 Pro là SoC cao cấp cho iPhone Pro, tích hợp CPU, GPU, Neural Engine và bộ xử lý hình ảnh trên một nền tảng tiết kiệm năng lượng; module phù hợp tác vụ di động nặng nhưng không thể nâng cấp độc lập.",
    },
    {
      slug: "apple-m4",
      organization: "apple",
      description:
        "Apple M4 là nền tảng Apple Silicon tích hợp CPU, GPU, Neural Engine và bộ nhớ hợp nhất cho máy tính bảng và máy tính; ưu thế nằm ở hiệu suất trên mỗi watt, còn RAM và GPU không thể thay rời.",
    },
    {
      slug: "apple-m4-pro",
      organization: "apple",
      description:
        "Apple M4 Pro là SoC dành cho máy Mac chuyên nghiệp, có CPU/GPU nhiều lõi, Neural Engine và băng thông bộ nhớ hợp nhất cao; module tối ưu cho dựng nội dung và phát triển phần mềm nhưng không nâng cấp sau mua.",
    },
    {
      slug: "exynos-w1000",
      organization: "samsung",
      description:
        "Exynos W1000 là SoC 3 nm dành cho thiết bị đeo, tích hợp CPU nhiều lõi, xử lý đồ họa và khả năng AI trong giới hạn điện năng thấp; hiệu năng được tối ưu cho Wear OS thay vì tác vụ máy tính phổ thông.",
    },
    {
      slug: "apple-h2",
      organization: "apple",
      description:
        "Apple H2 là chip xử lý âm thanh chuyên dụng cho AirPods Pro, đảm nhiệm chống ồn, Transparency, âm thanh thích ứng và điều khiển micro theo thời gian thực; module hoạt động gắn với firmware và hệ sinh thái Apple.",
    },
    {
      slug: "sony-xr-processor-2024",
      organization: "sony",
      description:
        "Sony XR Processor là nền tảng xử lý hình ảnh và âm thanh cho TV BRAVIA, thực hiện nâng cấp độ phân giải, ánh xạ HDR và điều khiển chuyển động; hiệu quả phụ thuộc tấm nền, firmware và chế độ hình ảnh.",
    },
    {
      slug: "amd-sephiroth-apu",
      organization: "amd",
      description:
        "AMD Sephiroth là APU bán tùy biến 6 nm của Steam Deck OLED, kết hợp CPU Zen 2 bốn lõi/tám luồng và GPU RDNA 2 tám CU trong mức điện 4–15 W; module được hàn cố định và ưu tiên hiệu quả cầm tay.",
    },
    {
      slug: "mediatek-mt8113",
      organization: "mediatek",
      description:
        "MediaTek MT8113 là nền tảng tích hợp cho máy đọc sách, đảm nhiệm xử lý giao diện, kết nối và điều khiển màn hình E Ink với điện năng thấp; module phù hợp đọc nội dung nhưng không hướng đến đa nhiệm nặng.",
    },
  ],
  cpus: [
    {
      slug: "apple-a18-pro-cpu",
      organization: "apple",
      description:
        "CPU Apple A18 Pro dùng cụm lõi hiệu năng và tiết kiệm điện cho tác vụ di động, phối hợp chặt với bộ nhớ và hệ điều hành iOS; cấu hình nằm trong SoC nên không thể thay thế hoặc nâng cấp độc lập.",
    },
    {
      slug: "apple-m4-cpu",
      organization: "apple",
      description:
        "CPU Apple M4 sử dụng kiến trúc lõi hiệu năng và tiết kiệm điện, phục vụ ứng dụng sáng tạo, năng suất và AI trên thiết bị; hiệu năng thực tế phụ thuộc cấu hình SoC, giới hạn nhiệt và phần mềm.",
    },
    {
      slug: "apple-m4-pro-cpu",
      organization: "apple",
      description:
        "CPU Apple M4 Pro là bộ xử lý nhiều lõi cho máy Mac chuyên nghiệp, ưu tiên hiệu năng duy trì và hiệu suất trên mỗi watt; số lõi thay đổi theo cấu hình và không thể nâng cấp sau khi xuất xưởng.",
    },
    {
      slug: "exynos-w1000-cpu",
      organization: "samsung",
      description:
        "CPU Exynos W1000 là cụm xử lý nhiều lõi cho smartwatch, tối ưu phản hồi giao diện, cảm biến và ứng dụng Wear OS trong ngân sách pin nhỏ; không phù hợp so sánh trực tiếp với CPU điện thoại hoặc laptop.",
    },
    {
      slug: "apple-h2-audio-controller",
      organization: "apple",
      description:
        "Apple H2 Audio Controller xử lý luồng micro, chống ồn, Transparency và điều khiển âm thanh trên AirPods Pro 2; đây là bộ điều khiển chuyên dụng, phụ thuộc firmware và không phải CPU đa dụng.",
    },
    {
      slug: "sony-xr-cpu-2024",
      organization: "sony",
      description:
        "Sony XR CPU điều phối hệ điều hành TV, pipeline hình ảnh và các tác vụ nền trên BRAVIA; module ưu tiên phát media ổn định, còn tốc độ ứng dụng phụ thuộc bộ nhớ, lưu trữ và bản cập nhật Google TV.",
    },
    {
      slug: "amd-zen2-steam-deck-cpu",
      organization: "amd",
      description:
        "AMD Zen 2 Steam Deck CPU có bốn lõi và tám luồng, hoạt động trong APU công suất thấp cho trò chơi cầm tay; giới hạn điện năng giữ nhiệt độ và pin hợp lý nhưng hạn chế tốc độ ở game phụ thuộc CPU.",
    },
    {
      slug: "mediatek-mt8113-cpu",
      organization: "mediatek",
      description:
        "MediaTek MT8113 CPU là bộ xử lý tiết kiệm điện dành cho tác vụ đọc sách, đồng bộ nội dung và điều khiển giao diện đơn giản; tốc độ làm mới E Ink và phần mềm là giới hạn chính của trải nghiệm.",
    },
  ],
  gpus: [
    {
      slug: "apple-gpu-a18-pro-6core",
      organization: "apple",
      description:
        "GPU 6 lõi trong Apple A18 Pro xử lý đồ họa di động, hiệu ứng giao diện, trò chơi và tăng tốc tác vụ tính toán; hỗ trợ ray tracing phần cứng nhưng hiệu năng dài hạn phụ thuộc nhiệt độ thân máy.",
    },
    {
      slug: "apple-m4-gpu",
      organization: "apple",
      description:
        "Apple M4 GPU tích hợp trong SoC và dùng chung bộ nhớ hợp nhất, hỗ trợ đồ họa, dựng video và ray tracing tăng tốc phần cứng; số lõi phụ thuộc cấu hình và không thể thay thế bằng GPU rời.",
    },
    {
      slug: "apple-gpu-m4-pro",
      organization: "apple",
      description:
        "Apple GPU M4 Pro là bộ xử lý đồ họa tích hợp nhiều lõi cho workflow sáng tạo, dựng 3D và tính toán; dùng bộ nhớ hợp nhất băng thông cao nhưng khả năng tương thích trò chơi phụ thuộc macOS.",
    },
    {
      slug: "sony-xr-graphics-2024",
      organization: "sony",
      description:
        "Sony XR Graphics đảm nhiệm dựng giao diện và hỗ trợ pipeline hình ảnh trên TV BRAVIA 9; module tối ưu phát video 4K và xử lý chuyển động, không được thiết kế như GPU máy tính đa dụng.",
    },
    {
      slug: "amd-rdna2-8cu",
      organization: "amd",
      description:
        "AMD RDNA 2 8CU là GPU tích hợp trong APU Steam Deck, chạy đến khoảng 1,6 GHz và nhắm đến độ phân giải 1280 × 800; giới hạn công suất giúp tiết kiệm pin nhưng cần điều chỉnh đồ họa ở game nặng.",
    },
    {
      slug: "mediatek-mt8113-display-engine",
      organization: "mediatek",
      description:
        "MediaTek MT8113 Display Engine điều khiển nội dung và quá trình làm mới màn hình E Ink trên Kindle Paperwhite; ưu tiên độ rõ chữ và điện năng thấp thay vì hoạt ảnh hoặc đồ họa tốc độ cao.",
    },
  ],
  npus: [
    {
      slug: "apple-neural-engine-a18-pro",
      organization: "apple",
      description:
        "Apple Neural Engine trong A18 Pro là bộ tăng tốc học máy nhiều lõi cho nhận dạng hình ảnh, ngôn ngữ và các tính năng AI trên thiết bị; khả năng sử dụng phụ thuộc API, hệ điều hành và vùng hỗ trợ.",
    },
    {
      slug: "apple-neural-engine-m4",
      organization: "apple",
      description:
        "Apple Neural Engine thế hệ M4 tăng tốc mô hình học máy, xử lý hình ảnh và tác vụ AI trong ứng dụng iPadOS/macOS; hiệu năng thực tế phụ thuộc độ chính xác số, mô hình và mức tối ưu phần mềm.",
    },
    {
      slug: "exynos-w1000-npu",
      organization: "samsung",
      description:
        "Exynos W1000 NPU là bộ tăng tốc AI điện năng thấp cho thiết bị đeo, hỗ trợ xử lý cảm biến, sức khỏe và tác vụ thông minh cục bộ; năng lực được tối ưu cho smartwatch thay vì mô hình AI quy mô lớn.",
    },
  ],
  displays: [
    {
      slug: "iphone-16-pro-display",
      organization: "apple",
      description:
        "Màn hình Super Retina XDR OLED 6,3 inch của iPhone 16 Pro có độ phân giải 2622 × 1206, mật độ 460 ppi, Always-On và ProMotion đến 120 Hz; độ sáng và tần số thay đổi theo nội dung.",
    },
    {
      slug: "ipad-pro-13-m4-display",
      organization: "apple",
      description:
        "Ultra Retina XDR 13 inch dùng cấu trúc Tandem OLED, độ phân giải 2752 × 2064, ProMotion 10–120 Hz và độ sáng HDR cực đại 1600 nit; bề mặt kính vẫn cần tránh va đập và phản xạ mạnh.",
    },
    {
      slug: "macbook-pro-14-m4-display",
      organization: "apple",
      description:
        "Liquid Retina XDR 14,2 inch là màn hình mini-LED độ phân giải cao, hỗ trợ ProMotion đến 120 Hz, dải màu rộng và HDR; hiện tượng blooming nhẹ có thể xuất hiện trong cảnh tương phản cực cao.",
    },
    {
      slug: "galaxy-watch7-44-display",
      organization: "samsung",
      description:
        "Màn hình Super AMOLED tròn của Galaxy Watch7 44 mm hỗ trợ Always-On, màu sắc tương phản cao và kính sapphire; độ sáng cao hoặc bật Always-On liên tục sẽ làm giảm thời lượng pin.",
    },
    {
      slug: "sony-bravia-9-65-display",
      organization: "sony",
      description:
        "Tấm nền BRAVIA 9 Mini LED 65 inch có độ phân giải 4K, tần số 120 Hz và hệ thống đèn nền nhiều vùng cho HDR sáng; quầng sáng vẫn có thể xuất hiện quanh vật thể sáng trên nền tối.",
    },
    {
      slug: "steam-deck-oled-display",
      organization: "valve",
      description:
        "Màn hình Steam Deck OLED HDR 7,4 inch có độ phân giải 1280 × 800, tần số tối đa 90 Hz, dải màu rộng và độ sáng HDR cực đại khoảng 1000 nit; độ phân giải ưu tiên hiệu năng và pin.",
    },
    {
      slug: "kindle-paperwhite-12-display",
      organization: "amazon-devices",
      description:
        "Màn hình E Ink 7 inch của Kindle Paperwhite ưu tiên độ rõ chữ, chống chói và điện năng thấp, kèm đèn nền điều chỉnh ấm; tốc độ làm mới thấp nên không phù hợp video hoặc hoạt ảnh.",
    },
  ],
  batteries: [
    {
      slug: "iphone-16-pro-battery",
      organization: "apple",
      name: "iPhone 16 Pro Battery",
      description:
        "Pin lithium-ion tích hợp của iPhone 16 Pro có mức tham chiếu 3582 mAh, hỗ trợ sạc có dây và MagSafe/Qi2; dung lượng thực tế, tốc độ và tuổi thọ thay đổi theo nhiệt độ cùng chu kỳ sử dụng.",
    },
    {
      slug: "ipad-pro-13-m4-battery",
      organization: "apple",
      name: "iPad Pro 13-inch M4 Battery",
      description:
        "Pin lithium-polymer 38,99 Wh của iPad Pro 13-inch M4 hỗ trợ sạc qua USB-C và được tối ưu cho thân máy mỏng; thời lượng phụ thuộc độ sáng OLED, ứng dụng và phụ kiện kết nối.",
    },
    {
      slug: "macbook-pro-14-m4-battery",
      organization: "apple",
      name: "MacBook Pro 14-inch M4 Battery",
      description:
        "Pin lithium-polymer 72,4 Wh của MacBook Pro 14-inch hỗ trợ sạc qua MagSafe hoặc USB-C và sạc nhanh với bộ nguồn phù hợp; tải CPU/GPU dài sẽ rút ngắn thời lượng đáng kể.",
    },
    {
      slug: "galaxy-watch7-44-battery",
      organization: "samsung",
      name: "Galaxy Watch7 44mm Battery",
      description:
        "Pin 425 mAh tích hợp trong Galaxy Watch7 44 mm hỗ trợ sạc không dây; Always-On, LTE, GPS và đo sức khỏe liên tục là các yếu tố chính làm thay đổi thời lượng sử dụng.",
    },
    {
      slug: "airpods-pro-2-usbc-battery",
      organization: "apple",
      name: "AirPods Pro 2 USB-C Charging Case Battery",
      description:
        "Cụm pin trong hộp sạc AirPods Pro 2 USB-C hỗ trợ USB-C, MagSafe và Qi, cung cấp nhiều lần sạc cho tai nghe; pin được tích hợp kín và khả năng tự thay thế rất hạn chế.",
    },
    {
      slug: "steam-deck-oled-battery",
      organization: "valve",
      name: "Steam Deck OLED 50Wh Battery",
      description:
        "Pin 50 Wh của Steam Deck OLED hỗ trợ sạc USB-C PD 45 W và được công bố cho khoảng 3–12 giờ chơi; game nặng, độ sáng HDR và giới hạn công suất quyết định thời lượng thực tế.",
    },
    {
      slug: "kindle-paperwhite-12th-gen-battery",
      organization: "amazon-devices",
      name: "Kindle Paperwhite 12th Gen Battery",
      description:
        "Pin tích hợp của Kindle Paperwhite thế hệ 12 ưu tiên thời lượng nhiều tuần nhờ màn hình E Ink và trạng thái nghỉ sâu; Wi-Fi, đèn nền cao và sách nói làm tăng mức tiêu thụ.",
    },
  ],
};

function buildDescription(parts: DescriptionParts) {
  return [
    ["Điểm nổi bật", parts.highlights],
    ["Thiết kế và trải nghiệm", parts.design],
    ["Hiệu năng và phần cứng", parts.performance],
    ["Màn hình, âm thanh và tương tác", parts.experience],
    ["Pin và kết nối", parts.battery],
    ["Phần mềm và hệ sinh thái", parts.software],
    ["Hạn chế và đối tượng phù hợp", parts.limits],
  ]
    .map(([title, body]) => `## ${title}\n\n${body}`)
    .join("\n\n");
}

function validateSeedData() {
  const violations: string[] = [];

  for (const organization of organizations) {
    if (organization.description.trim().length < 80) {
      violations.push(`Organization ${organization.slug}: description < 80`);
    }
  }

  for (const device of devices) {
    const description = buildDescription(device.model.description);
    if (device.family.description.trim().length < 80) {
      violations.push(`Family ${device.family.slug}: description < 80`);
    }
    if (
      device.model.summary.trim().length < 80 ||
      device.model.summary.trim().length > 600
    ) {
      violations.push(`Model ${device.model.slug}: invalid summary length`);
    }
    if (description.trim().length < 240) {
      violations.push(`Model ${device.model.slug}: description < 240`);
    }
    if (!device.model.coverImageUrl.startsWith("/images/devices/")) {
      violations.push(`Model ${device.model.slug}: invalid local cover path`);
    }
  }

  if (violations.length) {
    throw new Error(`Standard catalog validation failed:\n${violations.join("\n")}`);
  }
}

async function updateModuleDescriptions(
  tx: Prisma.TransactionClient,
  organizationIds: Map<string, string>,
) {
  for (const item of moduleDescriptions.chipsets) {
    await tx.chipsets.update({
      where: { slug: item.slug },
      data: {
        manufacturer_org_id: organizationIds.get(item.organization),
        description: item.description,
      },
    });
  }
  for (const item of moduleDescriptions.cpus) {
    await tx.cpus.update({
      where: { slug: item.slug },
      data: {
        manufacturer_org_id: organizationIds.get(item.organization),
        description: item.description,
      },
    });
  }
  for (const item of moduleDescriptions.gpus) {
    await tx.gpus.update({
      where: { slug: item.slug },
      data: {
        manufacturer_org_id: organizationIds.get(item.organization),
        description: item.description,
      },
    });
  }
  for (const item of moduleDescriptions.npus) {
    await tx.npus.update({
      where: { slug: item.slug },
      data: {
        manufacturer_org_id: organizationIds.get(item.organization),
        description: item.description,
      },
    });
  }
  for (const item of moduleDescriptions.displays) {
    await tx.display_units.update({
      where: { slug: item.slug },
      data: {
        manufacturer_org_id: organizationIds.get(item.organization),
        description: item.description,
      },
    });
  }
  for (const item of moduleDescriptions.batteries) {
    await tx.battery_units.update({
      where: { slug: item.slug },
      data: {
        name: item.name,
        manufacturer_org_id: organizationIds.get(item.organization),
        description: item.description,
      },
    });
  }
}

async function resolveModuleId(
  tx: Prisma.TransactionClient,
  kind:
    | "chipsets"
    | "cpus"
    | "gpus"
    | "npus"
    | "display_units"
    | "battery_units"
    | "memory_standards"
    | "storage_standards",
  slug: string,
) {
  let record: { id: string } | null;
  switch (kind) {
    case "chipsets":
      record = await tx.chipsets.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
    case "cpus":
      record = await tx.cpus.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
    case "gpus":
      record = await tx.gpus.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
    case "npus":
      record = await tx.npus.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
    case "display_units":
      record = await tx.display_units.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
    case "battery_units":
      record = await tx.battery_units.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
    case "memory_standards":
      record = await tx.memory_standards.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
    case "storage_standards":
      record = await tx.storage_standards.findUnique({
        where: { slug },
        select: { id: true },
      });
      break;
  }

  if (!record) {
    throw new Error(`Missing required ${kind} module: ${slug}`);
  }
  return record.id;
}

async function seedDevice(
  tx: Prisma.TransactionClient,
  device: DeviceSeed,
  context: {
    organizationIds: Map<string, string>;
    categoryIds: Map<string, string>;
    releasedStatusId: number;
    usdCurrencyId: number;
    roleIds: Map<string, number>;
  },
) {
  const brandOrgId = context.organizationIds.get(device.brandSlug);
  const categoryId = context.categoryIds.get(device.categorySlug);
  if (!brandOrgId || !categoryId) {
    throw new Error(
      `Missing brand or category for ${device.model.slug}: ${device.brandSlug}/${device.categorySlug}`,
    );
  }

  const family = await tx.product_families.upsert({
    where: { slug: device.family.slug },
    update: {
      brand_org_id: brandOrgId,
      device_category_id: categoryId,
      name: device.family.name,
      description: device.family.description,
      first_release_year: device.family.firstReleaseYear,
      is_active: true,
      deleted_at: null,
    },
    create: {
      brand_org_id: brandOrgId,
      device_category_id: categoryId,
      name: device.family.name,
      slug: device.family.slug,
      description: device.family.description,
      first_release_year: device.family.firstReleaseYear,
      is_active: true,
    },
  });

  const description = buildDescription(device.model.description);
  const model = await tx.device_models.upsert({
    where: { slug: device.model.slug },
    update: {
      product_family_id: family.id,
      name: device.model.name,
      release_status_id: context.releasedStatusId,
      announcement_date: new Date(device.model.announcementDate),
      release_date: new Date(device.model.releaseDate),
      generation_label: device.model.generation,
      summary: device.model.summary,
      description,
      cover_image_url: device.model.coverImageUrl,
      deleted_at: null,
    },
    create: {
      product_family_id: family.id,
      name: device.model.name,
      slug: device.model.slug,
      release_status_id: context.releasedStatusId,
      announcement_date: new Date(device.model.announcementDate),
      release_date: new Date(device.model.releaseDate),
      generation_label: device.model.generation,
      summary: device.model.summary,
      description,
      cover_image_url: device.model.coverImageUrl,
    },
  });

  await tx.device_model_aliases.deleteMany({
    where: { device_model_id: model.id },
  });
  for (const alias of device.model.aliases ?? []) {
    await tx.device_model_aliases.create({
      data: {
        device_model_id: model.id,
        alias,
        alias_type: "marketing",
        normalized_alias: alias
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim(),
      },
    });
  }

  const variant = await tx.device_variants.upsert({
    where: {
      device_model_id_variant_name: {
        device_model_id: model.id,
        variant_name: device.variant.name,
      },
    },
    update: {
      sku_code: device.variant.skuCode,
      market_name: device.variant.marketName,
      color_name: device.variant.colorName,
      color_hex: device.variant.colorHex,
      release_status_id: context.releasedStatusId,
      launch_date: new Date(device.model.releaseDate),
      launch_price: device.variant.launchPriceUsd,
      currency_id: context.usdCurrencyId,
      is_default: true,
      notes: `Nguồn thông số chính: ${device.sourceUrl}`,
      deleted_at: null,
    },
    create: {
      device_model_id: model.id,
      variant_name: device.variant.name,
      sku_code: device.variant.skuCode,
      market_name: device.variant.marketName,
      color_name: device.variant.colorName,
      color_hex: device.variant.colorHex,
      release_status_id: context.releasedStatusId,
      launch_date: new Date(device.model.releaseDate),
      launch_price: device.variant.launchPriceUsd,
      currency_id: context.usdCurrencyId,
      is_default: true,
      notes: `Nguồn thông số chính: ${device.sourceUrl}`,
    },
  });

  await tx.device_variants.updateMany({
    where: {
      device_model_id: model.id,
      id: { not: variant.id },
    },
    data: { is_default: false },
  });

  await tx.variant_physical_specs.upsert({
    where: { device_variant_id: variant.id },
    update: {
      height_mm: device.variant.heightMm,
      width_mm: device.variant.widthMm,
      thickness_mm: device.variant.thicknessMm,
      weight_g: device.variant.weightG,
      frame_material: device.variant.frameMaterial,
      back_material: device.variant.backMaterial,
      front_glass: device.variant.frontGlass,
      ingress_protection: device.variant.ingressProtection,
    },
    create: {
      device_variant_id: variant.id,
      height_mm: device.variant.heightMm,
      width_mm: device.variant.widthMm,
      thickness_mm: device.variant.thicknessMm,
      weight_g: device.variant.weightG,
      frame_material: device.variant.frameMaterial,
      back_material: device.variant.backMaterial,
      front_glass: device.variant.frontGlass,
      ingress_protection: device.variant.ingressProtection,
    },
  });

  if (device.variant.io) {
    const io = device.variant.io;
    await tx.variant_io_specs.upsert({
      where: { device_variant_id: variant.id },
      update: {
        sim_slots: io.simSlots,
        esim_supported: io.esimSupported,
        stereo_speakers: io.stereoSpeakers,
        speaker_count: io.speakerCount,
        headphone_jack: io.headphoneJack,
        has_microsd_slot: io.hasMicrosdSlot,
        microsd_max_capacity_gb: io.microsdMaxCapacityGb,
        notes: io.notes,
      },
      create: {
        device_variant_id: variant.id,
        sim_slots: io.simSlots,
        esim_supported: io.esimSupported,
        stereo_speakers: io.stereoSpeakers,
        speaker_count: io.speakerCount,
        headphone_jack: io.headphoneJack,
        has_microsd_slot: io.hasMicrosdSlot,
        microsd_max_capacity_gb: io.microsdMaxCapacityGb,
        notes: io.notes,
      },
    });
  }

  await Promise.all([
    tx.variant_chipsets.deleteMany({ where: { device_variant_id: variant.id } }),
    tx.variant_cpus.deleteMany({ where: { device_variant_id: variant.id } }),
    tx.variant_gpus.deleteMany({ where: { device_variant_id: variant.id } }),
    tx.variant_npus.deleteMany({ where: { device_variant_id: variant.id } }),
    tx.variant_displays.deleteMany({ where: { device_variant_id: variant.id } }),
    tx.variant_batteries.deleteMany({ where: { device_variant_id: variant.id } }),
    tx.variant_memory_configs.deleteMany({
      where: { device_variant_id: variant.id },
    }),
    tx.variant_storage_configs.deleteMany({
      where: { device_variant_id: variant.id },
    }),
  ]);

  if (device.modules.chipset) {
    await tx.variant_chipsets.create({
      data: {
        device_variant_id: variant.id,
        chipset_id: await resolveModuleId(
          tx,
          "chipsets",
          device.modules.chipset,
        ),
        chip_role: "main",
        is_primary: true,
      },
    });
  }
  if (device.modules.cpu) {
    await tx.variant_cpus.create({
      data: {
        device_variant_id: variant.id,
        cpu_id: await resolveModuleId(tx, "cpus", device.modules.cpu),
        cpu_role: "main",
        is_primary: true,
      },
    });
  }
  if (device.modules.gpu) {
    await tx.variant_gpus.create({
      data: {
        device_variant_id: variant.id,
        gpu_id: await resolveModuleId(tx, "gpus", device.modules.gpu),
        gpu_role: "integrated",
        is_primary: true,
      },
    });
  }
  if (device.modules.npu) {
    await tx.variant_npus.create({
      data: {
        device_variant_id: variant.id,
        npu_id: await resolveModuleId(tx, "npus", device.modules.npu),
        npu_role: "integrated",
        is_primary: true,
      },
    });
  }
  if (device.modules.display) {
    await tx.variant_displays.create({
      data: {
        device_variant_id: variant.id,
        display_unit_id: await resolveModuleId(
          tx,
          "display_units",
          device.modules.display,
        ),
        display_role: "main",
        display_order: 1,
      },
    });
  }
  if (device.modules.battery) {
    await tx.variant_batteries.create({
      data: {
        device_variant_id: variant.id,
        battery_unit_id: await resolveModuleId(
          tx,
          "battery_units",
          device.modules.battery,
        ),
        battery_role: "main",
        is_primary: true,
      },
    });
  }
  if (device.modules.memory) {
    await tx.variant_memory_configs.create({
      data: {
        device_variant_id: variant.id,
        memory_standard_id: await resolveModuleId(
          tx,
          "memory_standards",
          device.modules.memory.slug,
        ),
        capacity_gb: device.modules.memory.capacityGb,
        speed_mhz: device.modules.memory.speedMhz,
        is_primary: true,
      },
    });
  }
  if (device.modules.storage) {
    await tx.variant_storage_configs.create({
      data: {
        device_variant_id: variant.id,
        storage_standard_id: await resolveModuleId(
          tx,
          "storage_standards",
          device.modules.storage.slug,
        ),
        total_capacity_gb: device.modules.storage.capacityGb,
        is_expandable: device.modules.storage.expandable ?? false,
        expansion_max_gb: device.modules.storage.expansionMaxGb,
      },
    });
  }

  return { modelId: model.id, variantId: variant.id };
}

async function main() {
  validateSeedData();

  const result = await prisma.$transaction(
    async (tx) => {
      const [categories, releasedStatus, usdCurrency, roles] =
        await Promise.all([
          tx.device_categories.findMany({
            select: { id: true, slug: true },
          }),
          tx.release_statuses.findUnique({ where: { code: "released" } }),
          tx.currencies.findUnique({ where: { code: "USD" } }),
          tx.organization_roles.findMany({
            select: { id: true, code: true },
          }),
        ]);

      if (!releasedStatus || !usdCurrency) {
        throw new Error("Missing released status or USD currency reference data.");
      }

      const categoryIds = new Map(
        categories.map((category) => [category.slug, category.id]),
      );
      const roleIds = new Map(roles.map((role) => [role.code, role.id]));
      const organizationIds = new Map<string, string>();

      for (const item of organizations) {
        const organization = await tx.organizations.upsert({
          where: { slug: item.slug },
          update: {
            name: item.name,
            short_name: item.shortName,
            legal_name: item.legalName,
            country_code: item.countryCode,
            founded_year: item.foundedYear,
            website_url: item.websiteUrl,
            description: item.description,
            is_active: true,
            deleted_at: null,
          },
          create: {
            name: item.name,
            slug: item.slug,
            short_name: item.shortName,
            legal_name: item.legalName,
            country_code: item.countryCode,
            founded_year: item.foundedYear,
            website_url: item.websiteUrl,
            description: item.description,
            is_active: true,
          },
        });
        organizationIds.set(item.slug, organization.id);

        for (const roleCode of item.roles) {
          const roleId = roleIds.get(roleCode);
          if (!roleId) throw new Error(`Missing organization role: ${roleCode}`);
          await tx.organization_role_assignments.upsert({
            where: {
              organization_id_role_id: {
                organization_id: organization.id,
                role_id: roleId,
              },
            },
            update: {},
            create: {
              organization_id: organization.id,
              role_id: roleId,
            },
          });
        }
      }

      await updateModuleDescriptions(tx, organizationIds);

      const seeded = [];
      for (const device of devices) {
        seeded.push(
          await seedDevice(tx, device, {
            organizationIds,
            categoryIds,
            releasedStatusId: releasedStatus.id,
            usdCurrencyId: usdCurrency.id,
            roleIds,
          }),
        );
      }

      return {
        organizations: organizationIds.size,
        devices: seeded.length,
      };
    },
    { timeout: 120_000 },
  );

  const counts = {
    organizations: await prisma.organizations.count(),
    productFamilies: await prisma.product_families.count(),
    deviceModels: await prisma.device_models.count(),
    deviceVariants: await prisma.device_variants.count(),
  };
  console.log("Standard catalog seeded:", { ...result, ...counts });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
