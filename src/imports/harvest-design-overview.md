DESIGN OVERVIEW
Create a comprehensive, production-ready Figma design for the Harvest Module that manages the complete harvest lifecycle from prediction to completion, including grading, inventory creation, and analytics dashboards.
Target Users: Farm Managers, Harvest Supervisors, Accountants
Key Principles:

Data-dense but scannable
Multi-step workflows with clear progress
Real-time validation and feedback
Mobile-responsive for field operations
Traceability at every step


SCREEN HIERARCHY
1. Harvest Dashboard (Overview)
2. Harvest Prediction (Planning)
3. Active Harvests List
4. Start Harvest Workflow (Multi-step)
5. Harvest Grading Interface (Field Entry)
6. Complete Harvest Review
7. Harvest History & Analytics
8. Tank Harvest Performance
9. Grade Distribution Reports
10. Cost Analysis Dashboard

COLOR SYSTEM
Harvest Status Colors
DRAFT (In Progress): #3B82F6 (Blue)
COMPLETED: #10B981 (Green)
CANCELLED: #6B7280 (Gray)

Harvest Types:
FULL: #8B5CF6 (Purple)
PARTIAL: #F59E0B (Orange)
SELECTIVE: #EC4899 (Pink)
Grade Quality Indicators
Super Grade: #10B981 (Green) with gold star ⭐
Grade 1: #3B82F6 (Blue)
Grade 2: #F59E0B (Orange)
Sherr/Small: #EF4444 (Red)
Waste: #DC2626 (Dark Red) with ⚠️
Alert System
Recommendation Positive: #10B981 (Green)
Warning: #F59E0B (Yellow)
Loss Alert: #EF4444 (Red)

SCREEN 1: HARVEST DASHBOARD
Layout: Grid with KPI Cards + Active Harvests Table
┌─────────────────────────────────────────────────────────────────┐
│  🎣 Harvest Management                    [+ Start New Harvest] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐        │
│  │ Active        │ │ This Month    │ │ Avg FCR       │        │
│  │ Harvests      │ │ Harvested     │ │ (Last 3)      │        │
│  │               │ │               │ │               │        │
│  │   3 🔵       │ │  2,450 kg     │ │   1.65        │        │
│  │ In Progress   │ │  Value:       │ │ ⭐ Excellent  │        │
│  │               │ │  110,250 EGP  │ │               │        │
│  └───────────────┘ └───────────────┘ └───────────────┘        │
│                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐        │
│  │ Ready to      │ │ Avg Survival  │ │ Next          │        │
│  │ Harvest       │ │ Rate          │ │ Recommended   │        │
│  │               │ │               │ │               │        │
│  │  🟢 5 Tanks  │ │   92.5%       │ │ Tank A-03     │        │
│  │ >400g avg     │ │ Last 10       │ │ In 5 days     │        │
│  │ [View List]   │ │               │ │ [Predict]     │        │
│  └───────────────┘ └───────────────┘ └───────────────┘        │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Active Harvests                        [Filter ▼] [Search 🔍]│
│  ┌───────────────────────────────────────────────────────────┐│
│  │ Tank    Batch   Type    Started      Progress   Actions   ││
│  ├───────────────────────────────────────────────────────────┤│
│  │ A-03   #123   FULL🟣  2hr ago      Grading    [Continue] ││
│  │ 850 fish • 420g avg • Est: 357kg                          ││
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 65% Complete          ││
│  │ Graded: 232kg of 357kg estimated                          ││
│  │                                                            ││
│  │ B-05   #145   PARTIAL🟠  45min ago  Draft     [Continue] ││
│  │ 1200 fish (50%) • 380g avg • Est: 228kg                   ││
│  │ ━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░ 35% Complete          ││
│  │ Graded: 80kg of 228kg estimated                           ││
│  │                                                            ││
│  │ C-02   #178   SELECTIVE🩷  3hr ago  Grading    [Continue] ││
│  │ Large fish only • >450g • Est: 145kg                      ││
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 85% Complete        ││
│  │ Graded: 123kg of 145kg estimated                          ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  Completed Harvests (Last 7 Days)              [View All →]   │
│  ┌───────────────────────────────────────────────────────────┐│
│  │ A-01   Feb 28   FULL   485kg   21,825 EGP  FCR: 1.62  ✅ ││
│  │ B-03   Feb 26   FULL   520kg   23,400 EGP  FCR: 1.58  ✅ ││
│  │ C-05   Feb 25   PARTIAL 240kg  10,800 EGP  FCR: 1.71  ⚠️ ││
│  └───────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
Interactive Elements:

