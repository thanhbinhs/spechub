import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

import { CommonModule } from './common/common.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { HealthController } from './health/health.controller'

import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'

import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { RolesGuard } from './common/guards/roles.guard'

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

    // Core modules
    CommonModule,
    PrismaModule,
    RedisModule,

    // Feature modules
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    // Throttler guard chạy đầu tiên
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // JWT guard chạy thứ 2 - protect mọi endpoint mặc định
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Roles guard chạy thứ 3 - check role nếu có @Roles()
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}