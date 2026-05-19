import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';
import { AuthRequest } from '../middleware';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.userId!);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }
}