Click tank name → Tank detail page
Click batch → Batch detail page
Progress bar tooltip shows: "Super: 50kg, Grade1: 120kg, Grade2: 62kg"
[Continue] button → Opens harvest workflow at current step


SCREEN 2: HARVEST PREDICTION (Planning Tool)
Layout: Split View - Left: Input, Right: Predictions
┌─────────────────────────────────────────────────────────────────┐
│  📊 Harvest Prediction - Tank A-03                    [✕ Close] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐  ┌────────────────────────────┐ │
│  │ Current Status           │  │ Predictions                │ │
│  ├──────────────────────────┤  ├────────────────────────────┤ │
│  │                          │  │                            │ │
│  │ Batch: #123              │  │ 🎯 Harvest Recommendation  │ │
│  │ Fish Type: Nile Tilapia  │  │                            │ │
│  │ Stocked: 45 days ago     │  │ Status: 🟢 READY NOW       │ │
│  │                          │  │                            │ │
│  │ Current Stats:           │  │ Current Weight (420g):     │ │
│  │ • Count: 850 fish        │  │ Revenue: 16,065 EGP        │ │
│  │ • Avg Weight: 420g       │  │ Profit: 8,215 EGP          │ │
│  │ • Total Biomass: 357kg   │  │ Margin: 51.1%  ⭐         │ │
│  │ • Survival: 89.5%        │  │                            │ │
│  │ • Last SGR: 2.8%/day     │  │ If Wait to 500g (+12 days):│ │
│  │ • Current FCR: 1.75      │  │ Revenue: 18,530 EGP        │ │
│  │                          │  │ Profit: 8,980 EGP  (+765)  │ │
│  │ Costs to Date:           │  │ Margin: 48.5%  📉          │ │
│  │ • Feed: 6,240 EGP        │  │                            │ │
│  │ • Operating: 1,610 EGP   │  │ ⚠️ Warning: SGR declining  │ │
│  │ • Total: 7,850 EGP       │  │ Additional cost > revenue  │ │
│  │                          │  │ gain per kg                │ │
│  │ ─────────────────────    │  │                            │ │
│  │                          │  │ 💡 Recommendation:         │ │
│  │ Scenario Builder:        │  │ HARVEST NOW                │ │
│  │                          │  │                            │ │
│  │ Target Weight: [500] g   │  │ Reasons:                   │ │
│  │                          │  │ • Fish at prime market size│ │
│  │ Market Conditions:       │  │ • Strong current profit    │ │
│  │ Current Price: 45 EGP/kg │  │ • Declining growth rate    │ │
│  │ [Use Current ▼]          │  │ • High demand this week    │ │
│  │                          │  │                            │ │
│  │ Other Costs:             │  │ [Start Harvest] [Save]     │ │
│  │ Harvest Labor: [500] EGP │  │                            │ │
│  │ Transport: [200] EGP     │  │                            │ │
│  │ Packaging: [150] EGP     │  │                            │ │
│  │                          │  │                            │ │
│  │ [Calculate Prediction]   │  │                            │ │
│  └──────────────────────────┘  └────────────────────────────┘ │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  📈 Revenue Breakdown by Grade (Based on Fish Type Distribution)│
│  ┌───────────────────────────────────────────────────────────┐│
│  │                                                            ││
│  │  [████████████ 25%] Super (300-500g)                      ││
│  │  89.25kg @ 50 EGP/kg = 4,463 EGP                          ││
│  │                                                            ││
│  │  [████████████████████ 40%] Grade 1 (200-300g)           ││
│  │  142.8kg @ 45 EGP/kg = 6,426 EGP                          ││
│  │                                                            ││
│  │  [████████████ 25%] Grade 2 (150-200g)                    ││
│  │  89.25kg @ 40 EGP/kg = 3,570 EGP                          ││
│  │                                                            ││
│  │  [█████ 10%] Sherr (<150g)                                ││
│  │  35.7kg @ 30 EGP/kg = 1,071 EGP                           ││
│  │                                                            ││
│  │  Total Projected Revenue: 15,530 EGP                      ││
│  │  Total Projected Profit: 7,680 EGP (49.5% margin)         ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  ℹ️  Note: Actual revenue may vary based on grading results   │
│     Grade distribution based on species averages (last 10      │
│     harvests from this fish type)                              │
└─────────────────────────────────────────────────────────────────┘
Visual Enhancements:

