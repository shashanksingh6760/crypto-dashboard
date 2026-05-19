import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, BarChart3, Bell, Zap, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-900/50 border-r border-surface-800/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-800/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
            CryptoIntel
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-surface-500 font-medium">
            Market Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-surface-800/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="p-1.5 text-surface-500 hover:text-loss transition-colors rounded-lg hover:bg-surface-800">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
