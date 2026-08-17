import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/macm1/Project/spechub/outputs/module-to-device-20260811";
const outputPath = `${outputDir}/spechub-checklist-du-lieu-tu-module-den-thiet-bi.xlsx`;
const previewDir = `${outputDir}/previews`;

const COLORS = {
  navy: "#0F172A",
  blue: "#2563EB",
  sky: "#DBEAFE",
  slate: "#475569",
  light: "#F8FAFC",
  border: "#CBD5E1",
  green: "#DCFCE7",
  amber: "#FEF3C7",
  red: "#FEE2E2",
  violet: "#EDE9FE",
  white: "#FFFFFF",
};

const STATUS_VALUES = ["Chưa chuẩn bị", "Đã có", "Cần xác minh", "Không áp dụng"];
const headers = [
  "STT",
  "Nhóm dữ liệu",
  "Trường cần nhập / chọn",
  "Khóa API",
  "Kiểu dữ liệu / đơn vị",
  "Mức bắt buộc",
  "Điều kiện / kiểm tra",
  "Ví dụ hoặc dạng chuẩn",
  "Tình trạng chuẩn bị",
  "Ghi chú",
];

const section = (group, field, key, type, requirement, condition, example, note = "") => [
  group,
  field,
  key,
  type,
  requirement,
  condition,
  example,
  note,
];

const baseModuleRows = [
  section("Chung", "Loại module", "kind", "Danh sách chọn", "Bắt buộc", "Chọn đúng một loại được hỗ trợ.", "chipset | cpu | gpu | npu | modem | memory-standard | storage-standard | operating-system", "Trong giao diện Phần cứng hiện có 7 thẻ; operating-system được hỗ trợ ở API và luồng Phần mềm."),
  section("Chung", "Tên module", "name", "Văn bản, tối đa 160 ký tự", "Bắt buộc", "Không để trống; dùng tên chuẩn của hãng/tổ chức tiêu chuẩn.", "Snapdragon 8 Elite", "Không dùng tên marketing thiếu định danh."),
  section("Chung", "Slug", "slug", "Chuỗi kebab-case, tối đa 180 ký tự", "Bắt buộc", "Chỉ chữ thường, số, dấu gạch ngang; không có khoảng trắng.", "snapdragon-8-elite", "Kiểm tra tránh trùng trước khi tạo."),
  section("Chung", "Mô tả", "description", "Văn bản, tối thiểu 120 ký tự", "Bắt buộc", "Nêu vai trò, thế hệ/kiến trúc, thông số nổi bật, tương thích và giới hạn đã xác minh.", "SoC cao cấp …", "Không chép nội dung quảng cáo; chưa xác minh thì không điền trường kỹ thuật."),
  section("Chung", "URL ảnh module", "image_url", "URL http/https", "Tùy chọn", "URL công khai hợp lệ.", "https://…/module.webp", "Không bắt buộc để tạo."),
  section("Chung", "Nguồn xác minh ảnh", "image_source_url", "URL http/https", "Tùy chọn", "Nên dùng khi có ảnh để truy vết nguồn.", "https://www.qualcomm.com/…", ""),
  section("Chung", "Hãng / tổ chức", "organization_id", "UUID chọn từ Tổ chức", "Điều kiện", "Bắt buộc cho chipset; các module khác chỉ chọn khi đã xác minh hãng/tổ chức.", "Qualcomm", "API kiểm tra tổ chức còn hoạt động."),
  section("Chung", "Phân loại module", "category", "Văn bản, tối đa 80 ký tự", "Điều kiện", "Bắt buộc cho chipset (chip kind) và operating-system (os family); khuyến nghị cho RAM/lưu trữ để xác định loại.", "soc | LPDDR | UFS | android", "Không cùng nghĩa với danh mục thiết bị."),
];

