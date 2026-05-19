import { Router } from 'express';
import { AlertController } from '../controllers';
import { authenticate, validate } from '../middleware';
import { z } from 'zod';

const router = Router();

const createAlertSchema = z.object({
  coinId: z.string().min(1),
  symbol: z.string().min(1),
  targetPrice: z.number().positive('Target price must be positive'),
  condition: z.enum(['ABOVE', 'BELOW']),
});

router.use(authenticate);

router.post('/', validate(createAlertSchema), AlertController.create);
router.get('/', AlertController.getAll);
router.delete('/:id', AlertController.delete);
router.patch('/:id/toggle', AlertController.toggle);

export default router;
