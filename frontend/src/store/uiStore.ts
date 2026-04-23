import { create } from 'zustand';

interface UIState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: localStorage.getItem('theme') === 'dark',
  toggleDarkMode: () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      if (newMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return { isDarkMode: newMode };
    });
  },
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