Status Badge: Large, prominent at top of predictions
Progress Indicator: Visual bar showing days to target weight
Comparison Cards: Side-by-side "Now vs Wait" with delta highlights
Grade Distribution: Horizontal stacked bar chart with percentages


SCREEN 3: START HARVEST WORKFLOW (Step 1 of 4)
Multi-Step Form with Progress Indicator
┌─────────────────────────────────────────────────────────────────┐
│  🎣 Start New Harvest                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progress: ●━━━○━━━○━━━○                                        │
│           Details  Grade  Review Complete                       │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Step 1: Harvest Details                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Select Tank & Batch: *                                   │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ Tank A-03 - Batch #123                              │  │ │
│  │  │ 850 fish • 420g avg • 357kg biomass • 45 days old   │  │ │
│  │  │ Stocked: Jan 5, 2026 • FCR: 1.75 • SGR: 2.8%/day    │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │  [Change Tank/Batch ▼]                                    │ │
│  │                                                            │ │
│  │  Harvest Type: *                                          │ │
│  │  ○ Full Harvest (100% of batch) 🟣                        │ │
│  │    Recommended for: End of cycle, tank cleaning           │ │
│  │                                                            │ │
│  │  ● Partial Harvest (Select percentage) 🟠                 │ │
│  │    Percentage: [━━━━━●━━━━━] 50%                          │ │
│  │    = ~425 fish, ~179kg estimated                          │ │
│  │    Remaining: 425 fish, ~179kg in tank                    │ │
│  │    Recommended for: Size grading, thinning                │ │
│  │                                                            │ │
│  │  ○ Selective Harvest (Large fish only) 🩷                 │ │
│  │    Min Weight: [450] g                                    │ │
│  │    Est. Count: ~210 fish, ~95kg                           │ │
│  │    Recommended for: Market-ready fish, staggered harvest  │ │
│  │                                                            │ │
│  │  ─────────────────────────────────────────────────────    │ │
│  │                                                            │ │
│  │  Harvest Date & Time: *                                   │ │
│  │  [2026-03-05] [08:30 AM]                                  │ │
│  │                                                            │ │
│  │  Estimated Total Weight: (for planning)                   │ │
│  │  [179] kg (based on partial 50%)                          │ │
│  │                                                            │ │
│  │  ⚠️  Weather Check:                                        │ │
│  │  Temperature: 22°C ✅ Good for harvest                     │ │
│  │  Conditions: Clear, low wind ✅                            │ │
│  │                                                            │ │
│  │  Additional Notes:                                        │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │ Partial harvest to reduce density before summer.  │   │ │
│  │  │ Targeting larger fish for premium market.         │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Cancel]                                     [Next: Grading →]│
└─────────────────────────────────────────────────────────────────┘
Interactive Features:

Batch Selector: Dropdown with search, shows only active batches
Harvest Type Radio: Shows visual preview of what remains
Percentage Slider: Live calculation of estimated fish/weight
Weather Widget: Auto-fetched based on date/location
Validation: Prevents proceeding without required fields


