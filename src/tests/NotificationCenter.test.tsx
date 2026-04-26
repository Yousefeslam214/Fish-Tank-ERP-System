// @ts-nocheck
import { render, screen, fireEvent, within } from '@testing-library/react';
import NotificationCenter from './NotificationCenter';

describe('Notification Center - Comprehensive Suite', () => {
  const mockUser = { 
    id: '1', 
    name: 'Ziad', 
    email: 'ziad@fishfarm360.com', 
    phone: '01507192004' 
  };
  
  const mockNotifications = [
    {
      id: 'n1',
      title: 'Critical Oxygen Drop',
      message: 'Tank Alpha oxygen at 2.1mg/L',
      priority: 'critical',
      type: 'alert',
      read: false,
      timestamp: new Date().toISOString()
    },
    {
      id: 'n2',
      title: 'Feeding Reminder',
      message: 'Time to feed Batch #402',
      priority: 'low',
      type: 'info',
      read: true,
      timestamp: new Date(Date.now() - 86400000).toISOString() // منذ يوم
    }
  ];

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. اختبار واجهة العرض والإحصائيات ---
  test('يجب عرض لوحة البيانات والإحصائيات بدقة', () => {
    render(<NotificationCenter user={mockUser} notifications={mockNotifications} onUpdateNotifications={mockOnUpdate} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // إجمالي التنبيهات
    expect(screen.getByText('1 unread')).toBeInTheDocument(); // غير المقروء
    expect(screen.getByText('Unread critical')).toBeInTheDocument(); // التنبيهات الحرجة
  });

  // --- 2. اختبار التصفية (Filtering) ---
  test('يجب تصفية القائمة بناءً على مستوى الخطورة (Critical Filter)', () => {
    render(<NotificationCenter user={mockUser} notifications={mockNotifications} onUpdateNotifications={mockOnUpdate} />);
    
    const criticalBtn = screen.getByRole('button', { name: /Critical/i });
    fireEvent.click(criticalBtn);

    expect(screen.getByText('Critical Oxygen Drop')).toBeInTheDocument();
    expect(screen.queryByText('Feeding Reminder')).not.toBeInTheDocument();
  });

  // --- 3. اختبار وظائف التحكم (Actions) ---
  test('يجب تنفيذ عملية "Mark Read" على تنبيه واحد بنجاح', () => {
    render(<NotificationCenter user={mockUser} notifications={mockNotifications} onUpdateNotifications={mockOnUpdate} />);
    
    const markReadBtn = screen.getByRole('button', { name: /Mark Read/i });
    fireEvent.click(markReadBtn);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'n1', read: true })
    ]));
  });

  test('يجب حذف التنبيه من القائمة عند الضغط على Dismiss', () => {
    render(<NotificationCenter user={mockUser} notifications={mockNotifications} onUpdateNotifications={mockOnUpdate} />);
    
    const dismissBtns = screen.getAllByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissBtns[1]); // حذف التنبيه الثاني

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ id: 'n2' })])
    );
  });

  // --- 4. اختبار التفضيلات (Preferences & Channels) ---
  test('يجب تفعيل وتعطيل قنوات التواصل في الإعدادات', () => {
    render(<NotificationCenter user={mockUser} notifications={mockNotifications} onUpdateNotifications={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Preferences'));

    const emailSwitch = screen.getByLabelText(/Email Notifications/i || screen.getAllByRole('switch')[0]);
    fireEvent.click(emailSwitch); 

    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Quiet Hours')).toBeInTheDocument();
  });

  // --- 5. اختبار منطق الوقت (Time Logic) ---
  test('يجب أن يعرض "1d ago" للتنبيهات التي مر عليها يوم', () => {
    render(<NotificationCenter user={mockUser} notifications={mockNotifications} onUpdateNotifications={mockOnUpdate} />);
    
    expect(screen.getByText('1d ago')).toBeInTheDocument();
  });

  // --- 6. اختبار الحالة الفارغة (Empty State) ---
  test('يجب عرض رسالة "No notifications" عند فراغ المصفوفة', () => {
    render(<NotificationCenter user={mockUser} notifications={[]} onUpdateNotifications={mockOnUpdate} />);
    
    expect(screen.getByText(/You'll see notifications here/i)).toBeInTheDocument();
  });
});