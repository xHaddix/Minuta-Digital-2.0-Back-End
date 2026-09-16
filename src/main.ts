import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // 1. Configuración de CORS segura y flexible
  const allowedOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 2. Prefijo global base de la API (Sin versionado por URI)
  app.setGlobalPrefix('api');

  // 3. ValidationPipe global estricto
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 4. Documentación OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Minuta Digital API')
    .setDescription(
      'API SaaS Multi-Tenant para la administración de conjuntos residenciales: ' +
        'minuta virtual, correspondencia, PQRS, reservas de amenidades, ' +
        'control de visitantes y mercado interno.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT que incluye sub, roleCode, organizationId y residentialComplexId',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Minuta Digital API corriendo en http://localhost:${port}/api`);
  logger.log(`📚 Swagger disponible en http://localhost:${port}/api/docs`);
}

bootstrap();
