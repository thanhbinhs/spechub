import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class OrganizationResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  slug!: string

  @ApiPropertyOptional()
  short_name?: string | null

  @ApiPropertyOptional()
  legal_name?: string | null

  @ApiPropertyOptional()
  country_code?: string | null

  @ApiPropertyOptional()
  founded_year?: number | null

  @ApiPropertyOptional()
  website_url?: string | null

  @ApiPropertyOptional()
  logo_url?: string | null

  @ApiPropertyOptional()
  description?: string | null

  @ApiProperty()
  is_active!: boolean

  @ApiProperty()
  created_at!: Date

  @ApiProperty()
  updated_at!: Date
}
