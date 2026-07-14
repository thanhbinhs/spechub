import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: "pro" })
  @IsString()
  @Matches(/^[a-z0-9_-]+$/)
  @MaxLength(30)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  code!: string;

  @ApiProperty({ example: "Pro" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price_monthly!: number;

  @ApiProperty({ example: 49.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price_yearly!: number;

  @ApiProperty({ example: "USD" })
  @IsString()
  @Matches(/^[A-Za-z]{3}$/)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  currency_code!: string;

  @ApiProperty({ example: { price_alerts: true, wishlist_limit: -1 } })
  @IsObject()
  features!: Record<string, unknown>;

  @ApiPropertyOptional({ example: "price_123" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stripe_price_monthly_id?: string;

  @ApiPropertyOptional({ example: "price_456" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stripe_price_yearly_id?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
