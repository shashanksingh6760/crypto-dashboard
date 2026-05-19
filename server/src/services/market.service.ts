import redis from '../config/redis';
import { config } from '../config';

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  ath: number;
  ath_change_percentage: number;
}

const CACHE_TTL = 300; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (config.coingecko.apiKey) headers['x-cg-demo-api-key'] = config.coingecko.apiKey;
      
      const response = await fetch(url, { headers });
      
      if (response.status === 429) {
        throw new Error('Rate limited by CoinGecko');
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error: any) {
      if (error.message === 'Rate limited by CoinGecko') throw error;
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
  throw new Error('Fetch failed');
}

export class MarketService {
  static async getMarketData(vsCurrency = 'usd', perPage = 50, page = 1): Promise<CoinGeckoMarketData[]> {
    const cacheKey = `market:${vsCurrency}:${perPage}:${page}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const url = `${config.coingecko.apiUrl}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=7d`;
      const response = await fetchWithRetry(url);
      const data: CoinGeckoMarketData[] = await response.json();
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Returning empty array for market data due to rate limit');
      return []; // Return empty array to prevent crashing UI
    }
  }

  static async getCoinDetails(coinId: string): Promise<any> {
    const cacheKey = `coin:${coinId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const url = `${config.coingecko.apiUrl}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
      const response = await fetchWithRetry(url);
      const data = await response.json();
      await redis.setex(cacheKey, 300, JSON.stringify(data));
      return data;
    } catch (error) {
      return { id: coinId, name: coinId, symbol: coinId, market_data: {} };
    }
  }

  static async getPriceHistory(coinId: string, days: number = 30, vsCurrency = 'usd'): Promise<{ prices: [number, number][]; volumes: [number, number][] }> {
    const cacheKey = `history:${coinId}:${days}:${vsCurrency}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const url = `${config.coingecko.apiUrl}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;
      const response = await fetchWithRetry(url);
      const data = await response.json();
      await redis.setex(cacheKey, 600, JSON.stringify(data));
      return data;
    } catch (error) {
      return { prices: [], volumes: [] };
    }
  }

  static async getGlobalData(): Promise<any> {
    const cacheKey = 'global:data';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const url = `${config.coingecko.apiUrl}/global`;
      const response = await fetchWithRetry(url);
      const data = await response.json();
      await redis.setex(cacheKey, 600, JSON.stringify(data));
      return data.data;
    } catch (error) {
      // Mock global data if rate limited
      return {
        active_cryptocurrencies: 10000,
        total_market_cap: { usd: 2500000000000 },
        total_volume: { usd: 100000000000 },
        market_cap_percentage: { btc: 51, eth: 17, usdt: 6, bnb: 3, sol: 2 },
        market_cap_change_percentage_24h_usd: 1.5
      };
    }
  }

  static async getTrendingCoins(): Promise<any> {
    const cacheKey = 'trending:coins';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const url = `${config.coingecko.apiUrl}/search/trending`;
      const response = await fetchWithRetry(url);
      const data = await response.json();
      await redis.setex(cacheKey, 600, JSON.stringify(data));
      return data.coins;
    } catch (error) {
      return [];
    }
  }
}

