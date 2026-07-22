import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsHexColor,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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
