import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCartStore } from './useCartStore';

interface User {
  id: string;
  displayName: string;
  nickname?: string;
  email: string;
  avatarUrl?: string;
  role: string;
  isSalesActive: boolean;
  isNfcActive: boolean;
  isEmailVerified: boolean;
  userType: string;
  coupleId?: string; // Only for paired NFC users
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isAuthenticated: true });
        // Fetch cart from backend after login
        useCartStore.getState().fetchFromBackend();
      },
      setToken: (accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ accessToken, isAuthenticated: true });
      },
      setUser: (user) => {
        set({ user });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
        useCartStore.getState().clearCart();
      },
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
