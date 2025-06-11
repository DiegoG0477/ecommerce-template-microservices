// apps/api-gateway/src/health/health.controller.ts
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica el estado de salud del API Gateway' })
  @ApiResponse({ status: 200, description: 'Servicio saludable.' })
  checkHealth() {
    return {
      status: 'ok',
      message: 'API Gateway is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}