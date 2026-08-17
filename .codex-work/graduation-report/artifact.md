# Hợp đồng tạo báo cáo đồ án Spechub từ tài liệu mẫu

## Tham chiếu

- Chuẩn chính: `/Users/macm1/Project/spechub/.codex-work/graduation-report/templates/21012899_PhamThanhTrung.docx`
- SHA-256 chuẩn chính: `e290581f9efc18ac4e3ac14d990153958b451fa27505f14605fe555333e43ab9`
- Kích thước: 29.347.528 byte; 97 trang render; 5 section; 988 đoạn; 10 bảng; 65 inline shape.
- Chuẩn đối chiếu nội dung: `/Users/macm1/Project/spechub/.codex-work/graduation-report/templates/baocaodoantotnghiep.docx`
- SHA-256 chuẩn đối chiếu: `b06edd31ed22c0521f238882970f1d31da2e7a727cb73a796c81ec3e98640a9a`
- Bằng chứng: `analysis/template-b-evidence.json`, `analysis/template-b-style.json`, `render-template-b/`; đối chiếu với các tệp tương ứng của template A.

## Hệ thống trang

- A4 dọc, 8,2701 × 11,6903 inch.
- Lề chuẩn chính: trái 1,0403 inch; phải 0,7701 inch; trên 1 inch; dưới 1 inch.
- Khoảng cách header 0,3937 inch cho phần nội dung; footer 0 inch trong nguồn. Báo cáo mới dùng footer 0,35 inch để số trang ổn định khi render (override `stable-footer`).
- Cấu trúc mới gồm bốn section, đều NEW_PAGE: bìa ngoài không số; bìa trong không số; phần đầu đánh số La Mã thường từ i; phần nội dung đánh số Ả Rập từ 1.
- Không dùng trang ngang. Sơ đồ rộng phải thu gọn trong bề ngang sử dụng khoảng 6,46 inch, tương ứng mẫu chính.

## Kiểu chữ và nhịp đoạn

- Font toàn văn: Times New Roman; thân bài 13 pt; căn đều; giãn dòng 1,5; trước 6 pt; sau 6 pt; thụt đầu dòng 0,1972 inch.
- Tiêu đề phần đầu: 16 pt, đậm, chữ hoa, căn giữa, không thụt đầu dòng.
- Heading 1 (tên chương): 15 pt, đậm, chữ hoa, căn giữa, `keep_with_next`, mở đầu trang mới.
- Heading 2: override `section-heading`: 13 pt, đậm, căn trái, trước 12 pt, sau 6 pt, không thụt đầu dòng.
- Heading 3: override `subsection-heading`: 13 pt, đậm nghiêng, căn trái, trước 9 pt, sau 4 pt, không thụt đầu dòng.
- Heading 4: 13 pt, nghiêng, lề trái 0,1972 inch, `keep_with_next`.
- Caption: override `academic-caption`: Times New Roman 11 pt, nghiêng, căn giữa, trước 3 pt, sau 9 pt, giữ cùng hình/bảng.
- Footnote: 10 pt, giãn dòng đơn.
- Không kế thừa lỗi Heading 9 và heading giả của mẫu; tất cả mục thực chất là tiêu đề phải dùng Heading 1/2/3/4 thật.

## Danh sách, bảng và hình

- Danh sách dùng numbering definition thật; dấu gạch đầu dòng căn tại 0,25 inch, nội dung tại 0,55 inch, hanging 0,3 inch.
- Bảng có chiều rộng cố định theo DXA; `tblW`, `tblGrid`, `tcW` đồng nhất; `tblInd` bằng 120 DXA; cell margin 120 DXA; không khóa chiều cao hàng.
- Header bảng: 11 pt đậm, căn giữa, nền xám trung tính `D9D9D9`; nội dung 10,5–11 pt; cột mô tả căn trái, cột mã/trạng thái/số căn giữa. Đây là thay đổi theo yêu cầu người dùng về tài liệu đen–trắng.
- Hình phải là inline drawing; không tạo `wp:anchor`. Chiều rộng tối đa 6,25 inch; ảnh chụp giao diện ưu tiên 6,1–6,25 inch; sơ đồ dọc có thể hẹp hơn.
- Toàn bộ logo, ảnh giao diện và sơ đồ trong bản nộp dùng thang xám, không còn điểm ảnh có độ bão hòa màu. Sơ đồ dùng nền trắng, nét đen, đầu mũi tên và ký pháp UML/ERD chuẩn; không đặt tiêu đề hoặc dải trang trí trong ảnh vì tên hình đã được trình bày bằng caption bên dưới.
- Hình và bảng có caption đánh số theo chương bằng văn bản hiển thị ổn định; danh mục hình/bảng được tạo tĩnh để render headless không phụ thuộc refresh field.
- Alt text mô tả nội dung hình bằng tiếng Việt.

