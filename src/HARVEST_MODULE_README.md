# Harvest Module - Complete Implementation

## Overview
وحدة الحصاد الشاملة (Harvest Module) هي نظام متكامل لإدارة دورة الحصاد الكاملة من التنبؤ إلى الإكمال، مع التدريج، إنشاء المخزون، ولوحات التحليلات.

## Features Implemented

### 1. Harvest Dashboard (لوحة تحكم الحصاد)
- **KPI Cards**: عرض مؤشرات الأداء الرئيسية
  - الحصادات النشطة
  - الكمية المحصودة هذا الشهر
  - متوسط FCR
  - الأحواض الجاهزة للحصاد
  - متوسط معدل البقاء
  - التوصية التالية

- **Active Harvests List**: قائمة الحصادات النشطة مع:
  - معلومات الحوض والدفعة
  - نوع الحصاد (Full/Partial/Selective)
  - شريط التقدم
  - الوزن المدرج vs المقدر
  - زر المتابعة

- **Completed Harvests**: الحصادات المكتملة مع ملخص سريع

### 2. Start Harvest Workflow (سير عمل بدء الحصاد)
نموذج متعدد الخطوات يتضمن 4 مراحل:

#### Step 1: Harvest Details (تفاصيل الحصاد)
- اختيار الحوض والدفعة
- نوع الحصاد:
  - **Full Harvest**: حصاد كامل (100%)
  - **Partial Harvest**: حصاد جزئي مع slider لتحديد النسبة
  - **Selective Harvest**: حصاد انتقائي (الأسماك الكبيرة فقط)
- التاريخ والوقت
- الوزن المقدر (تلقائي)
- فحص الطقس
- ملاحظات إضافية

#### Step 2: Grading Interface (واجهة التدريج)
- **Progress Bar**: شريط تقدم يعرض الكمية المدرجة vs المقدرة
- **Grade Selection Cards**: بطاقات اختيار الدرجات:
  - Super (⭐): 300-500g @ 50 EGP/kg
  - Grade 1 (🔵): 200-300g @ 45 EGP/kg
  - Grade 2 (🟠): 150-200g @ 40 EGP/kg
  - Sherr (🔴): <150g @ 30 EGP/kg
  - Waste (⚠️): 0 EGP/kg

- **Weight Entry**: إدخال الوزن مع حساب تلقائي للقيمة
- **Condition Selection**: اختيار حالة الأسماك (Excellent/Good/Fair/Poor)
- **Notes**: ملاحظات اختيارية
- **Recorded Grades List**: قائمة بالدرجات المسجلة مع إمكانية الحذف
- **Auto-save**: حفظ تلقائي كل 30 ثانية

#### Step 3: Review & Complete (المراجعة والإكمال)
- **Harvest Summary**: ملخص الحصاد
  - المعلومات الأساسية
  - الوزن المقدر vs الفعلي
  - نسبة الدقة

- **Grade Distribution**: توزيع الدرجات
  - رسم بياني شريطي أفقي
  - مقارنة مع المتوقع (species average)
  - تحليل الفروقات

- **Financial Performance**: الأداء المالي
  - إجمالي الإيرادات
  - تكاليف الإنتاج (علف، تشغيل، زريعة)
  - تكاليف الحصاد (عمالة، نقل، تغليف، ثلج، أخرى)
  - صافي الربح وهامش الربح
  - التكلفة والإيراد والربح لكل كيلوجرام
  - FCR

- **Batch Impact**: تأثير على الدفعة
  - الحالة قبل وبعد الحصاد
  - الأسماك والكتلة الحيوية المتبقية
  - حالة الدفعة الجديدة

- **Next Steps Checklist**: قائمة الخطوات التالية
  - إنشاء lots المخزون
  - أرقام اللوت التلقائية
  - نوع التخزين وتاريخ الانتهاء
  - القيود المحاسبية

- **Validation & Warnings**: التحقق والتحذيرات
  - تحذير إذا هامش الربح < 15%
  - تحذير إذا الفرق عن المقدر > 20%

#### Step 4: Completion Confirmation (تأكيد الإكمال)
- **Success Message**: رسالة نجاح مع رقم الحصاد
- **Completion Checklist**: قائمة بما تم إنجازه
- **Inventory Created**: قائمة lots المخزون المنشأة
- **Quick Actions**: إجراءات سريعة
  - عرض المخزون
  - إنشاء طلب بيع
  - عرض التحليلات
  - طباعة التقرير
  - إرسال بالبريد الإلكتروني
  - مشاركة QR codes

