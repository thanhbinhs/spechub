import { ApiProperty } from '@nestjs/swagger'

/**
 * Standard API response shape
 */
export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Response data' })
  data!: T

  @ApiProperty({
    description: 'Metadata (pagination, etc.)',
    required: false,
  })
  meta?: Record<string, unknown>
}

/**
 * Standard error response
 */
export class ApiErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number

  @ApiProperty({ example: '2026-05-11T10:00:00.000Z' })
  timestamp!: string

  @ApiProperty({ example: '/api/v1/devices' })
  path!: string

  @ApiProperty({ example: 'Validation failed' })
  message!: string | Record<string, unknown>

  @ApiProperty({ required: false })
  errors?: unknown[]
}