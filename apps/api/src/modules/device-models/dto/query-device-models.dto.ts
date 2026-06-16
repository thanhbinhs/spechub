import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../common/dto/pagination.dto'

export class QueryDeviceModelsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm theo tên, slug, codename hoặc mô tả',
    example: 'iphone',
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  product_family_id?: string

  @ApiPropertyOptional({ example: 'iphone-16-series' })
  @IsOptional()
  @IsString()
  family_slug?: string

  @ApiPropertyOptional({ example: 'apple' })
  @IsOptional()
  @IsString()
  brand_slug?: string

  @ApiPropertyOptional({ example: 'smartphone' })
  @IsOptional()
  @IsString()
  category_slug?: string

  @ApiPropertyOptional({
    description: 'Release status code',
    example: 'released',
  })
  @IsOptional()
  @IsString()
  release_status?: string
}
