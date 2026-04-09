# Frontend Implementation Tasks: Procurement Module

This list breaks down the frontend requirements into actionable tasks and subtasks based on the procurement backend analysis.

## 1. Supplier Management UI
**Goal**: Provide a way for admins to manage the database of suppliers.

- **Task**: **Supplier List Dashboard**
    - [ ] Create a searchable table for listing all suppliers.
    - [ ] Display key info: Name, Primary Contact, and Item Types (Fish/Feed).
    - [ ] Add "New Supplier" button.
- **Task**: **Supplier Creation/Edit Form**
    - [ ] Build a multi-input form for Name, Email, Phone, and Address.
    - [ ] Implement a dynamic "Item Types" selector (multi-select).
    - [ ] Integrate with [SupplierService](file:///d:/projects/fishFarmSystem/src/modules/procurement/application/services/SupplierService.ts#8-68) API endpoints.

## 2. Purchase Order (PO) Management
**Goal**: Enable users to create and track orders for farm resources.

- **Task**: **Procurement Overview Page**
    - [ ] Implement paginated lists for Fish and Feed POs.
    - [ ] Add status badges for `Pending`, `Approved`, `Delivered`, and `Canceled`.
    - [ ] Filter orders by status.
- **Task**: **PO Creation Wizard**
    - [ ] Supplier selection dropdown (filtered by farm).
    - [ ] Dynamic line item addition (addRow/removeRow).
    - [ ] Auto-calculation of Line Item Total and Grand Total based on quantity/unit cost.
- **Task**: **PO Details & Status Control**
    - [ ] Create a detailed view for a single PO showing all metadata and line items.
    - [ ] Implement actions: "Approve Order" and "Cancel Order" with confirmation modals.

## 3. Receiving & Inventory Integration
**Goal**: Handle the physical arrival of goods and update the system.

- **Task**: **Guided Receiving Interface**
    - [ ] Only enable "Receive" actions when the PO status is `Delivered`.
    - [ ] Create a "Receive Items" modal for updating line item statuses.
    - [ ] Implement logic for "Full Receipt" vs "Partial Receipt" (input field for actual quantity).
- **Task**: **Real-time Inventory Feedback**
    - [ ] Show immediate feedback of stock updates after a receipt is processed.
    - [ ] Map receipt locations (e.g., default to 'RECEIVING_AREA') in the UI.

## 4. Shared Components & Utilities
- **Task**: **Procurement Helpers**
    - [ ] Status color mapping (e.g., Green for [Received](file:///d:/projects/fishFarmSystem/src/modules/inventory/application/handlers/LineItemReceiptHandler.ts#16-27), Yellow for `Pending`).
    - [ ] Unit formatters (e.g., formatter for `Kg` in feed POs).
- **Task**: **Identification & Display Rules**
    - [ ] **ID Rule**: For all entities displayed (Suppliers, POs, Receipts), always show both `name` and `id`.
    - [ ] **ID Formatting**: Truncate UUIDs to show only the first segment: `id.split('-')[0]`.
## 5. UI Polish
**Goal**: Ensure all components are visually consistent, readable, and professionally refined across the procurement module.
 
- **Task**: **Spacing & Layout Consistency**
    - [ ] Apply consistent padding and margins between all fields (e.g., between ID and Name columns in tables).
    - [ ] Ensure uniform spacing inside form inputs, table cells, cards, and modals.
    - [ ] Add proper whitespace between sections and component groups.
- **Task**: **Typography Standardization**
    - [ ] Define and apply a consistent font scale (e.g., heading, subheading, body, caption sizes).
    - [ ] Standardize font weights across labels, values, and headings.
    - [ ] Ensure proper line height and letter spacing for readability.
- **Task**: **Visual Consistency Audit**
    - [ ] Review all procurement components for uniform border radius, shadow, and color usage.
    - [ ] Align all table columns and form labels to a common grid.
    - [ ] Ensure buttons, badges, and inputs follow the same size and style rules throughout the module.