// apps/cart-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration, { databaseConfig } from './config/configuration'; // Importa tu config

import { DatabaseModule } from './database/database.module'; // Lo crearemos
import { CartModule } from './modules/cart/cart.module';   // Lo crearemos

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace ConfigService disponible globalmente
      load: [configuration, databaseConfig], // Carga tus configuraciones namespaced
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      // validationSchema: Joi.object({ ... }), // Opcional: para validación de .env con Joi
    }),
    DatabaseModule, // Módulo para la conexión a la base de datos
    CartModule,     // Módulo principal de la lógica del carrito
  ],
  controllers: [], // Los controladores estarán dentro de CartModule
  providers: [],   // Los servicios globales o AppService (si lo tuvieras) irían aquí
})
export class AppModule {}