SCREEN 4: GRADING INTERFACE (Step 2 of 4) - CRITICAL
Field-Optimized Design for Mobile/Tablet
┌─────────────────────────────────────────────────────────────────┐
│  🎣 Harvest Grading - Tank A-03, Batch #123                     │
│  ← Back to Details                        Save Draft  Complete →│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progress: ●━━━●━━━○━━━○                                        │
│           Details  Grade  Review Complete                       │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Harvest Progress                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Estimated Total: 179 kg                                    │ │
│  │ Graded So Far:   125 kg (70%)                              │ │
│  │ Remaining:        54 kg (30%)                              │ │
│  │                                                            │ │
│  │ ███████████████████████████████████░░░░░░░░░░░ 70%        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Add Grading Record                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Quick Grade Selection (tap to select):                   │ │
│  │                                                            │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│  │  │ ⭐ SUPER    │ │ 🔵 GRADE 1  │ │ 🟠 GRADE 2  │         │ │
│  │  │             │ │             │ │             │         │ │
│  │  │ 300-500g    │ │ 200-300g    │ │ 150-200g    │         │ │
│  │  │ 50 EGP/kg   │ │ 45 EGP/kg   │ │ 40 EGP/kg   │         │ │
│  │  │             │ │ ✓ Selected  │ │             │         │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │ │
│  │                                                            │ │
│  │  ┌─────────────┐ ┌─────────────┐                          │ │
│  │  │ 🔴 SHERR    │ │ ⚠️  WASTE   │                          │ │
│  │  │             │ │             │                          │ │
│  │  │ <150g       │ │ Damaged     │                          │ │
│  │  │ 30 EGP/kg   │ │ 0 EGP/kg    │                          │ │
│  │  │             │ │             │                          │ │
│  │  └─────────────┘ └─────────────┘                          │ │
│  │                                                            │ │
│  │  Selected Grade: 🔵 Grade 1 (200-300g) @ 45 EGP/kg        │ │
│  │                                                            │ │
│  │  ─────────────────────────────────────────────────────    │ │
│  │                                                            │ │
│  │  Weight Entry: *                                          │ │
│  │  ┌──────────────────────────────────────┐                 │ │
│  │  │              35.5                    │                 │ │
│  │  │          [Large Input]               │ kg              │ │
│  │  └──────────────────────────────────────┘                 │ │
│  │  [Scan Scale 📊] or enter manually                        │ │
│  │                                                            │ │
│  │  💰 Value: 1,598 EGP (35.5 × 45)                          │ │
│  │                                                            │ │
│  │  ─────────────────────────────────────────────────────    │ │
│  │                                                            │ │
│  │  Fish Condition:                                          │ │
│  │  ● Excellent  ○ Good  ○ Fair  ○ Poor                      │ │
│  │                                                            │ │
│  │  Notes (optional):                                        │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │ Uniform size, good color, very active              │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  [Add Grade Record ✓]                                     │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Recorded Grades                              [Edit Mode ✏️]   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⭐ Super (300-500g)              42.5 kg @ 50 = 2,125 EGP │ │
│  │    Excellent condition • 10:15 AM                     [×] │ │
│  │                                                            │ │
│  │ 🔵 Grade 1 (200-300g)            52.0 kg @ 45 = 2,340 EGP │ │
│  │    Excellent condition • 10:22 AM                     [×] │ │
│  │                                                            │ │
│  │ 🟠 Grade 2 (150-200g)            25.5 kg @ 40 = 1,020 EGP │ │
│  │    Good condition • 10:28 AM                          [×] │ │
│  │                                                            │ │
│  │ 🔴 Sherr (<150g)                  5.0 kg @ 30 =   150 EGP │ │
│  │    Fair condition • 10:32 AM                          [×] │ │
│  │                                                            │ │
│  │ ────────────────────────────────────────────────────────  │ │
│  │ Total Graded: 125 kg                     Value: 5,635 EGP │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ⚠️  Estimated Remaining: 54 kg (30%)                          │
│     Continue grading or proceed to review                      │
│                                                                 │
│  [Save Draft]               [← Back]              [Review →]   │
└─────────────────────────────────────────────────────────────────┘
Key UX Features:

