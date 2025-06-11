// apps/cart-service/src/modules/cart/interfaces/user-payload.interface.ts
export interface UserPayload {
    userId: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    // roles?: string[]; // Si se necesitan roles, también se añadirían aquí
}
