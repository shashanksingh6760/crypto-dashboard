import { Router } from 'express';
import authRoutes from './auth.routes';
import marketRoutes from './market.routes';
import portfolioRoutes from './portfolio.routes';
import alertRoutes from './alert.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/market', marketRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/alerts', alertRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
