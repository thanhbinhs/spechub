import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator'
import { PaginationQueryDto } from '../../../common/dto/pagination.dto'

export class QueryOrganizationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm theo tên, short name, slug hoặc mô tả',
    example: 'apple',
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({
    description: 'Mã quốc gia ISO 3166-1 alpha-2',
    example: 'US',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  country_code?: string

  @ApiPropertyOptional({
    description: 'Bao gồm organization inactive',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  include_inactive?: boolean
}
