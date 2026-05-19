import { create } from 'zustand';
import { alertApi } from '../services/api';
import type { Alert } from '../types';

interface AlertState {
  alerts: Alert[];
  notifications: Alert[];
  isLoading: boolean;

  fetchAlerts: () => Promise<void>;
  createAlert: (data: {
    coinId: string; symbol: string; targetPrice: number; condition: 'ABOVE' | 'BELOW';
  }) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  toggleAlert: (id: string) => Promise<void>;
  addNotification: (alert: Alert) => void;
  clearNotifications: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  notifications: [],
  isLoading: false,

  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await alertApi.getAll();
      set({ alerts: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createAlert: async (alertData) => {
    try {
      await alertApi.create(alertData);
      await get().fetchAlerts();
    } catch (error: any) {
      throw error;
    }
  },

  deleteAlert: async (id) => {
    try {
      await alertApi.delete(id);
      await get().fetchAlerts();
    } catch (error: any) {
      console.error('Delete alert error:', error);
    }
  },

  toggleAlert: async (id) => {
    try {
      await alertApi.toggle(id);
      await get().fetchAlerts();
    } catch (error: any) {
      console.error('Toggle alert error:', error);
    }
  },

  addNotification: (alert) => {
    set((state) => ({ notifications: [alert, ...state.notifications].slice(0, 20) }));
  },

  clearNotifications: () => set({ notifications: [] }),
}));
