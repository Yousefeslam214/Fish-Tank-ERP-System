import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getProcurementSuppliers,
  updateFeedPurchaseOrderItemStatus,
  updateFishPurchaseOrderItemStatus,
} from '../services/procurementApi';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('procurementApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes suppliers from wrapped API payload', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [
          {
            id: 'a1b2c3d4-1111-2222-3333-444455556666',
            name: 'Blue Water Supplier',
            contactInfo: 'Email: supply@bluewater.com, Phone: +201111111111, Address: Cairo',
            items: ['fish', 'food'],
          },
        ],
      }),
    );

    const suppliers = await getProcurementSuppliers();

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0]).toMatchObject({
      id: 'a1b2c3d4-1111-2222-3333-444455556666',
      name: 'Blue Water Supplier',
      email: 'supply@bluewater.com',
      phoneNumber: '+201111111111',
      address: 'Cairo',
      items: ['FISH', 'FOOD'],
    });
  });

  it('sends feed line-item receipt payload with normalized status and quantity', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));

    await updateFeedPurchaseOrderItemStatus('feed-order-1', 'feed-item-1', 'PARTIALLY_RECEIVED', {
      actualQuantityKg: 12,
      receiptLocation: 'RECEIVING_AREA',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/procurement/feed-orders/feed-order-1/items/feed-item-1/status'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Partially Received',
          actualQuantityKg: 12,
          receiptLocation: 'RECEIVING_AREA',
        }),
      }),
    );
  });

  it('sends fish line-item receipt payload with normalized status and quantity', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));

    await updateFishPurchaseOrderItemStatus('fish-order-1', 'fish-item-1', 'RECEIVED', {
      actualQuantity: 500,
      receiptLocation: 'RECEIVING_AREA',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/procurement/fish-orders/fish-order-1/items/fish-item-1/status'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Received',
          actualQuantity: 500,
          receiptLocation: 'RECEIVING_AREA',
        }),
      }),
    );
  });
});
