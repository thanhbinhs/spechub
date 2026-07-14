import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator'

/**
 * Response wrapper interface
 */
export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

/**
 * TransformInterceptor - Wrap mọi response thành { data, meta }
 *
 * Before:
 *   return { id: '1', name: 'iPhone' }
 *
 * After:
 *   {
 *     "data": { "id": "1", "name": "iPhone" }
 *   }
 *
 * Nếu service trả về { data, meta } sẵn → giữ nguyên
 *
 *   return { data: [...], meta: { total: 100, page: 1 } }
 *   →
 *   {
 *     "data": [...],
 *     "meta": { "total": 100, "page": 1 }
 *   }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const isRawResponse = this.reflector.getAllAndOverride<boolean>(
      RAW_RESPONSE_KEY,
      [_context.getHandler(), _context.getClass()],
    )
    if (isRawResponse) {
      return next.handle() as Observable<ApiResponse<T>>
    }

    return next.handle().pipe(
      map((data) => {
        // Nếu đã có shape { data, meta } → giữ nguyên
        if (data && typeof data === 'object' && 'data' in data) {
          return data as ApiResponse<T>
        }

        // Wrap data
        return { data }
      }),
    )
  }
}
