import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DeviceModelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  product_family_id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  internal_codename?: string | null;

  @ApiPropertyOptional()
  announcement_date?: Date | null;

  @ApiPropertyOptional()
  release_date?: Date | null;

  @ApiPropertyOptional()
  generation_label?: string | null;

  @ApiPropertyOptional()
  summary?: string | null;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  cover_image_url?: string | null;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
