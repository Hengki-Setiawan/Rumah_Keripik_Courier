import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSync: (ts: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  pendingCount: 0,
  lastSyncAt: null,
  setOnline: (online) => set({ isOnline: online }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setLastSync: (ts) => set({ lastSyncAt: ts }),
}));
