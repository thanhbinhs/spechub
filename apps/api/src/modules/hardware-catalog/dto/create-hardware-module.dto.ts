import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export const ADMIN_HARDWARE_MODULE_KINDS = [
  "chipset",
  "cpu",
  "gpu",
  "npu",
  "modem",
  "memory-standard",
  "storage-standard",
  "wireless-standard",
  "port-standard",
  "operating-system",
  "sensor",
] as const;

export type AdminHardwareModuleKind =
  (typeof ADMIN_HARDWARE_MODULE_KINDS)[number];

export class CreateHardwareModuleDto {
  @ApiProperty({ enum: ADMIN_HARDWARE_MODULE_KINDS })
  @IsIn(ADMIN_HARDWARE_MODULE_KINDS)
  kind!: AdminHardwareModuleKind;

  @ApiProperty({ example: "Snapdragon 8 Elite" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "snapdragon-8-elite" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiPropertyOptional({ example: "Qualcomm flagship mobile SoC." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      "Manufacturer, vendor, or standards organization UUID. Required for chipsets.",
  })
  @IsOptional()
  @IsUUID("4")
  organization_id?: string;

  @ApiPropertyOptional({
    description:
      "Required for chipset, wireless standard, port standard, operating system, and sensor.",
    example: "soc",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_64bit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  integrated_5g?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  integrated_wifi?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_ram_gb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  max_display_resolution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_camera_mp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  announcement_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  release_date?: Date;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  core_count?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  thread_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  big_little?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  isa_name?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  shader_units?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  compute_units?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  clock_mhz?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  fp32_gflops?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ray_tracing_support?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  api_support?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  tops?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  tops_int4?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  tops_fp16?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_downlink_mbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_uplink_mbps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_mmwave?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_satellite?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  supported_5g_modes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  generation?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_data_rate_mtps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  typical_data_rate_mtps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  voltage?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  bandwidth_gbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  channel_width_bits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_mobile?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1800)
  release_year?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  sequential_read_mbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  sequential_write_mbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  random_read_iops?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  random_write_iops?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_speed_mbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  data_speed_gbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  power_delivery_w?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  alt_modes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  kernel_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_open_source?: boolean;
}
