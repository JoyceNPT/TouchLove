import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  syncCartItems: (products: any[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.id === product.id);
        if (existing) {
          set({
            items: currentItems.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      syncCartItems: (products: any[]) => {
        const currentItems = get().items;
        let hasChanges = false;
        
        const updatedItems = currentItems.map(item => {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const images = JSON.parse(product.imageUrls || '[]');
            const imageUrl = images[0];
            if (
              item.name !== product.name || 
              item.price !== product.price || 
              item.stockQuantity !== product.stockQuantity ||
              item.imageUrl !== imageUrl
            ) {
              hasChanges = true;
              return {
                ...item,
                name: product.name,
                price: product.price,
                stockQuantity: product.stockQuantity,
                imageUrl: imageUrl
              };
            }
          } else {
             // If product is deleted or unavailable
             if (item.stockQuantity !== 0) {
               hasChanges = true;
               return { ...item, stockQuantity: 0 };
             }
          }
          return item;
        });

        if (hasChanges) {
           set({ items: updatedItems });
        }
      },
    }),
    {
      name: 'touchlove-cart',
    }
  )
);
