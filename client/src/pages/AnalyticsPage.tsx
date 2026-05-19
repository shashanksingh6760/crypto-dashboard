import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, BarChart3, GitBranch } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { useMarketStore } from '../stores/marketStore';
import { marketApi } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';

export default function AnalyticsPage() {
  const coins = useMarketStore((s) => s.coins);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [timeframe, setTimeframe] = useState(30);
  const [priceHistory, setPriceHistory] = useState<{ date: string; price: number; volume: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [selectedCoin, timeframe]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await marketApi.getPriceHistory(selectedCoin, timeframe);
      const history = data.data;
      if (history?.prices) {
        const formatted = history.prices.map(([ts, price]: [number, number], i: number) => ({
          date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price,
          volume: history.volumes?.[i]?.[1] || 0,
        }));
        setPriceHistory(formatted);
      }
    } catch {
      console.error('Failed to load price history');
    }
    setLoading(false);
  };

  // Calculate volatility (standard deviation of daily returns)
  const volatilityData = useMemo(() => {
    return coins.slice(0, 20).map((coin) => {
      const sparkline = coin.sparkline_in_7d?.price || [];
      if (sparkline.length < 2) return { name: coin.symbol.toUpperCase(), volatility: 0, change: coin.price_change_percentage_24h || 0 };

      const returns = sparkline.slice(1).map((p, i) => ((p - sparkline[i]) / sparkline[i]) * 100);
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
      const stdDev = Math.sqrt(variance);

      return {
        name: coin.symbol.toUpperCase(),
        volatility: parseFloat(stdDev.toFixed(3)),
        change: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap,
      };
    }).sort((a, b) => b.volatility - a.volatility);
  }, [coins]);

  // Correlation matrix (simplified - based on 7d sparkline correlation)
  const correlationPairs = useMemo(() => {
    const topCoins = coins.slice(0, 8);
    const pairs: { x: string; y: string; correlation: number }[] = [];

    for (let i = 0; i < topCoins.length; i++) {
      for (let j = i + 1; j < topCoins.length; j++) {
        const a = topCoins[i].sparkline_in_7d?.price || [];
        const b = topCoins[j].sparkline_in_7d?.price || [];
        if (a.length < 10 || b.length < 10) continue;

        const len = Math.min(a.length, b.length);
        const aSlice = a.slice(-len);
        const bSlice = b.slice(-len);

        const meanA = aSlice.reduce((s, v) => s + v, 0) / len;
        const meanB = bSlice.reduce((s, v) => s + v, 0) / len;

        let num = 0, denA = 0, denB = 0;
        for (let k = 0; k < len; k++) {
          const dA = aSlice[k] - meanA;
          const dB = bSlice[k] - meanB;
          num += dA * dB;
          denA += dA * dA;
          denB += dB * dB;
        }
        const corr = denA > 0 && denB > 0 ? num / Math.sqrt(denA * denB) : 0;
        pairs.push({
          x: topCoins[i].symbol.toUpperCase(),
          y: topCoins[j].symbol.toUpperCase(),
          correlation: parseFloat(corr.toFixed(3)),
        });
      }
    }
    return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [coins]);

  const selectedCoinData = coins.find((c) => c.id === selectedCoin);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-surface-500 text-sm mt-1">Market analytics, volatility, and correlations</p>
      </div>

      {/* Coin Selector + Timeframe */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedCoin}
          onChange={(e) => setSelectedCoin(e.target.value)}
          className="input-field !w-auto"
        >
          {coins.slice(0, 30).map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
          ))}
        </select>
        <div className="flex gap-2">
          {[1, 7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setTimeframe(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeframe === d
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:text-white'
              }`}
            >
              {d === 1 ? '24H' : d === 7 ? '7D' : d === 30 ? '1M' : d === 90 ? '3M' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              Price Chart — {selectedCoinData?.name || selectedCoin}
            </h3>
            {selectedCoinData && (
              <p className="text-2xl font-bold mt-1">{formatCurrency(selectedCoinData.current_price)}</p>
            )}
          </div>
          {selectedCoinData && (
            <span className={selectedCoinData.price_change_percentage_24h >= 0 ? 'badge-gain' : 'badge-loss'}>
              {formatPercent(selectedCoinData.price_change_percentage_24h)}
            </span>
          )}
        </div>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Price']}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Volatility Chart */}
        <div className="glass-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            7D Volatility (Top 20)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={volatilityData.slice(0, 15)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} width={50} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(3)}%`, 'Volatility']}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
              />
              <Bar dataKey="volatility" radius={[0, 6, 6, 0]} fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation Table */}
        <div className="glass-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            7D Correlations (Top 8 Coins)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-surface-500 text-xs uppercase">
                  <th className="px-3 py-2 text-left">Pair</th>
                  <th className="px-3 py-2 text-right">Correlation</th>
                  <th className="px-3 py-2 text-right">Strength</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/30">
                {correlationPairs.slice(0, 15).map((pair, i) => {
                  const abs = Math.abs(pair.correlation);
                  const strength = abs > 0.8 ? 'Strong' : abs > 0.5 ? 'Moderate' : abs > 0.3 ? 'Weak' : 'Very Weak';
                  const color = abs > 0.8 ? 'text-gain' : abs > 0.5 ? 'text-brand-400' : abs > 0.3 ? 'text-warn' : 'text-surface-500';

                  return (
                    <tr key={i} className="hover:bg-surface-800/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-medium">
                        {pair.x}/{pair.y}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-semibold ${pair.correlation >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {pair.correlation.toFixed(3)}
                      </td>
                      <td className={`px-3 py-2.5 text-right text-xs font-medium ${color}`}>
                        {strength}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