## Thành phần lặp

- Bìa ngoài giữ tinh thần mẫu: khung đen, logo Phenikaa, tên cơ quan/trường, nhãn “ĐỒ ÁN TỐT NGHIỆP”, đề tài, thông tin thực hiện, Hà Nội – 2026. Dải gáy dọc của mẫu được lược bỏ nếu gây tràn khi render; đây là override `clean-outer-cover`.
- Bìa trong dùng cùng logo và hierarchy nhưng không có dải gáy.
- Phần đầu gồm: Tóm tắt, Lời cam đoan, Lời cảm ơn, Mục lục, Danh mục hình ảnh, Danh mục bảng biểu, Danh mục từ viết tắt.
- Nội dung gồm: Mở đầu; Chương 1 Tổng quan; Chương 2 Cơ sở lý thuyết và công nghệ; Chương 3 Phân tích thiết kế hệ thống; Chương 4 Phát triển và kết quả; Kết luận và hướng phát triển; Tài liệu tham khảo; Phụ lục.
- Header nội dung không bắt buộc; số trang đặt giữa chân trang như mẫu.

## Luồng nội dung và mật độ

- Phần mở đầu/tổng quan: 8–12 trang, văn xuôi kết hợp bảng so sánh hiện trạng và bảng yêu cầu.
- Cơ sở lý thuyết: 12–16 trang, mô tả monorepo, Next.js, NestJS/Fastify, Prisma/PostgreSQL, Redis/JWT, RAG/embedding, PWA/worker và bảo mật.
- Phân tích thiết kế: 20–28 trang, bảng tác nhân/use case, đặc tả use case tiêu biểu, sơ đồ use case, kiến trúc, hoạt động, tuần tự, mô hình dữ liệu theo nhóm.
- Phát triển/kết quả: 16–24 trang, module hiện thực, API, giao diện, kiểm thử, hạn chế.
- Mục tiêu 60–85 trang để tương xứng hai mẫu nhưng không chèn văn bản rỗng chỉ để tăng số trang.

## Bản đồ slot

- Bìa: thay toàn bộ tên đề tài bằng “XÂY DỰNG NỀN TẢNG SPECHUB – TRA CỨU, SO SÁNH VÀ NGHIÊN CỨU THIẾT BỊ THÔNG MINH”; thông tin cá nhân không được suy diễn. Dùng nhãn trung tính “Đơn vị thực hiện: Nhóm phát triển Spechub”.
- Tóm tắt/cam đoan/cảm ơn: viết mới theo dự án, không sao chép nội dung mẫu.
- Mục lục/danh mục: tạo mới hoàn toàn theo nội dung cuối.
- Chương 1–4, kết luận, tài liệu tham khảo, phụ lục: rewrite toàn bộ.
- Logo Phenikaa của mẫu chính: được phép tái sử dụng ở bìa vì người dùng cung cấp mẫu làm chuẩn.
- Logo Phenikaa được chuyển sang đen–trắng trong bản nộp; tệp màu gốc vẫn được giữ nguyên trong thư mục làm việc.
- Toàn bộ ảnh/sơ đồ nghiệp vụ cũ: loại bỏ; thay bằng sơ đồ và ảnh giao diện Spechub.

## Phạm vi package

- Preserve-only: `word/theme/theme1.xml`, logo Phenikaa được trích từ media của mẫu, thông số A4/lề, hệ thống Times New Roman và tinh thần hierarchy của style nguồn.
- Editable/rebuild: `word/document.xml`, numbering, headers/footers, relationships ảnh, TOC/list of figures/list of tables, settings page-number format, document properties.
- Loại bỏ khỏi bản cuối: ảnh giao diện/diagram của đề tài đặt vé, hyperlink INCLUDEPICTURE từ PlantUML, comment/tracked change nếu có, metadata tác giả mẫu.
- Kiểm tra hash của hai tệp tham chiếu trước và sau; không sửa bản tham chiếu.

## Cổng kiểm định

- Render tất cả trang của bản cuối; mở và kiểm tra từng PNG.
- Không có clip/overlap, trang trắng vô chủ đích, bảng vỡ, caption tách khỏi hình, ảnh mờ, ký tự tiếng Việt lỗi hoặc số trang sai section.
- Heading audit không có nhảy cấp; images audit chỉ có inline; a11y audit có alt text và header row; metadata được scrub.
- Đối chiếu hình thức với trang bìa, trang tóm tắt, mục lục, bảng từ viết tắt, trang mở đầu và các trang có sơ đồ/ảnh của mẫu chính.
- TOC và danh mục hình/bảng phải khớp bản render cuối; không còn placeholder, token nội bộ hoặc thông tin cá nhân của hai mẫu.
