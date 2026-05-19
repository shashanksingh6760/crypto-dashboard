import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useMarketStore } from '../../stores/marketStore';
import { useAuthStore } from '../../stores/authStore';
import socketService from '../../services/socket';
import type { CoinMarketData } from '../../types';

export default function Layout() {
  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);
  const fetchGlobalData = useMarketStore((s) => s.fetchGlobalData);
  const updatePrices = useMarketStore((s) => s.updatePrices);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // Initial data fetch
    fetchMarketData();
    fetchGlobalData();

    // Connect WebSocket
    const socket = socketService.connect();

    // Subscribe to alerts for this user
    if (user?.id) {
      socketService.subscribeToAlerts(user.id);
    }

    // Listen for real-time price updates
    const handlePriceUpdate = (data: CoinMarketData[]) => {
      if (Array.isArray(data)) {
        updatePrices(data);
      }
    };

    socketService.onPriceUpdate(handlePriceUpdate);

    return () => {
      socketService.offPriceUpdate(handlePriceUpdate);
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
