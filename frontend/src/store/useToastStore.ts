import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, duration };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  success: (message, duration) => get().addToast(message, 'success', duration),
  error: (message, duration) => get().addToast(message, 'error', duration),
  info: (message, duration) => get().addToast(message, 'info', duration),
  warning: (message, duration) => get().addToast(message, 'warning', duration),
}));

// Shortcut export for quick direct imports
export const toast = {
  success: (msg: string, dur?: number) => useToastStore.getState().success(msg, dur),
  error: (msg: string, dur?: number) => useToastStore.getState().error(msg, dur),
  info: (msg: string, dur?: number) => useToastStore.getState().info(msg, dur),
  warning: (msg: string, dur?: number) => useToastStore.getState().warning(msg, dur),
};