const moduleTypeRows = [
  section("Chipset", "Mã mẫu", "model_code", "Văn bản ≤100", "Tùy chọn", "Nhập mã nếu hãng công bố.", "SM8750", ""),
  section("Chipset", "Hỗ trợ 64-bit", "supports_64bit", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có", ""),
  section("Chipset", "Tích hợp 5G", "integrated_5g", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có", ""),
  section("Chipset", "Tích hợp Wi‑Fi", "integrated_wifi", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có", ""),
  section("Chipset", "RAM tối đa", "max_ram_gb", "Số nguyên ≥0, GB", "Tùy chọn", "Không nhập đơn vị vào ô số.", "24", ""),
  section("Chipset", "Độ phân giải tối đa", "max_display_resolution", "Văn bản ≤40", "Tùy chọn", "", "4K", ""),
  section("Chipset", "Camera tối đa", "max_camera_mp", "Số nguyên ≥0, MP", "Tùy chọn", "", "200", ""),
  section("Chipset", "Ngày công bố / ra mắt", "announcement_date / release_date", "Ngày YYYY-MM-DD", "Tùy chọn", "", "2024-10-21", "Nhập từng trường khi xác minh."),
  section("Chipset", "CPU / GPU / NPU / Modem chính", "cpu_id / gpu_id / npu_id / modem_id", "UUID chọn module đã tạo", "Tùy chọn", "Chỉ liên kết module đã có. Nếu chọn modem, có thể khai báo trạng thái tích hợp.", "CPU: Oryon; GPU: Adreno 830", "Các liên kết này được smart linking sang thiết bị khi chọn chipset."),
  section("Chipset", "Modem tích hợp", "modem_is_integrated", "Có / Không", "Điều kiện", "Chỉ nhập khi đã chọn modem cho chipset; mặc định Có trong UI.", "Có", ""),

  section("CPU", "Số nhân / số luồng", "core_count / thread_count", "Số nguyên ≥0", "Tùy chọn", "", "8 / 8", ""),
  section("CPU", "Big.LITTLE", "big_little", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có", ""),
  section("CPU", "ISA, vi kiến trúc, loại nhân", "isa_name / microarchitecture / core_type", "Văn bản", "Tùy chọn", "", "ARMv9.2-A / Oryon / Prime", ""),
  section("CPU", "Xung nhịp tối đa / tối thiểu", "max_frequency_mhz / min_frequency_mhz", "Số nguyên ≥0, MHz", "Tùy chọn", "Nếu nhập cả hai: tối thiểu không được lớn hơn tối đa.", "4320 / 2300", ""),
  section("CPU", "Cache L1 lệnh, L1 dữ liệu, L2, L3", "l1_instruction_cache / l1_data_cache / l2_cache / l3_cache", "Văn bản ≤80", "Tùy chọn", "", "64 KB / 64 KB / 1 MB / 12 MB", ""),
  section("CPU", "64-bit, SIMD, ảo hóa, out-of-order, SMT", "supports_64bit / simd_extension / virtualization / out_of_order / smt", "Boolean hoặc văn bản", "Tùy chọn", "", "Có / SVE2 / Có / Có / Không", ""),

  section("GPU", "Shader units / Compute units", "shader_units / compute_units", "Số nguyên ≥0", "Tùy chọn", "Chỉ nhập khi hãng công bố.", "12", "Không tự suy luận từ tên GPU."),
  section("GPU", "Xung nhịp / FP32", "clock_mhz / fp32_gflops", "Số ≥0, MHz / GFLOPS", "Tùy chọn", "FP32 chỉ nhập số được công bố, không tự tính.", "1100 / 4500", ""),
  section("GPU", "Dò tia / thế hệ / API", "ray_tracing_support / gpu_generation / api_support", "Boolean / văn bản", "Tùy chọn", "", "Có / Adreno 8xx / Vulkan, OpenGL ES", ""),
  section("GPU", "OpenGL / OpenCL / Vulkan / DirectX", "opengl_version / opencl_version / vulkan_version / directx_feature_level", "Văn bản ≤40", "Tùy chọn", "", "OpenGL ES 3.2 / Vulkan 1.3", ""),
  section("GPU", "Metal / CUDA", "metal_support / cuda_support", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Không", ""),
  section("GPU", "Codec video và độ phân giải tối đa", "video_decode_codecs / video_encode_codecs / max_display_resolution", "Văn bản", "Tùy chọn", "", "H.264, HEVC, AV1 / 4K", ""),

  section("NPU", "NPU chuyên dụng", "dedicated_npu", "Có / Không / Chưa xác minh", "Tùy chọn", "Nếu chọn Không, API bỏ các TOPS chi tiết.", "Có", ""),
  section("NPU", "TOPS tổng / INT8 / INT4 / FP16", "tops / tops_int8 / tops_int4 / tops_fp16", "Số ≥0, TOPS", "Tùy chọn", "Không nhập khi NPU không chuyên dụng.", "45 / 45 / 90 / 22", ""),
  section("NPU", "DSP / AI Engine / Tensor accelerator", "dsp_name / ai_engine_version / tensor_accelerator", "Văn bản", "Tùy chọn", "", "Hexagon / AI Engine 9 / Tensor", ""),
  section("NPU", "INT8 / FP16 / FP32 / lượng tử hóa", "supports_int8 / supports_fp16 / supports_fp32 / quantization", "Boolean / văn bản", "Tùy chọn", "", "Có / Có / Không / INT8, INT4", ""),

  section("Modem", "Tốc độ xuống / lên tối đa", "max_downlink_mbps / max_uplink_mbps", "Số nguyên ≥0, Mbps", "Tùy chọn", "", "10000 / 3500", ""),
  section("Modem", "mmWave / vệ tinh / 5G NR", "supports_mmwave / supports_satellite / supports_5g_nr", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có / Có / Có", ""),
  section("Modem", "Chế độ 5G / LTE Category", "supported_5g_modes / lte_category", "Văn bản", "Tùy chọn", "", "SA, NSA / Cat 24", ""),
  section("Modem", "CA / VoLTE / VoNR", "carrier_aggregation / volte / vonr", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có / Có / Có", ""),
  section("Modem", "Hai SIM / công nghệ hỗ trợ", "dual_sim_capability / supported_technologies", "Văn bản", "Tùy chọn", "", "Dual SIM Dual Active / 2G, 3G, LTE, 5G NR", ""),

  section("Chuẩn RAM", "Thế hệ / JEDEC / Prefetch", "generation / jedec_standard / prefetch", "Văn bản", "Tùy chọn", "", "LPDDR5X / JESD209-5 / 16n", ""),
  section("Chuẩn RAM", "ECC / dual channel", "ecc / dual_channel", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Không / Có", ""),
  section("Chuẩn RAM", "Tốc độ tối đa / thường", "max_data_rate_mtps / typical_data_rate_mtps", "Số nguyên ≥0, MT/s", "Tùy chọn", "", "9600 / 8533", ""),
  section("Chuẩn RAM", "Điện áp / băng thông / độ rộng kênh", "voltage / bandwidth_gbps / channel_width_bits", "Số ≥0, V / GB/s / bit", "Tùy chọn", "", "1.05 / 76.8 / 16", ""),
  section("Chuẩn RAM", "Dung lượng tối đa / di động / năm ra mắt", "maximum_capacity_gb / is_mobile / release_year", "Số nguyên / boolean / năm", "Tùy chọn", "Năm ≥1800.", "64 / Có / 2021", ""),

  section("Chuẩn lưu trữ", "Thế hệ / JEDEC / giao tiếp", "generation / jedec_standard / interface", "Văn bản", "Tùy chọn", "", "UFS 4.0 / JESD220G / M-PHY", ""),
  section("Chuẩn lưu trữ", "Half/Full duplex / Command queue", "half_duplex / full_duplex / command_queue", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Không / Có / Có", ""),
  section("Chuẩn lưu trữ", "Boot partition / RPMB / TRIM / Secure erase", "boot_partition / rpmb / trim / secure_erase", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có / Có / Có / Có", ""),
  section("Chuẩn lưu trữ", "HS200 / HS400 / năm ra mắt", "hs200 / hs400 / release_year", "Boolean / năm", "Tùy chọn", "Năm ≥1800.", "Không / Không / 2022", "Chỉ nhập nếu phù hợp chuẩn lưu trữ."),

  section("Hệ điều hành (API)", "Kernel / giấy phép / mã nguồn mở", "kernel_type / kernel_name / license_name / is_open_source", "Văn bản / boolean", "Tùy chọn", "", "Monolithic / Linux / GPLv2 / Có", "Trong Wizard, ưu tiên tạo OS version ở bước Phần mềm."),
  section("Hệ điều hành (API)", "Ngày phát hành đầu / loại OS / kiến trúc", "initial_release_date / os_type / supported_architectures", "Ngày / văn bản", "Tùy chọn", "category=os_family là bắt buộc nếu tạo module operating-system qua API.", "2008-09-23 / Mobile / ARM64, x86-64", "Tạo module OS tự sinh một phiên bản OS ban đầu."),
];

const foundationRows = [
  section("Tổ chức / hãng", "Tên tổ chức", "name", "Văn bản ≤160", "Bắt buộc", "Không để trống.", "Samsung Electronics", ""),
  section("Tổ chức / hãng", "Slug", "slug", "kebab-case ≤180", "Bắt buộc", "Chỉ chữ thường, số, dấu gạch ngang.", "samsung", ""),
  section("Tổ chức / hãng", "Mô tả", "description", "Văn bản ≥80 ký tự", "Bắt buộc", "Nêu lĩnh vực, vai trò, sản phẩm và công nghệ nổi bật.", "Tập đoàn…", ""),
  section("Tổ chức / hãng", "Tên ngắn / logo", "short_name / logo_file", "Văn bản / ảnh", "Tùy chọn", "Logo: JPG, PNG, WebP, SVG; tối đa 8 MB.", "Samsung / samsung.svg", "Giao diện upload file; API lưu logo_url."),
  section("Tổ chức / hãng", "Tên pháp lý / quốc gia / năm thành lập / website", "legal_name / country_code / founded_year / website_url", "Văn bản / mã 2 ký tự / năm / URL", "Tùy chọn", "Chỉ nhập khi đã xác minh; năm 1800–2200.", "Samsung Electronics Co., Ltd. / KR / 1969 / https://…", "API mở rộng."),
  section("Tổ chức / hãng", "Trạng thái hoạt động", "is_active", "Boolean", "Tùy chọn", "Mặc định Có.", "Có", "API mở rộng."),

  section("Danh mục thiết bị", "Tên danh mục", "name", "Văn bản ≤60", "Bắt buộc", "Không để trống trên giao diện.", "Điện thoại", ""),
  section("Danh mục thiết bị", "Slug", "slug", "kebab-case ≤80", "Bắt buộc", "Chỉ chữ thường, số, dấu gạch ngang.", "dien-thoai", ""),
  section("Danh mục thiết bị", "Mô tả", "description", "Văn bản", "Tùy chọn", "", "Điện thoại thông minh…", ""),
  section("Danh mục thiết bị", "Danh mục cha / icon / thứ tự / hoạt động", "parent_category_id / icon_url / display_order / is_active", "UUID / URL / số nguyên / boolean", "Tùy chọn", "display_order ≥0; mặc định active.", "Smartphone / https://…/phone.svg / 10 / Có", "API mở rộng."),

  section("Dòng sản phẩm", "Hãng", "brand_org_id", "UUID chọn tổ chức", "Bắt buộc", "Phải chọn đúng một tổ chức đã tạo.", "Samsung", ""),
  section("Dòng sản phẩm", "Danh mục thiết bị", "device_category_id", "UUID chọn danh mục", "Bắt buộc", "Phải chọn đúng một danh mục đã tạo.", "Điện thoại", ""),
  section("Dòng sản phẩm", "Tên / slug", "name / slug", "Văn bản ≤120 / kebab-case ≤160", "Bắt buộc", "Slug chuẩn; kiểm tra không trùng.", "Galaxy S Series / galaxy-s-series", ""),
  section("Dòng sản phẩm", "Mô tả", "description", "Văn bản ≥80 ký tự", "Bắt buộc", "Nêu định vị, nhóm người dùng, đặc trưng và phạm vi thế hệ.", "Dòng flagship…", ""),
  section("Dòng sản phẩm", "Ảnh bìa / năm đầu-cuối / hoạt động", "cover_image_url / first_release_year / last_release_year / is_active", "URL / năm / boolean", "Tùy chọn", "Năm 1800–2200.", "https://… / 2010 / 2026 / Có", "Các trường API mở rộng; Wizard tạo nhanh chỉ dùng các trường bắt buộc."),

  section("Phiên bản OS", "OS đã có hoặc thông tin OS gốc mới", "operating_system_id OR operating_system{name,slug,os_family}", "UUID hoặc object", "Điều kiện", "Phải chọn OS đã có hoặc nhập đủ tên, slug, họ OS cho OS mới.", "Android / android / android", ""),
  section("Phiên bản OS", "Tên phiên bản", "version_name", "Văn bản ≤40", "Bắt buộc", "Không để trống.", "16", ""),
  section("Phiên bản OS", "Codename / ngày phát hành / API level", "codename / release_date / api_level", "Văn bản / ngày / số nguyên ≥1", "Tùy chọn", "", "Baklava / 2025-06-10 / 36", ""),
  section("Phiên bản OS", "Kết thúc hỗ trợ / kernel / ghi chú", "end_of_support_date / kernel_version / notes", "Ngày / văn bản", "Tùy chọn", "API mở rộng.", "2030-01-01 / 6.6 / …", ""),

  section("Phiên bản giao diện", "UI layer đã có hoặc dòng UI mới", "ui_layer_id OR ui_layer{name,slug,base_os_id}", "UUID hoặc object", "Điều kiện", "Phải chọn UI đã có hoặc nhập đủ tên và slug cho UI mới.", "One UI / one-ui / Android", ""),
  section("Phiên bản giao diện", "Tên phiên bản", "version_name", "Văn bản ≤40", "Bắt buộc", "Không để trống.", "8.0", ""),
  section("Phiên bản giao diện", "OS nền / ngày phát hành / ghi chú", "base_os_version_id / release_date / notes", "UUID / ngày / văn bản", "Tùy chọn", "", "Android 16 / 2025-10-01", ""),
];

const modelRows = [
  section("Định danh thiết bị", "Tên thiết bị", "name", "Văn bản ≤160", "Bắt buộc xuất bản", "Không để trống; không trùng model đã có.", "Galaxy S26 Ultra", ""),
  section("Định danh thiết bị", "Slug", "slug", "kebab-case ≤200", "Bắt buộc xuất bản", "Chỉ chữ thường, số, dấu gạch ngang; không trùng model đã có.", "galaxy-s26-ultra", ""),
  section("Định danh thiết bị", "Dòng sản phẩm", "product_family_id", "UUID chọn dòng sản phẩm", "Bắt buộc xuất bản", "Phải có dòng sản phẩm hợp lệ.", "Galaxy S Series", "Từ sheet 02."),
  section("Định danh thiết bị", "Trạng thái phát hành", "release_status_id", "ID chọn từ dữ liệu tham chiếu", "Bắt buộc xuất bản", "Cần chọn trạng thái hợp lệ; được dùng cho model và variant.", "Đã phát hành", ""),
  section("Định danh thiết bị", "Tóm tắt cho card", "summary", "Văn bản 80–600 ký tự", "Bắt buộc xuất bản", "Nội dung card/kết quả tìm kiếm; không quảng cáo.", "Mẫu flagship…", "Có thể nhập bước 1 hoặc bước Review; hai ô đồng bộ."),
  section("Định danh thiết bị", "Tên mã nội bộ", "internal_codename", "Văn bản ≤80", "Tùy chọn", "", "Paradigm", ""),
  section("Định danh thiết bị", "Nhãn thế hệ", "generation_label", "Văn bản ≤40", "Tùy chọn", "", "2026 · Gen 8", ""),
  section("Vòng đời model", "Ngày công bố / phát hành", "announcement_date / release_date", "Ngày YYYY-MM-DD", "Tùy chọn", "", "2026-01-15 / 2026-02-05", "Ngày phát hành được gợi ý làm ngày mở bán variant."),
  section("Vòng đời model", "Ngừng bán / hết hỗ trợ", "end_of_sale_date / end_of_support_date", "Ngày YYYY-MM-DD", "Tùy chọn", "Có trong API/biểu mẫu quản trị cũ.", "2029-01-01 / 2031-01-01", "Không hiển thị trong bước Wizard mới."),
  section("Tên thay thế", "Alias / loại alias / khu vực", "aliases[].alias / alias_type / region_code", "Mảng object", "Tùy chọn", "Alias ≤180; Wizard tạo marketing alias nếu nhập.", "S26 Ultra 5G / marketing / VN", "API cho tối đa 50 aliases."),
  section("Nội dung", "Mục nội dung biên tập", "editorial_sections[]", "Mảng {section_key,title,body_markdown}", "Bắt buộc xuất bản", "Tối thiểu 3 mục có nội dung; tổng mô tả ≥240 ký tự. section_key dạng snake/kebab-case.", "highlights / Điểm nổi bật / …", "Wizard gợi ý 7 mục: nổi bật, thiết kế, hiệu năng, trải nghiệm, pin, phần mềm, hạn chế."),
  section("Nội dung", "Mô tả gộp", "description", "Markdown ≥240 ký tự", "Bắt buộc xuất bản", "Được hệ thống ghép từ các mục nội dung đã điền.", "## Điểm nổi bật …", "Không cần nhập riêng khi dùng Wizard."),
  section("Media (API cũ)", "URL ảnh bìa", "cover_image_url", "URL http/https", "Tùy chọn", "Luồng mới dùng upload Media thay vì ghi URL.", "https://…/cover.webp", "Xem sheet 06."),
];

const variantRows = [
  section("Phiên bản", "Tên phiên bản", "variant_name", "Văn bản ≤160", "Bắt buộc xuất bản", "Không để trống.", "12 GB / 512 GB · Global", "Wizard tạo một phiên bản mặc định trong bundle."),
  section("Phiên bản", "Model thiết bị", "device_model_id", "UUID", "Tự động", "Tự gán khi tạo bundle; bắt buộc nếu tạo variant qua API riêng.", "Galaxy S26 Ultra", ""),
  section("Phiên bản", "Trạng thái phát hành", "release_status_id", "ID tham chiếu", "Tự động / Bắt buộc API", "Wizard dùng trạng thái đã chọn cho model; API variant yêu cầu trường này.", "Đã phát hành", ""),
  section("Phiên bản", "SKU / Model number", "sku_code", "Văn bản ≤100", "Tùy chọn", "", "SM-S948B", ""),
  section("Phiên bản", "Marketing name", "market_name", "Văn bản ≤160", "Tùy chọn", "", "Galaxy AI Phone", ""),
  section("Phiên bản", "Tên màu / mã HEX", "color_name / color_hex", "Văn bản ≤80 / #RRGGBB", "Tùy chọn", "HEX phải đủ 6 ký tự sau #.", "Titanium Black / #1F2937", ""),
  section("Phiên bản", "Ngày mở bán / ngừng bán", "launch_date / end_of_sale_date", "Ngày YYYY-MM-DD", "Tùy chọn", "end_of_sale_date có trong API/biểu mẫu quản trị cũ.", "2026-02-05 / 2029-01-01", ""),
  section("Phiên bản", "Giá ra mắt", "launch_price", "Số ≥0", "Tùy chọn", "Nếu có giá, phải chọn currency_id.", "29990000", "Không nhập ký hiệu tiền tệ vào trường số."),
  section("Phiên bản", "Đơn vị tiền tệ", "currency_id", "ID tham chiếu", "Điều kiện", "Bắt buộc khi có giá ra mắt.", "VND", ""),
  section("Phiên bản", "Phiên bản mặc định / ghi chú", "is_default / notes", "Boolean / văn bản", "Tự động / Tùy chọn", "Wizard đặt is_default=true.", "Có / …", ""),

  section("Liên kết module", "Chipset / SoC", "hardware_components.chipsets[]", "UUID module + role/is_primary", "Tùy chọn", "Chọn SoC sẽ tự lấy CPU/GPU/NPU/modem đã liên kết với SoC.", "Snapdragon 8 Elite", "Ưu tiên chọn SoC dùng chung khi có."),
  section("Liên kết module", "CPU / GPU / NPU / modem riêng", "hardware_components.cpus[] / gpus[] / npus[] / modems[]", "UUID module + role/is_primary", "Điều kiện", "Chỉ gán trực tiếp khi không chọn chipset; mỗi liên kết có role và is_primary.", "CPU: Oryon", ""),
  section("Cấu hình", "Chuẩn RAM", "memory_standard_id", "UUID module", "Điều kiện", "Nếu có dung lượng RAM, phải chọn chuẩn RAM.", "LPDDR5X", ""),
  section("Cấu hình", "Dung lượng RAM", "memory_capacity_gb", "Số nguyên ≥1, GB", "Điều kiện", "Nếu chọn chuẩn RAM, phải có dung lượng RAM.", "12", "Không nhập đơn vị vào ô số."),
  section("Cấu hình", "Tốc độ RAM / băng thông / số kênh / ghi chú", "speed_mhz / bandwidth_gbps / channel_count / notes", "Số / văn bản", "Tùy chọn", "speed_mhz là trường legacy; ưu tiên tốc độ của chuẩn RAM.", "8533 / 68 / 4", "API mở rộng."),
  section("Cấu hình", "Chuẩn lưu trữ", "storage_standard_id", "UUID module", "Điều kiện", "Nếu có dung lượng lưu trữ, phải chọn chuẩn lưu trữ.", "UFS 4.0", ""),
  section("Cấu hình", "Dung lượng lưu trữ", "storage_capacity_gb", "Số nguyên ≥1, GB", "Điều kiện", "Nếu chọn chuẩn lưu trữ, phải có dung lượng.", "512", ""),
  section("Cấu hình", "Có thể mở rộng / dung lượng tối đa", "storage_expandable / storage_expansion_max_gb", "Boolean / số nguyên ≥1, GB", "Điều kiện", "Dung lượng mở rộng chỉ nhập khi expandable=true.", "Có / 2048", ""),

  section("Thân máy", "Cao / rộng / dày / khối lượng", "physical_specs.height_mm / width_mm / thickness_mm / weight_g", "Số ≥0, mm / g", "Tùy chọn", "Không nhập đơn vị vào ô số.", "163.4 / 77.9 / 8.2 / 218", ""),
  section("Thân máy", "Dày min/max / thể tích", "thickness_min_mm / thickness_max_mm / volume_cm3", "Số ≥0", "Tùy chọn", "API mở rộng, dùng với thiết bị có kích thước biến thiên.", "7.9 / 8.5 / 105", ""),
  section("Thân máy", "Khung / lưng / kính trước / IP / ghi chú", "frame_material / back_material / front_glass / ingress_protection / notes", "Văn bản", "Tùy chọn", "", "Titanium / kính mờ / Gorilla Armor 2 / IP68", ""),

  section("I/O & âm thanh", "Số khe SIM / loại SIM / eSIM", "io_specs.sim_slots / sim_type / esim_supported", "Số nguyên ≥0 / văn bản / boolean", "Tùy chọn", "", "2 / Nano-SIM / Có", ""),
  section("I/O & âm thanh", "Số eSIM / loa stereo / số loa / tuning", "esim_count / stereo_speakers / speaker_count / audio_brand_tuning", "Số / boolean / văn bản", "Tùy chọn", "API mở rộng.", "2 / Có / 2 / AKG", ""),
  section("I/O & âm thanh", "Jack tai nghe / kích cỡ", "headphone_jack / headphone_jack_size_mm", "Boolean / số ≥0, mm", "Tùy chọn", "", "Không / 3.5", ""),
  section("I/O & âm thanh", "Khe microSD / tối đa / IR / LED / ghi chú", "has_microsd_slot / microsd_max_capacity_gb / has_ir_blaster / has_notification_led / notes", "Boolean / số / văn bản", "Tùy chọn", "", "Có / 2048 / Có / Không", "Một số trường API mở rộng không hiển thị trong Wizard mới."),

  section("Tản nhiệt", "Loại / diện tích buồng hơi / chủ động / ghi chú", "thermal_specs.cooling_type / vc_area_mm2 / has_active_cooling / notes", "Văn bản / số ≥0 mm² / boolean", "Tùy chọn", "", "Vapor chamber / 5000 / Không", ""),
];

const inlineModuleRows = [
  section("Màn hình", "Công nghệ", "inline_modules.display.technology", "Văn bản ≤80", "Điều kiện", "Bắt buộc nếu nhập bất kỳ thông số màn hình nào.", "LTPO OLED", "Wizard tự tạo/liên kết module chuẩn hóa khi publish."),
  section("Màn hình", "Kích thước / tỷ lệ", "size_inch / aspect_ratio", "Số ≥0 inch / văn bản ≤20", "Tùy chọn", "", "6.7 / 19.5:9", ""),
  section("Màn hình", "Độ phân giải ngang / dọc / mật độ", "resolution_width / resolution_height / pixel_density_ppi", "Số nguyên ≥0, px / ppi", "Tùy chọn", "", "1440 / 3120 / 516", ""),
  section("Màn hình", "Tần số quét max/min / cảm ứng", "refresh_rate_hz / refresh_rate_min_hz / touch_sampling_hz", "Số nguyên ≥0, Hz", "Tùy chọn", "", "120 / 1 / 240", ""),
  section("Màn hình", "Độ sáng thường / HBM / đỉnh", "brightness_typical_nits / brightness_hbm_nits / brightness_peak_nits", "Số nguyên ≥0, nit", "Tùy chọn", "", "800 / 1600 / 2600", ""),
  section("Màn hình", "LTPO / dải màu / HDR / kính", "ltpo_version / color_gamut / hdr_formats / protection_glass", "Văn bản", "Tùy chọn", "", "LTPO 3.0 / DCI-P3 / HDR10+, Dolby Vision / Gorilla Glass Victus 2", ""),
  section("Màn hình", "Always-on / DC dimming / PWM", "has_always_on / has_dc_dimming / pwm_frequency_hz", "Boolean / số nguyên ≥0 Hz", "Tùy chọn", "", "Có / Có / 2160", ""),

  section("Camera (mỗi vai trò)", "Vai trò", "inline_modules.cameras[].role", "Danh sách chọn", "Tự động", "Wizard có 4 khối: main, ultrawide, telephoto, selfie. Khối rỗng không được tạo.", "main", "API yêu cầu role khi gửi camera."),
  section("Camera (mỗi vai trò)", "Độ phân giải / khẩu độ", "effective_megapixel / aperture", "Số ≥0 MP / văn bản ≤20", "Tùy chọn", "", "50 / f/1.8", ""),
  section("Camera (mỗi vai trò)", "Tiêu cự / zoom / góc nhìn", "focal_length_mm_eq / optical_zoom / field_of_view_deg", "Số ≥0, mm / x / độ", "Tùy chọn", "", "24 / 5 / 120", ""),
  section("Camera (mỗi vai trò)", "OIS / EIS / lấy nét tự động", "has_ois / has_eis / has_af", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Có / Có / Có", ""),
  section("Camera (mỗi vai trò)", "Khả năng quay video", "video_capabilities", "Văn bản", "Tùy chọn", "", "4K 60 fps, 8K 30 fps", ""),

  section("Pin", "Dung lượng", "inline_modules.battery.capacity_mah", "Số nguyên ≥1, mAh", "Điều kiện", "Bắt buộc nếu nhập bất kỳ thông tin pin/sạc nào.", "5000", "Wizard tự tạo/liên kết module pin chuẩn hóa khi publish."),
  section("Pin", "Năng lượng", "energy_wh", "Số ≥0, Wh", "Tùy chọn", "", "19.4", ""),
  section("Pin", "Sạc dây / chuẩn sạc dây", "wired_charging_w / wired_charging_protocol", "Số nguyên ≥0 W / văn bản ≤120", "Tùy chọn", "", "45 / USB PD PPS", ""),
  section("Pin", "Sạc không dây / chuẩn sạc không dây", "wireless_charging_w / wireless_charging_protocol", "Số nguyên ≥0 W / văn bản ≤120", "Tùy chọn", "", "15 / Qi2", ""),
  section("Pin", "Pin tháo rời", "removable", "Có / Không / Chưa xác minh", "Tùy chọn", "", "Không", ""),
];

const softwareMediaRows = [
  section("Phần mềm", "OS khi ra mắt", "software_profile.launch_os_version_id", "UUID phiên bản OS", "Tùy chọn", "Chọn từ catalog OS version.", "Android 16", "Tạo OS version ở sheet 02 khi chưa có."),
  section("Phần mềm", "OS hiện tại / cao nhất", "current_os_version_id / highest_official_version_id", "UUID phiên bản OS", "Tùy chọn", "Tách rõ bản hiện tại và mức chính thức cao nhất.", "Android 17 / Android 19", ""),
  section("Phần mềm", "Giao diện / UI layer", "ui_layer_version_id", "UUID phiên bản UI", "Tùy chọn", "Chọn từ catalog UI layer version.", "One UI 8.0", ""),
  section("Phần mềm", "Số bản nâng cấp / số năm bảo mật", "promised_major_updates / promised_security_years", "Số nguyên ≥0", "Tùy chọn", "", "7 / 7", ""),
  section("Phần mềm", "Bản vá bảo mật", "security_patch_date", "Ngày YYYY-MM-DD", "Tùy chọn", "", "2026-02-01", ""),
  section("Phần mềm", "Bootloader", "bootloader_status", "locked | unlockable | unlocked", "Tùy chọn", "Chỉ chọn một giá trị trong tập cho phép.", "locked", ""),
  section("Phần mềm", "Root", "root_status", "unknown | rootable | rooted", "Tùy chọn", "Chỉ chọn một giá trị trong tập cho phép.", "rootable", ""),
  section("Phần mềm", "Ghi chú", "software_profile.notes", "Văn bản", "Tùy chọn", "Có trong API mở rộng.", "Chính sách cập nhật theo vùng…", ""),

  section("Kết nối (API)", "Tính năng kết nối", "connectivity_support[].connectivity_feature_id", "UUID feature", "Tùy chọn", "Có thể lặp theo feature: NFC, eSIM, UWB, satellite, GPS…", "UWB", "API mở rộng; Wizard hiện dùng các trường I/O phổ biến."),
  section("Kết nối (API)", "Phiên bản / hỗ trợ / ghi chú", "connectivity_support[].version / is_supported / notes", "Văn bản / boolean", "Tùy chọn", "Nhập cùng từng feature kết nối.", "Wi‑Fi 7 / Có", ""),

  section("Media", "Ảnh / video", "media files", "Ảnh hoặc video", "Tùy chọn", "Ảnh: JPG/PNG/WebP, tối đa 25 MB; video tối đa 2 GB. Ảnh đầu tiên là cover, video đầu là review.", "galaxy-s26-ultra.webp", "Luồng mới upload qua storage; không ghi URL file vào entity."),
  section("Media", "Alt text ảnh bìa", "cover_alt", "Văn bản", "Tùy chọn", "Mô tả ảnh để hỗ trợ accessibility.", "Mặt lưng Galaxy S26 Ultra màu đen", ""),

  section("Nơi bán", "Link sản phẩm đối tác", "commerce.links[].product_url", "URL HTTPS", "Tùy chọn", "Phải là HTTPS; với đối tác đã cấu hình, tên miền phải khớp base URL đối tác.", "https://cellphones.com.vn/…", "Hệ thống đọc giá/ảnh/tồn kho khi kiểm tra hoặc publish."),
  section("Nơi bán", "Đối tác", "commerce.links[].partner_slug", "Slug đối tác", "Điều kiện", "Mỗi link phải gắn một đối tác hợp lệ.", "cellphones | fpt-shop", ""),

  section("Điểm & benchmark (API)", "Điểm module", "module_scores[]", "module_kind + module_id + score 0–100", "Tùy chọn", "Chỉ điểm module đã gán vào variant.", "chipset / UUID / 86.5", "Không bắt buộc trong Wizard tạo mới."),
  section("Điểm & benchmark (API)", "Metric điểm chi tiết", "score_metric_inputs[]", "metric_key + raw_value + unit + normalized_score", "Tùy chọn", "metric_key không trùng; raw_value bắt buộc; normalized_score nếu nhập phải 0–100.", "cpu_single / 2113 / điểm / 72.3", ""),
  section("Điểm & benchmark (API)", "Kết quả benchmark", "performance_results[]", "benchmark_id + score + ngữ cảnh đo", "Tùy chọn", "benchmark_id và score là bắt buộc cho mỗi kết quả.", "Geekbench 6 / 2847", "Ngữ cảnh tùy chọn: subscore, nguồn, ngày đo, OS/app version, power mode, nhiệt độ, giảm xung, ghi chú."),
];

const rulesRows = [
  section("Trình tự", "Tạo module dùng chung trước", "—", "Quy trình", "Bắt buộc theo luồng", "Tạo CPU/GPU/NPU/Modem trước nếu sẽ liên kết vào chipset; sau đó tạo chipset; tiếp đến chuẩn RAM/lưu trữ.", "CPU → GPU/NPU/Modem → Chipset → RAM/UFS", "Tránh tạo trùng cùng một thực thể kỹ thuật."),
  section("Trình tự", "Tạo dữ liệu nền trước model", "—", "Quy trình", "Bắt buộc theo luồng", "Tổ chức + danh mục → dòng sản phẩm → model + variant.", "Samsung + Điện thoại → Galaxy S → Galaxy S26 Ultra", ""),
  section("Publish", "Tám điều kiện chặn publish", "—", "Checklist", "Bắt buộc xuất bản", "Tên thiết bị; slug hợp lệ; dòng sản phẩm; trạng thái phát hành; tên phiên bản; tóm tắt ≥80; ≥3 mục mô tả; mô tả ≥240.", "Xem sheet 03 + 04", "Đây là các điều kiện validateForPublish của Wizard."),
  section("Phụ thuộc", "RAM đi cùng dung lượng", "memory_standard_id + memory_capacity_gb", "Cặp trường", "Điều kiện", "Một trong hai có dữ liệu thì phải có trường còn lại.", "LPDDR5X + 12 GB", ""),
  section("Phụ thuộc", "Lưu trữ đi cùng dung lượng", "storage_standard_id + storage_capacity_gb", "Cặp trường", "Điều kiện", "Một trong hai có dữ liệu thì phải có trường còn lại.", "UFS 4.0 + 512 GB", ""),
  section("Phụ thuộc", "Giá đi cùng tiền tệ", "launch_price + currency_id", "Cặp trường", "Điều kiện", "Có giá ra mắt thì phải có đơn vị tiền tệ.", "29.990.000 + VND", ""),
  section("Phụ thuộc", "Nhóm màn hình", "display.technology", "Trường khóa", "Điều kiện", "Bất kỳ thông số màn hình nào đều yêu cầu công nghệ màn hình.", "LTPO OLED", ""),
  section("Phụ thuộc", "Nhóm pin", "battery.capacity_mah", "Trường khóa", "Điều kiện", "Bất kỳ thông tin pin/sạc nào đều yêu cầu dung lượng mAh.", "5000", ""),
  section("Phụ thuộc", "Chipset và thành phần", "chipset links", "Quan hệ", "Tự động", "Khi chọn chipset, CPU/GPU/NPU/modem được kế thừa; chỉ chọn riêng từng thành phần khi không dùng chipset catalog.", "Snapdragon 8 Elite → Oryon, Adreno…", ""),
  section("Định dạng", "Slug", "slug", "Regex", "Bắt buộc", "^[a-z0-9]+(?:-[a-z0-9]+)*$", "galaxy-s26-ultra", "Không dấu, không khoảng trắng, không ký tự đặc biệt."),
  section("Định dạng", "HEX màu", "color_hex", "Regex", "Điều kiện", "^#[0-9a-fA-F]{6}$", "#1F2937", ""),
  section("Định dạng", "Số có đơn vị", "các trường số", "Số thuần", "Bắt buộc khi nhập", "Không nhập đơn vị trong ô số; UI/Excel nhãn đã thể hiện đơn vị. Chấp nhận 6,7 hoặc 6.7 khi UI chuẩn hóa.", "5000; 6.7; 120", ""),
  section("Nội dung", "Không điền dữ liệu chưa xác minh", "—", "Quy chuẩn", "Bắt buộc quy trình", "Để trống trường kỹ thuật chưa xác minh; không ước lượng để lấp chỗ trống.", "—", "Áp dụng cho module và thiết bị."),
  section("Media", "Cơ chế upload", "media_assets", "Quy trình", "Khuyến nghị", "Upload trực tiếp storage theo signed URL; DB lưu metadata/object key, không ghi CDN URL vào entity mới.", "create upload → PUT → complete", "Theo Platform v3."),
  section("UI/API", "Operating system module", "kind=operating-system", "Lưu ý rà soát", "Thông tin", "DTO/API hỗ trợ loại module này và category=os_family là bắt buộc; màn hình Phần cứng hiện không có thẻ chọn tương ứng.", "Android / android", "Dùng phần tạo OS version ở bước Phần mềm khi tạo thiết bị."),
];

const sheets = [
  { name: "01_Module", title: "01. Checklist tạo module phần cứng dùng chung", subtitle: "Tạo module trước khi liên kết vào thiết bị. Các trường chưa xác minh để trống.", rows: [...baseModuleRows, ...moduleTypeRows] },
  { name: "02_Dữ_liệu_nền", title: "02. Dữ liệu nền: hãng, danh mục, dòng máy và catalog phần mềm", subtitle: "Chuẩn bị hoặc tạo các bản ghi tham chiếu trước khi tạo model thiết bị.", rows: foundationRows },
  { name: "03_Model", title: "03. Model thiết bị và nội dung bắt buộc để publish", subtitle: "Model là thực thể thiết bị duy nhất; variant là SKU/cấu hình cụ thể bên dưới model.", rows: modelRows },
  { name: "04_Variant", title: "04. Phiên bản, cấu hình, liên kết module và thân máy", subtitle: "Thông tin áp dụng cho SKU/phiên bản bán ra. Chỉ điền dữ liệu đã xác minh.", rows: variantRows },
  { name: "05_Module_trực_tiếp", title: "05. Module nhập trực tiếp cho thiết bị: màn hình, camera, pin", subtitle: "Wizard chuẩn hóa và tạo liên kết module ở phía sau khi publish.", rows: inlineModuleRows },
  { name: "06_Phần_mềm_Media", title: "06. Phần mềm, media, nơi bán và dữ liệu nâng cao", subtitle: "Các phần này không chặn publish trừ khi một nhóm đã được bắt đầu mà thiếu trường khóa.", rows: softwareMediaRows },
  { name: "07_Quy_tắc", title: "07. Quy tắc kiểm tra và phụ thuộc dữ liệu", subtitle: "Các điều kiện tổng hợp được rút từ validation của Wizard, DTO API và quy chuẩn nội dung.", rows: rulesRows },
];

function makeChecklistSheet(workbook, definition) {
  const sheet = workbook.worksheets.add(definition.name);
  sheet.showGridLines = false;
  sheet.mergeCells("A1:J1");
  sheet.getRange("A1").values = [[definition.title]];
  sheet.getRange("A1:J1").format = {
    fill: COLORS.navy,
    font: { bold: true, color: COLORS.white, size: 14 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  sheet.getRange("A1:J1").format.rowHeight = 30;

  sheet.mergeCells("A2:J2");
  sheet.getRange("A2").values = [[definition.subtitle]];
  sheet.getRange("A2:J2").format = {
    fill: COLORS.sky,
    font: { color: COLORS.slate, italic: true, size: 10 },
    wrapText: true,
    verticalAlignment: "center",
  };
  sheet.getRange("A2:J2").format.rowHeight = 28;

  sheet.mergeCells("A3:J3");
  sheet.getRange("A3").values = [["Dùng cột “Tình trạng chuẩn bị” để theo dõi. “Bắt buộc xuất bản” là điều kiện chặn publish trong Catalog Studio; “Điều kiện” chỉ bắt buộc khi trường/nhóm liên quan đã có dữ liệu."]];
  sheet.getRange("A3:J3").format = {
    fill: COLORS.light,
    font: { color: COLORS.slate, size: 9 },
    wrapText: true,
    verticalAlignment: "center",
  };
  sheet.getRange("A3:J3").format.rowHeight = 32;

  sheet.getRange("A5:J5").values = [headers];
  sheet.getRange("A5:J5").format = {
    fill: COLORS.blue,
    font: { bold: true, color: COLORS.white, size: 9 },
    wrapText: true,
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: COLORS.blue },
  };
  sheet.getRange("A5:J5").format.rowHeight = 32;

  const values = definition.rows.map((row, index) => [
    index + 1,
    ...row.slice(0, 7),
    "Chưa chuẩn bị",
    row[7],
  ]);
  const lastRow = 5 + values.length;
  sheet.getRange(`A6:J${lastRow}`).values = values;
  const data = sheet.getRange(`A6:J${lastRow}`);
  data.format = {
    wrapText: true,
    verticalAlignment: "top",
    font: { size: 9, color: COLORS.navy },
    borders: { preset: "inside", style: "thin", color: "#E2E8F0" },
  };
  sheet.getRange(`A6:A${lastRow}`).format = { horizontalAlignment: "center", verticalAlignment: "top", font: { size: 9, color: COLORS.slate } };
  sheet.getRange(`I6:I${lastRow}`).format = { horizontalAlignment: "center", verticalAlignment: "top", font: { bold: true, size: 9, color: COLORS.slate } };
  sheet.getRange(`F6:F${lastRow}`).format = { font: { bold: true, size: 9, color: COLORS.slate }, verticalAlignment: "top", wrapText: true };

  sheet.getRange(`F6:F${lastRow}`).conditionalFormats.add("containsText", {
    text: "Bắt buộc",
    format: { fill: COLORS.red, font: { bold: true, color: "#991B1B" } },
  });
  sheet.getRange(`F6:F${lastRow}`).conditionalFormats.add("containsText", {
    text: "Điều kiện",
    format: { fill: COLORS.amber, font: { bold: true, color: "#92400E" } },
  });
  sheet.getRange(`F6:F${lastRow}`).conditionalFormats.add("containsText", {
    text: "Tùy chọn",
    format: { fill: COLORS.sky, font: { color: "#1E40AF" } },
  });
  sheet.getRange(`F6:F${lastRow}`).conditionalFormats.add("containsText", {
    text: "Tự động",
    format: { fill: COLORS.green, font: { color: "#166534" } },
  });
  sheet.getRange(`I6:I${lastRow}`).conditionalFormats.add("containsText", {
    text: "Đã có",
    format: { fill: COLORS.green, font: { bold: true, color: "#166534" } },
  });
  sheet.getRange(`I6:I${lastRow}`).conditionalFormats.add("containsText", {
    text: "Cần xác minh",
    format: { fill: COLORS.amber, font: { bold: true, color: "#92400E" } },
  });

  sheet.getRange(`I6:I${lastRow}`).dataValidation = {
    rule: { type: "list", values: STATUS_VALUES },
  };
  sheet.freezePanes.freezeRows(5);
  sheet.getRange(`A5:J${lastRow}`).format.borders = { preset: "outside", style: "thin", color: COLORS.border };
  sheet.getRange(`A5:J${lastRow}`).format.rowHeight = 33;

  const widths = [6, 19, 30, 31, 23, 18, 39, 34, 18, 40];
  for (let col = 0; col < widths.length; col += 1) {
    sheet.getRangeByIndexes(0, col, lastRow, 1).format.columnWidth = widths[col];
  }
  return { name: definition.name, lastRow, rowCount: values.length };
}

function makeOverview(workbook, metadata) {
  const sheet = workbook.worksheets.add("00_Hướng_dẫn");
  sheet.showGridLines = false;
  sheet.mergeCells("A1:H1");
  sheet.getRange("A1").values = [["SpecHub — Checklist dữ liệu từ module đến thiết bị"]];
  sheet.getRange("A1:H1").format = {
    fill: COLORS.navy,
    font: { bold: true, color: COLORS.white, size: 18 },
    verticalAlignment: "center",
  };
  sheet.getRange("A1:H1").format.rowHeight = 34;

  sheet.mergeCells("A2:H2");
  sheet.getRange("A2").values = [["Rà soát theo mã nguồn ngày 2026-08-11: Catalog Studio Wizard, DTO API, service validation và quy chuẩn nội dung."]];
  sheet.getRange("A2:H2").format = { fill: COLORS.sky, font: { color: COLORS.slate, italic: true, size: 10 }, verticalAlignment: "center" };
  sheet.getRange("A2:H2").format.rowHeight = 25;

  sheet.getRange("A4:D4").values = [["Trình tự", "Thực thể / hành động", "Kết quả dùng ở bước sau", "Lưu ý chính"]];
  sheet.getRange("A4:D4").format = { fill: COLORS.blue, font: { bold: true, color: COLORS.white }, horizontalAlignment: "center", wrapText: true };
  const flow = [
    [1, "Tạo CPU/GPU/NPU/Modem (nếu cần) và chuẩn RAM/lưu trữ", "Module dùng chung", "Không nhân bản thực thể kỹ thuật theo từng máy."],
    [2, "Tạo Chipset / SoC và liên kết CPU/GPU/NPU/Modem", "Smart-linking SoC", "Chipset bắt buộc hãng và loại chipset."],
    [3, "Tạo hãng, danh mục, dòng sản phẩm", "Dữ liệu nền", "Dòng sản phẩm cần hãng + danh mục + mô tả ≥80 ký tự."],
    [4, "Tạo model thiết bị", "Model duy nhất", "Cần tên, slug, dòng sản phẩm, trạng thái và tóm tắt ≥80 ký tự."],
    [5, "Tạo variant, gắn module và cấu hình", "SKU / cấu hình", "Tên phiên bản là bắt buộc; giá cần tiền tệ; RAM/lưu trữ là cặp trường."],
    [6, "Nhập màn hình, camera, pin trực tiếp", "Module inline chuẩn hóa", "Màn hình cần công nghệ; pin cần dung lượng mAh khi nhóm có dữ liệu."],
    [7, "Bổ sung phần mềm, media, nơi bán và nội dung", "Dữ liệu public", "Publish yêu cầu ≥3 mục nội dung và mô tả tổng ≥240 ký tự."],
  ];
  sheet.getRange("A5:D11").values = flow;
  sheet.getRange("A5:D11").format = { wrapText: true, verticalAlignment: "top", borders: { preset: "inside", style: "thin", color: "#E2E8F0" } };
  sheet.getRange("A4:D11").format.borders = { preset: "outside", style: "thin", color: COLORS.border };
  sheet.getRange("A5:A11").format = { horizontalAlignment: "center", font: { bold: true, color: COLORS.blue } };
  sheet.getRange("A5:D11").format.rowHeight = 52;

  sheet.getRange("F4:H4").values = [["Ký hiệu", "Ý nghĩa", "Cách dùng"]];
  sheet.getRange("F4:H4").format = { fill: COLORS.violet, font: { bold: true, color: "#5B21B6" }, horizontalAlignment: "center", wrapText: true };
  sheet.getRange("F5:H8").values = [
    ["Bắt buộc xuất bản", "Thiếu là không publish được", "Ưu tiên chuẩn bị trước"],
    ["Điều kiện", "Chỉ bắt buộc khi đã bắt đầu nhóm dữ liệu liên quan", "Kiểm tra cặp/field khóa"],
    ["Tùy chọn", "Không chặn tạo/publish", "Chỉ nhập khi đã xác minh"],
    ["Tình trạng chuẩn bị", "Cột có dropdown trong các sheet checklist", "Đổi thành Đã có/Cần xác minh/Không áp dụng"],
  ];
  sheet.getRange("F5:H8").format = { wrapText: true, verticalAlignment: "top", borders: { preset: "inside", style: "thin", color: "#E2E8F0" } };
  sheet.getRange("F4:H8").format.borders = { preset: "outside", style: "thin", color: COLORS.border };

  sheet.getRange("A14:D14").values = [["Sheet", "Nội dung", "Số dòng checklist", "Đã sẵn sàng"]];
  sheet.getRange("A14:D14").format = { fill: COLORS.navy, font: { bold: true, color: COLORS.white }, horizontalAlignment: "center" };
  const rows = metadata.map((item, index) => [
    item.name,
    sheets.find((definition) => definition.name === item.name)?.title ?? "",
    `=COUNTA('${item.name}'!C6:C${item.lastRow})`,
    `=COUNTIF('${item.name}'!I6:I${item.lastRow},"Đã có")`,
  ]);
  sheet.getRange(`A15:D${14 + rows.length}`).values = rows.map((row) => [row[0], row[1], null, null]);
  sheet.getRange(`C15:C${14 + rows.length}`).formulas = rows.map((row) => [row[2]]);
  sheet.getRange(`D15:D${14 + rows.length}`).formulas = rows.map((row) => [row[3]]);
  sheet.getRange(`A15:D${14 + rows.length}`).format = { wrapText: true, verticalAlignment: "top", borders: { preset: "inside", style: "thin", color: "#E2E8F0" } };
  sheet.getRange(`A14:D${14 + rows.length}`).format.borders = { preset: "outside", style: "thin", color: COLORS.border };
  sheet.getRange(`C15:D${14 + rows.length}`).format = { horizontalAlignment: "center", font: { bold: true, color: COLORS.blue } };

  sheet.mergeCells("F14:H14");
  sheet.getRange("F14").values = [["Điểm cần lưu ý sau rà soát"]];
  sheet.getRange("F14:H14").format = { fill: COLORS.amber, font: { bold: true, color: "#92400E" }, verticalAlignment: "center" };
  sheet.mergeCells("F15:H18");
  sheet.getRange("F15").values = [["1) DTO/API có loại module operating-system nhưng danh sách thẻ ở màn hình Phần cứng hiện không hiển thị loại này. Luồng tạo thiết bị dùng phần tạo OS version trong bước Phần mềm.\n\n2) Media không bắt buộc publish, nhưng ảnh đầu tiên sẽ là cover.\n\n3) Hãy để trống thông số chưa xác minh; không dùng số ước lượng."]];
  sheet.getRange("F15:H18").format = { fill: "#FFFBEB", font: { color: "#78350F", size: 10 }, wrapText: true, verticalAlignment: "top", borders: { preset: "outside", style: "thin", color: "#FCD34D" } };

  const widths = [10, 36, 18, 18, 4, 23, 30, 28];
  for (let col = 0; col < widths.length; col += 1) {
    sheet.getRangeByIndexes(0, col, 22, 1).format.columnWidth = widths[col];
  }
  sheet.getRange("A15:D21").format.rowHeight = 38;
  sheet.freezePanes.freezeRows(4);
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });
const workbook = Workbook.create();
const metadata = sheets.map((definition) => makeChecklistSheet(workbook, definition));
makeOverview(workbook, metadata);

const summaryCheck = await workbook.inspect({
  kind: "table",
  range: "00_Hướng_dẫn!A1:H18",
  include: "values,formulas",
  tableMaxRows: 18,
  tableMaxCols: 8,
});
console.log(summaryCheck.ndjson);

for (const sheetName of ["00_Hướng_dẫn", ...sheets.map((item) => item.name)]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${previewDir}/${sheetName}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`OUTPUT=${outputPath}`);
