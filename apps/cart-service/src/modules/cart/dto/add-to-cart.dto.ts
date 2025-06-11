// apps/cart-service/src/modules/cart/dto/add-to-cart.dto.ts
import { IsNotEmpty, IsString, IsUUID, IsInt, Min, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'Identificador único del producto a agregar (UUID)',
    example: 'prod-a1b2-c3d4-e5f6-0003',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Nombre del producto (opcional, para denormalización)',
    example: 'Laptop XYZ',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productName?: string;

  @ApiProperty({
    description: 'Cantidad a agregar',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario del producto',
    example: 1200.50,
    type: 'number',
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;
}