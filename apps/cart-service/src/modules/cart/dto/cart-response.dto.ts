// apps/cart-service/src/modules/cart/dto/cart-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto {
  @ApiProperty()
  id: string; // Cart ID

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalItems: number; // Total de unidades de productos diferentes

  @ApiProperty()
  totalQuantity: number; // Suma de todas las cantidades de items

  @ApiProperty()
  totalAmount: number; // Suma total del costo del carrito
}