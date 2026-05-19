import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { io as socketClient, Socket } from 'socket.io-client';

const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const PRICE_UPDATE_INTERVAL = parseInt(process.env.PRICE_UPDATE_INTERVAL || '10000', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const prisma = new PrismaClient();
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ─── Retry-enabled fetch ────────────────────────────────────
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '10', 10);
        console.warn(`⚠️  Rate limited. Waiting ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ─── Price Fetcher Job ──────────────────────────────────────
async function fetchAndBroadcastPrices() {
  try {
    const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d`;
    const data = await fetchWithRetry(url);

    if (!data || !Array.isArray(data)) {
      console.warn('⚠️  Invalid market data received');
      return;
    }

    // Cache in Redis
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

    // Publish price update via Redis pub/sub (server subscribes)
    await redis.publish('prices:update', JSON.stringify(data));

    console.log(`📊 Fetched prices for ${data.length} coins at ${new Date().toLocaleTimeString()}`);
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

        console.log(`🔔 Alert triggered: ${alert.symbol} ${alert.condition} $${alert.targetPrice} (current: $${currentPrice})`);
      }
    }
  } catch (error) {
    console.error('❌ Alert check error:', error);
  }
}

// ─── Cleanup old price history (keep 7 days) ───────────────
async function cleanupOldData() {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.priceHistory.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
    if (count > 0) {
      console.log(`🧹 Cleaned ${count} old price records`);
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// ─── Main Loop ──────────────────────────────────────────────
async function main() {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   ⚙️  Crypto Intelligence Worker              ║
  ║   Interval: ${(PRICE_UPDATE_INTERVAL / 1000).toString().padEnd(4)}s                          ║
  ║   Redis: Connected                            ║
  ╚══════════════════════════════════════════════╝
  `);

  // Initial fetch
  await fetchAndBroadcastPrices();
  await checkAlerts();

  // Price updates every 10 seconds
  setInterval(async () => {
    await fetchAndBroadcastPrices();
    await checkAlerts();
  }, PRICE_UPDATE_INTERVAL);

  // Cleanup daily
  setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
}

main().catch(console.error);
