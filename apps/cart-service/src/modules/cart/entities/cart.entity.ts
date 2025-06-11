// apps/cart-service/src/modules/cart/entities/cart.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { ApiProperty } from '@nestjs/swagger'; // Para Swagger

@Entity('carts') // Nombre de la tabla en la DB
export class Cart {
  @ApiProperty({
    description: 'Identificador único del carrito (UUID)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string; // Usaremos UUID generado por la aplicación o DB

  @ApiProperty({
    description: 'Identificador único del usuario propietario del carrito (UUID)',
    example: 'user-a1b2-c3d4-e5f6-0001',
  })
  @Index() // Indexar para búsquedas rápidas por user_id
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @ApiProperty({
    description: 'Fecha de creación del carrito',
    type: 'string',
    format: 'date-time',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ type: () => [CartItem], description: 'Items dentro del carrito' })
  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true, // Si eliminas un carrito, también elimina sus items
    eager: false,   // No cargar items automáticamente al cargar un carrito (false es default)
                   // Los cargaremos explícitamente cuando sea necesario
  })
  items: CartItem[];

  // Puedes añadir propiedades calculadas o de conveniencia aquí si es necesario
  // Por ejemplo, un total calculado, aunque es mejor hacerlo en el servicio
  // o con los procedimientos almacenados.
}