// apps/cart-service/src/modules/cart/cart.controller.ts
import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam, ApiSecurity } from '@nestjs/swagger'; // Para Swagger

import { CartService } from './cart.service';
import { User } from '../../common/decorators/user.decorator'; // Tu decorador @User
import { UserPayload } from './interfaces/user-payload.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { ApiKeyAuthGuard } from '../../common/guards/api-key.guard'; // El guard de API Key

@ApiTags('Cart') // Agrupa endpoints bajo "Cart" en Swagger
@ApiSecurity('ApiKeyAuth')      // Hace referencia al primer addApiKey
@ApiSecurity('UserPayloadAuth')
@ApiHeader({ // Documenta el header esperado para el API Key
  name: 'x-api-key',
  description: 'API Key para la autenticación interna del servicio',
  required: false,
})
@ApiHeader({
  name: 'user',
  description: 'Payload del usuario en formato JSON',
  required: false,
})
@UseGuards(ApiKeyAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener el carrito del usuario actual' })
  @ApiResponse({ status: 200, description: 'Carrito obtenido exitosamente.', type: CartResponseDto })
  @ApiResponse({ status: 401, description: 'API Key faltante.' })
  @ApiResponse({ status: 403, description: 'API Key inválido.' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado.' })
  async getMyCart(@User() user: UserPayload): Promise<CartResponseDto> {
    // El @User() decorator y el ApiKeyAuthGuard se encargan de la autenticación/identificación

    if (!user || !user.userId) {
      throw new Error('User context is missing or invalid.');
    }

    return this.cartService.getCart(user);
  }

  @Post('items')
  @ApiOperation({ summary: 'Agregar un item al carrito' })
  @ApiResponse({ status: 201, description: 'Item agregado/actualizado exitosamente.', schema: { example: { message: 'Producto agregado al carrito', itemId: 'uuid', cartId: 'uuid' }} })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'API Key faltante.' })
  @ApiResponse({ status: 403, description: 'API Key inválido.' })
  @HttpCode(HttpStatus.CREATED) // Devolver 201 para la creación/actualización exitosa
  async addItem(
    @User() user: UserPayload,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<{ message: string; itemId?: string; cartId: string }> {
    return this.cartService.addItemToCart(user, addToCartDto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Eliminar un item del carrito' })
  @ApiParam({ name: 'productId', description: 'ID del producto a eliminar', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Item eliminado exitosamente.', schema: { example: { message: 'Producto eliminado del carrito' } }})
  @ApiResponse({ status: 401, description: 'API Key faltante.' })
  @ApiResponse({ status: 403, description: 'API Key inválido.' })
  @ApiResponse({ status: 404, description: 'Item o carrito no encontrado.' })
  async removeItem(
    @User() user: UserPayload,
    @Param('productId', ParseUUIDPipe) productId: string, // Valida que productId sea un UUID
  ): Promise<{ message: string }> {
    return this.cartService.removeItemFromCart(user, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Limpiar/vaciar todos los items del carrito del usuario' })
  @ApiResponse({ status: 200, description: 'Carrito limpiado exitosamente.', schema: { example: { message: 'Carrito limpiado' } }})
  @ApiResponse({ status: 401, description: 'API Key faltante.' })
  @ApiResponse({ status: 403, description: 'API Key inválido.' })
  async clearMyCart(@User() user: UserPayload): Promise<{ message: string }> {
    return this.cartService.clearCart(user);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Finalizar la compra y crear una orden a partir del carrito' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente y carrito vaciado.', schema: { example: { message: 'Order created successfully and cart cleared.', orderId: 123 } }})
  @ApiResponse({ status: 400, description: 'El carrito está vacío.' })
  @ApiResponse({ status: 401, description: 'API Key faltante.' })
  @ApiResponse({ status: 403, description: 'API Key inválido.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor al procesar la orden.' })
  @HttpCode(HttpStatus.CREATED)
  async checkout(@User() user: UserPayload): Promise<{ message: string; orderId?: number }> {
    return this.cartService.checkoutCart(user);
  }
}
