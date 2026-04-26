// @ts-nocheck
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FoodTypeManagement from '../components/FoodTypeManagement'; 
import * as inventoryApi from '../api/inventoryApi';

vi.mock('../api/inventoryApi');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('Food Type Management - CRUD Operations', () => {
  const mockFoodTypes = [
    { id: '1', name: 'Protein 30%', description: 'High protein for fingerlings' },
    { id: '2', name: 'Growth Pellets', description: 'Standard growth feed' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('يجب عرض قائمة أنواع الأعلاف عند التحميل', async () => {
    (inventoryApi.getFoodTypes as any).mockResolvedValue(mockFoodTypes);

    render(<FoodTypeManagement />);

    await waitFor(() => {
      expect(screen.getByText('Protein 30%')).toBeInTheDocument();
      expect(screen.getByText('Growth Pellets')).toBeInTheDocument();
    });
  });

  test('يجب استدعاء الـ API عند إضافة نوع علف جديد', async () => {
    const newFood = { name: 'Starter Feed', description: 'Initial stage' };
    (inventoryApi.addFoodType as any).mockResolvedValue({ success: true, data: newFood });

    render(<FoodTypeManagement />);

    // محاكاة فتح المودال وكتابة البيانات
    const addBtn = screen.getByText(/Add New Type/i);
    fireEvent.click(addBtn);

    fireEvent.change(screen.getByPlaceholderText(/Enter name/i), { target: { value: newFood.name } });
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(inventoryApi.addFoodType).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Starter Feed'
      }));
    });
  });
});