import prisma from './config/database';
import redis from './config/redis';
import { config } from './config';

// ─── Retry-enabled fetch ────────────────────────────────────
async function fetchWithRetry(url: string, retries = 2): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (response.status === 429) {
        console.warn(`⚠️  Rate limited by CoinGecko in worker`);
        return null; // Return null instead of blocking thread
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) return null;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

// ─── Price Fetcher Job ──────────────────────────────────────
async function fetchAndBroadcastPrices() {
  try {
    const url = `${config.coingecko.apiUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d`;
    const data = await fetchWithRetry(url);

    if (!data || !Array.isArray(data)) {
      console.warn('⚠️  Invalid market data received');
      return;
    }

    // Cache in in-memory Redis mock
    await redis.setex('market:usd:50:1', 30, JSON.stringify(data));

    // Store price history (sample every minute to avoid DB bloat)
    const lastSaved = await redis.get('last_price_save');
    const now = Date.now();
    if (!lastSaved || now - parseInt(lastSaved) > 60000) {
      const priceRecords = data.slice(0, 20).map((coin: any) => ({
        coinId: coin.id,
        symbol: coin.symbol,
        price: coin.current_price || 0,
        volume: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        change24h: coin.price_change_percentage_24h || 0,
      }));

      await prisma.priceHistory.createMany({ data: priceRecords });
      await redis.set('last_price_save', now.toString());

      // Update coins table
      for (const coin of data.slice(0, 50)) {
        // SQLite doesn't support generic upsert with multiple creates easily if using Prisma without unique constraints on the updated fields,
        // but id is unique, so upsert works fine.
        await prisma.coin.upsert({
          where: { id: coin.id },
          update: {
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            rank: coin.market_cap_rank || 0,
          },
          create: {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            rank: coin.market_cap_rank || 0,
          },
        });
      }
    }

    // Publish price update via mock Redis
    await redis.publish('prices:update', JSON.stringify(data));

  } catch (error) {
    console.error('❌ Price fetch error:', error);
  }
}

// ─── Alert Checker ──────────────────────────────────────────
async function checkAlerts() {
  try {
    const alerts = await prisma.alert.findMany({
      where: { isActive: true, isTriggered: false },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (alerts.length === 0) return;

    // Get current prices from cache
    const cached = await redis.get('market:usd:50:1');
    if (!cached) return;

    const marketData = JSON.parse(cached);
    const priceMap = new Map(marketData.map((c: any) => [c.id, c.current_price]));

    for (const alert of alerts) {
      const currentPrice = priceMap.get(alert.coinId);
      if (!currentPrice) continue;

      const shouldTrigger =
        (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: { isTriggered: true, triggeredAt: new Date(), isActive: false },
        });

        // Publish alert notification
        await redis.publish(
          'alert:triggered',
          JSON.stringify({
            userId: alert.userId,
            alert: {
              id: alert.id,
              coinId: alert.coinId,
              symbol: alert.symbol,
              targetPrice: alert.targetPrice,
              currentPrice,
              condition: alert.condition,
            },
          })
        );
      }
    }
  } catch (error) {
    console.error('❌ Alert check error:', error);
  }
}

export function initializeWorker() {
  console.log('⚙️  In-memory worker started');
  
  // Initial fetch
  fetchAndBroadcastPrices().then(() => checkAlerts());

  // Price updates every 60 seconds to avoid free tier rate limits
  setInterval(async () => {
    await fetchAndBroadcastPrices();
    await checkAlerts();
  }, 60000);
}
