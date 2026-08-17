import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export const DEVICE_USE_CASES = [
  "gaming",
  "photography",
  "productivity",
  "travel",
  "long_term",
  "value",
] as const;

export const DEVICE_PRIORITIES = [
  "performance",
  "battery",
  "camera",
  "display",
  "price",
  "portability",
  "software",
  "storage",
] as const;

export const DEVICE_MUST_HAVES = [
  "5g",
  "oled",
  "high_refresh",
  "wireless_charging",
  "ois",
  "expandable_storage",
  "lightweight",
] as const;

export const DEVICE_OPERATING_SYSTEMS = [
  "any",
  "android",
  "ios",
  "windows",
  "macos",
  "linux",
] as const;

export type DeviceUseCase = (typeof DEVICE_USE_CASES)[number];
export type DevicePriority = (typeof DEVICE_PRIORITIES)[number];
export type DeviceMustHave = (typeof DEVICE_MUST_HAVES)[number];
export type DeviceOperatingSystem = (typeof DEVICE_OPERATING_SYSTEMS)[number];

export class RecommendDevicesDto {
  @ApiProperty({ example: "smartphone" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category_slug!: string;

  @ApiPropertyOptional({ example: 1200, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  budget_max?: number;

  @ApiPropertyOptional({ example: "USD", default: "USD" })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{3}$/)
  currency_code?: string = "USD";

  @ApiPropertyOptional({ enum: DEVICE_OPERATING_SYSTEMS, default: "any" })
  @IsOptional()
  @IsIn(DEVICE_OPERATING_SYSTEMS)
  operating_system?: DeviceOperatingSystem = "any";

  @ApiProperty({ enum: DEVICE_USE_CASES, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsIn(DEVICE_USE_CASES, { each: true })
  use_cases!: DeviceUseCase[];

  @ApiPropertyOptional({ enum: DEVICE_PRIORITIES, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(DEVICE_PRIORITIES, { each: true })
  priorities?: DevicePriority[] = [];

  @ApiPropertyOptional({ enum: DEVICE_MUST_HAVES, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsIn(DEVICE_MUST_HAVES, { each: true })
  must_haves?: DeviceMustHave[] = [];

  @ApiPropertyOptional({ enum: [128, 256, 512, 1024, 2048] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([128, 256, 512, 1024, 2048])
  min_storage_gb?: number;

  @ApiPropertyOptional({ default: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  limit?: number = 3;
}
