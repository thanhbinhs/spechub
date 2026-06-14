import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

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
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
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