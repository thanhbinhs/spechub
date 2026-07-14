import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthUser } from '../decorators/current-user.decorator'

/**
 * LoggingInterceptor - Log mọi request
 *
 * Output format:
 *   [API] GET /api/v1/devices 200 45ms (admin@spechub.io)
 *   [API] POST /api/v1/auth/login 401 12ms (anonymous)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  constructor(private readonly config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthUser }>()
    const response = context.switchToHttp().getResponse<FastifyReply>()

    const { method, url, id: requestId } = request
    const user = request.user?.email ?? 'anonymous'
    const startTime = Date.now()

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime
        const statusCode = response.statusCode
        const event = {
          event: 'http_request',
          request_id: requestId,
          method,
          path: url.split('?')[0],
          status_code: statusCode,
          duration_ms: duration,
          user,
        }
        this.logger.log(
          this.config.get<string>('LOG_FORMAT', 'pretty') === 'json'
            ? JSON.stringify(event)
            : `${method} ${event.path} ${statusCode} ${duration}ms (${user})`,
        )
      }),
    )
  }
}
