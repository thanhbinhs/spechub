import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  MaxLength,
  Min,
  Max,
} from "class-validator";

export class CreateAffiliateLinkDto {
  @ApiProperty()
  @IsUUID("4")
  partner_id!: string;

  @ApiProperty()
  @IsUUID("4")
  device_variant_id!: string;

  @ApiPropertyOptional({ example: "VN", default: "VN" })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  region_code?: string;

  @ApiProperty({ example: "https://retailer.example/iphone-16-pro" })
  @IsUrl({ require_tld: false })
  product_url!: string;

  @ApiPropertyOptional({ example: 1099 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current_price?: number;

  @ApiPropertyOptional({ example: "VND", default: "VND" })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency_code?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  in_stock?: boolean;
}

export class QueryAffiliateLinksDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  device_variant_id?: string;

  @ApiPropertyOptional({ example: "apple-iphone-16-pro" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  device_model_slug?: string;

  @ApiPropertyOptional({ example: "US" })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  region_code?: string;

  @ApiPropertyOptional({ example: "amazon" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  partner_slug?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  in_stock_only?: boolean;
}

export class QueryAffiliatePriceInsightsDto {
  @ApiPropertyOptional({ example: "apple-iphone-16-pro" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  device_model_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  device_variant_id?: string;

  @ApiPropertyOptional({ example: "VN" })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  region_code?: string;

  @ApiPropertyOptional({ default: 90, minimum: 7, maximum: 365 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(7)
  @Max(365)
  days?: number;
}
