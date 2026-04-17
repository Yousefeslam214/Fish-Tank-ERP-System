# Frontend Implementation Guide

This guide is the complete source of truth for all frontend tasks across Sales, Procurement, Harvest, and Fish Types.

## 1. Sales Module: Order Management & Approval

### Order List & Details
- **Statuses**: `PENDING`, `APPROVED`, `FULFILLED`, `DELIVERED`, `CANCELLED`.
- **Order Details View**: Display order number, customer, status, total amount, and **Line Items Table**:
  - Columns: Inventory ID (Lot Number), Quantity (kg), Unit Price, Subtotal, Status.

### Action Buttons & Logic
- **Buttons**: Show ONLY **[Approve]** and **[Cancel]**.
- **Rules**:
  - Buttons MUST be active/visible ONLY if `status === 'PENDING'`.
  - **Restriction**: If status is `APPROVED` or beyond, the 'Cancel' button is hidden.

### Approval Workflow (Modal/Dropdown)
- **User Source**: `GET /api/v1/users/farm/:farmId`
- **Dropdown A (Worker)**: Filter users where `role === 6`.
- **Dropdown B (Delivery)**: Filter users where `role === 5`.
- **Validation**: Cannot submit without selecting both users.
- **Approval API**: `POST /sales/orders/:id/approve`
- **Body**:
  ```json
  {
    "assignedWorkerId": "worker-uuid",
    "assignedDeliveryUserId": "delivery-uuid"
  }
  ```

---

## 2. Procurement Module: Purchase Orders
- **Statuses**: [Pending](file:///d:/projects/fishFarmSystem/src/modules/aquaculture-system/src/modules/tank/application/use-cases/feeding/CreatePendingFeedingUseCase.ts#30-36), `Approved`, `Canceled`, `Delivered`.
- **UI Logic**: Display ONLY **[Approve]** and **[Cancel]** buttons.
- **Availability**: Actions available ONLY for [Pending](file:///d:/projects/fishFarmSystem/src/modules/aquaculture-system/src/modules/tank/application/use-cases/feeding/CreatePendingFeedingUseCase.ts#30-36) orders.

---

## 3. Harvest Module: Workflow

### Add Grading Records
- Form to add records to an active `HarvestEvent`.
- **Route**: `POST /aquaculture-system/harvest/events/:eventId/grading`
- **Body**:
  ```json
  {
    "fishTypeId": "uuid",
    "gradeId": "uuid",
    "weight": 100.5,
    "count": 400,
    "condition": "GOOD"
  }
  ```

### Complete Harvest Event
- **Route**: `POST /aquaculture-system/harvest/events/:eventId/complete`
- **Body**: `{ "notes": "string" }`

---

## 4. Fish Types: Configuration

### Create/Edit Fish Type
- **Route**: `POST /farm/fish-types` (Create) | `PUT /farm/fish-types/:id` (Update)
- **Attributes List**:
  - `name`, `scientificName`, `arabicName`, `description`
  - **Water Quality**: `tempMin`, `tempOptimal`, `tempMax`, `doMin`, `phMin`, `phMax`, `nh3Safe`, `nh3Critical`, `no2Max`, `no3Max`
  - **Benchmarks**: `fcrMin`, `fcrMax`, `survivalRate`, `targetWeightForHarvest`, `defaultMarketPrice`
  - **JSON Config**: `feedingRateMatrix`, `mealFrequencyRules`, `proteinRequirements`

### Grade Distribution (Separate Component)
- **Header**: "Harvest yield prediction configuration."
- **Route**: `PUT /farm/fish-types/:id`
- **Schema**:
  ```json
  {
    "expectedGradeDistribution": [
      {
        "gradePricingId": "uuid",
        "percentage": 25.0
      }
    ]
  }
  ```

---

## Roles Appendix
- `0`: MANAGER
- `1`: ADMIN
- `5`: DELIVERY
- `6`: WORKER
