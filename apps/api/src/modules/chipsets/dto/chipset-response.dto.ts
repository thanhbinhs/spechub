import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ChipsetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  chip_kind!: string;

  @ApiPropertyOptional()
  model_code?: string | null;

  @ApiPropertyOptional()
  integrated_5g?: boolean | null;

  @ApiPropertyOptional()
  max_ram_gb?: number | null;

  @ApiPropertyOptional()
  description?: string | null;
}
