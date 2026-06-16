import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ProductFamilySummaryDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  slug!: string
}

export class ProductFamilyResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  brand_org_id!: string

  @ApiProperty()
  device_category_id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  slug!: string

  @ApiPropertyOptional()
  description?: string | null

  @ApiPropertyOptional()
  cover_image_url?: string | null

  @ApiPropertyOptional()
  first_release_year?: number | null

  @ApiPropertyOptional()
  last_release_year?: number | null

  @ApiProperty()
  is_active!: boolean

  @ApiProperty({ type: ProductFamilySummaryDto })
  brand_org!: ProductFamilySummaryDto

  @ApiProperty({ type: ProductFamilySummaryDto })
  device_category!: ProductFamilySummaryDto

  @ApiProperty()
  created_at!: Date

  @ApiProperty()
  updated_at!: Date
}
