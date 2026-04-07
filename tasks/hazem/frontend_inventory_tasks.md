# Frontend Implementation Tasks: Inventory Module

Following the backend analysis, here are the core frontend tasks for implementing the Inventory Management system.

## 1. Fish Inventory & Batch Management
**Goal**: Manage the lifecycle of fish batches from arrival to tank stocking.

- **Task**: **Inventory Batch Dashboard**
    - [ ] Create a comprehensive table listing all inventory batches.
-   [ ] Implement status-based filtering (e.g., `READY_TO_STOCK`, `DEPLETED`).
-   [ ] Display key metrics: Fish Type, Current vs. Initial Quantity.
- **Task**: **Batch Action Center**
-   [ ] **Allocation Interface**: Build a modal to transfer fish from a batch to a specific tank (requires tank list from Aquaculture module).
- **Task**: **Batch Traceability View**
-   [ ] Detail page showing the history of a batch (Movement and link to the source Purchase Order).

## 2. Feed Inventory Management
**Goal**: Track feed stock levels and consumption.

- **Task**: **Feed Stock Summary**
    - [ ] Create card-based overview showing total available stock per Feed Type (e.g., "Tilapia Starter: 250 Kg").
    - [ ] Implement color indicators for low-stock levels.
- **Task**: **Feed Batch Details**
    - [ ] Provide nested list view showing individual stock receipts (Batches).
    - [ ] Display Cost per Kg and upcoming Expiry Dates for each batch.
- **Task**: **Stock Adjustment Form**
    - [ ] Interface for manual stock corrections or deletions.

## 3. Integrated Insights & Alerts
- **Task**: **Inventory Alerts System**
-   [ ] Visual warnings for `DEPLETED` resources or low feed stock.
- **Task**: **Cross-Module Navigation**
    - [ ] Deep-link from an Inventory Batch directly to its originating Purchase Order in the Procurement module.

## 4. Technical Requirements
- **Task**: **State Management & UI Patterns**
    - [ ] Implement global status colors for consistency with the Procurement module.
    - [ ] Create shared components for "Quantity Progress Bars" (showing current vs. initial stock).
- **Task**: **Identification & Display Rules**
    - [ ] **ID Rule**: For all entities displayed (Batches, Tanks, etc.), always show both `name` and `id`.
    - [ ] **ID Formatting**: Truncate UUIDs to show only the first segment: `id.split('-')[0]`.
