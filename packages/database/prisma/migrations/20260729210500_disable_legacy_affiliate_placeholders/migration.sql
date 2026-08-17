UPDATE "affiliate_links"
SET
  "in_stock" = false,
  "sync_status" = 'unavailable',
  "sync_error" = 'Liên kết mẫu không trỏ tới trang sản phẩm thật.',
  "availability_label" = 'Liên kết đã hết hiệu lực',
  "last_checked_at" = CURRENT_TIMESTAMP,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "product_url" IN (
  'https://www.amazon.com/spechub/iphone-16-pro-256',
  'https://www.amazon.com/spechub/pixel-9-pro-128',
  'https://www.bestbuy.com/spechub/galaxy-s25-ultra-256',
  'https://www.bestbuy.com/spechub/xiaomi-14-ultra-512'
);
