// apps/cart-service/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
// Descomenta si decides hacer el ApiKeyAuthGuard global:
// import { ApiKeyAuthGuard } from './common/guards/api-key.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Opciones de logger si quieres personalizarlas
    // logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap'); // Logger para el proceso de bootstrap

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port'); // Usando el namespace 'app'
  const nodeEnv = configService.get<string>('app.nodeEnv');
  const internalApiKey = configService.get<string>('app.internalApiKey'); // Para validación del guard

  // --- Globales ---
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Para aplicar ApiKeyAuthGuard globalmente (opcional, ya está en CartController):
  // Asegúrate que ApiKeyAuthGuard está preparado para ser instanciado así,
  // o usa `app.get(ApiKeyAuthGuard)` si está registrado como provider global.
  // Si ApiKeyAuthGuard necesita ConfigService, es mejor aplicarlo a nivel de controlador
  // o inyectarlo a través de APP_GUARD.
  // const apiKeyGuard = new ApiKeyAuthGuard(configService); // Esto funciona si el constructor solo toma ConfigService
  // app.useGlobalGuards(apiKeyGuard);


  // --- Configuración de Swagger ---
  if (nodeEnv === 'dev' || nodeEnv === 'qa') { // Swagger solo en entornos de desarrollo y QA
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Cart Service API')
      .setDescription('API para gestionar carritos de compra.')
      .setVersion('1.0')
      .addTag('Cart', 'Operaciones relacionadas con el carrito')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description: 'API Key para autenticación interna del servicio.',
        },
        'ApiKeyAuth'
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'user',
          in: 'header',
          description: 'Payload del usuario en formato JSON. Ejemplo: {"userId": "user-123"}',
        },
        'UserPayloadAuth'
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // Determinar la URL del servidor para Swagger
    const swaggerServerUrl = configService.get<string>('app.swagger.devUrl');

    if (swaggerServerUrl) {
        (document.servers = document.servers || []).push({ url: swaggerServerUrl, description: `${nodeEnv.toUpperCase()} environment`});
    }


    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        // Opciones de la UI de Swagger
        persistAuthorization: true, // Para que el API Key se mantenga entre recargas
      },
    });
    logger.log(`Swagger UI disponible en http://localhost:${port}/api-docs`);
  }


  await app.listen(port);
  logger.log(`Cart service (NODE_ENV: ${nodeEnv}) is running on: ${await app.getUrl()}`);
  if (!internalApiKey) {
    logger.warn('INTERNAL_API_KEY no está definida. El ApiKeyAuthGuard no funcionará correctamente.');
  }
}
bootstrap();
