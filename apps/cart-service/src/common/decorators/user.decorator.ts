// apps/cart-service/src/common/decorators/user.decorator.ts

import { createParamDecorator, ExecutionContext, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { UserPayload } from '../../modules/cart/interfaces/user-payload.interface';

const logger = new Logger('UserDecorator');

/**
 * @User() Decorator
 *
 * Este decorador de parámetro personalizado se utiliza para extraer el objeto `UserPayload`
 * que se espera sea enviado por el API Gateway en un header específico.
 *
 * El API Gateway es responsable de validar el JWT del usuario original, extraer la información
 * relevante (como userId), y pasarla en un header (ej. 'x-user-payload' o 'user')
 * como un string JSON.
 *
 * Uso en un controlador:
 * ```typescript
 * @Get()
 * async findCart(@User() user: UserPayload) {
 *   if (!user) { // Siempre verifica si user es undefined
 *     throw new BadRequestException('User context is missing or invalid.');
 *   }
 *   console.log(user.userId);
 * }
 * ```
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();

    // 1. Define el nombre del header que esperas del API Gateway.
    //    Es buena práctica usar un prefijo como 'x-' para headers personalizados.
    //    Se consistente con lo que envías desde cURL o lo que configurará tu API Gateway.
    const userHeaderName = 'user'; // O podría ser 'x-user-payload' o 'x-user-id'
                                    // Si solo necesitas el ID, 'x-user-id' es más simple.
                                    // Si envías un payload JSON, 'x-user-payload' o 'user' tiene sentido.

    const userPayloadString = request.headers[userHeaderName.toLowerCase()]; // Los headers llegan en minúsculas

    if (!userPayloadString) {
      logger.warn(`Header "${userHeaderName}" not found in request.`);
      // Si el usuario es estrictamente necesario, un AuthGuard debería haber prevenido esto.
      // Devolver undefined permite que el controlador decida cómo manejarlo.
      return undefined;
    }

    if (typeof userPayloadString !== 'string') {
        logger.warn(`Header "${userHeaderName}" is not a string. Received: ${typeof userPayloadString}`);
        // Esto no debería pasar si el header se envía correctamente.
        return undefined;
    }

    try {
      // 2. Parsea el string JSON del header a un objeto UserPayload.
      const parsedPayload: Partial<UserPayload> = JSON.parse(userPayloadString);

      // 3. Valida mínimamente que el payload parseado contenga 'userId'.
      if (!parsedPayload || typeof parsedPayload.userId !== 'string' || !parsedPayload.userId) {
        logger.warn(`Parsed payload from header "${userHeaderName}" is invalid or missing userId. Payload: ${userPayloadString}`);
        // Lanza una excepción si el formato es incorrecto, ya que esto indica un problema
        // con cómo el gateway (o el cliente) está enviando la información.
        throw new BadRequestException(`Invalid user payload format in header: ${userHeaderName}. Expected { "userId": "string" }.`);
      }
      
      // Retorna todos los campos relevantes del payload parseado
      return {
        userId: parsedPayload.userId,
        email: parsedPayload.email,
        first_name: parsedPayload.first_name,
        last_name: parsedPayload.last_name,
      };

    } catch (error) {
      logger.error(`Failed to parse user payload from header "${userHeaderName}". Payload: "${userPayloadString}"`, error.stack);
      // Si el JSON es inválido, es un error del cliente (o gateway).
      throw new BadRequestException(`Malformed JSON in user payload header: ${userHeaderName}.`);
    }
  },
);