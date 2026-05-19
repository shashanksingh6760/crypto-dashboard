import { Router } from 'express';
import { MarketController } from '../controllers';

const router = Router();

// Public market data endpoints
router.get('/', MarketController.getMarketData);
router.get('/global', MarketController.getGlobalData);
router.get('/trending', MarketController.getTrendingCoins);
router.get('/:coinId', MarketController.getCoinDetails);
router.get('/:coinId/history', MarketController.getPriceHistory);

export default router;
