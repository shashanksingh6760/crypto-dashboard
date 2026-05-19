import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Globe, Coins } from 'lucide-react';
import { useMarketStore } from '../stores/marketStore';
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/format';
import CoinTable from '../components/dashboard/CoinTable';
import SparklineChart from '../components/charts/SparklineChart';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  const { coins, globalData, isLoading } = useMarketStore();

  const topGainer = coins.length > 0
    ? [...coins].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))[0]
    : null;

  const topLoser = coins.length > 0
    ? [...coins].sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))[0]
    : null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <p className="text-surface-500 text-sm mt-1">Real-time cryptocurrency market data</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <Globe className="w-4 h-4" />
            <span>Total Market Cap</span>
          </div>
          <p className="text-2xl font-bold">
            {globalData ? formatCurrency(globalData.total_market_cap?.usd || 0) : '—'}
          </p>
          {globalData && (
            <span className={globalData.market_cap_change_percentage_24h_usd >= 0 ? 'badge-gain' : 'badge-loss'}>
              {globalData.market_cap_change_percentage_24h_usd >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercent(globalData.market_cap_change_percentage_24h_usd)}
            </span>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>24h Volume</span>
          </div>
          <p className="text-2xl font-bold">
            {globalData ? formatCurrency(globalData.total_volume?.usd || 0) : '—'}
          </p>
          <span className="text-xs text-surface-500">
            {globalData ? `${formatCompactNumber(globalData.active_cryptocurrencies)} active coins` : ''}
          </span>
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <TrendingUp className="w-4 h-4 text-gain" />
            <span>Top Gainer (24h)</span>
          </div>
          {topGainer ? (
            <>
              <div className="flex items-center gap-2">
                <img src={topGainer.image} alt={topGainer.name} className="w-6 h-6 rounded-full" />
                <span className="text-lg font-bold">{topGainer.symbol.toUpperCase()}</span>
              </div>
              <span className="badge-gain">
                <TrendingUp className="w-3 h-3" />
                {formatPercent(topGainer.price_change_percentage_24h)}
              </span>
            </>
          ) : <p className="text-lg font-bold">—</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <TrendingDown className="w-4 h-4 text-loss" />
            <span>Top Loser (24h)</span>
          </div>
          {topLoser ? (
            <>
              <div className="flex items-center gap-2">
                <img src={topLoser.image} alt={topLoser.name} className="w-6 h-6 rounded-full" />
                <span className="text-lg font-bold">{topLoser.symbol.toUpperCase()}</span>
              </div>
              <span className="badge-loss">
                <TrendingDown className="w-3 h-3" />
                {formatPercent(topLoser.price_change_percentage_24h)}
              </span>
            </>
          ) : <p className="text-lg font-bold">—</p>}
        </motion.div>
      </div>

      {/* BTC Dominance Bar */}
      {globalData?.market_cap_percentage && (
        <motion.div variants={itemVariants} className="glass-card p-4">
          <p className="text-xs text-surface-500 mb-2 font-medium">Market Dominance</p>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {Object.entries(globalData.market_cap_percentage)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([coin, pct], i) => {
                const colors = ['bg-amber-500', 'bg-brand-500', 'bg-cyan-500', 'bg-purple-500', 'bg-rose-500'];
                return (
                  <div
                    key={coin}
                    className={`${colors[i]} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                    title={`${coin.toUpperCase()}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {Object.entries(globalData.market_cap_percentage)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([coin, pct], i) => {
                const colors = ['text-amber-500', 'text-brand-500', 'text-cyan-500', 'text-purple-500', 'text-rose-500'];
                return (
                  <span key={coin} className={`text-xs font-medium ${colors[i]}`}>
                    {coin.toUpperCase()} {pct.toFixed(1)}%
                  </span>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Coin Table */}
      <motion.div variants={itemVariants}>
        <CoinTable coins={coins} isLoading={isLoading} />
      </motion.div>
    </motion.div>
  );
}
