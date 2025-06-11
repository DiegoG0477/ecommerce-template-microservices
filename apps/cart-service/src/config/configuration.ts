// apps/cart-service/src/config/configuration.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'dev',
  port: parseInt(process.env.CART_SERVICE_PORT ?? '3003', 10),
  internalApiKey: process.env.INTERNAL_API_KEY,
  swagger: {
    devUrl: process.env.SWAGGER_SERVER_URL_DEV,
    qaUrl: process.env.SWAGGER_SERVER_URL_QA,
    prodUrl: process.env.SWAGGER_SERVER_URL_PROD,
  },
}));

export const databaseConfig = registerAs('database', () => ({
  type: process.env.DB_TYPE || 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  databaseName: process.env.DB_DATABASE_NAME,
  //synchronize: process.env.NODE_ENV === 'dev', // true solo en dev
  logging: process.env.NODE_ENV === 'dev',     // true solo en dev
  synchronize: false, // true solo en dev
  //logging: false,     // true solo en dev
                                                // En producción, deberías usar migraciones
                                                // y logging más selectivo.
  // entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Esto se configurará en DatabaseModule
  // migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  // cli: {
  //   migrationsDir: 'src/database/migrations',
  // },
}));