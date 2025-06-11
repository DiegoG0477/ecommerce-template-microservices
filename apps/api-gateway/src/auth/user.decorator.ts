// apps/api-gateway/src/auth/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../gateway.controller'; // O donde definas la interfaz

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // 'user' es adjuntado por Passport tras validar el JWT
  },
);