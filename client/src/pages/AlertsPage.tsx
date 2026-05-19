import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useAlertStore } from '../stores/alertStore';
import { useMarketStore } from '../stores/marketStore';
import { formatCurrency, formatDate, cn } from '../utils/format';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const { alerts, fetchAlerts, createAlert, deleteAlert, toggleAlert, notifications, clearNotifications } = useAlertStore();
  const coins = useMarketStore((s) => s.coins);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ coinId: '', targetPrice: '', condition: 'ABOVE' as 'ABOVE' | 'BELOW' });

  useEffect(() => { fetchAlerts(); }, []);

  const handleCreate = async () => {
    if (!form.coinId || !form.targetPrice) return;
    const coin = coins.find((c) => c.id === form.coinId);
    if (!coin) return;
    try {
      await createAlert({
        coinId: coin.id,
        symbol: coin.symbol,
        targetPrice: parseFloat(form.targetPrice),
        condition: form.condition,
      });
      setForm({ coinId: '', targetPrice: '', condition: 'ABOVE' });
      setShowCreate(false);
      toast.success('Alert created!');
    } catch {
      toast.error('Failed to create alert');
    }
  };

  const activeAlerts = alerts.filter((a) => a.isActive && !a.isTriggered);
  const triggeredAlerts = alerts.filter((a) => a.isTriggered);

  const priceMap = new Map(coins.map((c) => [c.id, c.current_price]));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Price Alerts</h1>
          <p className="text-surface-500 text-sm mt-1">Get notified when prices hit your targets</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Alert
        </button>
      </div>

      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="glass-card p-4 border-l-4 border-warn"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-warn flex items-center gap-2">
              <Bell className="w-4 h-4" /> Recent Notifications ({notifications.length})
            </h4>
            <button onClick={clearNotifications} className="text-xs text-surface-500 hover:text-white">Clear</button>
          </div>
          <div className="space-y-1">
            {notifications.slice(0, 3).map((n: any, i: number) => (
              <p key={i} className="text-sm text-surface-300">
                {n.symbol?.toUpperCase()} reached ${n.currentPrice?.toFixed(2)} (target: ${n.targetPrice?.toFixed(2)})
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Alerts */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-800/50">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-400" />
            Active Alerts ({activeAlerts.length})
          </h3>
        </div>
        {activeAlerts.length === 0 ? (
          <div className="p-12 text-center text-surface-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No active alerts. Create one to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-800/30">
            {activeAlerts.map((alert) => {
              const currentPrice = priceMap.get(alert.coinId) || 0;
              const distance = alert.condition === 'ABOVE'
                ? ((alert.targetPrice - currentPrice) / currentPrice) * 100
                : ((currentPrice - alert.targetPrice) / currentPrice) * 100;

              return (
                <div key={alert.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      alert.condition === 'ABOVE' ? 'bg-gain/10' : 'bg-loss/10'
                    )}>
                      {alert.condition === 'ABOVE' ? (
                        <TrendingUp className="w-5 h-5 text-gain" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-loss" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{alert.symbol.toUpperCase()}</p>
                      <p className="text-sm text-surface-500">
                        {alert.condition === 'ABOVE' ? 'Above' : 'Below'} {formatCurrency(alert.targetPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-mono">{formatCurrency(currentPrice)}</p>
                      <p className={cn('text-xs', distance > 0 ? 'text-surface-500' : 'text-warn')}>
                        {distance > 0 ? `${distance.toFixed(1)}% away` : 'Close!'}
                      </p>
                    </div>
                    <button onClick={() => toggleAlert(alert.id)} className="text-surface-500 hover:text-brand-400 transition-colors">
                      {alert.isActive ? <ToggleRight className="w-6 h-6 text-brand-400" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button onClick={() => deleteAlert(alert.id)} className="text-surface-500 hover:text-loss transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-800/50">
            <h3 className="font-semibold flex items-center gap-2 text-surface-400">
              <CheckCircle className="w-4 h-4 text-gain" />
              Triggered ({triggeredAlerts.length})
            </h3>
          </div>
          <div className="divide-y divide-surface-800/30">
            {triggeredAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between px-5 py-3 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gain" />
                  <div>
                    <p className="font-medium text-sm">{alert.symbol.toUpperCase()} — {alert.condition === 'ABOVE' ? 'Above' : 'Below'} {formatCurrency(alert.targetPrice)}</p>
                    <p className="text-xs text-surface-500">{alert.triggeredAt ? formatDate(alert.triggeredAt) : ''}</p>
                  </div>
                </div>
                <button onClick={() => deleteAlert(alert.id)} className="text-surface-600 hover:text-loss transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Create Price Alert</h3>
            <div className="space-y-4">
              <select value={form.coinId} onChange={(e) => {
                const coin = coins.find(c => c.id === e.target.value);
                setForm({ ...form, coinId: e.target.value, targetPrice: coin?.current_price?.toString() || '' });
              }} className="input-field">
                <option value="">Select coin</option>
                {coins.slice(0, 50).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()}) — {formatCurrency(c.current_price)}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, condition: 'ABOVE' })}
                  className={cn('flex-1 py-3 rounded-xl font-medium text-sm transition-all border', form.condition === 'ABOVE' ? 'bg-gain/10 border-gain/30 text-gain' : 'bg-surface-800 border-surface-700 text-surface-400')}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" /> Above
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, condition: 'BELOW' })}
                  className={cn('flex-1 py-3 rounded-xl font-medium text-sm transition-all border', form.condition === 'BELOW' ? 'bg-loss/10 border-loss/30 text-loss' : 'bg-surface-800 border-surface-700 text-surface-400')}
                >
                  <TrendingDown className="w-4 h-4 inline mr-2" /> Below
                </button>
              </div>
              <input type="number" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} className="input-field" placeholder="Target price (USD)" step="any" />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleCreate} className="btn-primary text-sm">Create Alert</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
