import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { formatCurrency, formatPercent, formatCompactNumber, cn } from '../../utils/format';
import SparklineChart from '../charts/SparklineChart';
import type { CoinMarketData } from '../../types';

interface CoinTableProps {
  coins: CoinMarketData[];
  isLoading: boolean;
}

export default function CoinTable({ coins, isLoading }: CoinTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<string>('market_cap_rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'market_cap_rank' ? 'asc' : 'desc');
    }
  };

  const toggleFavorite = (coinId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(coinId) ? next.delete(coinId) : next.add(coinId);
      return next;
    });
  };

  const sorted = [...coins].sort((a: any, b: any) => {
    const aVal = a[sortKey] || 0;
    const bVal = b[sortKey] || 0;
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  if (isLoading && coins.length === 0) {
    return (
      <div className="glass-card p-8">
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-surface-800" />
              <div className="flex-1 h-4 bg-surface-800 rounded" />
              <div className="w-24 h-4 bg-surface-800 rounded" />
              <div className="w-16 h-4 bg-surface-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && (
          <span className="text-brand-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-surface-800/50">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <SortHeader label="#" field="market_cap_rank" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Coin</th>
              <SortHeader label="Price" field="current_price" />
              <SortHeader label="24h %" field="price_change_percentage_24h" />
              <SortHeader label="7d %" field="price_change_percentage_7d_in_currency" />
              <SortHeader label="Market Cap" field="market_cap" />
              <SortHeader label="Volume" field="total_volume" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden xl:table-cell">
                7D Chart
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800/30">
            {sorted.map((coin) => {
              const change24h = coin.price_change_percentage_24h || 0;
              const change7d = coin.price_change_percentage_7d_in_currency || 0;
              const isUp24h = change24h >= 0;
              const isUp7d = change7d >= 0;

              return (
                <tr
                  key={coin.id}
                  onClick={() => navigate(`/coin/${coin.id}`)}
                  className="hover:bg-surface-800/30 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(coin.id); }}
                      className="text-surface-600 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={cn('w-4 h-4', favorites.has(coin.id) && 'fill-amber-400 text-amber-400')}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-500 font-mono">
                    {coin.market_cap_rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-8 h-8 rounded-full"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-semibold text-sm">{coin.name}</p>
                        <p className="text-xs text-surface-500 uppercase">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-sm">
                    {formatCurrency(coin.current_price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-sm font-semibold',
                      isUp24h ? 'text-gain' : 'text-loss'
                    )}>
                      {isUp24h ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {formatPercent(change24h)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-sm font-semibold',
                      isUp7d ? 'text-gain' : 'text-loss'
                    )}>
                      {formatPercent(change7d)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-300 font-mono">
                    {formatCompactNumber(coin.market_cap)}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400 font-mono">
                    {formatCompactNumber(coin.total_volume)}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {coin.sparkline_in_7d?.price && (
                      <SparklineChart
                        data={coin.sparkline_in_7d.price}
                        isPositive={isUp7d}
                        width={120}
                        height={40}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
