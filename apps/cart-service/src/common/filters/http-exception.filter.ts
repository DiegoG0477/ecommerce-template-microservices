// apps/cart-service/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * @HttpExceptionFilter
 *
 * Filtro de excepciones global que captura todas las excepciones de tipo `HttpException`
 * (y sus clases derivadas como `NotFoundException`, `BadRequestException`, etc.)
 * y también excepciones no manejadas (que se tratan como `InternalServerErrorException`).
 *
 * Su propósito es estandarizar el formato de las respuestas de error JSON devueltas
 * por el microservicio.
 *
 * Se registra globalmente en `main.ts` usando `app.useGlobalFilters()`.
 */
@Catch() // Si no se especifica ningún tipo, atrapa todas las excepciones.
         // Puedes ser más específico con @Catch(HttpException) para solo HttpException.
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determina el código de estado y el mensaje
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse() // Esto puede ser un string o un objeto
        : 'Internal server error';

    // Construye el cuerpo de la respuesta de error estandarizado
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      // Si `message` ya es un objeto (como en ValidationPipe), lo fusionamos.
      // Si es un string, lo ponemos bajo una propiedad `error` o `message`.
      ...(typeof message === 'string' ? { error: message } : (message as object)),
    };

    // Loguear el error (especialmente los errores internos del servidor)
    if (status >= 500) {
      console.error(
        `[HttpExceptionFilter] Error: ${status} ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception, // Loguear el stack trace si está disponible
        (exception as any).response?.data, // Si es un error de Axios de una llamada a otro servicio
      );
    } else {
        console.warn(
            `[HttpExceptionFilter] Client Error: ${status} ${request.method} ${request.url}`,
            JSON.stringify(message)
        );
    }


    response.status(status).json(errorResponse);
  }
}