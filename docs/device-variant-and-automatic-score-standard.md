# Quy chuẩn biến thể thiết bị và score tự động

## 1. Danh tính dữ liệu

- **Device model** là tên sản phẩm mà người dùng nhận biết, ví dụ `Samsung Galaxy S25`.
- **Hardware variant** chỉ được tạo khi thị trường, model number hoặc mô-đun phần cứng khác nhau.
- Tên biến thể được tạo tự động theo mẫu `Thị trường · Model number`, ví dụ `Hàn Quốc · SM-S931N`.
- Nếu chỉ có một cấu hình phần cứng và không phân vùng, hệ thống dùng `Cấu hình tiêu chuẩn`.
- Màu sắc, RAM và dung lượng lưu trữ không tạo device model hoặc hardware variant mới.

## 2. RAM và lưu trữ

Một hardware variant có thể chứa nhiều `variant_memory_configs` và
`variant_storage_configs`.

Ví dụ một bản ghi `Hàn Quốc · SM-S931N` có thể chứa:

- RAM: `8 GB`, `12 GB` cùng chuẩn LPDDR5X.
- Lưu trữ: `128 GB`, `256 GB`, `512 GB` cùng chuẩn UFS 4.0.

Danh sách được loại trùng, sắp xếp tăng dần và lưu trong cùng một transaction.
Score dùng chuẩn/tốc độ module và mức dung lượng cao nhất được hãng cung cấp để
phản ánh năng lực của biến thể, không tạo score riêng cho từng SKU dung lượng.

## 3. Quy chuẩn score tự động

Phiên bản công thức: `automatic-device-score-v1.0.0`.

Người tạo thiết bị không nhập score 0–100. Mỗi lần tạo hoặc cập nhật biến thể,
backend tự tính lại scorecard trong cùng transaction theo thứ tự ưu tiên:

1. Benchmark đã xác minh của thiết bị, chipset, CPU, GPU hoặc NPU.
2. Thông số catalog của module và thiết bị.
3. Giá trị suy ra có công thức công khai, ví dụ PPI, hiệu suất sạc, điểm vật
   liệu hoặc khả năng duy trì hiệu năng từ thiết kế tản nhiệt.
4. Mốc tham chiếu trung tính 50 nếu chưa có dữ liệu; nguồn `reference` luôn
   được lưu trong `raw_metrics`, không giả làm dữ liệu đo.

Mọi metric được chuẩn hóa về 0–100 theo khoảng min/max của loại thiết bị. Phân
phối có biên độ lớn dùng thang log. Điểm nhóm là trung bình có trọng số của các
metric; điểm thiết bị là trung bình có trọng số của các nhóm.

### Trọng số điện thoại

| Nhóm                       | Trọng số |
| -------------------------- | -------: |
| Hiệu năng                  |      25% |
| Máy ảnh                    |      20% |
| Màn hình                   |      15% |
| Pin và sạc                 |      15% |
| Phần mềm                   |      10% |
| Kết nối                    |       5% |
| Hoàn thiện và tính di động |       5% |
| Âm thanh                   |       5% |

Các loại laptop, tablet, smartwatch, earbuds, TV, máy chơi game cầm tay và máy
đọc sách dùng profile riêng trong `@spechub/scoring-core` nhưng cùng nguyên tắc
nguồn dữ liệu và chuẩn hóa ở trên.

## 4. Điều kiện tính lại

Scorecard được tính lại khi:

- tạo device model cùng hardware variant đầu tiên;
- tạo thêm hardware variant;
- đổi chipset/module, màn hình, camera, pin, RAM/lưu trữ;
- đổi thông số thiết kế, I/O, tản nhiệt, kết nối hoặc phần mềm;
- thêm/cập nhật benchmark thông qua API cập nhật biến thể.

`factors.calculation_mode` phải là `automatic_from_composed_device`. Trường
`observed_metric_count` và `reference_metric_count` cho biết bao nhiêu tiêu chí
có dữ liệu thực và bao nhiêu tiêu chí đang dùng mốc trung tính.
