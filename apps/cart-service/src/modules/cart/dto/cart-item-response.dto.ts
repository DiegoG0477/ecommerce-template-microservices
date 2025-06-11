// apps/cart-service/src/modules/cart/dto/cart-item-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  lineTotal: number; // Calculado (quantity * price)
}