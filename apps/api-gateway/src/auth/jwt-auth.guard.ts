// apps/api-gateway/src/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { // 'jwt' coincide con el nombre de la estrategia
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Puedes añadir lógica personalizada aquí si es necesario antes o después de llamar a super.canActivate
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Puedes personalizar el manejo de errores aquí
    if (err || !user) {
      // info puede contener detalles como TokenExpiredError, JsonWebTokenError
      console.error('JWT Auth Guard Error:', info?.message || err?.message);
      throw err || new UnauthorizedException(info?.message || 'Invalid or expired token');
    }
    return user; // user es lo que devolvió JwtStrategy.validate()
  }
}