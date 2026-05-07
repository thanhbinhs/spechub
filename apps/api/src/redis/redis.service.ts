import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client!: Redis

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'

    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 2000),
    })

    this.client.on('connect', () => this.logger.log('✓ Redis connected'))
    this.client.on('error', (err) => this.logger.error(`Redis: ${err.message}`))
  }

  onModuleDestroy() {
    this.client?.disconnect()
  }

  async ping(): Promise<string> {
    return this.client.ping()
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key)
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds)
  }

  /** Get raw client for advanced operations (pubsub, scripts...) */
  getClient(): Redis {
    return this.client
  }
}
