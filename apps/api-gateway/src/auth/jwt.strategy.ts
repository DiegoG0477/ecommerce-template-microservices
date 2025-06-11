// apps/api-gateway/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  id: string; // El userId que viene del user-service
  email: string;
  name?: string; // El nombre completo que viene del user-service
  // ...otros campos que tu user-service ponga en el token
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // 'jwt' es el nombre del guard
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Asegúrate de que los tokens expirados sean rechazados
      secretOrKey: configService.get<string>('app.jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // Lo que devuelvas aquí se adjuntará a request.user
    // Aquí simplemente devolvemos el payload decodificado.
    // Podrías hacer una validación adicional aquí si fuera necesario (ej. verificar si el usuario aún existe o está activo)
    // pero eso implicaría una llamada al user-service, lo cual puede ser un overhead.
    // Por ahora, confiamos en el payload del token si la firma y expiración son válidas.
    if (!payload || !payload.id) { // Cambiado de 'sub' a 'id'
      throw new UnauthorizedException('Invalid token payload: Missing user ID.');
    }
    return {
      userId: payload.id, // Mapear 'id' del token a 'userId'
      email: payload.email,
      // Si el user-service envía 'first_name' y 'last_name' por separado,
      // o si envía un campo 'name' con el nombre completo, ajusta aquí.
      // Basado en users.service.js, el token tiene 'name' con el nombre completo.
      name: payload.name,
    };
  }
}
