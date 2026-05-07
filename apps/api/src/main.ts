import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import fastifyHelmet from '@fastify/helmet'
import fastifyCookie from '@fastify/cookie'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
    }),
  )

  const config = app.get(ConfigService)

  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  })

  await app.register(fastifyCookie as any, {
    secret: config.get<string>('AUTH_SECRET'),
  })

  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  app.enableCors({
    origin: [
      config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
      config.get<string>('ADMIN_URL') ?? 'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SpecHub API')
      .setDescription('Smart device wiki & research platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication')
      .addTag('devices', 'Device catalog')
      .addTag('search', 'Search & AI research')
      .addTag('commerce', 'Affiliate & subscriptions')
      .build()
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }

  const port = config.get<number>('PORT') ?? 4000
  await app.listen(port, '0.0.0.0')

  logger.log('')
  logger.log(`🚀  API:      http://localhost:${port}/api/v1`)
  logger.log(`📖  Swagger:  http://localhost:${port}/api/docs`)
  logger.log(`💚  Health:   http://localhost:${port}/api/v1/health`)
  logger.log('')
}

bootstrap().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
