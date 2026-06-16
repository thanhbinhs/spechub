import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../common/dto/pagination.dto'

export class QueryProductFamiliesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm theo tên, slug hoặc mô tả',
    example: 'iphone',
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  brand_org_id?: string

  @ApiPropertyOptional({ example: 'apple' })
  @IsOptional()
  @IsString()
  brand_slug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  device_category_id?: string

  @ApiPropertyOptional({ example: 'smartphone' })
  @IsOptional()
  @IsString()
  category_slug?: string

  @ApiPropertyOptional({
    description: 'Bao gồm family inactive',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  include_inactive?: boolean
}
