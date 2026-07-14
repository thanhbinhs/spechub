import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateSourceDto {
  @ApiProperty({ example: "Apple Newsroom" })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "apple-newsroom" })
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiProperty({ example: "official" })
  @IsString()
  @MaxLength(40)
  source_type!: string;

  @ApiPropertyOptional({ example: "https://www.apple.com/newsroom" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  base_url?: string;

  @ApiPropertyOptional({ default: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  trust_level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
