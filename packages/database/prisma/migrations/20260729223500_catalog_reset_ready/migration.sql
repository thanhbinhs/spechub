ALTER TABLE "process_nodes"
  DROP CONSTRAINT "process_nodes_foundry_org_id_fkey";

ALTER TABLE "process_nodes"
  ALTER COLUMN "foundry_org_id" DROP NOT NULL;

ALTER TABLE "process_nodes"
  ADD CONSTRAINT "process_nodes_foundry_org_id_fkey"
  FOREIGN KEY ("foundry_org_id")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "chipsets"
  DROP CONSTRAINT "chipsets_manufacturer_org_id_fkey";

ALTER TABLE "chipsets"
  ALTER COLUMN "manufacturer_org_id" DROP NOT NULL;

ALTER TABLE "chipsets"
  ADD CONSTRAINT "chipsets_manufacturer_org_id_fkey"
  FOREIGN KEY ("manufacturer_org_id")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "camera_sensors"
  DROP CONSTRAINT "camera_sensors_manufacturer_org_id_fkey";

ALTER TABLE "camera_sensors"
  ALTER COLUMN "manufacturer_org_id" DROP NOT NULL;

ALTER TABLE "camera_sensors"
  ADD CONSTRAINT "camera_sensors_manufacturer_org_id_fkey"
  FOREIGN KEY ("manufacturer_org_id")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

UPDATE "organizations"
SET "description" = CONCAT(
  'Tổ chức ', "name",
  ' hoạt động trong hệ sinh thái công nghệ và thiết bị. Hồ sơ chi tiết về vai trò, sản phẩm, công nghệ nổi bật và phạm vi hoạt động cần được chuẩn hóa lại.'
)
WHERE NULLIF(BTRIM("description"), '') IS NULL;

UPDATE "product_families"
SET "description" = CONCAT(
  'Dòng sản phẩm ', "name",
  ' cần được chuẩn hóa lại thông tin về định vị, nhóm người dùng, các đặc điểm nổi bật và phạm vi thế hệ trước khi tiếp tục sử dụng.'
)
WHERE NULLIF(BTRIM("description"), '') IS NULL;

UPDATE "device_models"
SET "summary" = CONCAT(
  "name",
  ' là một mẫu thiết bị cần được chuẩn hóa lại phần tóm tắt về định vị, trải nghiệm chính và những điểm nổi bật trước khi tiếp tục sử dụng.'
)
WHERE NULLIF(BTRIM("summary"), '') IS NULL;

UPDATE "device_models"
SET "description" = CONCAT(
  '## Tổng quan', E'\n\n',
  "name",
  ' cần được biên tập lại hồ sơ đầy đủ theo chuẩn SpecHub, bao gồm điểm nổi bật, thiết kế, hiệu năng, màn hình, camera, pin, phần mềm, hạn chế và đối tượng người dùng phù hợp. Nội dung kỹ thuật phải khớp với các mô-đun và nguồn dữ liệu đã xác minh.'
)
WHERE NULLIF(BTRIM("description"), '') IS NULL;

ALTER TABLE "organizations"
  ALTER COLUMN "description" SET NOT NULL;

ALTER TABLE "product_families"
  ALTER COLUMN "description" SET NOT NULL;

ALTER TABLE "device_models"
  ALTER COLUMN "summary" SET NOT NULL,
  ALTER COLUMN "description" SET NOT NULL;
