import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class CreateAffiliatePartnerDto {
  @ApiProperty({ example: "Amazon" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: "amazon" })
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiProperty({ example: "https://www.amazon.com" })
  @IsUrl({ require_tld: false })
  base_url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  logo_url?: string;

  @ApiPropertyOptional({
    example: "Hệ thống bán lẻ thiết bị công nghệ chính hãng.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ example: 3.5 })
  @IsNumber()
  @Min(0)
  commission_rate!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_trusted?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  display_order?: number;
}
