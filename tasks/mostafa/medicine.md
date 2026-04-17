
## Medicine Inventory Tasks
1. **Medicine Inventory List View**:
   - Table to display current stock of medicines.
   - Columns: Medicine, Company, Batch, Quantity, Expiry Date, Status.
   - Color-code status (e.g., Red for Expired, Orange for Low Stock).

2. **Inventory Detail & Adjustments**:
   - View detailed batch information.
   - Form to manually deduct stock (for usage) or adjust quantities.

## Inventory API Routes
- `GET /inventory/medicine`: List all medicine inventory batches for the farm.
- `GET /inventory/medicine/total`: Get total stock per medicine name.
- `PATCH /inventory/medicine/:id/quantity`: Manually update/adjust quantity for a batch.
- `DELETE /inventory/medicine/:id`: Remove a batch from inventory (e.g., if damaged).

## Inventory Request Schemas

### Update Quantity
```json
{
  "newQuantity": 50.5
}
```
