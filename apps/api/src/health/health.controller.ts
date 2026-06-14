import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { Public } from '../common/decorators/public.decorator'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public() // ← Thêm decorator này
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ])

    const [dbCheck, redisCheck] = checks
    const allOk = checks.every((c) => c.status === 'fulfilled')

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.1.0',
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
}