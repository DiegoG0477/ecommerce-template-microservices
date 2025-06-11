// apps/api-gateway/src/gateway.service.ts
import { Injectable, HttpException, HttpStatus, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, Method } from 'axios';
import { firstValueFrom } from 'rxjs';

type ServiceName = 'user' | 'product' | 'cart' | 'stock' | 'order';

interface ServiceDetails {
  url?: string;
  apiKey?: string;
  basePath?: string; // Nuevo campo para la ruta base del microservicio
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private services: Record<ServiceName, ServiceDetails> = {
    user: {}, product: {}, cart: {}, stock: {}, order: {},
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('GatewayService constructor called.');
    this.logger.log('ConfigService "services" namespace:', JSON.stringify(this.configService.get('services'), null, 2));
    const serviceNames: ServiceName[] = ['user', 'product', 'cart', 'stock', 'order'];
    for (const name of serviceNames) {
      const url = this.configService.get<string>(`services.${name}.url`);
      const apiKey = this.configService.get<string>(`services.${name}.apiKey`);
      const basePath = this.configService.get<string>(`services.${name}.basePath`);

      this.logger.log(`Attempting to get URL for ${name}: ${url}`);

      if (!url) {
        this.logger.error(`URL for ${name}-service is not defined in environment variables.`);
        // Considerar lanzar un error aquí para detener el inicio si es crítico
      }
      if (!apiKey) {
        this.logger.warn(`API Key for ${name}-service is not defined. Calls to this service will likely fail authentication.`);
      }
      this.services[name] = { url, apiKey, basePath };
    }
  }

  async forwardRequest(
    serviceName: ServiceName,
    originalRequest: any, // Express request object
    // El objeto 'user' vendrá del JwtAuthGuard (si la ruta está protegida)
    // y contendrá lo que JwtStrategy.validate() retornó (ej. { userId: '...', email: '...' })
    authenticatedUser?: { userId: string; [key: string]: any },
  ): Promise<any> {
    const { method, originalUrl, body, headers: originalHeaders } = originalRequest;

    const serviceDetails = this.services[serviceName];
    if (!serviceDetails?.url) {
      this.logger.error(`Configuration for service "${serviceName}" not found or URL is missing.`);
      throw new InternalServerErrorException(`Service endpoint for "${serviceName}" is not configured.`);
    }

    // Extraer el path específico para el microservicio
    // Asume que el path en el gateway es /api/<serviceName>/<actual_path_for_microservice>
    // Ej: /api/user/profile/me  -> servicePath = /profile/me
    // Extraer el path específico para el microservicio
    // Asume que el path en el gateway es /api/<serviceName>/<actual_path_for_microservice>
    // Ej: /api/user/profile/me  -> servicePath = /profile/me
    // Se añade 's?' para manejar casos donde el nombre del servicio en la URL es plural (ej. /api/products)
    // Extraer el path específico para el microservicio, eliminando el prefijo del gateway
    // Ej: /api/user/profile/me  -> servicePath = /profile/me
    // Se añade 's?' para manejar casos donde el nombre del servicio en la URL del gateway es plural (ej. /api/products)
    const gatewayServicePath = originalUrl.replace(new RegExp(`^/api/${serviceName}s?`), '');

    // Construir la URL objetivo usando la URL base del microservicio y su basePath configurado,
    // seguido de la parte restante de la ruta original del gateway.
    // Esto asegura que el microservicio reciba la ruta que espera (ej. /products/some-route)
    const targetUrl = `${serviceDetails.url}${serviceDetails.basePath}${gatewayServicePath}`;

    // Preparar headers para la solicitud reenviada
    const forwardHeaders: Record<string, string> = {
      'Content-Type': originalHeaders['content-type'] || 'application/json',
      // Otros headers que quieras pasar explícitamente
    };

    // Añadir API Key para la autenticación servicio-a-servicio
    if (serviceDetails.apiKey) {
      forwardHeaders['x-api-key'] = serviceDetails.apiKey;
    } else {
      this.logger.warn(`No API Key configured for calls to ${serviceName}-service.`);
    }

    // Añadir el payload completo del usuario si está autenticado (viene del JWT validado)
    // El Cart Service espera este payload en el header 'user' como un string JSON
    if (authenticatedUser) {
      forwardHeaders['user'] = JSON.stringify(authenticatedUser);
    }

    // Filtrar headers sensibles del cliente original
    const headersToOmit = ['host', 'cookie', 'connection', 'authorization']; // 'authorization' ya se procesó
    for (const key in originalHeaders) {
      if (!headersToOmit.includes(key.toLowerCase()) && !forwardHeaders[key.toLowerCase()]) {
        // No sobrescribir headers ya establecidos (como Content-Type o los específicos del gateway)
        // forwardHeaders[key] = originalHeaders[key]; // Descomentar si se quieren pasar más headers
      }
    }

    const requestConfig: AxiosRequestConfig = {
      method: method as Method,
      url: targetUrl,
      data: body,
      headers: forwardHeaders,
    };

    this.logger.log(`Forwarding request: ${method} ${targetUrl} (User: ${authenticatedUser?.userId || 'Guest'})`);

    try {
      const response = await firstValueFrom(
        this.httpService.request(requestConfig),
      );
      // Devolver solo data y status, y quizás algunos headers específicos si es necesario.
      // Evitar filtrar todos los headers del microservicio al cliente por defecto.
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Error forwarding to ${serviceName}-service (${targetUrl}): ${error.message}`, error.stack);
      if (error.response) {
        // Reenviar la respuesta de error del microservicio
        throw new HttpException(
          error.response.data,
          error.response.status,
        );
      }
      throw new InternalServerErrorException(`Error connecting to ${serviceName}-service.`);
    }
  }
}
