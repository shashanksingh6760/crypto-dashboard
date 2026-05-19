import prisma from '../config/database';
import { AlertCondition } from '@prisma/client';
import { AppError } from '../middleware';

interface CreateAlertInput {
  userId: string;
  coinId: string;
  symbol: string;
  targetPrice: number;
  condition: AlertCondition;
}

export class AlertService {
  static async createAlert({ userId, coinId, symbol, targetPrice, condition }: CreateAlertInput) {
    return prisma.alert.create({
      data: { userId, coinId, symbol, targetPrice, condition },
    });
  }

  static async getUserAlerts(userId: string) {
    return prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteAlert(alertId: string, userId: string) {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, userId },
    });
    if (!alert) throw new AppError(404, 'Alert not found');
    await prisma.alert.delete({ where: { id: alertId } });
    return { message: 'Alert deleted' };
  }

  static async toggleAlert(alertId: string, userId: string) {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, userId },
    });
    if (!alert) throw new AppError(404, 'Alert not found');
    return prisma.alert.update({
      where: { id: alertId },
      data: { isActive: !alert.isActive },
    });
  }

  static async getActiveAlerts() {
    return prisma.alert.findMany({
      where: { isActive: true, isTriggered: false },
    });
  }

  static async triggerAlert(alertId: string) {
    return prisma.alert.update({
      where: { id: alertId },
      data: { isTriggered: true, triggeredAt: new Date(), isActive: false },
    });
  }
}
