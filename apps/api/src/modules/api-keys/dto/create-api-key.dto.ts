import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const API_KEY_SCOPES = ["catalog:read"] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export class CreateApiKeyDto {
  @ApiProperty({ example: "Production catalog sync" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: API_KEY_SCOPES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(API_KEY_SCOPES, { each: true })
  scopes?: ApiKeyScope[];

  @ApiPropertyOptional({ default: 60, minimum: 1, maximum: 600 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  rate_limit_per_minute?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10_000_000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  monthly_quota?: number;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
