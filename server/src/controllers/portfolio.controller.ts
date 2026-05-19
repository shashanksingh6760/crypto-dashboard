import { Response, NextFunction } from 'express';
import { PortfolioService } from '../services';
import { AuthRequest } from '../middleware';

export class PortfolioController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const portfolio = await PortfolioService.createPortfolio({
        name: req.body.name,
        userId: req.userId!,
      });
      res.status(201).json({ status: 'success', data: portfolio });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const portfolios = await PortfolioService.getUserPortfolios(req.userId!);
      res.json({ status: 'success', data: portfolios });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const portfolio = await PortfolioService.getPortfolioById(req.params.id, req.userId!);
      res.json({ status: 'success', data: portfolio });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PortfolioService.deletePortfolio(req.params.id, req.userId!);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async addHolding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const holding = await PortfolioService.addHolding({
        ...req.body,
        portfolioId: req.params.id,
        userId: req.userId!,
      });
      res.status(201).json({ status: 'success', data: holding });
    } catch (error) {
      next(error);
    }
  }

  static async removeHolding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PortfolioService.removeHolding(req.params.holdingId, req.userId!);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}
