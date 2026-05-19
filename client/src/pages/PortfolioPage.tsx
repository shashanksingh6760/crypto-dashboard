import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3 } from 'lucide-react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useMarketStore } from '../stores/marketStore';
import { formatCurrency, formatPercent, cn } from '../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import type { HoldingWithPnL } from '../types';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export default function PortfolioPage() {
  const { portfolios, activePortfolio, isLoading, fetchPortfolios, createPortfolio, deletePortfolio, addHolding, removeHolding, setActivePortfolio } = usePortfolioStore();
  const coins = useMarketStore((s) => s.coins);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [holdingForm, setHoldingForm] = useState({ coinId: '', quantity: '', avgBuyPrice: '' });

  useEffect(() => {
    fetchPortfolios();
  }, []);

  // Calculate P&L for each holding
  const priceMap = new Map(coins.map((c) => [c.id, c]));
  const holdingsWithPnL: HoldingWithPnL[] = (activePortfolio?.holdings || []).map((h) => {
    const coin = priceMap.get(h.coinId);
    const currentPrice = coin?.current_price || 0;
    const currentValue = h.quantity * currentPrice;
    const costBasis = h.quantity * h.avgBuyPrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { ...h, currentPrice, currentValue, costBasis, pnl, pnlPercent };
  });

  const totalValue = holdingsWithPnL.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdingsWithPnL.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const pieData = holdingsWithPnL
    .filter((h) => h.currentValue > 0)
    .map((h) => ({ name: h.symbol.toUpperCase(), value: h.currentValue }));

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    try {
      await createPortfolio(newPortfolioName);
      setNewPortfolioName('');
      setShowCreateModal(false);
      toast.success('Portfolio created!');
    } catch { toast.error('Failed to create portfolio'); }
  };

  const handleAddHolding = async () => {
    if (!activePortfolio || !holdingForm.coinId) return;
    const coin = coins.find((c) => c.id === holdingForm.coinId);
    if (!coin) return;
    try {
      await addHolding(activePortfolio.id, {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        quantity: parseFloat(holdingForm.quantity),
        avgBuyPrice: parseFloat(holdingForm.avgBuyPrice),
      });
      setHoldingForm({ coinId: '', quantity: '', avgBuyPrice: '' });
      setShowAddHolding(false);
      toast.success('Holding added!');
    } catch { toast.error('Failed to add holding'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-surface-500 text-sm mt-1">Track your holdings and P&L</p>
        </div>
        <div className="flex gap-3">
          {portfolios.length > 0 && (
            <select
              value={activePortfolio?.id || ''}
              onChange={(e) => setActivePortfolio(portfolios.find((p) => p.id === e.target.value) || null)}
              className="input-field !w-auto !py-2 text-sm"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Portfolio
          </button>
        </div>
      </div>

      {/* Stats */}
      {activePortfolio && holdingsWithPnL.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 text-surface-500 text-sm">
              <Wallet className="w-4 h-4" />
              <span>Total Value</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-surface-500 text-sm">
              <DollarSign className="w-4 h-4" />
              <span>Total Cost</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-surface-500 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>Total P&L</span>
            </div>
            <p className={cn('text-2xl font-bold', totalPnL >= 0 ? 'text-gain' : 'text-loss')}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <span className={totalPnL >= 0 ? 'badge-gain' : 'badge-loss'}>
              {totalPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercent(totalPnLPercent)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-surface-800/50">
            <h3 className="font-semibold">Holdings</h3>
            {activePortfolio && (
              <button onClick={() => setShowAddHolding(true)} className="btn-ghost text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add
              </button>
            )}
          </div>
          {!activePortfolio ? (
            <div className="p-12 text-center text-surface-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Create a portfolio to get started</p>
            </div>
          ) : holdingsWithPnL.length === 0 ? (
            <div className="p-12 text-center text-surface-500">
              <p>No holdings yet. Add your first coin!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-surface-500 uppercase">
                    <th className="px-4 py-3 text-left">Coin</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Avg Buy</th>
                    <th className="px-4 py-3 text-right">Current</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3 text-right">P&L</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/30">
                  {holdingsWithPnL.map((h) => (
                    <tr key={h.id} className="hover:bg-surface-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={priceMap.get(h.coinId)?.image} alt="" className="w-6 h-6 rounded-full" />
                          <div>
                            <p className="font-medium text-sm">{h.name}</p>
                            <p className="text-xs text-surface-500 uppercase">{h.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{h.quantity.toFixed(4)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-surface-400">{formatCurrency(h.avgBuyPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(h.currentPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold">{formatCurrency(h.currentValue)}</td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <p className={cn('font-mono text-sm font-semibold', h.pnl >= 0 ? 'text-gain' : 'text-loss')}>
                            {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)}
                          </p>
                          <p className={cn('text-xs', h.pnl >= 0 ? 'text-gain' : 'text-loss')}>
                            {formatPercent(h.pnlPercent)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeHolding(activePortfolio!.id, h.id)}
                          className="text-surface-600 hover:text-loss transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4">Allocation</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-surface-300">{entry.name}</span>
                    </div>
                    <span className="font-mono font-medium">{((entry.value / totalValue) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-surface-500 text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreateModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Create Portfolio</h3>
            <input value={newPortfolioName} onChange={(e) => setNewPortfolioName(e.target.value)} className="input-field mb-4" placeholder="Portfolio name" autoFocus />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleCreatePortfolio} className="btn-primary text-sm">Create</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Holding Modal */}
      {showAddHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAddHolding(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add Holding</h3>
            <div className="space-y-4">
              <select value={holdingForm.coinId} onChange={(e) => {
                const coin = coins.find(c => c.id === e.target.value);
                setHoldingForm({ ...holdingForm, coinId: e.target.value, avgBuyPrice: coin?.current_price?.toString() || '' });
              }} className="input-field">
                <option value="">Select coin</option>
                {coins.slice(0, 50).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
                ))}
              </select>
              <input type="number" value={holdingForm.quantity} onChange={(e) => setHoldingForm({ ...holdingForm, quantity: e.target.value })} className="input-field" placeholder="Quantity" step="any" />
              <input type="number" value={holdingForm.avgBuyPrice} onChange={(e) => setHoldingForm({ ...holdingForm, avgBuyPrice: e.target.value })} className="input-field" placeholder="Average buy price (USD)" step="any" />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowAddHolding(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAddHolding} className="btn-primary text-sm">Add</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
