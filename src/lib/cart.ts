import { CartItem } from './types';

const STORAGE_KEY = 'mapunjan_cart';

export function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CartItem[];
    return [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function clearCartStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function cartItemKey(productId: string, size: string): string {
  return `${productId}__${size}`;
}

export function addToCart(current: CartItem[], product: CartItem['product'], size: string, quantity: number): CartItem[] {
  const existing = current.find((item) => item.product.id === product.id && item.size === size);
  if (existing) {
    return current.map((item) =>
      item === existing ? { ...item, quantity: item.quantity + quantity } : item
    );
  }
  return [...current, { product, size, quantity }];
}

export function updateCartQuantity(items: CartItem[], productId: string, size: string, quantity: number): CartItem[] {
  if (quantity < 1) return items.filter((item) => !(item.product.id === productId && item.size === size));
  return items.map((item) =>
    item.product.id === productId && item.size === size ? { ...item, quantity } : item
  );
}

export function removeCartItem(items: CartItem[], productId: string, size: string): CartItem[] {
  return items.filter((item) => !(item.product.id === productId && item.size === size));
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.current_price * item.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
