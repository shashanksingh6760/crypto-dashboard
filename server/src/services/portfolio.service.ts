import prisma from '../config/database';
import { AppError } from '../middleware';

interface CreatePortfolioInput {
  name: string;
  userId: string;
}

interface AddHoldingInput {
  portfolioId: string;
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  userId: string;
}

export class PortfolioService {
  static async createPortfolio({ name, userId }: CreatePortfolioInput) {
    return prisma.portfolio.create({
      data: { name, userId },
      include: { holdings: true },
    });
  }

  static async getUserPortfolios(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPortfolioById(portfolioId: string, userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: { holdings: true },
    });
    if (!portfolio) throw new AppError(404, 'Portfolio not found');
    return portfolio;
  }

  static async deletePortfolio(portfolioId: string, userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });
    if (!portfolio) throw new AppError(404, 'Portfolio not found');
    await prisma.portfolio.delete({ where: { id: portfolioId } });
    return { message: 'Portfolio deleted' };
  }

  static async addHolding({ portfolioId, coinId, symbol, name, quantity, avgBuyPrice, userId }: AddHoldingInput) {
    // Verify ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });
    if (!portfolio) throw new AppError(404, 'Portfolio not found');

    // Upsert holding - if coin already exists, update quantity and avg price
    const existing = await prisma.holding.findUnique({
      where: { portfolioId_coinId: { portfolioId, coinId } },
    });

    if (existing) {
      const totalQty = existing.quantity + quantity;
      const newAvg =
        (existing.quantity * existing.avgBuyPrice + quantity * avgBuyPrice) / totalQty;

      return prisma.holding.update({
        where: { id: existing.id },
        data: { quantity: totalQty, avgBuyPrice: newAvg },
      });
    }

    return prisma.holding.create({
      data: { portfolioId, coinId, symbol, name, quantity, avgBuyPrice },
    });
  }

  static async removeHolding(holdingId: string, userId: string) {
    const holding = await prisma.holding.findUnique({
      where: { id: holdingId },
      include: { portfolio: true },
    });
    if (!holding || holding.portfolio.userId !== userId) {
      throw new AppError(404, 'Holding not found');
    }
    await prisma.holding.delete({ where: { id: holdingId } });
    return { message: 'Holding removed' };
  }
}
