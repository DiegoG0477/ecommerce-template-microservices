// apps/cart-service/src/common/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Para obtener el API key esperado del entorno

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly expectedApiKey: string;

  constructor(private readonly configService: ConfigService) {
    // Obtener el API Key esperado de las variables de entorno
    // Es CRUCIAL que esta variable esté definida en tus .env.* y en producción.
    this.expectedApiKey = this.configService.get<string>('INTERNAL_API_KEY') ?? 
      (() => { throw new Error('INTERNAL_API_KEY must be defined'); })();

    if (!this.expectedApiKey) {
      // Este es un error de configuración grave. El servicio no debería iniciarse
      // o debería estar en un estado de error si no puede protegerse.
      console.error('FATAL ERROR: INTERNAL_API_KEY is not defined in environment variables.');
      // Podrías lanzar un error aquí para detener el inicio de la aplicación si es crítico.
      // throw new Error('FATAL ERROR: INTERNAL_API_KEY is not defined.');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.expectedApiKey) {
        // Si el API Key no está configurado en el servidor, denegar todas las solicitudes
        // para evitar una brecha de seguridad.
        console.error('ApiKeyAuthGuard: Denying access because INTERNAL_API_KEY is not configured on the server.');
        throw new ForbiddenException('Access denied due to server configuration error.');
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key']; // O el nombre de header que decidas usar

    if (!apiKey) {
      // No se proporcionó API Key
      throw new UnauthorizedException('API Key is missing.');
    }

    if (apiKey === this.expectedApiKey) {
      return true; // La solicitud está permitida
    } else {
      // API Key proporcionado es inválido
      throw new ForbiddenException('Invalid API Key.');
    }
  }
}