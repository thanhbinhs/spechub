import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class DeviceModelAliasDto {
  @ApiProperty()
  @IsString()
  @MaxLength(180)
  alias!: string;

  @ApiPropertyOptional({ example: "marketing" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  alias_type?: string;

  @ApiPropertyOptional({ example: "VN" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  region_code?: string;
}

export class DeviceEditorialSectionDto {
  @ApiProperty({
    enum: [
      "overview",
      "design",
      "performance",
      "camera",
      "battery",
      "display",
      "software",
      "highlights",
      "drawbacks",
      "audience",
    ],
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/)
  @MaxLength(40)
  section_key!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty()
  @IsString()
  body_markdown!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  display_order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}

export class CreateDeviceModelDto {
  @ApiProperty()
  @IsUUID("4")
  product_family_id!: string;

  @ApiProperty({ example: "iPhone 16 Pro" })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "iphone-16-pro" })
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  internal_codename?: string;

  @ApiProperty()
  @IsInt()
  release_status_id!: number;

  @ApiPropertyOptional({ example: "2024-09-09" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  announcement_date?: Date;

  @ApiPropertyOptional({ example: "2024-09-20" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  release_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_of_sale_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_of_support_date?: Date;

  @ApiPropertyOptional({ example: "16 Pro" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  generation_label?: string;

  @ApiProperty({
    description: "Tóm tắt ngắn dành cho card và kết quả tìm kiếm.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(80)
  @MaxLength(600)
  summary!: string;

  @ApiProperty({
    description:
      "Mô tả đầy đủ điểm nổi bật, thiết kế, hiệu năng, camera, pin, phần mềm, hạn chế và đối tượng phù hợp.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(240)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  cover_image_url?: string;

  @ApiPropertyOptional({ type: [DeviceModelAliasDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DeviceModelAliasDto)
  aliases?: DeviceModelAliasDto[];

  @ApiPropertyOptional({ type: [DeviceEditorialSectionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DeviceEditorialSectionDto)
  editorial_sections?: DeviceEditorialSectionDto[];
}