Large Touch Targets: Grade cards are 120×120px minimum
Auto-Calculate: Price shown immediately on grade selection
Numeric Keypad: Large input for weight (field workers wearing gloves)
Quick Entry: Tap grade → Enter weight → Add (3 taps total)
Live Totals: Running sum visible at all times
Edit Mode: Can delete/modify records before completion
Draft Save: Auto-save every 30 seconds, manual save button

Mobile Optimization:

Portrait mode layout
Swipe to delete records
Voice input option for weight
Offline capability (sync when online)


SCREEN 5: REVIEW & COMPLETE (Step 3 of 4)
┌─────────────────────────────────────────────────────────────────┐
│  🎣 Review Harvest - Tank A-03, Batch #123                      │
│  ← Back to Grading                                  Complete →  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progress: ●━━━●━━━●━━━○                                        │
│           Details  Grade  Review Complete                       │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Harvest Summary                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Tank: A-03                    Harvest Type: PARTIAL (50%) │ │
│  │  Batch: #123                   Date: Mar 5, 2026 10:15 AM  │ │
│  │  Fish Type: Nile Tilapia                                   │ │
│  │                                                            │ │
│  │  Estimated Weight: 179 kg                                  │ │
│  │  Actual Weight:    175 kg  (98% accuracy ✅)               │ │
│  │  Variance:         -4 kg                                   │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Grade Distribution                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Grade        Weight    %      Price    Value    Quality  │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  ⭐ Super     58.5kg   33.4%   50 EGP   2,925 EGP  ⭐⭐⭐  │ │
│  │  🔵 Grade 1   70.0kg   40.0%   45 EGP   3,150 EGP  ⭐⭐⭐  │ │
│  │  🟠 Grade 2   38.5kg   22.0%   40 EGP   1,540 EGP  ⭐⭐    │ │
│  │  🔴 Sherr      8.0kg    4.6%   30 EGP     240 EGP  ⭐      │ │
│  │  ⚠️  Waste     0.0kg    0.0%    0 EGP       0 EGP  -      │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  TOTAL       175.0kg   100%              7,855 EGP         │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  📊 Visual Distribution                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [██████████ 33%] Super                                    │ │
│  │ [████████████ 40%] Grade 1                                │ │
│  │ [██████ 22%] Grade 2                                      │ │
│  │ [█ 5%] Sherr                                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ✅ Comparison to Expected (Species Average)                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Super:    33% vs 25% expected  (+8% 🎉 Better!)           │ │
│  │ Grade 1:  40% vs 40% expected  (Match ✅)                 │ │
│  │ Grade 2:  22% vs 25% expected  (-3% ✅ Good)              │ │
│  │ Sherr:     5% vs 10% expected  (-5% 🎉 Excellent!)        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Financial Performance                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Gross Revenue:           7,855 EGP                        │ │
│  │                                                            │ │
│  │  Production Costs:                                         │ │
│  │  • Feed consumed:         3,120 EGP                        │ │
│  │  • Operating costs:         805 EGP                        │ │
│  │  • Fingerling cost:       1,000 EGP (prorated 50%)         │ │
│  │  Subtotal:                4,925 EGP                        │ │
│  │                                                            │ │
│  │  Harvest Costs (add below):                                │ │
│  │  • Labor:         [250] EGP                                │ │
│  │  • Transport:     [100] EGP                                │ │
│  │  • Packaging:     [ 75] EGP                                │ │
│  │  • Ice:           [ 50] EGP                                │ │
│  │  • Other:         [  0] EGP                                │ │
│  │  Subtotal:                  475 EGP                        │ │
│  │                                                            │ │
│  │  ────────────────────────────────────────────────          │ │
│  │  Total Costs:             5,400 EGP                        │ │
│  │  Net Profit:              2,455 EGP  💰                    │ │
│  │  Profit Margin:           31.2%  ⭐ Good                   │ │
│  │                                                            │ │
│  │  Cost per kg:             30.86 EGP                        │ │
│  │  Revenue per kg:          44.89 EGP                        │ │
│  │  Profit per kg:           14.03 EGP                        │ │
│  │                                                            │ │
│  │  FCR (Batch):             1.75  ⭐ Good                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Batch Impact                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Before Harvest:                                           │ │
│  │  • Fish count: 850                                         │ │
│  │  • Biomass: 357 kg                                         │ │
│  │  • Status: ACTIVE                                          │ │
│  │                                                            │ │
│  │  After Harvest:                                            │ │
│  │  • Fish count: ~425 (est, 50% remain)                     │ │
│  │  • Biomass: ~182 kg                                        │ │
│  │  • Status: PARTIALLY_HARVESTED                             │ │
│  │  • Remaining proportion: 50%                               │ │
│  │                                                            │ │
│  │  ✅ Batch will remain active for continued growth          │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Next Steps After Completion                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✓ Harvested inventory will be created (4 lots)            │ │
│  │ ✓ Lot numbers will be auto-generated (LOT-2026-XXX)       │ │
│  │ ✓ Storage: Default to FRESH in Cold Room A                │ │
│  │ ✓ Expiry: 2 days from now (Mar 7, 2026)                   │ │
│  │ ✓ Accounting: Asset entry recorded (5,400 EGP basis)      │ │
│  │ ✓ Available for sales orders immediately                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Final Notes (optional):                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Excellent harvest. Fish quality very high. No disease   │   │
│  │ observed. Remaining fish healthy and growing well.      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [← Edit Grading]  [Save as Draft]  [✓ Complete Harvest]      │
└─────────────────────────────────────────────────────────────────┘
Validation Before Complete:

