// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport'; // Para JWT

import { appConfig, servicesConfig } from './config/configuration';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { JwtStrategy } from './auth/jwt.strategy'; // Crearemos esto
import { HealthController } from './health/health.controller'; // Crearemos esto

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, servicesConfig], // Carga ambas configuraciones
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }), // Configura Passport para JWT
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('app.http.timeout'),
        maxRedirects: configService.get<number>('app.http.maxRedirects'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    GatewayController, // Controlador principal para el reenvío
    HealthController,  // Controlador para el health check
  ],
  providers: [
    GatewayService,
    JwtStrategy, // Proveedor de la estrategia JWT
  ],
})
export class AppModule {}
