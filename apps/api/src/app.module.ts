import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { CacheModule } from '@nestjs/cache-manager'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'

import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { HealthController } from './health/health.controller'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ]),

    EventEmitterModule.forRoot({
      wildcard: true,
      maxListeners: 20,
    }),

    ScheduleModule.forRoot(),

    PrismaModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
