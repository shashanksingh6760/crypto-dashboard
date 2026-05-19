import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Globe, Link as LinkIcon, Github, Twitter, DollarSign, BarChart3, Maximize } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { marketApi } from '../services/api';
import { formatCurrency, formatPercent, formatCompactNumber, cn } from '../utils/format';

export default function CoinDetailsPage() {
  const { id } = useParams();
  const [coin, setCoin] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(30);

  useEffect(() => {
    if (!id) return;
    loadCoinData();
  }, [id, timeframe]);

  const loadCoinData = async () => {
    setLoading(true);
    try {
      const [coinRes, historyRes] = await Promise.all([
        marketApi.getCoinDetails(id!),
        marketApi.getPriceHistory(id!, timeframe),
      ]);
      setCoin(coinRes.data.data);
      
      const historyData = historyRes.data.data;
      if (historyData?.prices) {
        const formatted = historyData.prices.map(([ts, price]: [number, number]) => ({
          date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: timeframe <= 1 ? '2-digit' : undefined }),
          price,
        }));
        setHistory(formatted);
      }
    } catch (error) {
      console.error('Failed to load coin details', error);
    }
    setLoading(false);
  };

  if (loading && !coin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!coin) {
    return <div className="p-8 text-center text-surface-400">Coin not found.</div>;
  }

  const currentPrice = coin.market_data?.current_price?.usd || 0;
  const change24h = coin.market_data?.price_change_percentage_24h || 0;
  const isUp = change24h >= 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      <Link to="/" className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 glass-card p-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <img src={coin.image?.large} alt={coin.name} className="w-20 h-20 rounded-full bg-surface-900 p-1 border border-surface-800" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
              <span className="px-2.5 py-1 bg-surface-800 text-surface-300 text-xs font-bold uppercase rounded-lg border border-surface-700">
                {coin.symbol}
              </span>
              <span className="px-2.5 py-1 bg-brand-500/10 text-brand-400 text-xs font-bold rounded-lg border border-brand-500/20">
                Rank #{coin.market_cap_rank}
              </span>
            </div>
            <div className="flex items-baseline gap-4 mt-3">
              <span className="text-4xl font-bold font-mono tracking-tight text-white">
                {formatCurrency(currentPrice)}
              </span>
              <span className={cn('text-lg font-semibold flex items-center gap-1', isUp ? 'text-gain' : 'text-loss')}>
                {isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {formatPercent(change24h)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          {coin.links?.homepage?.[0] && (
            <a href={coin.links.homepage[0]} target="_blank" rel="noreferrer" className="btn-secondary !p-2.5">
              <Globe className="w-5 h-5 text-surface-300" />
            </a>
          )}
          {coin.links?.repos_url?.github?.[0] && (
            <a href={coin.links.repos_url.github[0]} target="_blank" rel="noreferrer" className="btn-secondary !p-2.5">
              <Github className="w-5 h-5 text-surface-300" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-semibold flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-brand-400" /> Price Chart
            </h3>
            <div className="flex bg-surface-900/50 p-1 rounded-xl border border-surface-800">
              {[1, 7, 30, 90, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setTimeframe(d)}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    timeframe === d ? 'bg-surface-800 text-white shadow-sm' : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                  )}
                >
                  {d === 1 ? '1D' : d === 7 ? '7D' : d === 30 ? '1M' : d === 90 ? '3M' : '1Y'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => formatCurrency(v, 0)} 
                    domain={['auto', 'auto']} 
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isUp ? '#10b981' : '#ef4444'} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4 text-lg">Market Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-surface-800/50">
                <span className="text-surface-400 text-sm flex items-center gap-2"><DollarSign className="w-4 h-4"/> Market Cap</span>
                <span className="font-mono font-medium text-white">{formatCurrency(coin.market_data?.market_cap?.usd || 0, 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-800/50">
                <span className="text-surface-400 text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4"/> 24h Volume</span>
                <span className="font-mono font-medium text-white">{formatCurrency(coin.market_data?.total_volume?.usd || 0, 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-800/50">
                <span className="text-surface-400 text-sm flex items-center gap-2"><Maximize className="w-4 h-4"/> Circulating Supply</span>
                <span className="font-mono font-medium text-white">{formatCompactNumber(coin.market_data?.circulating_supply || 0)} {coin.symbol.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-800/50">
                <span className="text-surface-400 text-sm">All Time High</span>
                <div className="text-right">
                  <span className="font-mono font-medium text-white block">{formatCurrency(coin.market_data?.ath?.usd || 0)}</span>
                  <span className="text-xs text-loss">{formatPercent(coin.market_data?.ath_change_percentage?.usd || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-3 text-lg">About {coin.name}</h3>
            <div 
              className="text-sm text-surface-300 leading-relaxed max-h-64 overflow-y-auto pr-2 prose prose-invert prose-p:mb-3 prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline scrollbar-thin"
              dangerouslySetInnerHTML={{ __html: coin.description?.en || 'No description available.' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
