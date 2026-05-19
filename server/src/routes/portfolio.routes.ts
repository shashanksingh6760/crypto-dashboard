import { Router } from 'express';
import { PortfolioController } from '../controllers';
import { authenticate, validate } from '../middleware';
import { z } from 'zod';

const router = Router();

const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
});

const addHoldingSchema = z.object({
  coinId: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive('Quantity must be positive'),
  avgBuyPrice: z.number().positive('Price must be positive'),
});

router.use(authenticate);

router.post('/', validate(createPortfolioSchema), PortfolioController.create);
router.get('/', PortfolioController.getAll);
router.get('/:id', PortfolioController.getById);
router.delete('/:id', PortfolioController.delete);
router.post('/:id/holdings', validate(addHoldingSchema), PortfolioController.addHolding);
router.delete('/:id/holdings/:holdingId', PortfolioController.removeHolding);

export default router;
