# Frontend Task: Medicine Procurement Implementation

## Objective
Implement the UI for managing Medicine Purchase Orders, following the pattern used for Feed Purchase Orders.

## Tasks
1. **Medicine Purchase Order List View**:
   - Create a table to display medicine purchase orders.
   - Columns: Order ID, Supplier, Date, Total Cost, Status, Delivery Status.
   - Add filters for status and search by supplier.

2. **Create Medicine Purchase Order Form**:
   - Supplier selection.
   - Dynamic line items:
     - Medicine Name (Text input)
     - Company/Manufacturer (Text input)
     - Applicable Fish Types (Multi-select dropdown referencing `fish-types` API)
     - Quantity
     - Unit Cost
     - Total Cost (Auto-calculated)
   - Validation: All fields required, quantity and unit cost must be > 0.

3. **Medicine Purchase Order Detail View**:
   - Display order details and status.
   - List line items with their attributes (Medicine, Company, Fish Types).
   - "Approve" button: Should trigger the backend logic to set status to `Delivered` and auto-receive line items.
   - Ability to update delivery status and individual line item statuses if needed.

## API Routes
- `POST /procurement/medicine-orders`: Create a new medicine purchase order.
- `GET /procurement/medicine-orders`: List medicine purchase orders (paginated).
- `GET /procurement/medicine-orders/:id`: Get detailed information for a specific order.
- `PATCH /procurement/medicine-orders/:id/status`: Update order status (e.g., to `APPROVED`).
- `PATCH /procurement/medicine-orders/:id/delivery-status`: Update delivery status.
- `PATCH /procurement/medicine-orders/:id/line-items/:itemId/status`: Update status of a specific line item.

## Request Schemas

### Create Medicine Purchase Order
```json
{
  "supplierId": "uuid",
  "items": [
    {
      "medicine": "Medicine Name",
      "company": "Manufacturer Name",
      "fishTypeIds": ["uuid1", "uuid2"],
      "quantity": 10.5,
      "unitCost": 50.0
    }
  ]
}
```

### Update Order Status
```json
{
  "status": "APPROVED" | "CANCELLED" | ...
}
```
