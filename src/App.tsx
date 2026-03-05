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
import { User, Farm } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('fishfarm_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('fishfarm_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fishfarm_user');
    setCurrentPage('dashboard');
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
            onFarmSelect={setSelectedFarm}
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
    </div>
  );
}