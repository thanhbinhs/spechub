import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DeviceCategoryResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  slug!: string

  @ApiPropertyOptional()
  parent_category_id?: string | null

  @ApiPropertyOptional()
  description?: string | null

  @ApiPropertyOptional()
  icon_url?: string | null

  @ApiProperty()
  display_order!: number

  @ApiProperty()
  is_active!: boolean

  @ApiProperty()
  created_at!: Date

  @ApiProperty()
  updated_at!: Date
}
