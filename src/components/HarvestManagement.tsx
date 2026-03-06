import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Fish, 
  TrendingUp, 
  Target,
  Calendar,
  DollarSign,
  Activity,
  Award,
  AlertCircle,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { HarvestDashboard } from './harvest/HarvestDashboard';
import { StartHarvestWorkflow } from './harvest/StartHarvestWorkflow';
import { HarvestHistory } from './harvest/HarvestHistory';
import { TankHarvestPerformance } from './harvest/TankHarvestPerformance';

interface HarvestManagementProps {
  farmId: string;
}

export const HarvestManagement: React.FC<HarvestManagementProps> = ({ farmId }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'start' | 'history' | 'analytics'>('dashboard');
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);

  const handleStartHarvest = () => {
    setActiveView('start');
  };

  const handleViewHistory = () => {
    setActiveView('history');
  };

  const handleViewTankPerformance = (tankId: string) => {
    setSelectedTankId(tankId);
    setActiveView('analytics');
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
    setSelectedTankId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0A4D68] rounded-lg flex items-center justify-center">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Harvest Management</h1>
            <p className="text-sm text-gray-600">Complete harvest lifecycle management</p>
          </div>
        </div>

        {activeView === 'dashboard' && (
          <Button 
            onClick={handleStartHarvest}
            className="bg-[#0A4D68] hover:bg-[#0A4D68]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Harvest
          </Button>
        )}

        {activeView !== 'dashboard' && (
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
          >
            ← Back to Dashboard
          </Button>
        )}
      </div>

      {activeView === 'dashboard' && (
        <HarvestDashboard 
          farmId={farmId}
          onStartHarvest={handleStartHarvest}
          onViewHistory={handleViewHistory}
          onViewTankPerformance={handleViewTankPerformance}
        />
      )}

      {activeView === 'start' && (
        <StartHarvestWorkflow
          farmId={farmId}
          onComplete={handleBackToDashboard}
          onCancel={handleBackToDashboard}
        />
      )}

      {activeView === 'history' && (
        <HarvestHistory
          farmId={farmId}
          onViewTankPerformance={handleViewTankPerformance}
        />
      )}

      {activeView === 'analytics' && selectedTankId && (
        <TankHarvestPerformance
          tankId={selectedTankId}
          farmId={farmId}
        />
      )}
    </div>
  );
};
