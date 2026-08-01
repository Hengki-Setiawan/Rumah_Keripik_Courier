import { create } from 'zustand';
import type { CourierDeliveryDto } from '../lib/types';

interface DeliveryState {
  activeDeliveries: CourierDeliveryDto[];
  currentDeliveryId: string | null;
  setActiveDeliveries: (deliveries: CourierDeliveryDto[]) => void;
  setCurrentDelivery: (id: string | null) => void;
  updateDelivery: (id: string, updates: Partial<CourierDeliveryDto>) => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  activeDeliveries: [],
  currentDeliveryId: null,
  setActiveDeliveries: (deliveries) => set({ activeDeliveries: deliveries }),
  setCurrentDelivery: (id) => set({ currentDeliveryId: id }),
  updateDelivery: (id, updates) =>
    set((state) => ({
      activeDeliveries: state.activeDeliveries.map((d) =>
        String(d.id) === id ? { ...d, ...updates } : d
      ),
    })),
}));
