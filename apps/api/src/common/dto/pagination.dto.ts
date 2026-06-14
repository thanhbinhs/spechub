import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type, Transform } from 'class-transformer'
import { IsInt, IsOptional, Min, Max, IsString, IsIn } from 'class-validator'

/**
 * PaginationQueryDto - Query params chung cho list endpoints
 *
 * Usage trong controller:
 *   @Get()
 *   findAll(@Query() query: PaginationQueryDto) {
 *     return this.service.findAll(query)
 *   }
 *
 * Example URL: /api/v1/devices?page=2&pageSize=20&sortBy=name&sortOrder=asc
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Trang hiện tại (bắt đầu từ 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Số items mỗi trang',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20

  @ApiPropertyOptional({
    description: 'Field để sort',
    example: 'created_at',
  })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiPropertyOptional({
    description: 'Thứ tự sort',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'

  /**
   * Helper: tính skip cho Prisma
   */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.pageSize ?? 20)
  }

  /**
   * Helper: lấy take cho Prisma
   */
  get take(): number {
    return this.pageSize ?? 20
  }
}

/**
 * PaginationMeta - Meta info trả về cùng data
 */
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Helper tạo pagination meta
 */
export function createPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize)
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}