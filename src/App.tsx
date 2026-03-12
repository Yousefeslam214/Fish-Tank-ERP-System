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
import { mockFarms } from './mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  useEffect(() => {
    const user = getStoredAppUser();
    if (user) {
      setCurrentUser(user);
      fetchFarms(user);
    }
  }, []);

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
          <NotificationCenter user={currentUser} />
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
