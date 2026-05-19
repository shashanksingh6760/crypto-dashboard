import { Response, NextFunction } from 'express';
import { AlertService } from '../services';
import { AuthRequest } from '../middleware';

export class AlertController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alert = await AlertService.createAlert({
        ...req.body,
        userId: req.userId!,
      });
      res.status(201).json({ status: 'success', data: alert });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alerts = await AlertService.getUserAlerts(req.userId!);
      res.json({ status: 'success', data: alerts });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AlertService.deleteAlert(req.params.id, req.userId!);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async toggle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alert = await AlertService.toggleAlert(req.params.id, req.userId!);
      res.json({ status: 'success', data: alert });
    } catch (error) {
      next(error);
    }
  }
}
