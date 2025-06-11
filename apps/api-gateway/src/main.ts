// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';  // Necesitas crear este filtro
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('GatewayBootstrap');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');
  const nodeEnv = configService.get<string>('app.nodeEnv');

  logger.log(`[DEBUG] process.env.NODE_ENV: ${process.env.NODE_ENV}`);
  logger.log(`[DEBUG] configService.get('app.nodeEnv'): ${nodeEnv}`);
  logger.log(`[DEBUG] configService.get('services.user.url'): ${configService.get<string>('services.user.url')}`);
  logger.log(`[DEBUG] configService.get('services.product.url'): ${configService.get<string>('services.product.url')}`);
  logger.log(`[DEBUG] configService.get('services.cart.url'): ${configService.get<string>('services.cart.url')}`);
  logger.log(`[DEBUG] configService.get('services.stock.url'): ${configService.get<string>('services.stock.url')}`);
  logger.log(`[DEBUG] configService.get('services.order.url'): ${configService.get<string>('services.order.url')}`);

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

  app.enableCors({
    // Configura según tus necesidades
    origin: true, // O una lista de orígenes permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // --- Configuración de Swagger para el API Gateway ---
  if (nodeEnv === 'dev') {
    const swaggerOptions = new DocumentBuilder()
      .setTitle('Ecommerce API Gateway (Development)')
      .setDescription('Punto de entrada para los microservicios del Ecommerce. ESTA DOCUMENTACIÓN ES SOLO PARA DESARROLLO.')
      .setVersion('1.0_dev')
      .addTag('Gateway API', 'Rutas expuestas por el API Gateway')
      .addTag('Health', 'Verificación de estado')
      // Para JWT en Swagger UI
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT Authorization',
          description: 'Introduce el token JWT',
          in: 'header',
        },
        'jwt-token', // Nombre de la seguridad, usado en @ApiBearerAuth() en controladores
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerOptions);

    const swaggerServerUrl = configService.get<string>('app.swagger.devUrl') || `http://localhost:${port}`;
    (document.servers = document.servers || []).push({ url: swaggerServerUrl, description: 'Development Environment'});

    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Mantiene el token JWT entre recargas en Swagger UI
      },
    });
    logger.log(`Gateway Swagger UI (SOLO DESARROLLO) disponible en http://localhost:${port}/api-docs`);
  } else {
    logger.log(`Gateway Swagger UI está DESHABILITADA para el entorno: ${nodeEnv}`);
  }

  await app.listen(port);
  logger.log(`API Gateway (NODE_ENV: ${nodeEnv}) is running on: ${await app.getUrl()}`);
  if (!configService.get<string>('app.jwt.secret')) {
    logger.error('FATAL: JWT_SECRET no está definida. La autenticación JWT fallará.');
  }
}
bootstrap();
