import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  cover_image_url?: string;
}
