// apps/api-gateway/src/gateway.controller.ts
import { Controller, All, Req, Res, HttpStatus, UseGuards, Logger, Get, Post, Put, Delete } from '@nestjs/common';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // Guard para JWT
import { User as GetUser } from './auth/user.decorator'; // Decorador para obtener el usuario del request

// UserPayload para el decorador @GetUser
// Podría estar en un archivo de interfaces comunes del gateway si se usa en varios sitios
export interface AuthenticatedUser {
  userId: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  // otros campos del payload del JWT
}

@Controller('api') // Prefijo base para todas las rutas del gateway
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly gatewayService: GatewayService) {}

  private async handleForward(
    serviceName: 'user' | 'product' | 'cart' | 'stock' | 'order',
    req: Request,
    res: Response,
    user?: AuthenticatedUser, // Usuario autenticado, opcional
  ) {
    try {
      const serviceResponse = await this.gatewayService.forwardRequest(serviceName, req, user);
      res.status(serviceResponse.status).json(serviceResponse.data);
    } catch (error) {
      const status = error.getStatus ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const responseData = error.getResponse ? error.getResponse() : { message: error.message || 'Internal server error' };
      this.logger.error(`Error in ${serviceName} forward: Status ${status}`, responseData);
      res.status(status).json(responseData);
    }
  }

  // --- User Service (Auth y Gestión de Usuarios) ---
  // Rutas públicas para user-service (login, register, recover)
  @Post('user/login')
  async login(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('user', req, res);
  }

  @All('user/register')
  async register(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('user', req, res);
  }

  @All('user/recover') // Asumiendo que es una ruta pública
  async recoverPassword(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('user', req, res);
  }
  
  @All('user/reset-password') // Asumiendo que es una ruta pública (puede que con un token en el body/query)
  async resetPassword(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('user', req, res);
  }

  // Rutas protegidas para user-service (requieren JWT)
  @UseGuards(JwtAuthGuard)
  @All('user/profile/me')
  async getMyProfile(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('user', req, res, user);
  }

  @Get('user/') // Get All Users - Public
  async getAllUsers(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('user', req, res);
  }

  @Get('user/:identifier') // Get User by Identifier - Public
  async getUserByIdentifier(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('user', req, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/profile/address') // Add User Address - Protected
  async addUserAddress(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('user', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('user/:id') // Delete User - Protected
  async deleteUser(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('user', req, res, user);
  }

  // --- Product Service (Consultas) ---
  // --- Product Service (Consultas) ---
  @Get('products') // Get all available products
  async getAllProducts(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('product', req, res);
  }

  @Get('products/product-details/:id') // Get product details by ID
  async getProductDetailsById(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('product', req, res);
  }

  @Get('products/search/by-name') // Get products by name
  async getProductsByName(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('product', req, res);
  }

  @Get('products/search/by-price') // Get products within a price range
  async getProductsByPriceRange(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('product', req, res);
  }

  @Get('products/search/by-category') // Get products by category
  async getProductsByCategory(@Req() req: Request, @Res() res: Response) {
    await this.handleForward('product', req, res);
  }

  // --- Cart Service ---
  // Obtener el carrito del usuario actual
  @UseGuards(JwtAuthGuard)
  @Get('cart')
  async getCart(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('cart', req, res, user);
  }

  // Limpiar/vaciar todos los items del carrito del usuario
  @UseGuards(JwtAuthGuard)
  @Delete('cart')
  async clearCart(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('cart', req, res, user);
  }

  // Agregar un item al carrito
  @UseGuards(JwtAuthGuard)
  @Post('cart/items')
  async addItemToCart(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('cart', req, res, user);
  }

  // Eliminar un item del carrito
  @UseGuards(JwtAuthGuard)
  @Delete('cart/items/:productId')
  async deleteItemFromCart(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('cart', req, res, user);
  }

  // Finalizar la compra y crear una orden a partir del carrito
  @UseGuards(JwtAuthGuard)
  @Post('cart/checkout')
  async checkoutCart(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('cart', req, res, user);
  }

  // --- Stock Service ---
  // Rutas protegidas para stock-service (requieren JWT)
  // Category Endpoints
  @UseGuards(JwtAuthGuard)
  @Post('stock/categories')
  async createCategory(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stock/categories')
  async getAllCategories(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stock/categories/:id')
  async getCategoryById(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('stock/categories/:id')
  async updateCategoryById(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('stock/categories/:id')
  async deleteCategoryById(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  // Products Endpoints (under Stock Service)
  @UseGuards(JwtAuthGuard)
  @Get('stock/products')
  async getStockProducts(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stock/products')
  async createStockProduct(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stock/products/filter/available')
  async getAvailableStockProducts(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stock/products/filter/unavailable')
  async getUnavailableStockProducts(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stock/products/filter/low-stock')
  async getLowStockProducts(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stock/products/:id')
  async getStockProductById(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('stock/products/:id')
  async updateStockProduct(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('stock/products/:id')
  async deleteStockProduct(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  // Stock Management Endpoints
  @UseGuards(JwtAuthGuard)
  @Post('stock/products/stock/add-bulk')
  async addBulkStock(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stock/products/stock/subtract-bulk')
  async subtractBulkStock(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stock/products/stock/adjust-bulk')
  async adjustBulkStock(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('stock', req, res, user);
  }

  // --- Order Service ---
  // Rutas protegidas para order-service (requieren JWT)
  @UseGuards(JwtAuthGuard)
  @Post('orders/create')
  async createOrder(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('order', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/item')
  async addOrderItem(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('order', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/payment')
  async processOrderPayment(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('order', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/user/:user_id')
  async getOrdersByUserId(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('order', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/detail/:order_id')
  async getOrderDetail(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('order', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('orders/status')
  async updateOrderStatus(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('order', req, res, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('orders/cancel/:order_id')
  async cancelOrder(@Req() req: Request, @Res() res: Response, @GetUser() user: AuthenticatedUser) {
    await this.handleForward('order', req, res, user);
  }
}
