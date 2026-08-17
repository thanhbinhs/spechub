# Quy chuẩn nội dung danh mục SpecHub

Mọi bản ghi mới phải mô tả đúng dữ liệu đã xác minh, viết bằng tiếng Việt rõ
ràng và không dùng câu quảng cáo.

## Tổ chức

- Tên, slug và mô tả là bắt buộc.
- Mô tả tối thiểu 80 ký tự, nêu lĩnh vực hoạt động, vai trò trong chuỗi sản
  phẩm và các nhóm công nghệ hoặc thiết bị nổi bật.
- Website, quốc gia, tên pháp lý và năm thành lập chỉ nhập khi đã xác minh.

## Dòng sản phẩm

- Phải thuộc đúng một tổ chức và một danh mục thiết bị.
- Mô tả tối thiểu 80 ký tự, nêu định vị dòng máy, nhóm người dùng, đặc trưng
  xuyên suốt và phạm vi thế hệ.

## Thiết bị

- Tóm tắt từ 80 đến 600 ký tự, dùng cho card và kết quả tìm kiếm.
- Mô tả chi tiết tối thiểu 240 ký tự, ưu tiên Markdown với các phần: điểm nổi
  bật, thiết kế/màn hình, hiệu năng, camera, pin/sạc, phần mềm, hạn chế và nhóm
  người dùng phù hợp.
- Không sao chép mô tả tiếp thị; mọi con số quan trọng phải khớp module hoặc
  nguồn đã xác minh.

## Module phần cứng

- Tên, slug và mô tả là bắt buộc.
- Mô tả tối thiểu 120 ký tự, nêu vai trò của module, thế hệ/kiến trúc, thông số
  nổi bật, khả năng tương thích và hạn chế đáng chú ý.
- Trường chưa xác minh để trống; không dùng giá trị ước đoán để lấp chỗ trống.

## Chuẩn hóa thông số nhập trực tiếp

Catalog Studio, biểu mẫu quản trị và API cùng áp dụng một bộ chuẩn trước khi
lưu. Người nhập có thể dùng cách viết quen thuộc, nhưng bản ghi công khai luôn
chỉ giữ một biểu diễn chuẩn:

| Nhóm                  | Ví dụ đầu vào được chấp nhận                  | Dạng lưu/hiển thị chuẩn                                                                                        |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Số và đơn vị          | `6,7`, `6.7`, `5 000`, `5,000`                | Giá trị số có cấu trúc; hiển thị theo `vi-VN` với đơn vị cách một khoảng trắng (`6,7″`, `5.000 mAh`, `120 Hz`) |
| Công nghệ màn hình    | `ltpo-oled`, `LTPO OLED`                      | `LTPO OLED`                                                                                                    |
| Tỷ lệ / dải màu / HDR | `19,5 / 9`, `dci p3`, `dolby vision / hdr10+` | `19.5:9`, `DCI-P3`, `HDR10+, Dolby Vision`                                                                     |
| Camera và sạc         | `F 1,8`, `4k60fps`, `usb-pd / pps`, `qi 2`    | `f/1.8`, `4K 60 fps`, `USB PD PPS`, `Qi2`                                                                      |
| Thân máy              | `ip 68`, `nano sim + e sim`, `vapour chamber` | `IP68`, `Nano-SIM + eSIM`, `Vapor chamber`                                                                     |

Không nhập đơn vị vào các trường số vì đơn vị đã nằm trong nhãn trường. Khi
nhập qua API, gửi số ở dạng số JSON; giao diện vẫn chấp nhận cả dấu phẩy thập
phân và dấu phân cách hàng nghìn khi người biên tập dán dữ liệu.
