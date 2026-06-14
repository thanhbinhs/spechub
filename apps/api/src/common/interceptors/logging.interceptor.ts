import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
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

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthUser }>()
    const response = context.switchToHttp().getResponse<FastifyReply>()

    const { method, url } = request
    const user = request.user?.email ?? 'anonymous'
    const startTime = Date.now()

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime
        const statusCode = response.statusCode
        this.logger.log(`${method} ${url} ${statusCode} ${duration}ms (${user})`)
      }),
    )
  }
}