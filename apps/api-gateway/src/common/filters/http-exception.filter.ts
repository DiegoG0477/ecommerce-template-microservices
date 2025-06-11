// apps/api-gateway/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger, // Importa Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Atrapa todas las excepciones
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name); // Instancia el Logger

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let messageDetail: any = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      messageDetail = typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : exceptionResponse;
    } else if (exception instanceof Error) {
        messageDetail = { message: exception.message };
    }


    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      // Fusionar el detalle del mensaje (puede ser objeto o string)
      ...(typeof messageDetail === 'object' ? messageDetail : { message: messageDetail }),
    };

    // Loguear el error
    if (status >= 500) {
      this.logger.error(
        `[${request.method} ${request.url}] Status: ${status} Error: ${JSON.stringify(messageDetail)}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else {
      // Para errores 4xx, podrías usar logger.warn o logger.log
      this.logger.warn(
        `[${request.method} ${request.url}] Status: ${status} Message: ${JSON.stringify(messageDetail)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}