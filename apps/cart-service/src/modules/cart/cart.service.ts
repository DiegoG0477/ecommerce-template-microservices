// apps/cart-service/src/modules/cart/cart.service.ts
import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Repository, EntityManager } from 'typeorm';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UserPayload } from './interfaces/user-payload.interface';
import { CartResponseDto } from './dto/cart-response.dto'; // Ajusta el nombre si es necesario
import { CartItemResponseDto } from './dto/cart-item-response.dto';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CartService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getCart(user: UserPayload): Promise<CartResponseDto> {
    const { userId } = user;

    try {
      // El procedimiento GetCartWithTotal devuelve dos result sets.
      // Primero los items, luego el total.
      const results = await this.entityManager.query('CALL GetCartWithTotal(?)', [userId]);

      if (!results || results.length < 2 || !results[0] || !results[1] || results[1].length === 0) {
        const cartIdResult = await this.entityManager.query('CALL GetOrCreateCart(?)', [userId]);
        if(!cartIdResult || cartIdResult.length === 0 || !cartIdResult[0].id) {
            // If cart cannot be found or created, throw NotFoundException
            throw new NotFoundException(`Cart not found for user ${userId}.`); // More user-friendly message
        }

        // If a cart was created (or found empty), return an empty cart DTO
        return {
          id: cartIdResult[0].id,
          userId: userId,
          items: [],
          totalItems: 0,
          totalQuantity: 0,
          totalAmount: 0,
        };
      }

      const cartItemsRaw: any[] = results[0];
      const cartTotalRaw: any = results[1][0];

      const itemsDto: CartItemResponseDto[] = cartItemsRaw.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: parseInt(item.quantity, 10),
        price: parseFloat(item.price),
        lineTotal: parseFloat(item.line_total),
      }));

      return {
        id: cartTotalRaw.cart_id,
        userId: userId,
        items: itemsDto,
        totalItems: parseInt(cartTotalRaw.total_items, 10),
        totalQuantity: itemsDto.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: parseFloat(cartTotalRaw.total_amount),
      };

    } catch (error) {
      console.error(`Error in getCart for user ${userId}:`, error);
      // Re-throw specific NestJS HTTP exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // For any other unexpected errors, throw InternalServerErrorException
      throw new InternalServerErrorException('Could not retrieve cart due to an unexpected error.');
    }
  }

  async addItemToCart(user: UserPayload, addToCartDto: AddToCartDto): Promise<{ message: string; itemId?: string; cartId: string }> {
    const { userId } = user;
    const { productId, quantity, price, productName } = addToCartDto;

    try {
      // El procedimiento AddToCart llama internamente a GetOrCreateCart
      const result = await this.entityManager.query(
        'CALL AddToCart(?, ?, ?, ?, ?)',
        [userId, productId, quantity, price, productName || null], // productName es opcional
      );

      if (!result || result.length === 0 || !result[0].message) {
        throw new InternalServerErrorException('Failed to add item to cart, unexpected SP result.');
      }

      // El SP AddToCart devuelve un mensaje y opcionalmente item_id
      // También necesitamos el cartId. Podemos obtenerlo llamando a GetOrCreateCart de nuevo
      // o modificando AddToCart para que devuelva también el cart_id.
      // Por simplicidad aquí, lo obtenemos de nuevo (aunque menos eficiente).
      const cartIdResult = await this.entityManager.query('CALL GetOrCreateCart(?)', [userId]);
      if(!cartIdResult || cartIdResult.length === 0 || !cartIdResult[0].id) {
          throw new InternalServerErrorException('Could not determine cart ID after adding item.');
      }

      return {
        message: result[0].message,
        itemId: result[0].item_id, // Puede ser undefined si actualiza cantidad
        cartId: cartIdResult[0].id,
      };
    } catch (error) {
      console.error(`Error in addItemToCart for user ${userId}, product ${productId}:`, error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not add item to cart.');
    }
  }

  async removeItemFromCart(user: UserPayload, productId: string): Promise<{ message: string }> {
    const { userId } = user;

    if (!productId) {
        throw new BadRequestException('Product ID is required.');
    }

    try {
      const result = await this.entityManager.query('CALL RemoveFromCart(?, ?)', [userId, productId]);
      if (!result || result.length === 0 || !result[0].message) {
        throw new InternalServerErrorException('Failed to remove item from cart, unexpected SP result.');
      }
      return { message: result[0].message };
    } catch (error) {
      console.error(`Error in removeItemFromCart for user ${userId}, product ${productId}:`, error);
      throw new InternalServerErrorException('Could not remove item from cart.');
    }
  }

  async clearCart(user: UserPayload): Promise<{ message: string }> {
    const { userId } = user;
    try {
      const [rows]: [any[], any] = await this.entityManager.query('CALL ClearCart(?)', [userId]);

      if (!rows || rows.length === 0 || !rows[0] || typeof rows[0].message !== 'string') {
        console.warn(`ClearCart SP for user ${userId} did not return the expected message string. Result:`, JSON.stringify(rows));
        // Si el SP siempre debe devolver un mensaje, y no lo hace, es un error interno.
        throw new InternalServerErrorException('Failed to clear cart or SP did not return a confirmation message.');
      }
      // Verifica el contenido del mensaje si quieres ser más específico
      // Por ejemplo, si el SP devuelve "No se encontró carrito..."
      if (rows[0].message.includes('No se encontró carrito')) {
        // Podrías lanzar NotFoundException aquí si lo prefieres,
        // o simplemente devolver el mensaje del SP.
        // throw new NotFoundException(rows[0].message);
      }
      return { message: rows[0].message };
    } catch (error) {
      // Si es una excepción que ya hemos lanzado (como NotFoundException o InternalServerErrorException)
      if (error.status) { // Las excepciones de NestJS tienen .status
        console.error(`Error in clearCart for user ${userId} (Caught HTTP Exception): ${error.message}`);
        throw error;
      }
      // Para errores de base de datos crudos u otros errores inesperados
      console.error(`Unexpected raw error in clearCart for user ${userId}:`, error);
      throw new InternalServerErrorException('Could not clear cart due to an unexpected database or system issue.');
    }
  }

  async checkoutCart(user: UserPayload): Promise<{ message: string; orderId?: number }> {
    const { userId } = user;
    const ORDER_SERVICE_URL = this.configService.get<string>('ORDER_SERVICE_URL');

    if (!ORDER_SERVICE_URL) {
      throw new InternalServerErrorException('Order service URL is not configured.');
    }

    try {
      const cart = await this.getCart(user);

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty. Cannot create an order from an empty cart.');
      }

      // 1. Create the order
      const createOrderPayload = {
        user_id: userId,
        total: cart.totalAmount,
      };

      let createOrderResponse: AxiosResponse<any>;
      try {
        createOrderResponse = await lastValueFrom(
          this.httpService.post(`${ORDER_SERVICE_URL}/orders/create`, createOrderPayload),
        );
      } catch (httpError) {
        console.error(`Error calling order-service /orders/create:`, httpError.response?.data || httpError.message);
        throw new InternalServerErrorException(`Failed to create order: ${httpError.response?.data?.error || httpError.message}`);
      }

      const orderId = createOrderResponse.data.order_id;
      if (!orderId) {
        throw new InternalServerErrorException('Order service did not return an order ID.');
      }

      // 2. Add items to the order
      for (const item of cart.items) {
        const addItemPayload = {
          order_id: orderId,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          price: item.price,
        };
        try {
          await lastValueFrom(
            this.httpService.post(`${ORDER_SERVICE_URL}/orders/item`, addItemPayload),
          );
        } catch (httpError) {
          console.error(`Error adding item ${item.productId} to order ${orderId}:`, httpError.response?.data || httpError.message);
          // Consider a rollback mechanism here if adding items fails for a partially created order
          throw new InternalServerErrorException(`Failed to add item ${item.productName} to order: ${httpError.response?.data?.error || httpError.message}`);
        }
      }

      // 3. Clear the cart after successful order creation
      await this.clearCart(user);

      return { message: 'Order created successfully and cart cleared.', orderId };

    } catch (error) {
      console.error(`Error during checkout for user ${userId}:`, error);
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('An unexpected error occurred during checkout.');
    }
  }
}
