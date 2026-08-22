'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/features/catalog/types';

export type CartItem = { product: Product; quantity: number };
type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalTHB: number;
};

const storageKey = 'byteforge-cart';
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function addItem(items: CartItem[], product: Product): CartItem[] {
  const existing = items.find((item) => item.product.id === product.id);
  if (!existing) return product.stockQuantity > 0 ? [...items, { product, quantity: 1 }] : items;
  return updateQuantity(items, product.id, existing.quantity + 1);
}

export function updateQuantity(items: CartItem[], productId: number, quantity: number): CartItem[] {
  return items.flatMap((item) => {
    if (item.product.id !== productId) return [item];
    const clamped = Math.min(Math.max(0, quantity), item.product.stockQuantity);
    return clamped > 0 ? [{ ...item, quantity: clamped }] : [];
  });
}

export function removeItem(items: CartItem[], productId: number): CartItem[] {
  return items.filter((item) => item.product.id !== productId);
}

export function sanitizeStoredItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CartItem => {
    if (!item || typeof item !== 'object' || !('product' in item) || !('quantity' in item))
      return false;
    const { product, quantity } = item as CartItem;
    return Boolean(
      product &&
      Number.isSafeInteger(product.id) &&
      product.id > 0 &&
      typeof product.name === 'string' &&
      typeof product.brand === 'string' &&
      typeof product.image === 'string' &&
      typeof product.imageAlt === 'string' &&
      Number.isFinite(product.priceTHB) &&
      product.priceTHB >= 0 &&
      Number.isSafeInteger(product.stockQuantity) &&
      product.stockQuantity > 0 &&
      Number.isSafeInteger(quantity) &&
      quantity > 0 &&
      quantity <= product.stockQuantity
    );
  });
}

function readStoredItems(): CartItem[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    return sanitizeStoredItems(value);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem: (product) => setItems((current) => addItem(current, product)),
      updateQuantity: (productId, quantity) =>
        setItems((current) => updateQuantity(current, productId, quantity)),
      removeItem: (productId) => setItems((current) => removeItem(current, productId)),
      clearCart: () => setItems([]),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalTHB: items.reduce((sum, item) => sum + item.product.priceTHB * item.quantity, 0),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
