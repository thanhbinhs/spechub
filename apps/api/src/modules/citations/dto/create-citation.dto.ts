import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateCitationDto {
  @ApiProperty()
  @IsUUID("4")
  source_id!: string;

  @ApiPropertyOptional({ example: "https://www.apple.com/newsroom/..." })
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional({ example: "Apple introduces iPhone 16 Pro" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional({ example: "2024-09-09" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  published_at?: Date;

  @ApiPropertyOptional({ example: "2026-06-17" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  retrieved_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;
}
