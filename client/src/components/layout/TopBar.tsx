import { useState } from 'react';
import { Bell, Search, Menu, X, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useMarketStore } from '../../stores/marketStore';
import { useAlertStore } from '../../stores/alertStore';
import { useAuthStore } from '../../stores/authStore';
import { formatTime } from '../../utils/format';

export default function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const lastUpdated = useMarketStore((s) => s.lastUpdated);
  const notifications = useAlertStore((s) => s.notifications);
  const { user, logout } = useAuthStore();

  return (
    <>
      <header className="h-16 border-b border-surface-800/50 bg-surface-900/30 backdrop-blur-xl flex items-center justify-between px-6">
        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 text-surface-400 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-800/50 rounded-xl px-4 py-2 w-80 border border-surface-700/50 focus-within:border-brand-500/50 transition-colors">
          <Search className="w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white placeholder:text-surface-500 focus:outline-none flex-1"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-surface-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gain opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gain"></span>
              </span>
              <span>Live · {formatTime(lastUpdated)}</span>
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-surface-400 hover:text-white transition-colors rounded-lg hover:bg-surface-800">
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-loss rounded-full text-[10px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Mobile user */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-surface-950/90 backdrop-blur-xl">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">CryptoIntel</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-surface-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-2">
              {[
                { to: '/', label: 'Dashboard' },
                { to: '/portfolio', label: 'Portfolio' },
                { to: '/analytics', label: 'Analytics' },
                { to: '/alerts', label: 'Alerts' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 text-lg font-medium rounded-xl transition-colors ${
                      isActive ? 'text-white bg-brand-600/20' : 'text-surface-400 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto">
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full px-4 py-3 text-loss font-medium rounded-xl hover:bg-surface-800 transition-colors text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
