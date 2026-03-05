# FishFarm360 Frontend Page Guide (Page -> Component -> Route)

This guide maps each frontend page id to its main React component and backend route group.

Base API prefix for backend routes: `/api/v1`

## 0. Login
> **Assigned to:** Youssef Eslam
- Page id: `login`
- Component: `src/components/Login.tsx`
- Backend route group:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/pre-login`

## 1. Dashboard
> **Assigned to:** Hazzem Ibrahim
- Page id: `dashboard`
- Component: `src/components/Dashboard.tsx`
- Backend route group:
  - `GET /api/v1/dashboard`

## 2. Tank Management
> **Assigned to:** Hazzem Ibrahim
- Page id: `tanks`
- Component: `src/components/TankManagement.tsx`
- Backend route group:
  - `GET /api/v1/tanks`
  - `GET /api/v1/tanks/:id`
  - `GET /api/v1/tanks/:id/dashboard`
  - `GET /api/v1/tanks/:id/batches`
  - `GET /api/v1/tanks/:id/water-quality`
  - `GET /api/v1/tanks/:id/feeding-history`
  - `GET /api/v1/tanks/:id/growth-metrics`
  - `POST /api/v1/tanks/feeding-records/:batchId`
  - `GET /api/v1/tanks/feeding-records/:tankId/calculate`
  - `GET /api/v1/tanks/feeding-records/batch/:batchId/calculate`
  - `POST /api/v1/tanks/water-quality/:batchId`
  - `GET /api/v1/tanks/water-quality/batch/:batchId`
  - `GET /api/v1/tanks/growth/batch/:batchId`
  - `PUT /api/v1/tanks/growth/:id`

## 3. Harvest
> **Assigned to:** Youssef Eslam
- Page id: `harvest`
- Component: `src/components/HarvestManagement.tsx`
- Backend route group:
  - `GET /api/v1/harvest/events`
  - `GET /api/v1/harvest/events/tank/:tankId`
  - `GET /api/v1/harvest/events/:id/gradings`
  - `GET /api/v1/harvest/events/active-tanks`
  - `GET /api/v1/harvest/events/prediction/batch/:batchId`
  - `POST /api/v1/harvest/events/start`
  - `POST /api/v1/harvest/events/:id/grading`
  - `POST /api/v1/harvest/events/:id/complete`
  - `POST /api/v1/harvest/pricing`
  - `PATCH /api/v1/harvest/pricing/:id`
  - `GET /api/v1/harvest/pricing/fish-type/:fishTypeId`

## 4. Fish Types
> **Assigned to:** Youssef Eslam
- Page id: `fish-types`
- Component: `src/components/FishTypeManagement.tsx`
- Backend route group:
  - `GET /api/v1/farm/fish-types`
  - `POST /api/v1/farm/fish-types`
  - `PUT /api/v1/farm/fish-types/:id`
  - `GET /api/v1/farm/fish-types/:id`
  - `GET /api/v1/farm/fish-types/:id/feeding-rate?weight=45&temperature=27`
  - `GET /api/v1/farm/fish-types/:id/meal-frequency?weight=45`
  - `GET /api/v1/farm/fish-types/:id/protein-requirement?weight=45`

## 5. Food Types
> **Assigned to:** Hazzem Ibrahim
- Page id: `food-types`
- Component: `src/components/FoodTypeManagement.tsx`
- Backend route group:
  - `GET /api/v1/aquaculture/food-types`
  - `POST /api/v1/aquaculture/food-types`
  - `PUT /api/v1/aquaculture/food-types/:id`
  - `GET /api/v1/aquaculture/food-types/species?name=Tilapia`

## 6. Procurement
> **Assigned to:** Later ....
- Page id: `procurement`
- Component: `src/components/Procurement.tsx`
- Backend route group:
  - `GET /api/v1/procurement/feed-orders`
  - `POST /api/v1/procurement/feed-orders`
  - `PATCH /api/v1/procurement/feed-orders/:id/status`
  - `PATCH /api/v1/procurement/feed-orders/:id/delivery-status`
  - `PATCH /api/v1/procurement/feed-orders/:id/items/:itemId/status`
  - `GET /api/v1/procurement/fish-orders`
  - `POST /api/v1/procurement/fish-orders`
  - `PATCH /api/v1/procurement/fish-orders/:id/status`
  - `PATCH /api/v1/procurement/fish-orders/:id/items/:itemId/status`
  - `GET /api/v1/procurement/suppliers`
  - `POST /api/v1/procurement/suppliers`

## 7. Notifications
- Page id: `notifications`
- Component: `src/components/NotificationCenter.tsx`
- Backend route group:
  - `GET /api/v1/notifications`
  - `GET /api/v1/notifications/unread-count`
  - `PATCH /api/v1/notifications/:id/read`
  - `GET /api/v1/notifications/stream`
  - `GET /api/v1/notification-templates`
  - `PATCH /api/v1/notification-templates/:id`

## 8. Health Library
- Page id: `health`
- Component: `src/components/HealthLibrary.tsx`
- Backend route group:
  - currently available system endpoint: `GET /api/v1/health`

## 9. AI Assistant
- Page id: `ai-assistant`
- Component: `src/components/AIAssistant.tsx`
- Backend route group:
  - no dedicated AI endpoints yet (to be defined)

## 10. Inventory
> **Assigned to:** Later ....
- Page id: `inventory`
- Component: `src/components/Inventory.tsx`
- Backend route group:
  - `GET /api/v1/inventory/feed`
  - `POST /api/v1/inventory/feed`
  - `GET /api/v1/inventory/feed/food-type/:foodId`
  - `GET /api/v1/inventory/batches`
  - `GET /api/v1/inventory/batches/:id`
  - `PATCH /api/v1/inventory/batches/:id/quarantine`
  - `PATCH /api/v1/inventory/batches/:id/health-check`
  - `PATCH /api/v1/inventory/batches/:id/allocate`

## 11. Sales
> **Assigned to:** Later ....
- Page id: `sales`
- Component: `src/components/SalesModule.tsx`
- Backend route group:
  - `GET /api/v1/sales/orders`
  - `POST /api/v1/sales/orders`
  - `GET /api/v1/sales/orders/:id`
  - `PATCH /api/v1/sales/orders/:id/fulfill`
  - `PATCH /api/v1/sales/orders/:id/cancel`
  - `GET /api/v1/sales/customers`
  - `POST /api/v1/sales/customers`
  - `PATCH /api/v1/sales/customers/:id`
  - `DELETE /api/v1/sales/customers/:id`
  - `GET /api/v1/sales/analytics/dashboard`
  - `GET /api/v1/sales/analytics/stock-dashboard`
  - `GET /api/v1/harvested-inventory/find`
  - `GET /api/v1/harvested-inventory/summary`

## 12. Accounting
> **Assigned to:** Later ....
- Page id: `accounting`
- Component: `src/components/Accounting.tsx`
- Backend route group:
  - `GET /api/v1/accounting/dashboard`
  - `GET /api/v1/accounting/expenses`
  - `POST /api/v1/accounting/expenses`
  - `DELETE /api/v1/accounting/expenses/:id`
  - `GET /api/v1/reports/profit-loss`
  - `GET /api/v1/reports/inventory-valuation`

## 13. Analytics
> **Assigned to:** Later ....
- Page id: `analytics`
- Component: `src/components/Analytics.tsx`
- Backend route group:
  - `GET /api/v1/sales/analytics/dashboard`
  - `GET /api/v1/sales/analytics/stock-dashboard`
  - `GET /api/v1/harvest/events`
  - `GET /api/v1/harvest/events/tank/:tankId`