✓ All grades have weight > 0 or explicitly marked as 0
✓ Total weight reasonable (within 20% of estimate)
✓ Harvest costs entered
⚠️ Warning if profit margin < 15%
⚠️ Warning if actual weight < 80% of estimate


SCREEN 6: COMPLETION CONFIRMATION
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Harvest Completed Successfully!                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progress: ●━━━●━━━●━━━●                                        │
│           Details  Grade  Review Complete                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │            🎉 Harvest HRV-2026-045 Complete                │ │
│  │                                                            │ │
│  │  Tank A-03 • Batch #123 • Mar 5, 2026                     │ │
│  │  175 kg harvested • 7,855 EGP value • 31.2% profit        │ │
│  │                                                            │ │
│  │  ✓ 4 inventory lots created and ready for sale            │ │
│  │  ✓ Batch status updated (50% remains active)              │ │
│  │  ✓ Accounting entries recorded                            │ │
│  │  ✓ Traceability links established                         │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Inventory Created                                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ LOT-2026-087  ⭐ Super      58.5kg  FRESH  Exp: Mar 7  🟢 │ │
│  │ LOT-2026-088  🔵 Grade 1   70.0kg  FRESH  Exp: Mar 7  🟢 │ │
│  │ LOT-2026-089  🟠 Grade 2   38.5kg  FRESH  Exp: Mar 7  🟢 │ │
│  │ LOT-2026-090  🔴 Sherr      8.0kg  FRESH  Exp: Mar 7  🟢 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Quick Actions                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ 📦 View         │ │ 💰 Create       │ │ 📊 View         │  │
│  │ Inventory       │ │ Sales Order     │ │ Analytics       │  │
│  │                 │ │                 │ │                 │  │
│  │ [Go →]          │ │ [Go →]          │ │ [Go →]          │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ 🖨️  Print       │ │ 📧 Email        │ │ 📱 Share        │  │
│  │ Summary         │ │ Report          │ │ QR Codes        │  │
│  │                 │ │                 │ │                 │  │
│  │ [Print]         │ │ [Send]          │ │ [Share]         │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                 │
│  [← Back to Dashboard]                   [Start New Harvest]   │
└─────────────────────────────────────────────────────────────────┘

