import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { PrismaClient } from '@spechub/database'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    })
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('✓ Prisma connected to database')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Prisma disconnected')
  }
}
