// apps/cart-service/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Importa ConfigModule para usar ConfigService
      inject: [ConfigService],  // Inyecta ConfigService
      useFactory: (configService: ConfigService) => ({
        type: 'mysql', // Ya está en config, pero lo ponemos explícito aquí
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.databaseName'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Ruta a tus entidades
                                                            // Esto encontrará cualquier archivo .entity.ts o .entity.js
                                                            // en cualquier subdirectorio de src/
        synchronize: configService.get<boolean>('database.synchronize'), // true en dev, false en prod
        logging: configService.get<boolean>('database.logging'),         // true en dev
        // autoLoadEntities: true, // Alternativa a `entities` si prefieres que TypeORM las descubra
                                 // (puede ser más conveniente)

        // Opciones específicas de MySQL si son necesarias:
        // charset: 'utf8mb4_unicode_ci',
        // extra: {
        //   connectionLimit: 10,
        // },

        // Para producción, configurarías migraciones aquí:
        // migrationsTableName: 'migrations_history',
        // migrations: ['dist/database/migrations/*{.ts,.js}'], // Ruta a migraciones compiladas
        // cli: {
        //   migrationsDir: 'src/database/migrations',
        // },
      }),
    }),
  ],
})
export class DatabaseModule {}