SCREEN 7: HARVEST HISTORY & ANALYTICS
┌─────────────────────────────────────────────────────────────────┐
│  📊 Harvest Analytics                      [Export] [Filter ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Time Period: [Last 3 Months ▼]     Fish Type: [All Types ▼]   │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ Total        │ │ Avg Profit   │ │ Avg FCR      │           │
│  │ Harvested    │ │ Margin       │ │              │           │
│  │              │ │              │ │              │           │
│  │  2,450 kg    │ │    35.8%     │ │    1.67      │           │
│  │  12 events   │ │  ⭐ Excellent │ │  ⭐ Good     │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ Total        │ │ Avg Survival │ │ Best         │           │
│  │ Revenue      │ │ Rate         │ │ Performer    │           │
│  │              │ │              │ │              │           │
│  │  110,250 EGP │ │    91.2%     │ │  Tank B-03   │           │
│  │  📈 +12%     │ │  ⭐ Good     │ │  [View →]    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Grade Distribution Trends (Last 3 Months)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  📈 Line chart showing percentage trends:                 │ │
│  │                                                            │ │
│  │  Super:     ──────/─────/────── (25% → 28% → 31%)  ↗️    │ │
│  │  Grade 1:   ──────────────────  (40% → 39% → 40%)  →     │ │
│  │  Grade 2:   ──────\─────\────── (25% → 23% → 20%)  ↘️    │ │
│  │  Sherr:     ──────\─────\────── (10% → 10% →  9%)  ↘️    │ │
│  │                                                            │ │
│  │  💡 Insight: Super grade improving! (+6% over 3 months)   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Revenue by Grade (Last 3 Months)                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Super:    34,575 EGP (31%)  ████████████████              │ │
│  │  Grade 1:  44,100 EGP (40%)  ████████████████████          │ │
│  │  Grade 2:  24,525 EGP (22%)  ███████████                   │ │
│  │  Sherr:     7,050 EGP (7%)   ███                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Recent Harvests                                  [View All →] │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Date      Tank  Type    Weight  Revenue  Profit%  FCR     │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Mar 5     A-03  PARTIAL 175kg   7,855    31.2%   1.75  ✅ │ │
│  │ Mar 2     B-05  FULL    520kg  23,400    38.5%   1.58  ⭐ │ │
│  │ Feb 28    A-01  FULL    485kg  21,825    35.2%   1.62  ✅ │ │
│  │ Feb 25    C-05  PARTIAL 240kg  10,800    28.1%   1.71  ⚠️ │ │
│  │ Feb 20    B-03  FULL    550kg  24,750    42.3%   1.52  ⭐ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Performance Alerts                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⚠️  Tank C-05 FCR trending high (1.71 → 1.78 → 1.85)     │ │
│  │    Action: Review feeding schedule and water quality      │ │
│  │                                                            │ │
│  │ 🎉 Tank B-03 consistently exceeds profit targets          │ │
│  │    Avg profit margin: 42.3% (target: 30%)                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

SCREEN 8: TANK HARVEST PERFORMANCE (Detail View)
┌─────────────────────────────────────────────────────────────────┐
│  🏆 Tank A-03 - Harvest Performance History                     │
│  ← Back to Analytics                               [Export PDF] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tank Overview                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Name: Tank A-03                Volume: 50 m³              │ │
│  │ Total Harvests: 8              Lifetime: 3,920 kg         │ │
│  │ Lifetime Revenue: 176,400 EGP  Avg Profit Margin: 34.2%   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Performance Metrics                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ Avg FCR      │ │ Avg Survival │ │ Avg Cycle    │           │
│  │              │ │              │ │              │           │
│  │    1.64      │ │    90.8%     │ │   58 days    │           │
│  │  ⭐ Excellent│ │  ⭐ Excellent │ │  Target: 60  │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                                 │
│  Harvest Timeline                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  [Timeline visualization with harvest points]             │ │
│  │                                                            │ │
│  │  Jan ────●──── Feb ────●──── Mar ──●── Apr ─────── May    │ │
│  │       485kg       520kg    175kg                           │ │
│  │       HRV-042     HRV-043  HRV-045                         │ │
│  │       FCR:1.62    FCR:1.58 FCR:1.75                        │ │
│  │       31% profit  38% profit 31% profit                    │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Grade Distribution Comparison                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                           Harvest                          │ │
│  │ Grade    Jan (HRV-042)  Feb (HRV-043)  Mar (HRV-045)      │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Super    120kg (25%)    145kg (28%)     58kg (33%)  ↗️    │ │
│  │ Grade 1  194kg (40%)    208kg (40%)     70kg (40%)  →     │ │
│  │ Grade 2  121kg (25%)    114kg (22%)     39kg (22%)  ↘️    │ │
│  │ Sherr     50kg (10%)     53kg (10%)      8kg (5%)   ↘️    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Total    485kg          520kg           175kg             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  💡 Insights:                                                   │
│  • Super grade percentage increasing (+8% over 3 harvests)     │
│  • Sherr percentage decreasing (excellent!)                    │
│  • Consistent Grade 1 performance (target maintained)          │
│  • Recommendation: Current practices are working well          │
│                                                                 │
│  Full Harvest History                              [Export CSV]│
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Date      Event     Type    Weight  Revenue  Cost  Profit │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Mar 5'26  HRV-045  PARTIAL  175kg   7,855   5,400  2,455 │ │
│  │ Feb 2'26  HRV-043  FULL     520kg  23,400  14,430  8,970 │ │
│  │ Jan 15'26 HRV-042  FULL     485kg  21,825  15,067  6,758 │ │
│  │ Dec 20'25 HRV-038  FULL     490kg  22,050  15,435  6,615 │ │
│  │ Nov 28'25 HRV-035  PARTIAL  220kg   9,900   6,864  3,036 │ │
│  │ Nov 5'25  HRV-032  FULL     510kg  22,950  15,810  7,140 │ │
│  │ Oct 12'25 HRV-028  FULL     495kg  22,275  16,092  6,183 │ │
│  │ Sep 18'25 HRV-024  FULL     505kg  22,725  16,641  6,084 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [View Batch Details] [Compare with Other Tanks]               │
└─────────────────────────────────────────────────────────────────┘

MOBILE DESIGN SPECIFICATIONS
Grading Interface (Mobile-First)
Portrait Mode (Primary):

Grade cards: Full width, stacked vertically
Weight input: 80% screen width, 64px height
Numeric keypad: Native OS keyboard
Quick-add button: Fixed bottom bar

Landscape Mode (Field Use):

Grade cards: 3 columns
Weight input: Split screen (left: grades, right: entry)
One-handed operation optimized

Offline Functionality:

All grading data cached locally
Sync indicator in top bar
"Pending sync" badge on records
Auto-sync when connection restored

Accessibility:

High contrast mode for outdoor use
Large fonts (min 16px body, 24px inputs)
Voice input for hands-free operation
Screen reader compatible


COMPONENT LIBRARY
Reusable Components
1. GradeCard
Props:
- gradeName: string
- weightRange: string
- pricePerKg: number
- color: string
- selected: boolean
- onClick: function

Design:
- 120×120px minimum (mobile)
- Large grade name (18px bold)
- Weight range (14px)
- Price prominent (16px)
- Selected state: thick border + checkmark
2. HarvestProgressBar
Props:
- estimated: number
- actual: number
- unit: string

Design:
- Gradient fill (blue to green as approaches 100%)
- Percentage label centered
- Tooltip on hover: "125kg of 179kg (70%)"
3. FinancialSummaryCard
Props:
- revenue: number
- costs: number
- profit: number
- margin: number

Design:
- Color-coded profit (green >30%, yellow 15-30%, red <15%)
- Large profit value (24px)
- Breakdown collapsible
4. GradeDistributionChart
Props:
- grades: Array<{ name, weight, percentage }>

Design:
- Horizontal stacked bar
- Percentages labeled
- Hover shows actual weight
- Comparison mode: current vs expected