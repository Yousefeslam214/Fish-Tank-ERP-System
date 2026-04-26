// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FoodTypeManagement from './FoodTypeManagement';
import * as api from '../api';

// Mock للـ API والـ Sonner للتنبيهات
jest.mock('../api');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

describe('Food Type Management - Full Functional Test', () => {
  const mockUser = { id: '1', name: 'Ziad', role: 'manager' };
  const mockFarm = { id: 'farm1', name: 'Main Fish Farm' };

  // بيانات وهمية تحاكي الصور المرفقة (Grand 25%, 32%, etc.)
  const mockFoodTypes = [
    {
      id: 'food1',
      name: 'Grand 25%',
      arabicName: 'جراند 25%',
      proteinPercentage: 25,
      pelletSizeMm: 3,
      buoyancyType: 'FLOATING',
      lowStockThreshold: 100
    },
    {
      id: 'food2',
      name: 'Grand 32%',
      arabicName: 'جراند 32%',
      proteinPercentage: 32,
      pelletSizeMm: 2,
      buoyancyType: 'FLOATING',
      lowStockThreshold: 100
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // محاكاة استرجاع البيانات بنجاح عند كل رندر
    (api.apiGet as jest.Mock).mockResolvedValue(mockFoodTypes);
  });

  test('يجب أن يعرض قائمة المنتجات ببياناتها الصحيحة وتنبيهات المخزون', async () => {
    render(<FoodTypeManagement user={mockUser} selectedFarm={mockFarm} />);

    // التأكد من ظهور الكروت بأسماء المنتجات
    await waitFor(() => {
      expect(screen.getByText('Grand 25%')).toBeInTheDocument();
      expect(screen.getByText('جراند 32%')).toBeInTheDocument();
    });

    // التأكد من ظهور تفاصيل المكونات (Protein & Size)
    expect(screen.getByText('25% Protein')).toBeInTheDocument();
    expect(screen.getByText('3mm')).toBeInTheDocument();

    // التأكد من ظهور الـ Badge الخاص بحد الطلب (Low Stock Threshold)
    const stockAlerts = screen.getAllByText('100 kg');
    expect(stockAlerts.length).toBeGreaterThan(0);
  });

  test('يجب فتح Modal الإضافة عند الضغط على Add Food Type', async () => {
    render(<FoodTypeManagement user={mockUser} selectedFarm={mockFarm} />);
    
    const addButton = screen.getByText(/Add Food Type/i);
    fireEvent.click(addButton);

    // التأكد من ظهور حقول الإدخال في الـ Dialog
    expect(screen.getByPlaceholderText(/English Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory Settings/i)).toBeInTheDocument();
  });

  test('يجب محاكاة عملية مسح منتج بنجاح', async () => {
    (api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
    
    render(<FoodTypeManagement user={mockUser} selectedFarm={mockFarm} />);

    await waitFor(() => screen.getByText('Grand 25%'));

    // الضغط على أيقونة المسح (بناءً على الكود بنبحث بالـ Trash icon)
    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-trash2'));
    fireEvent.click(deleteButtons[0]);

    // التأكد من ظهور رسالة التأكيد (AlertDialog)
    expect(screen.getByText(/Delete Product?/i)).toBeInTheDocument();
    
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.apiDelete).toHaveBeenCalledWith(expect.stringContaining('/aquaculture/food-types/'));
    });
  });

  test('يجب إظهار حالة فارغة عند عدم وجود بيانات', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    render(<FoodTypeManagement user={mockUser} selectedFarm={mockFarm} />);

    await waitFor(() => {
      expect(screen.getByText(/No feed types registered yet/i)).toBeInTheDocument();
    });
  });
});