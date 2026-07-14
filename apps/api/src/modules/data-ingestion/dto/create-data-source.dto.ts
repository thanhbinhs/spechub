import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  Matches,
} from "class-validator";

export class CreateDataSourceDto {
  @ApiProperty({ example: "GSMArena" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: "gsmarena" })
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiProperty({ example: "https://www.gsmarena.com" })
  @IsUrl({ require_tld: false })
  base_url!: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  reliability?: number;

  @ApiPropertyOptional({
    example: {
      seed_urls: ["/apple-phones-48.php"],
      allowed_paths: ["/apple-phones-48.php"],
      rate_limit_ms: 2000,
    },
  })
  @IsOptional()
  @IsObject()
  crawl_config?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
