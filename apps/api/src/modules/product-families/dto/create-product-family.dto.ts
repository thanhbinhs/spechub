import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateProductFamilyDto {
  @ApiProperty()
  @IsUUID("4")
  brand_org_id!: string;

  @ApiProperty()
  @IsUUID("4")
  device_category_id!: string;

  @ApiProperty({ example: "iPhone 16 Series" })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "iphone-16-series" })
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiProperty({
    description:
      "Mô tả định vị, nhóm người dùng, đặc điểm nổi bật và phạm vi thế hệ của dòng máy.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(80)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  cover_image_url?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2200)
  first_release_year?: number;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2200)
  last_release_year?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
