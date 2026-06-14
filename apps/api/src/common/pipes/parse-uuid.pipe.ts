import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'

/**
 * Regex UUID v4 (cũng accept v1, v3, v5)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * ParseUuidPipe - Validate UUID format
 *
 * Usage:
 *   @Get(':id')
 *   findById(@Param('id', ParseUuidPipe) id: string) {
 *     // id chắc chắn là UUID hợp lệ
 *   }
 *
 * Sai format → 400 Bad Request
 */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('ID is required')
    }

    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`)
    }

    return value
  }
}