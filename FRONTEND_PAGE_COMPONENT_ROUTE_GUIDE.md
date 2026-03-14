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

#### **POST** `/auth/pre-login`
*Description*: Checks if account exists and returns allowed farm IDs before full login.
**Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

#### **POST** `/auth/login`
*Description*: Main login endpoint. Can return JWT directly or a request for OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "farmId": "farm-uuid"
}
```

**Response (Success - Direct):**
```json
{
  "token": "eyJhbG...",
  "refreshToken": "ref-...",
  "expiresIn": 3600,
  "requiresOTP": false,
  "user": { "id": "uuid", "email": "user@example.com", "role": "MANAGER" }
}
```

## 1. Dashboard
> **Assigned to:** Hazem Yasser
- Page id: `dashboard`
- Component: `src/components/Dashboard.tsx`
- Backend route group:
  - `GET /api/v1/dashboard`

## 2. Tank Management
> **Assigned to:** Hazem Yasser
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
  - `GET /api/v1/tanks/feeding-records/calculation/tank/:tankId`
  - `GET /api/v1/tanks/feeding-records/calculation/batch/:batchId`
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
- Component: `src/components/FishTypeManagement.tsx` *(re-exports from `FishTypeManagementEnhanced.tsx`)*
- Backend route group:
  - `GET /api/v1/farm/fish-types`
  - `POST /api/v1/farm/fish-types`
  - `PUT /api/v1/farm/fish-types/:id`
  - `GET /api/v1/farm/fish-types/:id`
  - `GET /api/v1/farm/fish-types/:id/feeding-rate?weight=45&temperature=27`
  - `GET /api/v1/farm/fish-types/:id/meal-frequency?weight=45`
  - `GET /api/v1/farm/fish-types/:id/protein-requirement?weight=45`

## 5. Food Types
> **Assigned to:** Hazem Yasser
- Page id: `food-types`
- Component: `src/components/FoodTypeManagement.tsx`
- Backend route group:
  - `GET /api/v1/aquaculture/food-types`
  - `POST /api/v1/aquaculture/food-types`
  - `PUT /api/v1/aquaculture/food-types/:id`
  - `GET /api/v1/aquaculture/food-types/species?name=Tilapia`
 
## 6. Inventory
> **Iteration** 2 
> **Assigned to:** Hazem Yasser
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

## 7. Procurement
> **Iteration** 2
> **Assigned to:** Youssef Eslam
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

## 8. Sales
> **Iteration** 2
> **Assigned to:** Youssef Eslam
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

## 9. Accounting
> **Iteration** 2 
> **Assigned to:** Hazem Yasser
- Page id: `accounting`
- Component: `src/components/Accounting.tsx`
- Backend route group:
  - `GET /api/v1/accounting/metrics` (Dashboard)
  - `GET /api/v1/accounting/expenses`
  - `POST /api/v1/accounting/expenses`
  - `DELETE /api/v1/accounting/expenses/:id`
  - `GET /api/v1/accounting/journal-entries`
  - `GET /api/v1/accounting/journal-entries/:id`
  - `POST /api/v1/accounting/journal-entries`
  - `GET /api/v1/accounting/accounts`
  - `GET /api/v1/accounting/accounts/:id/ledger`
  - `GET /api/v1/accounting/reports/profit-loss`
  - `GET /api/v1/accounting/reports/balance-sheet`
  - `GET /api/v1/accounting/reports/inventory-valuation`
  - `GET /api/v1/accounting/reports/harvest-revenue`
