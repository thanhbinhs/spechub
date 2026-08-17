UPDATE "device_categories"
SET "name" = CASE "slug"
  WHEN 'smartphone' THEN 'Điện thoại'
  WHEN 'tablet' THEN 'Máy tính bảng'
  WHEN 'laptop' THEN 'Máy tính xách tay'
  WHEN 'smartwatch' THEN 'Đồng hồ thông minh'
  WHEN 'earbuds' THEN 'Tai nghe không dây'
  WHEN 'television' THEN 'TV thông minh'
  WHEN 'gaming-handheld' THEN 'Máy chơi game cầm tay'
  WHEN 'e-reader' THEN 'Máy đọc sách điện tử'
  ELSE "name"
END
WHERE "slug" IN (
  'smartphone',
  'tablet',
  'laptop',
  'smartwatch',
  'earbuds',
  'television',
  'gaming-handheld',
  'e-reader'
);

UPDATE "release_statuses"
SET "name" = CASE "code"
  WHEN 'rumored' THEN 'Đồn đại'
  WHEN 'announced' THEN 'Đã công bố'
  WHEN 'pre_order' THEN 'Đặt trước'
  WHEN 'released' THEN 'Đã phát hành'
  WHEN 'delayed' THEN 'Hoãn lại'
  WHEN 'discontinued' THEN 'Ngừng sản xuất'
  WHEN 'eol' THEN 'Kết thúc vòng đời'
  ELSE "name"
END
WHERE "code" IN (
  'rumored',
  'announced',
  'pre_order',
  'released',
  'delayed',
  'discontinued',
  'eol'
);

UPDATE "camera_roles"
SET "name" = CASE "code"
  WHEN 'main' THEN 'Máy ảnh chính'
  WHEN 'telephoto' THEN 'Máy ảnh chụp xa'
  WHEN 'ultrawide' THEN 'Máy ảnh góc siêu rộng'
  ELSE "name"
END
WHERE "code" IN ('main', 'telephoto', 'ultrawide');
