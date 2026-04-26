// @ts-nocheck
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Inventory from '../components/Inventory'; 
import * as inventoryApi from '../api/inventoryApi';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));
import { toast } from 'sonner';

vi.mock('../api/inventoryApi');
window.confirm = vi.fn();

describe('Inventory - Delete Feed Operation', () => {
  const mockUser = { id: '1', name: 'Test User' };
  const mockFarm = { id: 'farm1', name: 'Main Farm' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('يجب أن يتم استدعاء API المسح بنجاح', async () => {
    // 1. تجهيز الـ Mocks
    inventoryApi.getFeedInventory.mockResolvedValue([
      { id: 'feed-123', name: 'Protein Feed', quantityKg: 100, type: 'feed' }
    ]);
    inventoryApi.deleteFeed.mockResolvedValue({ success: true });
    window.confirm.mockReturnValue(true);

    render(<Inventory user={mockUser} selectedFarm={mockFarm} />);

    // 2. الضغط على التاب اللي فيها الـ Feed
    // إحنا هنبص على كل الزراير اللي "دورها" Tab ونختار اللي مكتوب عليها Feed
    const tabs = await screen.findAllByRole('tab');
    const feedTab = tabs.find(t => t.textContent.toLowerCase().includes('feed'));
    
    if (feedTab) {
      fireEvent.click(feedTab);
    } else {
      // لو ملهاش اسم واضح، جرب تدوس على التاب التالتة مثلاً (حسب ترتيب مشروعك)
      fireEvent.click(tabs[2]); 
    }

    // 3. استنى لحد ما زرار الـ Trash يظهر في الجدول
    const deleteBtn = await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      // بنبحث عن الأيقونة اللي فيها كلمة trash اللي جاية من مكتبة lucide
      const btn = buttons.find(b => b.innerHTML.includes('trash'));
      if (!btn) throw new Error('Button not found yet');
      return btn;
    }, { timeout: 4000 });

    // 4. دوس على الزرار
    fireEvent.click(deleteBtn);

    // 5. اتأكد إن الـ Confirm ظهرت والـ API اتنادى
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(inventoryApi.deleteFeed).toHaveBeenCalledWith('feed-123');
    });

    expect(toast.success).toHaveBeenCalled();
  });
});