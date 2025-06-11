// apps/api-gateway/src/config/configuration.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'dev',
  port: parseInt(process.env.GATEWAY_PORT, 10) || 8080,
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME || '1h',
  },
  swagger: {
    devUrl: process.env.SWAGGER_GATEWAY_SERVER_URL_DEV,
    // qaUrl: process.env.SWAGGER_GATEWAY_SERVER_URL_QA, (si los tienes)
    // prodUrl: process.env.SWAGGER_GATEWAY_SERVER_URL_PROD, (si los tienes)
  },
  http: {
    timeout: parseInt(process.env.HTTP_TIMEOUT, 10) || 5000,
    maxRedirects: parseInt(process.env.HTTP_MAX_REDIRECTS, 10) || 5,
  }
}));

export const servicesConfig = registerAs('services', () => ({
  user: {
    url: process.env.USER_SERVICE_URL,
    apiKey: process.env.USER_SERVICE_API_KEY,
    basePath: process.env.USER_SERVICE_BASE_PATH || '/app/user',
  },
  product: {
    url: process.env.PRODUCT_SERVICE_URL,
    apiKey: process.env.PRODUCT_SERVICE_API_KEY,
    basePath: process.env.PRODUCT_SERVICE_BASE_PATH || '/products',
  },
  cart: {
    url: process.env.CART_SERVICE_URL,
    apiKey: process.env.CART_SERVICE_API_KEY,
    basePath: process.env.CART_SERVICE_BASE_PATH || '/cart',
  },
  stock: {
    url: process.env.STOCK_SERVICE_URL,
    apiKey: process.env.STOCK_SERVICE_API_KEY,
    basePath: process.env.STOCK_SERVICE_BASE_PATH || '/stock',
  },
  order: {
    url: process.env.ORDER_SERVICE_URL,
    apiKey: process.env.ORDER_SERVICE_API_KEY,
    basePath: process.env.ORDER_SERVICE_BASE_PATH || '/orders',
  },
  // payment_service no se llama vía HTTP directa desde gateway
}));
