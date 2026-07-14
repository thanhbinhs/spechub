import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  NotFoundException,
  Res,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { timingSafeEqual } from 'node:crypto'
import type { FastifyReply } from 'fastify'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { Public } from '../common/decorators/public.decorator'
import { RawResponse } from '../common/decorators/raw-response.decorator'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return this.readiness()
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe; does not depend on external services' })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '0.1.0',
    }
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for database and Redis' })
  async ready(@Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.readiness()
    reply.code(result.status === 'ok' ? 200 : 503)
    return result
  }

  @Public()
  @Get('metrics')
  @RawResponse()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Protected Prometheus-compatible process metrics' })
  metrics(@Headers('authorization') authorization?: string) {
    const token = this.config.get<string>('METRICS_TOKEN')
    if (!token) {
      throw new NotFoundException('Metrics endpoint is not enabled')
    }
    const provided = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : ''
    if (!this.matchesToken(provided, token)) {
      throw new ForbiddenException('Invalid metrics token')
    }

    const memory = process.memoryUsage()
    const uptime = process.uptime()
    return [
      '# HELP spechub_process_uptime_seconds Process uptime in seconds.',
      '# TYPE spechub_process_uptime_seconds gauge',
      `spechub_process_uptime_seconds ${uptime}`,
      '# HELP spechub_process_resident_memory_bytes Resident memory in bytes.',
      '# TYPE spechub_process_resident_memory_bytes gauge',
      `spechub_process_resident_memory_bytes ${memory.rss}`,
      '# HELP spechub_process_heap_used_bytes Used V8 heap memory in bytes.',
      '# TYPE spechub_process_heap_used_bytes gauge',
      `spechub_process_heap_used_bytes ${memory.heapUsed}`,
      '',
    ].join('\n')
  }

  private async readiness() {
    const checks = await Promise.allSettled([this.checkDatabase(), this.checkRedis()])
    const [dbCheck, redisCheck] = checks
    const allOk = checks.every((check) => check.status === 'fulfilled')

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '0.1.0',
      checks: {
        database: dbCheck.status === 'fulfilled' ? 'ok' : 'failed',
        redis: redisCheck.status === 'fulfilled' ? 'ok' : 'failed',
      },
    }
  }

  private async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`
  }

  private async checkRedis() {
    await this.redis.ping()
  }

  private matchesToken(provided: string, expected: string) {
    const providedBuffer = Buffer.from(provided)
    const expectedBuffer = Buffer.from(expected)
    return (
      providedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(providedBuffer, expectedBuffer)
    )
  }
}
