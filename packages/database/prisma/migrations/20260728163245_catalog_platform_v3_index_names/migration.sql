-- RenameIndex
ALTER INDEX "battery_charging_protocols_battery_protocol_reverse_key" RENAME TO "battery_charging_protocols_battery_unit_id_charging_protoco_key";

-- RenameIndex
ALTER INDEX "camera_module_feature_links_camera_module_id_feature_id_key" RENAME TO "camera_module_feature_links_camera_module_id_camera_feature_key";

-- RenameIndex
ALTER INDEX "camera_module_video_modes_camera_module_id_video_mode_id_key" RENAME TO "camera_module_video_modes_camera_module_id_camera_video_mod_key";

-- RenameIndex
ALTER INDEX "camera_video_modes_resolution_fps_idx" RENAME TO "camera_video_modes_resolution_width_resolution_height_frame_idx";

-- RenameIndex
ALTER INDEX "catalog_draft_versions_draft_id_revision_key" RENAME TO "catalog_draft_versions_catalog_draft_id_revision_key";

-- RenameIndex
ALTER INDEX "catalog_drafts_owner_status_updated_at_idx" RENAME TO "catalog_drafts_owner_user_id_status_updated_at_idx";

-- RenameIndex
ALTER INDEX "catalog_entity_versions_actor_created_at_idx" RENAME TO "catalog_entity_versions_actor_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "catalog_entity_versions_table_entity_created_at_idx" RENAME TO "catalog_entity_versions_entity_table_entity_id_created_at_idx";

-- RenameIndex
ALTER INDEX "catalog_entity_versions_table_entity_version_key" RENAME TO "catalog_entity_versions_entity_table_entity_id_version_key";

-- RenameIndex
ALTER INDEX "device_editorial_sections_device_model_id_is_published_display_" RENAME TO "device_editorial_sections_device_model_id_is_published_disp_idx";

-- RenameIndex
ALTER INDEX "device_model_aliases_device_model_id_normalized_alias_region_ke" RENAME TO "device_model_aliases_device_model_id_normalized_alias_regio_key";

-- RenameIndex
ALTER INDEX "display_color_gamut_support_display_unit_id_gamut_id_key" RENAME TO "display_color_gamut_support_display_unit_id_color_gamut_id_key";

-- RenameIndex
ALTER INDEX "npu_precision_capabilities_npu_id_precision_sparsity_key" RENAME TO "npu_precision_capabilities_npu_id_precision_sparsity_mode_key";

-- RenameIndex
ALTER INDEX "scoring_profile_metrics_module_id_display_order_idx" RENAME TO "scoring_profile_metrics_scoring_profile_module_id_display_o_idx";

-- RenameIndex
ALTER INDEX "scoring_profile_metrics_module_id_metric_key_key" RENAME TO "scoring_profile_metrics_scoring_profile_module_id_metric_ke_key";

-- RenameIndex
ALTER INDEX "scoring_profile_modules_profile_id_display_order_idx" RENAME TO "scoring_profile_modules_scoring_profile_id_display_order_idx";

-- RenameIndex
ALTER INDEX "scoring_profile_modules_profile_id_module_key_key" RENAME TO "scoring_profile_modules_scoring_profile_id_module_key_key";

-- RenameIndex
ALTER INDEX "scoring_profiles_category_status_effective_idx" RENAME TO "scoring_profiles_device_category_id_status_effective_from_idx";

-- RenameIndex
ALTER INDEX "variant_connectivity_support_feature_supported_idx" RENAME TO "variant_connectivity_support_connectivity_feature_id_is_sup_idx";

-- RenameIndex
ALTER INDEX "variant_connectivity_support_variant_feature_key" RENAME TO "variant_connectivity_support_device_variant_id_connectivity_key";