- **Summary Stats**: إحصائيات ملخصة

### 3. Harvest History & Analytics (تاريخ الحصاد والتحليلات)
- **Filters**: فلاتر بالفترة الزمنية ونوع السمك
- **KPIs**: مؤشرات الأداء
  - إجمالي المحصود
  - متوسط هامش الربح
  - متوسط FCR
  - إجمالي الإيرادات
  - متوسط معدل البقاء
  - أفضل أداء

- **Grade Distribution Trends**: اتجاهات توزيع الدرجات
  - رسم بياني خطي للاتجاهات
  - مؤشرات الارتفاع/الانخفاض
  - Insights ذكية

- **Revenue by Grade**: الإيرادات حسب الدرجة
  - رسم بياني شريطي أفقي مكدس

- **Recent Harvests Table**: جدول الحصادات الأخيرة
  - قابل للفرز والبحث

- **Performance Alerts**: تنبيهات الأداء
  - تحذيرات FCR المرتفع
  - تهاني للأداء الممتاز

### 4. Tank Harvest Performance (أداء حصاد الحوض)
- **Tank Overview**: نظرة عامة على الحوض
  - الحجم
  - عدد الحصادات
  - الإنتاج مدى الحياة
  - الإيرادات مدى الحياة

- **Performance Metrics**: مقاييس الأداء
  - متوسط FCR
  - متوسط البقاء
  - متوسط دورة النمو

- **Harvest Timeline**: خط زمني للحصادات
  - تصور بصري للحصادات
  - تفاصيل كل حصاد

- **Grade Distribution Comparison**: مقارنة توزيع الدرجات
  - جدول مقارنة عبر الحصادات
  - مؤشرات الاتجاه

- **Insights**: رؤى ذكية
  - تحليل الاتجاهات
  - توصيات

- **Full Harvest History Table**: جدول تاريخ الحصاد الكامل
  - قابل للتصدير (CSV)

## Components Created

### Main Components
1. `HarvestManagement.tsx` - المكون الرئيسي
2. `HarvestDashboard.tsx` - لوحة التحكم
3. `StartHarvestWorkflow.tsx` - سير عمل بدء الحصاد
4. `HarvestHistory.tsx` - تاريخ الحصاد والتحليلات
5. `TankHarvestPerformance.tsx` - أداء حصاد الحوض

### Workflow Steps
1. `HarvestDetailsStep.tsx` - خطوة التفاصيل
2. `HarvestGradingStep.tsx` - خطوة التدريج
3. `HarvestReviewStep.tsx` - خطوة المراجعة
4. `HarvestCompletionStep.tsx` - خطوة التأكيد

### Shared Components
1. `GradeCard.tsx` - بطاقة الدرجة
2. `HarvestProgressBar.tsx` - شريط تقدم الحصاد
3. `FinancialSummaryCard.tsx` - بطاقة الملخص المالي
4. `GradeDistributionChart.tsx` - رسم بياني توزيع الدرجات

### Context
1. `HarvestContext.tsx` - إدارة حالة الحصاد

### Types
تم تحديث `types.ts` بـ:
- `HarvestType`: 'FULL' | 'PARTIAL' | 'SELECTIVE'
- `HarvestStatus`: 'DRAFT' | 'GRADING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED'
- `HarvestCondition`: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
- `GradeType`: 'SUPER' | 'GRADE_1' | 'GRADE_2' | 'SHERR' | 'WASTE'
- `HarvestCosts`: تفاصيل تكاليف الحصاد
- `HarvestEvent`: تحديث شامل
- `HarvestGrading`: تحديث شامل
- `FishGradePricing`: إضافة gradeType و color و icon

## Design System

### Colors
- **Harvest Status**:
  - DRAFT: #3B82F6 (Blue)
  - COMPLETED: #10B981 (Green)
  - CANCELLED: #6B7280 (Gray)

- **Harvest Types**:
  - FULL: #8B5CF6 (Purple) 🟣
  - PARTIAL: #F59E0B (Orange) 🟠
  - SELECTIVE: #EC4899 (Pink) 🩷

- **Grade Quality**:
  - Super: #10B981 (Green) ⭐
  - Grade 1: #3B82F6 (Blue) 🔵
  - Grade 2: #F59E0B (Orange) 🟠
  - Sherr: #EF4444 (Red) 🔴
  - Waste: #DC2626 (Dark Red) ⚠️

- **Alerts**:
  - Positive: #10B981 (Green)
  - Warning: #F59E0B (Yellow)
  - Loss: #EF4444 (Red)

