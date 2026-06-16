import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../common/dto/pagination.dto'

export class QueryDeviceCategoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm theo tên, slug hoặc mô tả',
    example: 'phone',
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({
    description: 'Lọc theo parent category UUID',
  })
  @IsOptional()
  @IsUUID('4')
  parent_category_id?: string

  @ApiPropertyOptional({
    description: 'Bao gồm category inactive',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  include_inactive?: boolean
}
