import { create } from 'zustand';
import type { CourierDto } from '../lib/types';

interface AuthState {
  courier: CourierDto | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (courier: CourierDto, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  courier: null,
  token: null,
  isAuthenticated: false,
  setAuth: (courier, token) => set({ courier, token, isAuthenticated: true }),
  clearAuth: () => set({ courier: null, token: null, isAuthenticated: false }),
}));
