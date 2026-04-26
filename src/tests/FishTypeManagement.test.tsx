// @ts-nocheck
import { render, screen, waitFor } from '@testing-library/react';
import FishTypeManagementEnhanced from './FishTypeManagementEnhanced';
import * as api from '../services/fishTypesApi'; // تأكد من المسار

// Mock للـ API والـ Sonner (لو بتستخدمها للـ Alerts)
jest.mock('../services/fishTypesApi');
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

describe('Fish Type Management - Initial Data Loading', () => {
  const mockUser = { id: '1', name: 'Test User', role: 'manager' };
  const mockFarm = { id: 'farm1', name: 'Main Fish Farm' };

  // بيانات وهمية بنفس شكل الـ Schema اللي الـ Component مستنيها
  const mockFishTypes = [
    { 
      id: '1', 
      name: 'Nile Tilapia', 
      scientificName: 'Oreochromis niloticus', 
      arabicName: 'البلطي النيلي',
      isActive: true,
      tempMin: 18,
      tempMax: 32,
      doSafe: 5,
      fcrMin: 1.2,
      fcrMax: 1.8,
      survivalRate: 90
    },
    { 
      id: '2', 
      name: 'European Sea Bass', 
      scientificName: 'Dicentrarchus labrax', 
      arabicName: 'القاروص',
      isActive: true,
      tempMin: 20,
      tempMax: 30,
      doSafe: 6,
      fcrMin: 1.2,
      fcrMax: 1.6,
      survivalRate: 80
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('يجب أن يعرض كروت أنواع الأسماك بالبيانات الصحيحة من الـ API', async () => {
    // محاكاة رد الـ API (استخدام GetFishTypes)
    (api.getFishTypes as jest.Mock).mockResolvedValue(mockFishTypes);

    render(<FishTypeManagementEnhanced user={mockUser} selectedFarm={mockFarm} />);

    // 1. التأكد من ظهور حالة التحميل أولاً (لو موجودة في الـ UI بتاعك)
    // expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // 2. التأكد من ظهور أسماء الأسماك (العربي والإنجليزي) بعد انتهاء التحميل
    await waitFor(() => {
      expect(screen.getByText('Nile Tilapia')).toBeInTheDocument();
      expect(screen.getByText('البلطي النيلي')).toBeInTheDocument();
    });

    // 3. التأكد من ظهور المعايير الفنية (الـ Parameters)
    expect(screen.getByText(/18 - 32 °C/)).toBeInTheDocument();
    expect(screen.getByText(/DO Safe: 5 mg\/L/)).toBeInTheDocument();

    // 4. التأكد من ظهور السمكة الثانية
    expect(screen.getByText('European Sea Bass')).toBeInTheDocument();
    expect(screen.getByText('القاروص')).toBeInTheDocument();
  });

  test('يجب أن يظهر "No food types assigned" في حالة عدم وجود أنواع طعام', async () => {
    (api.getFishTypes as jest.Mock).mockResolvedValue([mockFishTypes[0]]);

    render(<FishTypeManagementEnhanced user={mockUser} selectedFarm={mockFarm} />);

    await waitFor(() => {
      expect(screen.getByText(/No food types assigned/i)).toBeInTheDocument();
    });
  });
});