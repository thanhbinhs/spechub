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
import fastifyStatic from '@fastify/static'
import { mkdirSync } from 'node:fs'
import { AppModule } from './app.module'
import { StorageSigningService } from './modules/catalog-studio/storage-signing.service'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
    }),
    { rawBody: true },
  )

  const config = app.get(ConfigService)
  const fastify = app.getHttpAdapter().getInstance()

  fastify.addContentTypeParser(
    /^(?:image|video)\/|^application\/octet-stream$/,
    (_request, payload, done) => done(null, payload),
  )

  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  })

  await app.register(fastifyCookie as any, {
    secret: config.get<string>('AUTH_SECRET'),
  })

  const localStorage = app.get(StorageSigningService).localServingConfig()
  if (localStorage) {
    mkdirSync(localStorage.root, { recursive: true })
    await app.register(fastifyStatic as any, {
      root: localStorage.root,
      prefix: '/media/',
      decorateReply: false,
      setHeaders(response: { setHeader(name: string, value: string): void }) {
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      },
    })
  }

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })

  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('x-request-id', request.id)
    done()
  })

  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SpecHub API')
      .setDescription('Smart device wiki & research platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey(
        { type: 'apiKey', name: 'X-API-Key', in: 'header' },
        'x-api-key',
      )
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
