import { create } from 'zustand';
import { portfolioApi } from '../services/api';
import type { Portfolio } from '../types';

interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;

  fetchPortfolios: () => Promise<void>;
  createPortfolio: (name: string) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  setActivePortfolio: (portfolio: Portfolio | null) => void;
  addHolding: (portfolioId: string, data: {
    coinId: string; symbol: string; name: string; quantity: number; avgBuyPrice: number;
  }) => Promise<void>;
  removeHolding: (portfolioId: string, holdingId: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  activePortfolio: null,
  isLoading: false,
  error: null,

  fetchPortfolios: async () => {
    set({ isLoading: true });
    try {
      const { data } = await portfolioApi.getAll();
      const portfolios = data.data;
      set({
        portfolios,
        isLoading: false,
        activePortfolio: portfolios.length > 0 ? portfolios[0] : null,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createPortfolio: async (name) => {
    try {
      await portfolioApi.create({ name });
      await get().fetchPortfolios();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deletePortfolio: async (id) => {
    try {
      await portfolioApi.delete(id);
      await get().fetchPortfolios();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setActivePortfolio: (portfolio) => set({ activePortfolio: portfolio }),

  addHolding: async (portfolioId, holdingData) => {
    try {
      await portfolioApi.addHolding(portfolioId, holdingData);
      await get().fetchPortfolios();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeHolding: async (portfolioId, holdingId) => {
    try {
      await portfolioApi.removeHolding(portfolioId, holdingId);
      await get().fetchPortfolios();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
