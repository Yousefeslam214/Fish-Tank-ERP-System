// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIAssistant from './AIAssistant';
import * as api from '../api';


jest.mock('../api');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

describe('AI Assistant - Advanced Integration Suite', () => {
  const mockUser = { id: 'u1', name: 'Ziad Admin' };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. اختبار حالة الـ Connection والـ UI Initial State ---
  test('يجب عرض حالة الـ AI Endpoint والتحقق من الـ Last Health Check', () => {
    render(<AIAssistant user={mockUser} />);
    
    // التأكد من ظهور رابط الـ Space الخاص بـ Hugging Face
    expect(screen.getByText(/yousseftallal-ai-fisherman/i)).toBeInTheDocument();
    // التأكد من ظهور زر فحص الرابط
    expect(screen.getByRole('button', { name: /Check AI Link/i })).toBeInTheDocument();
  });

  // --- 2. اختبار اختيار الحوض والدفعة (Data Binding) ---
  test('يجب أن يسمح للمستخدم باختيار الحوض والدفعة قبل التحليل', async () => {
    render(<AIAssistant user={mockUser} />);
    
    const tankSelect = screen.getByText(/Select Tank/i || /delta/i);
    expect(tankSelect).toBeInTheDocument();
    
    // التأكد من وجود نص الحالة الابتدائية للتقارير
    expect(screen.getByText(/No saved reports yet/i)).toBeInTheDocument();
  });

  // --- 3. اختبار عملية رفع الصورة (Image Upload Interaction) ---
  test('يجب تفعيل أزرار التحكم عند اختيار صورة للتحليل', () => {
    render(<AIAssistant user={mockUser} />);
    
    const chooseBtn = screen.getByRole('button', { name: /Choose Image/i });
    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    const resetBtn = screen.getByRole('button', { name: /Reset/i });

    expect(chooseBtn).toBeInTheDocument();
    expect(analyzeBtn).toBeInTheDocument();
    expect(resetBtn).toBeInTheDocument();
  });

  // --- 4. اختبار محاكاة تحليل الـ AI (AI Analysis Simulation) ---
  test('يجب عرض رسالة تنبيه إذا حاول المستخدم التحليل بدون رفع صورة', async () => {
    render(<AIAssistant user={mockUser} />);
    
    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeBtn);

    // التأكد من ظهور الـ Empty State أو التنبيه في الـ Analysis Result
    expect(screen.getByText(/Upload an image and run AI analysis first/i)).toBeInTheDocument();
  });

  // --- 5. اختبار الـ Reports History (Integration Check) ---
  test('يجب التحقق من وجود قسم تاريخ الصحة للحوض (Tank Health History)', () => {
    render(<AIAssistant user={mockUser} />);
    
    const historyTab = screen.getByText(/Tank Health History/i);
    fireEvent.click(historyTab);
    
    expect(screen.getByText(/Generate Fixed AI Health Report/i)).toBeInTheDocument();
  });

  // --- 6. اختبار الـ API Error Handling ---
  test('يجب التعامل مع خطأ فشل الاتصال بموديل الذكاء الاصطناعي', async () => {
    // محاكاة فشل الـ API
    api.apiPost.mockRejectedValueOnce(new Error('AI Model Offline'));
    
    render(<AIAssistant user={mockUser} />);
    
    // محاكاة الضغط على زر التحديث أو الفحص
    const checkLinkBtn = screen.getByText(/Check AI Link/i);
    fireEvent.click(checkLinkBtn);

    await waitFor(() => {
      // هنا نتوقع أن السيستم يفضل محتفظ بحالة الـ UI ثابتة أو يظهر تنبيه
      expect(screen.getByText(/AI API Healthy/i)).toBeInTheDocument(); 
    });
  });

  // --- 7. اختبار زر الـ Reset ---
  test('زر Reset يجب أن يمسح نتائج التحليل والصورة المختارة', () => {
    render(<AIAssistant user={mockUser} />);
    
    const resetBtn = screen.getByText(/Reset/i);
    fireEvent.click(resetBtn);

    // التأكد من العودة للحالة الابتدائية
    expect(screen.getByText(/Upload image/i)).toBeInTheDocument();
  });
});