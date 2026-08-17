import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  ArrayUnique,
  IsBoolean,
  IsDate,
  IsHexColor,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class VariantPerformanceResultDto {
  @ApiProperty()
  @IsUUID("4")
  benchmark_id!: string;

  @ApiProperty({ example: 1845120 })
  @Type(() => Number)
  @IsNumber()
  score!: number;

  @ApiPropertyOptional({ example: "overall" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  subscore_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  source_id?: string;

  @ApiPropertyOptional({ example: "2026-07-20" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  tested_at?: Date;

  @ApiPropertyOptional({ example: "Bài đo trung bình 3 lần, máy nguội" })
  @IsOptional()
  @IsString()
  test_environment_note?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ambient_temp_c?: number;

  @ApiPropertyOptional({ example: "Android 16" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  os_version?: string;

  @ApiPropertyOptional({ example: "10.2.1" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  app_version?: string;

  @ApiPropertyOptional({ example: "performance" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  power_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_thermal_throttled?: boolean;
}

export class VariantPhysicalSpecsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  thickness_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  thickness_min_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  thickness_max_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight_g?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volume_cm3?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  frame_material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  back_material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  front_glass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  ingress_protection?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VariantIoSpecsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sim_slots?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  sim_type?: string;

  @IsOptional()
  @IsBoolean()
  esim_supported?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  esim_count?: number;

  @IsOptional()
  @IsBoolean()
  stereo_speakers?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  speaker_count?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  audio_brand_tuning?: string;

  @IsOptional()
  @IsBoolean()
  headphone_jack?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  headphone_jack_size_mm?: number;

  @IsOptional()
  @IsBoolean()
  has_microsd_slot?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  microsd_max_capacity_gb?: number;

  @IsOptional()
  @IsBoolean()
  has_ir_blaster?: boolean;

  @IsOptional()
  @IsBoolean()
  has_notification_led?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VariantThermalSpecsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  cooling_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  vc_area_mm2?: number;

  @IsOptional()
  @IsBoolean()
  has_active_cooling?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VariantHardwareLinkDto {
  @ApiProperty()
  @IsUUID("4")
  module_id!: string;

  @ApiPropertyOptional({ example: "main" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  role?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class VariantMemoryConfigDto {
  @ApiProperty()
  @IsUUID("4")
  memory_standard_id!: string;

  @ApiProperty({ example: 16 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity_gb!: number;

  @ApiPropertyOptional({
    example: 8533,
    deprecated: true,
    description:
      "Legacy field. Use the data rate declared by the memory standard.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  speed_mhz?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bandwidth_gbps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  channel_count?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VariantStorageConfigDto {
  @ApiProperty()
  @IsUUID("4")
  storage_standard_id!: string;

  @ApiProperty({ example: 512 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  total_capacity_gb!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  module_count?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_expandable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expansion_max_gb?: number;
}

export class VariantDisplayLinkDto {
  @ApiProperty()
  @IsUUID("4")
  display_unit_id!: string;

  @ApiPropertyOptional({ example: "main" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  display_order?: number;
}

export class VariantBatteryLinkDto {
  @ApiProperty()
  @IsUUID("4")
  battery_unit_id!: string;

  @ApiPropertyOptional({ example: "main" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class VariantCameraModuleLinkDto {
  @ApiProperty()
  @IsUUID("4")
  camera_module_id!: string;

  @ApiProperty({ example: "main" })
  @IsString()
  @MaxLength(40)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  module_order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  usage_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VariantCameraSystemDto {
  @ApiProperty({ enum: ["front", "rear"] })
  @IsIn(["front", "rear"])
  position!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  system_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [VariantCameraModuleLinkDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantCameraModuleLinkDto)
  modules!: VariantCameraModuleLinkDto[];
}

export class VariantInlineDisplayDto {
  @ApiProperty({ example: "LTPO OLED" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  technology!: string;

  @ApiPropertyOptional({ example: 6.7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  size_inch?: number;

  @ApiPropertyOptional({ example: "19.5:9" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  aspect_ratio?: string;

  @ApiPropertyOptional({ example: 1440 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  resolution_width?: number;

  @ApiPropertyOptional({ example: 3120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  resolution_height?: number;

  @ApiPropertyOptional({ example: 516 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pixel_density_ppi?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  refresh_rate_hz?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  refresh_rate_min_hz?: number;

  @ApiPropertyOptional({ example: "LTPO 3.0" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  ltpo_version?: string;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  touch_sampling_hz?: number;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  brightness_typical_nits?: number;

  @ApiPropertyOptional({ example: 1600 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  brightness_hbm_nits?: number;

  @ApiPropertyOptional({ example: 2600 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  brightness_peak_nits?: number;

  @ApiPropertyOptional({ example: "DCI-P3" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  color_gamut?: string;

  @ApiPropertyOptional({ example: "HDR10+, Dolby Vision" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  hdr_formats?: string;

  @ApiPropertyOptional({ example: "Gorilla Glass Victus 2" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  protection_glass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  has_always_on?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  has_dc_dimming?: boolean;

  @ApiPropertyOptional({ example: 2160 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pwm_frequency_hz?: number;
}

export class VariantInlineCameraDto {
  @ApiProperty({ enum: ["main", "ultrawide", "telephoto", "selfie"] })
  @IsIn(["main", "ultrawide", "telephoto", "selfie"])
  role!: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  effective_megapixel?: number;

  @ApiPropertyOptional({ example: "f/1.8" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  aperture?: string;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  focal_length_mm_eq?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  optical_zoom?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  field_of_view_deg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  has_ois?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  has_eis?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  has_af?: boolean;

  @ApiPropertyOptional({ example: "4K 60fps, 8K 30fps" })
  @IsOptional()
  @IsString()
  video_capabilities?: string;
}

export class VariantInlineBatteryDto {
  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity_mah!: number;

  @ApiPropertyOptional({ example: 19.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  energy_wh?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  wired_charging_w?: number;

  @ApiPropertyOptional({ example: "USB PD PPS" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  wired_charging_protocol?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  wireless_charging_w?: number;

  @ApiPropertyOptional({ example: "Qi2" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  wireless_charging_protocol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  removable?: boolean;
}

export class VariantInlineHardwareModulesDto {
  @ApiPropertyOptional({ type: VariantInlineDisplayDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantInlineDisplayDto)
  display?: VariantInlineDisplayDto;

  @ApiPropertyOptional({ type: [VariantInlineCameraDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantInlineCameraDto)
  cameras?: VariantInlineCameraDto[];

  @ApiPropertyOptional({ type: VariantInlineBatteryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantInlineBatteryDto)
  battery?: VariantInlineBatteryDto;
}

export class VariantSoftwareProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  launch_os_version_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  current_os_version_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  highest_official_version_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  ui_layer_version_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  security_patch_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  promised_major_updates?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  promised_security_years?: number;

  @ApiPropertyOptional({ enum: ["locked", "unlockable", "unlocked"] })
  @IsOptional()
  @IsIn(["locked", "unlockable", "unlocked"])
  bootloader_status?: string;

  @ApiPropertyOptional({ enum: ["unknown", "rootable", "rooted"] })
  @IsOptional()
  @IsIn(["unknown", "rootable", "rooted"])
  root_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VariantConnectivitySupportDto {
  @ApiProperty()
  @IsUUID("4")
  connectivity_feature_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_supported?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VariantModuleScoreDto {
  @ApiProperty({
    enum: [
      "chipset",
      "cpu",
      "gpu",
      "npu",
      "modem",
      "memory-standard",
      "storage-standard",
    ],
  })
  @IsIn([
    "chipset",
    "cpu",
    "gpu",
    "npu",
    "modem",
    "memory-standard",
    "storage-standard",
  ])
  module_kind!: string;

  @ApiProperty()
  @IsUUID("4")
  module_id!: string;

  @ApiProperty({ example: 86.5, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rationale?: string;
}

export class VariantScoreMetricInputDto {
  @ApiProperty({ example: "cpu_single" })
  @IsString()
  @MaxLength(80)
  metric_key!: string;

  @ApiProperty({ example: 2113 })
  @Type(() => Number)
  @IsNumber()
  raw_value!: number;

  @ApiPropertyOptional({ example: "điểm" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @ApiPropertyOptional({
    example: 72.3,
    minimum: 0,
    maximum: 100,
    description:
      "Điểm quản trị nhập tay. Bỏ trống để hệ thống tự chuẩn hóa từ raw_value.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  normalized_score?: number;

  @ApiPropertyOptional({ example: "Geekbench 6 CPU" })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  source_label?: string;
}

export class VariantHardwareComponentsDto {
  @ApiPropertyOptional({ type: [VariantHardwareLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantHardwareLinkDto)
  chipsets?: VariantHardwareLinkDto[];

  @ApiPropertyOptional({ type: [VariantHardwareLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantHardwareLinkDto)
  cpus?: VariantHardwareLinkDto[];

  @ApiPropertyOptional({ type: [VariantHardwareLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantHardwareLinkDto)
  gpus?: VariantHardwareLinkDto[];

  @ApiPropertyOptional({ type: [VariantHardwareLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantHardwareLinkDto)
  npus?: VariantHardwareLinkDto[];

  @ApiPropertyOptional({ type: [VariantHardwareLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantHardwareLinkDto)
  modems?: VariantHardwareLinkDto[];

  @ApiPropertyOptional({ type: [VariantMemoryConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantMemoryConfigDto)
  memory?: VariantMemoryConfigDto[];

  @ApiPropertyOptional({ type: [VariantStorageConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantStorageConfigDto)
  storage?: VariantStorageConfigDto[];

  @ApiPropertyOptional({ type: [VariantDisplayLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDisplayLinkDto)
  displays?: VariantDisplayLinkDto[];

  @ApiPropertyOptional({ type: [VariantBatteryLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantBatteryLinkDto)
  batteries?: VariantBatteryLinkDto[];

  @ApiPropertyOptional({ type: [VariantCameraSystemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantCameraSystemDto)
  cameras?: VariantCameraSystemDto[];
}

export class CreateDeviceVariantDto {
  @ApiProperty()
  @IsUUID("4")
  device_model_id!: string;

  @ApiProperty({ example: "256GB Natural Titanium" })
  @IsString()
  @MaxLength(160)
  variant_name!: string;

  @ApiPropertyOptional({ example: "A3293" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku_code?: string;

  @ApiPropertyOptional({ example: "Global" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  market_name?: string;

  @ApiPropertyOptional({ example: "Natural Titanium" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  color_name?: string;

  @ApiPropertyOptional({ example: "#AAA09B" })
  @IsOptional()
  @IsHexColor()
  color_hex?: string;

  @ApiProperty()
  @IsInt()
  release_status_id!: number;

  @ApiPropertyOptional({ example: "2024-09-20" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  launch_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_of_sale_date?: Date;

  @ApiPropertyOptional({ example: 1099 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  launch_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  currency_id?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: VariantPhysicalSpecsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantPhysicalSpecsDto)
  physical_specs?: VariantPhysicalSpecsDto;

  @ApiPropertyOptional({ type: VariantIoSpecsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantIoSpecsDto)
  io_specs?: VariantIoSpecsDto;

  @ApiPropertyOptional({ type: VariantThermalSpecsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantThermalSpecsDto)
  thermal_specs?: VariantThermalSpecsDto;

  @ApiPropertyOptional({ type: VariantSoftwareProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantSoftwareProfileDto)
  software_profile?: VariantSoftwareProfileDto;

  @ApiPropertyOptional({ type: [VariantConnectivitySupportDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantConnectivitySupportDto)
  connectivity_support?: VariantConnectivitySupportDto[];

  @ApiPropertyOptional({
    type: VariantHardwareComponentsDto,
    description:
      "Các mô-đun phần cứng được gán trực tiếp cho phiên bản thiết bị.",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantHardwareComponentsDto)
  hardware_components?: VariantHardwareComponentsDto;

  @ApiPropertyOptional({
    type: VariantInlineHardwareModulesDto,
    description:
      "Thông số màn hình, camera và pin nhập trực tiếp khi tạo phiên bản; API tự chuẩn hóa thành module và liên kết.",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantInlineHardwareModulesDto)
  inline_modules?: VariantInlineHardwareModulesDto;

  @ApiPropertyOptional({
    type: [VariantModuleScoreDto],
    deprecated: true,
    description:
      "Chỉ giữ để tương thích dữ liệu cũ. Scorecard thiết bị hiện được tính tự động từ module và thông số đã liên kết.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantModuleScoreDto)
  module_scores?: VariantModuleScoreDto[];

  @ApiPropertyOptional({
    type: [VariantScoreMetricInputDto],
    deprecated: true,
    description:
      "Chỉ giữ để tương thích dữ liệu cũ. Quy trình tạo thiết bị không còn nhập metric score thủ công.",
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: VariantScoreMetricInputDto) => item.metric_key)
  @ValidateNested({ each: true })
  @Type(() => VariantScoreMetricInputDto)
  score_metric_inputs?: VariantScoreMetricInputDto[];

  @ApiPropertyOptional({
    type: [VariantPerformanceResultDto],
    description:
      "Kết quả benchmark cấp thiết bị dùng để xếp hạng các máy dùng chung mô-đun.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantPerformanceResultDto)
  performance_results?: VariantPerformanceResultDto[];
}
