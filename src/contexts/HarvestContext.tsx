import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HarvestEvent, HarvestGrading, HarvestPrediction, HarvestedInventory } from '../types';

interface HarvestContextType {
  harvests: HarvestEvent[];
  gradings: HarvestGrading[];
  predictions: HarvestPrediction[];
  harvestedInventory: HarvestedInventory[];
  addHarvest: (harvest: HarvestEvent) => void;
  updateHarvest: (id: string, harvest: Partial<HarvestEvent>) => void;
  deleteHarvest: (id: string) => void;
  addGrading: (grading: HarvestGrading) => void;
  updateGrading: (id: string, grading: Partial<HarvestGrading>) => void;
  deleteGrading: (id: string) => void;
  getHarvestById: (id: string) => HarvestEvent | undefined;
  getGradingsByHarvestId: (harvestId: string) => HarvestGrading[];
  completeHarvest: (harvestId: string) => void;
}

const HarvestContext = createContext<HarvestContextType | undefined>(undefined);

export const useHarvest = () => {
  const context = useContext(HarvestContext);
  if (!context) {
    throw new Error('useHarvest must be used within HarvestProvider');
  }
  return context;
};

interface HarvestProviderProps {
  children: ReactNode;
}

export const HarvestProvider: React.FC<HarvestProviderProps> = ({ children }) => {
  const [harvests, setHarvests] = useState<HarvestEvent[]>([]);
  const [gradings, setGradings] = useState<HarvestGrading[]>([]);
  const [predictions] = useState<HarvestPrediction[]>([]);
  const [harvestedInventory] = useState<HarvestedInventory[]>([]);

  const addHarvest = (harvest: HarvestEvent) => {
    setHarvests(prev => [...prev, harvest]);
  };

  const updateHarvest = (id: string, updates: Partial<HarvestEvent>) => {
    setHarvests(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHarvest = (id: string) => {
    setHarvests(prev => prev.filter(h => h.id !== id));
    setGradings(prev => prev.filter(g => g.harvestEventId !== id));
  };

  const addGrading = (grading: HarvestGrading) => {
    setGradings(prev => [...prev, grading]);
  };

  const updateGrading = (id: string, updates: Partial<HarvestGrading>) => {
    setGradings(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGrading = (id: string) => {
    setGradings(prev => prev.filter(g => g.id !== id));
  };

  const getHarvestById = (id: string) => {
    return harvests.find(h => h.id === id);
  };

  const getGradingsByHarvestId = (harvestId: string) => {
    return gradings.filter(g => g.harvestEventId === harvestId);
  };

  const completeHarvest = (harvestId: string) => {
    const harvest = getHarvestById(harvestId);
    if (!harvest) return;

    const harvestGradings = getGradingsByHarvestId(harvestId);
    const actualWeight = harvestGradings.reduce((sum, g) => sum + g.weightKg, 0);
    const totalRevenue = harvestGradings.reduce((sum, g) => sum + g.totalValue, 0);
    
    const totalCosts = (harvest.productionCosts || 0) + 
                      ((harvest.costs?.laborCost || 0) +
                       (harvest.costs?.transportCost || 0) +
                       (harvest.costs?.packagingCost || 0) +
                       (harvest.costs?.iceCost || 0) +
                       (harvest.costs?.otherCost || 0));

    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    updateHarvest(harvestId, {
      status: 'COMPLETED',
      actualWeight,
      totalRevenue,
      totalCosts,
      netProfit,
      profitMargin,
      completedAt: new Date().toISOString()
    });
  };

  const value: HarvestContextType = {
    harvests,
    gradings,
    predictions,
    harvestedInventory,
    addHarvest,
    updateHarvest,
    deleteHarvest,
    addGrading,
    updateGrading,
    deleteGrading,
    getHarvestById,
    getGradingsByHarvestId,
    completeHarvest
  };

  return (
    <HarvestContext.Provider value={value}>
      {children}
    </HarvestContext.Provider>
  );
};
