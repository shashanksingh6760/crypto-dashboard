import { Request, Response, NextFunction } from 'express';
import { MarketService } from '../services';

export class MarketController {
  static async getMarketData(req: Request, res: Response, next: NextFunction) {
    try {
      const { vs_currency = 'usd', per_page = '50', page = '1' } = req.query;
      const data = await MarketService.getMarketData(
        vs_currency as string,
        parseInt(per_page as string, 10),
        parseInt(page as string, 10)
      );
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getCoinDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { coinId } = req.params;
      const data = await MarketService.getCoinDetails(coinId);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { coinId } = req.params;
      const { days = '30', vs_currency = 'usd' } = req.query;
      const data = await MarketService.getPriceHistory(
        coinId,
        parseInt(days as string, 10),
        vs_currency as string
      );
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getGlobalData(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MarketService.getGlobalData();
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getTrendingCoins(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MarketService.getTrendingCoins();
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}
