// @ts-nocheck
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard'; 
import * as api from '../api';

// Mock للـ API والـ Sonner
vi.mock('../api');
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

describe('Dashboard - Initial Data Loading', () => {
  const mockUser = { id: '1', name: 'Ziad Abdalla', role: 'manager' };
  const mockFarm = { id: 'farm1', name: 'Main Fish Farm' };

  const mockDashData = {
    fishSummary: {
      totalActiveFish: "10,449", // باعتينها String فيه فاصلة زي الـ API بتاعك
      totalBiomassKg: 437.5,
      activeTanks: 5
    },
    predictedRevenue: {
      totalProjectedRevenue: 1027685,
      nextHarvestDateFormatted: '2026-05-20'
    },
    feedStock: { totalStockKg: 21181 },
    waterQualityAlerts: [],
    upcomingHarvests: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('يجب أن تعرض الكروت الأرقام الصحيحة القادمة من الـ API', async () => {
    // محاكاة رد الـ API
    (api.apiGet as any).mockImplementation((url: string) => {
      if (url === '/dashboard') return Promise.resolve({ data: mockDashData });
      if (url === '/tanks') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Unknown API'));
    });

    render(<Dashboard user={mockUser} selectedFarm={mockFarm} />);

    // 1. التأكد من ظهور "إجمالي عدد السمك" (بعد تحويل الـ String لرقم بفاصلة)
    await waitFor(() => {
      expect(screen.getByText('10,449')).toBeInTheDocument();
    });

    // 2. التأكد من ظهور الـ Biomass
    expect(screen.getByText('437.5 kg')).toBeInTheDocument();

    // 3. التأكد من ظهور الـ Revenue المتوقع
    // إحنا بنستخدم toLocaleString في الكود بتاعك، فالاختبار هيلاقي الرقم متقسم بفاصلة
    expect(screen.getByText(/1,027,685/)).toBeInTheDocument();

    // 4. التأكد من ظهور عدد الأحواض (Tanks)
    expect(screen.getByText('Across 5 tanks')).toBeInTheDocument();
  });
});