### Icons
- استخدام Lucide React للأيقونات
- استخدام Emojis للتصنيفات والحالات

## Data Flow

1. **Start Harvest**: المستخدم يبدأ حصاد جديد
2. **Enter Details**: إدخال تفاصيل الحصاد ونوعه
3. **Grade Fish**: تدريج الأسماك مع تسجيل الأوزان
4. **Review**: مراجعة البيانات وإدخال التكاليف
5. **Complete**: إكمال الحصاد وإنشاء المخزون
6. **Inventory Created**: إنشاء lots المخزون تلقائياً
7. **Available for Sales**: المنتجات متاحة للبيع فوراً

## Integration Points

### مع Inventory Module
- إنشاء `HarvestedInventory` تلقائياً عند إكمال الحصاد
- ربط كل lot بـ tankId و harvestEventId
- تتبع القدرة البيعية

### مع Sales Module
- المنتجات المحصودة متاحة فوراً في Sales Orders
- عرض Tank name في كل line item
- تتبع أصل كل منتج مباع

### مع Tank Management
- تحديث حالة الدفعة (Batch Status)
- تحديث الكتلة الحيوية (Biomass)
- تحديث عدد الأسماك
- حساب FCR و Survival Rate

### مع Accounting
- إنشاء قيود محاسبية تلقائياً
- تسجيل الإيرادات والتكاليف
- حساب الأرباح

## Mobile Optimization

### Grading Interface
- تصميم Portrait Mode الأساسي
- بطاقات الدرجات بحجم 120×120px كحد أدنى
- إدخال الوزن بحجم كبير (64px height)
- لوحة مفاتيح رقمية أصلية
- عمليات بيد واحدة
- دعم الوضع الأفقي
- إمكانية العمل بدون اتصال (Offline)
- مزامنة تلقائية عند الاتصال

### Accessibility
- وضع التباين العالي للاستخدام الخارجي
- خطوط كبيرة (16px min body, 24px inputs)
- إدخال صوتي للعمل بدون استخدام اليدين
- متوافق مع قارئ الشاشة

## Future Enhancements

1. **Harvest Prediction AI**
   - التنبؤ بأفضل وقت للحصاد
   - تحليل السعر والطلب
   - تقدير توزيع الدرجات
   - حساب الربحية المتوقعة

2. **QR Code Traceability**
   - إنشاء QR codes لكل lot
   - تتبع كامل من الزريعة للمستهلك
   - معلومات الشهادات والجودة

3. **Weather Integration**
   - جلب بيانات الطقس الفعلية
   - توصيات بناءً على الطقس
   - تنبيهات الظروف غير المناسبة

4. **Advanced Analytics**
   - تحليل الموسمية
   - مقارنة الأداء عبر المزارع
   - Benchmarking ضد معايير الصناعة
   - تحليل الاتجاهات طويلة المدى

5. **Integration with Scales**
   - ربط مع موازين إلكترونية
   - قراءة تلقائية للأوزان
   - تقليل الأخطاء البشرية

## Usage

### للوصول للوحدة:
1. تسجيل الدخول للنظام
2. الضغط على "Harvest" في القائمة الجانبية
3. عرض لوحة التحكم الرئيسية

### لبدء حصاد جديد:
1. الضغط على "Start New Harvest"
2. اختيار الحوض والدفعة
3. تحديد نوع الحصاد
4. تدريج الأسماك
5. مراجعة وإدخال التكاليف
6. إكمال الحصاد

### لعرض التحليلات:
1. الضغط على "View History" أو اختيار "Analytics" من القائمة
2. استخدام الفلاتر لتحديد الفترة
3. عرض الاتجاهات والرؤى
4. الضغط على أي tank لعرض أداءه المفصل

## Notes

- جميع البيانات حالياً mock data للعرض التوضيحي
- في التطبيق الحقيقي، سيتم استبدال البيانات بـ API calls فعلية
- التصميم responsive ويعمل على جميع أحجام الشاشات
- الواجهة مُحسّنة للاستخدام الميداني
- دعم RTL جاهز للغة العربية (يحتاج تفعيل)

## Color Scheme
- Primary: #0A4D68 (Ocean Blue)
- Secondary: #088395 (Teal)
- Success: #10B981 (Green)
- Warning: #F59E0B (Orange/Amber)
- Error: #EF4444 (Red)
- Background: #F9FAFB (Light Gray)

---

تم تنفيذ الوحدة بالكامل وفقاً للتصميم المفصل في `/imports/harvest-design-overview.md`. جميع الشاشات الـ8 والميزات المطلوبة موجودة ووظيفية.
