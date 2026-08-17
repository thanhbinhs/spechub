-- Remove soft references to the retired module types before dropping their tables.
DELETE FROM "variant_module_scores"
WHERE "module_kind" IN ('wireless-standard', 'port-standard', 'sensor');

DELETE FROM "translations"
WHERE "entity_table" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

DELETE FROM "entity_tags"
WHERE "entity_table" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

DELETE FROM "entity_media"
WHERE "entity_table" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

DELETE FROM "catalog_drafts"
WHERE "entity_table" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

DELETE FROM "catalog_entity_versions"
WHERE "entity_table" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

DELETE FROM "wiki_article_citations"
WHERE "article_id" IN (
  SELECT "id"
  FROM "wiki_articles"
  WHERE "entity_table" IN (
    'wireless_standards',
    'port_standards',
    'hardware_sensors',
    'variant_wireless_support',
    'variant_ports',
    'variant_hardware_sensors'
  )
);

DELETE FROM "wiki_revisions"
WHERE "article_id" IN (
  SELECT "id"
  FROM "wiki_articles"
  WHERE "entity_table" IN (
    'wireless_standards',
    'port_standards',
    'hardware_sensors',
    'variant_wireless_support',
    'variant_ports',
    'variant_hardware_sensors'
  )
);

DELETE FROM "wiki_articles"
WHERE "entity_table" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

DELETE FROM "comments"
WHERE "entity_table" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

DELETE FROM "embeddings"
WHERE "entity_type" IN (
  'wireless_standards',
  'port_standards',
  'hardware_sensors',
  'variant_wireless_support',
  'variant_ports',
  'variant_hardware_sensors'
);

-- Drop variant links first so the catalog tables are no longer referenced.
DROP TABLE "variant_wireless_support";
DROP TABLE "variant_ports";
DROP TABLE "variant_hardware_sensors";

DROP TABLE "wireless_standards";
DROP TABLE "port_standards";
DROP TABLE "hardware_sensors";
