import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TankManagement from './components/TankManagement';
import Accounting from './components/Accounting';
import Inventory from './components/Inventory';
import Analytics from './components/Analytics';
import AIAssistant from './components/AIAssistant';
import HealthLibrary from './components/HealthLibrary';
import NotificationCenter from './components/NotificationCenter';
import Procurement from './components/Procurement';
import SalesModule from './components/SalesModule';
import FishTypeManagement from './components/FishTypeManagement';
import FoodTypeManagement from './components/FoodTypeManagement';
import { HarvestManagement } from './components/HarvestManagement';
import Sidebar from './components/Sidebar';
import { Toaster } from './components/ui/sonner';
import { User, Farm } from './types';
import { clearAuthSession, getStoredAppUser } from './services/authSession';
import { apiGet } from './api';
import { mockFarms, mockNotifications } from './mockData';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const user = getStoredAppUser();
    if (user) {
      setCurrentUser(user);
      fetchFarms(user);
    }
  }, []);



  useEffect(() => {
    if (!currentUser) return;

    const controller = new AbortController();

    const connectToSSE = async () => {
      try {
        await fetchEventSource('https://fouadkhaild-asd.hf.space/api/v1/notifications/stream', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'text/event-stream',
          },
          signal: controller.signal,
          async onopen(response) {
            if (response.ok) {
              console.log("✅ متصل بنظام إشعارات FishFarm360");
            }
          },
          onmessage(ev) {
            console.log("📥 إشعار جديد:", ev.data);
            try {
              const data = JSON.parse(ev.data);
              const newNotification = {
                id: data.id || Math.random().toString(36).substr(2, 9),
                title: data.subject || "New Notification",
                message: data.body || "",
                type: 'alert',
                priority: data.data?.status?.toLowerCase() || 'medium',
                timestamp: data.timestamp || new Date().toISOString(),
                read: false,
                data: data.data
              };

              setNotifications((prev: any[]) => [newNotification, ...prev]);
            } catch (err) {
              console.error("Failed to parse notification:", err);
            }
          },
          onerror(err) {
            console.log("🔄 محاولة إعادة اتصال...");
            throw err;
          }
        });
      } catch (err) {
        console.log("SSE Connection Error");
      }
    };

    connectToSSE();

    return () => {

      controller.abort();
    };
  }, [currentUser]);



  const fetchFarms = async (user: User) => {
    try {
      const res = await apiGet<any>('/farms');
      const apiFarms = res.data || (Array.isArray(res) ? res : []);

      if (apiFarms.length > 0) {
        const farm = apiFarms.find((f: any) => f.id === user.farmId) || apiFarms[0];
        setSelectedFarm(farm);
      } else if (user.farmId) {
        // Fallback to mock if needed, but only if they belong to one
        const mockFarm = mockFarms.find(f => f.id === user.farmId);
        if (mockFarm) setSelectedFarm(mockFarm);
      }
    } catch (err) {
      console.error('Failed to fetch farms:', err);
      // Fallback
      if (user.farmId) {
        const mockFarm = mockFarms.find(f => f.id === user.farmId);
        if (mockFarm) setSelectedFarm(mockFarm);
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    fetchFarms(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearAuthSession();
    setCurrentPage('dashboard');
    setSelectedFarm(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
        user={currentUser}
        notifications={notifications}
      />

      <div className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && (
          <Dashboard
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'tanks' && (
          <TankManagement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'accounting' && (
          <Accounting
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'inventory' && (
          <Inventory
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'analytics' && (
          <Analytics
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'ai-assistant' && (
          <AIAssistant user={currentUser} />
        )}
        {currentPage === 'health' && (
          <HealthLibrary
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'notifications' && (
          <NotificationCenter
            user={currentUser}
            notifications={notifications}
            onUpdateNotifications={setNotifications}
          />
        )}
        {currentPage === 'procurement' && (
          <Procurement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'sales' && (
          <SalesModule
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'fish-types' && (
          <FishTypeManagement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'food-types' && (
          <FoodTypeManagement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'harvest' && (
          <HarvestManagement
            farmId={selectedFarm?.id || 'farm-1'}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
}
