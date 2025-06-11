// apps/cart-service/src/modules/cart/entities/cart-item.entity.ts
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { ApiProperty } from '@nestjs/swagger'; // Para Swagger

@Entity('cart_items') // Nombre de la tabla
export class CartItem {
  @ApiProperty({
    description: 'Identificador único del item del carrito (UUID)',
    example: 'item-a1b2-c3d4-e5f6-0002',
  })
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string; // UUID

  @ApiProperty({ description: 'ID del carrito al que pertenece este item' })
  @Column({ name: 'cart_id', type: 'varchar', length: 36 })
  cartId: string;

  @ApiProperty({ description: 'ID del producto (UUID)', example: 'prod-a1b2-c3d4-e5f6-0003' })
  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @ApiProperty({ description: 'Nombre del producto (denormalizado)', example: 'Laptop XYZ' })
  @Column({ name: 'product_name', type: 'varchar', length: 255, nullable: true })
  productName?: string;

  @ApiProperty({ description: 'Cantidad del producto', example: 2, type: 'integer' })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ description: 'Precio unitario del producto en el momento de agregarlo', example: 1200.50 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // TypeORM maneja decimal como string o number, se recomienda number para cálculos

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE', // Si el carrito se elimina, este item también
  })
  @JoinColumn({ name: 'cart_id' }) // Especifica la columna de la FK
  cart: Cart;
}