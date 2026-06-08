import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../api/axiosInstance';

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
  syncWithBackend: () => Promise<void>;
  fetchFromBackend: () => Promise<void>;
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
        get().syncWithBackend();
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
        get().syncWithBackend();
      },
      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
        get().syncWithBackend();
      },
      clearCart: () => {
        set({ items: [] });
        get().syncWithBackend();
      },
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
           get().syncWithBackend();
        }
      },
      syncWithBackend: async () => {
        try {
          if (!localStorage.getItem('accessToken')) return;
          const currentItems = get().items;
          const itemsPayload = currentItems.map(i => ({ productId: i.id, quantity: i.quantity }));
          const res = await axiosInstance.post('/cart/sync', itemsPayload);
          
          if (res.data.success) {
            const serverItems = res.data.data.items;
            const formattedItems = serverItems.map((i: any) => ({
              id: i.productId,
              name: i.productName,
              price: i.price,
              quantity: i.quantity,
              stockQuantity: i.stockQuantity,
              imageUrl: i.productImage
            }));
            
            // Only update if the lengths are different or there are stock changes, 
            // to avoid resetting the store constantly while typing/clicking
            set({ items: formattedItems });
          }
        } catch (error) {
          console.error('Failed to sync cart with backend:', error);
        }
      },
      fetchFromBackend: async () => {
        try {
          if (!localStorage.getItem('accessToken')) return;
          const res = await axiosInstance.get('/cart');
          if (res.data.success) {
            const serverItems = res.data.data.items;
            const formattedItems = serverItems.map((i: any) => ({
              id: i.productId,
              name: i.productName,
              price: i.price,
              quantity: i.quantity,
              stockQuantity: i.stockQuantity,
              imageUrl: i.productImage
            }));

            const localItems = get().items;
            if (localItems.length === 0) {
              set({ items: formattedItems });
            } else {
              // Merge items
              const merged = [...localItems];
              let hasChanges = false;
              for (const si of formattedItems) {
                const existing = merged.find(i => i.id === si.id);
                if (existing) {
                  if (existing.quantity !== si.quantity) {
                    existing.quantity = Math.max(existing.quantity, si.quantity);
                    hasChanges = true;
                  }
                } else {
                  merged.push(si);
                  hasChanges = true;
                }
              }

              if (hasChanges || localItems.length > formattedItems.length) {
                set({ items: merged });
                get().syncWithBackend();
              } else {
                set({ items: formattedItems });
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch cart from backend:', error);
        }
      },
    }),
    {
      name: 'touchlove-cart',
    }
  )
);
