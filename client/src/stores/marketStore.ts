import { create } from 'zustand';
import { marketApi } from '../services/api';
import type { CoinMarketData, GlobalData } from '../types';

interface MarketState {
  coins: CoinMarketData[];
  globalData: GlobalData | null;
  trending: any[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  fetchMarketData: () => Promise<void>;
  fetchGlobalData: () => Promise<void>;
  fetchTrending: () => Promise<void>;
  updatePrices: (data: CoinMarketData[]) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  coins: [],
  globalData: null,
  trending: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchMarketData: async () => {
    set({ isLoading: true });
    try {
      const { data } = await marketApi.getMarketData({ per_page: 50 });
      set({ coins: data.data, isLoading: false, lastUpdated: new Date(), error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchGlobalData: async () => {
    try {
      const { data } = await marketApi.getGlobalData();
      set({ globalData: data.data });
    } catch (error: any) {
      console.error('Global data fetch error:', error);
    }
  },

  fetchTrending: async () => {
    try {
      const { data } = await marketApi.getTrendingCoins();
      set({ trending: data.data || [] });
    } catch (error: any) {
      console.error('Trending fetch error:', error);
    }
  },

  updatePrices: (data) => {
    set({ coins: data, lastUpdated: new Date() });
  },
}));
