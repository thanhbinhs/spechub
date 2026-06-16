import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DeviceVariantResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  device_model_id!: string

  @ApiProperty()
  variant_name!: string

  @ApiPropertyOptional()
  sku_code?: string | null

  @ApiPropertyOptional()
  market_name?: string | null

  @ApiPropertyOptional()
  color_name?: string | null

  @ApiPropertyOptional()
  color_hex?: string | null

  @ApiPropertyOptional()
  launch_date?: Date | null

  @ApiPropertyOptional()
  launch_price?: unknown

  @ApiProperty()
  is_default!: boolean

  @ApiProperty()
  created_at!: Date

  @ApiProperty()
  updated_at!: Date
}
