import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateOrganizationDto {
  @ApiProperty({ example: "Apple" })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "apple" })
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiPropertyOptional({ example: "Apple" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  short_name?: string;

  @ApiPropertyOptional({ example: "Apple Inc." })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legal_name?: string;

  @ApiPropertyOptional({ example: "US" })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country_code?: string;

  @ApiPropertyOptional({ example: 1976 })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2200)
  founded_year?: number;

  @ApiPropertyOptional({ example: "https://www.apple.com" })
  @IsOptional()
  @IsUrl()
  website_url?: string;

  @ApiPropertyOptional({ example: "https://cdn.spechub.io/logos/apple.svg" })
  @IsOptional()
  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
    require_tld: false,
  })
  logo_url?: string;

  @ApiProperty({
    description:
      "Mô tả chuẩn hóa về lĩnh vực, vai trò, sản phẩm và công nghệ nổi bật của tổ chức.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(80)
  description!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
