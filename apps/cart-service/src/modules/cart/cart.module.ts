// apps/cart-service/src/modules/cart/cart.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
// No necesitas importar ConfigModule aquí si es global y solo lo usa ApiKeyAuthGuard
// que se inyecta desde el módulo raíz o globalmente.

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]),
    HttpModule, // Import HttpModule to make HttpService available
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
