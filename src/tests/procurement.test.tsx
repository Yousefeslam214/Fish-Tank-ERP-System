import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Procurement from '../components/Procurement';
import type { User } from '../types';
import * as procurementApi from '../services/procurementApi';
import * as fishTypesApi from '../services/fishTypesApi';
import * as foodTypesApi from '../services/foodTypesApi';

vi.mock('../services/procurementApi', async () => {
  const actual = await vi.importActual<typeof import('../services/procurementApi')>('../services/procurementApi');
  return {
    ...actual,
    createFeedPurchaseOrder: vi.fn(),
    createFishPurchaseOrder: vi.fn(),
    createProcurementSupplier: vi.fn(),
    getFeedPurchaseOrders: vi.fn(),
    getFishPurchaseOrders: vi.fn(),
    getProcurementSuppliers: vi.fn(),
    updateFeedPurchaseOrderDeliveryStatus: vi.fn(),
    updateFeedPurchaseOrderItemStatus: vi.fn(),
    updateFeedPurchaseOrderStatus: vi.fn(),
    updateFishPurchaseOrderItemStatus: vi.fn(),
    updateFishPurchaseOrderStatus: vi.fn(),
  };
});

vi.mock('../services/fishTypesApi', async () => {
  const actual = await vi.importActual<typeof import('../services/fishTypesApi')>('../services/fishTypesApi');
  return {
    ...actual,
    getFishTypes: vi.fn(),
  };
});

vi.mock('../services/foodTypesApi', async () => {
  const actual = await vi.importActual<typeof import('../services/foodTypesApi')>('../services/foodTypesApi');
  return {
    ...actual,
    getFoodTypes: vi.fn(),
  };
});

const getFeedPurchaseOrdersMock = vi.mocked(procurementApi.getFeedPurchaseOrders);
const getFishPurchaseOrdersMock = vi.mocked(procurementApi.getFishPurchaseOrders);
const getProcurementSuppliersMock = vi.mocked(procurementApi.getProcurementSuppliers);
const updateFeedPurchaseOrderItemStatusMock = vi.mocked(procurementApi.updateFeedPurchaseOrderItemStatus);
const getFishTypesMock = vi.mocked(fishTypesApi.getFishTypes);
const getFoodTypesMock = vi.mocked(foodTypesApi.getFoodTypes);

const testUser: User = {
  id: 'user-1',
  name: 'Procurement Manager',
  email: 'manager@fishfarm.local',
  phone: 'N/A',
  role: 'manager',
  farmId: 'farm-1',
};

describe('Procurement component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    getFeedPurchaseOrdersMock.mockResolvedValue([]);
    getFishPurchaseOrdersMock.mockResolvedValue([]);
    getProcurementSuppliersMock.mockResolvedValue([]);
    getFishTypesMock.mockResolvedValue([]);
    getFoodTypesMock.mockResolvedValue([]);
    updateFeedPurchaseOrderItemStatusMock.mockResolvedValue(undefined);
  });

  it('renders searchable supplier table with truncated IDs', async () => {
    const user = userEvent.setup();

    getProcurementSuppliersMock.mockResolvedValue([
      {
        id: 'abc12345-1111-2222-3333-444444444444',
        name: 'Nile Inputs',
        email: 'sales@nileinputs.com',
        phoneNumber: '+201000000001',
        address: 'Giza',
        items: ['FOOD'],
      },
      {
        id: 'def67890-1111-2222-3333-444444444444',
        name: 'Delta Hatchery',
        email: 'contact@deltahatchery.com',
        phoneNumber: '+201000000002',
        address: 'Cairo',
        items: ['FISH'],
      },
    ]);

    render(<Procurement user={testUser} selectedFarm={null} />);

    await user.click(await screen.findByRole('tab', { name: 'Suppliers' }));

    expect(await screen.findByText('Nile Inputs')).toBeInTheDocument();
    expect(screen.getByText('ID: abc12345')).toBeInTheDocument();
    expect(screen.getByText('Delta Hatchery')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search suppliers'), 'delta');

    expect(screen.queryByText('Nile Inputs')).not.toBeInTheDocument();
    expect(screen.getByText('Delta Hatchery')).toBeInTheDocument();
  });

  it('applies feed status filter and pagination', async () => {
    const user = userEvent.setup();

    getFeedPurchaseOrdersMock.mockResolvedValue([
      {
        id: 'feed-order-1-uuid',
        orderNumber: 'PO-001',
        supplierName: 'Supplier A',
        status: 'PENDING',
        totalCost: 1000,
        items: [],
      },
      {
        id: 'feed-order-2-uuid',
        orderNumber: 'PO-002',
        supplierName: 'Supplier A',
        status: 'PENDING',
        totalCost: 1000,
        items: [],
      },
      {
        id: 'feed-order-3-uuid',
        orderNumber: 'PO-003',
        supplierName: 'Supplier A',
        status: 'PENDING',
        totalCost: 1000,
        items: [],
      },
      {
        id: 'feed-order-4-uuid',
        orderNumber: 'PO-004',
        supplierName: 'Supplier A',
        status: 'PENDING',
        totalCost: 1000,
        items: [],
      },
      {
        id: 'feed-order-5-uuid',
        orderNumber: 'PO-005',
        supplierName: 'Supplier A',
        status: 'PENDING',
        totalCost: 1000,
        items: [],
      },
      {
        id: 'feed-order-6-uuid',
        orderNumber: 'PO-006',
        supplierName: 'Supplier B',
        status: 'APPROVED',
        totalCost: 1000,
        items: [],
      },
    ]);

    render(<Procurement user={testUser} selectedFarm={null} />);

    expect(await screen.findByText('PO-001')).toBeInTheDocument();
    expect(screen.queryByText('PO-006')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next feed page' }));

    expect(await screen.findByText('PO-006')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Feed order status filter'), 'APPROVED');

    expect(await screen.findByText('PO-006')).toBeInTheDocument();
    expect(screen.queryByText('PO-001')).not.toBeInTheDocument();
  });

  it('updates a feed line item status from order details', async () => {
    const user = userEvent.setup();

    getFeedPurchaseOrdersMock.mockResolvedValue([
      {
        id: 'order-status',
        orderNumber: 'PO-STATUS',
        supplierId: 'supplier-1',
        supplierName: 'Supplier Status',
        status: 'APPROVED',
        deliveryStatus: 'DELIVERED',
        totalCost: 800,
        items: [
          {
            id: 'item-status',
            foodTypeId: 'food-1',
            foodTypeName: 'Starter Feed',
            quantityKg: 20,
            unitCost: 40,
            status: 'PENDING',
          },
        ],
      },
    ]);

    render(<Procurement user={testUser} selectedFarm={null} />);

    await screen.findByText('PO-STATUS');
    await user.click(screen.getByRole('button', { name: 'View Details' }));

    await screen.findByRole('dialog', { name: /feed order po-status/i });
    await user.selectOptions(screen.getByLabelText('Line item status item-status'), 'RECEIVED');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(updateFeedPurchaseOrderItemStatusMock).toHaveBeenCalledWith('order-status', 'item-status', 'RECEIVED');
    });
  });

  it('enables receiving only for delivered orders and submits partial receipt updates', async () => {
    const user = userEvent.setup();

    getFeedPurchaseOrdersMock.mockResolvedValue([
      {
        id: 'order-pending',
        orderNumber: 'PO-PENDING',
        supplierId: 'supplier-1',
        supplierName: 'Supplier Pending',
        status: 'PENDING',
        deliveryStatus: 'SHIPPED',
        totalCost: 500,
        items: [
          {
            id: 'item-pending',
            foodTypeId: 'food-1',
            foodTypeName: 'Starter Feed',
            quantityKg: 10,
            unitCost: 20,
            status: 'PENDING',
          },
        ],
      },
      {
        id: 'order-delivered',
        orderNumber: 'PO-DELIVERED',
        supplierId: 'supplier-2',
        supplierName: 'Supplier Delivered',
        status: 'APPROVED',
        deliveryStatus: 'DELIVERED',
        totalCost: 1000,
        items: [
          {
            id: 'item-delivered',
            foodTypeId: 'food-2',
            foodTypeName: 'Grower Feed',
            quantityKg: 25,
            unitCost: 40,
            status: 'PENDING',
          },
        ],
      },
    ]);

    render(<Procurement user={testUser} selectedFarm={null} />);

    await screen.findByText('PO-PENDING');

    const receiveButtons = screen.getAllByRole('button', { name: 'Receive Items' });
    expect(receiveButtons[0]).toBeDisabled();
    expect(receiveButtons[1]).toBeEnabled();

    await user.click(receiveButtons[1]);

    expect(await screen.findByText('Receive Items - PO-DELIVERED')).toBeInTheDocument();

    const quantityInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(quantityInput);
    await user.type(quantityInput, '10');

    await user.click(screen.getByRole('button', { name: 'Submit Receipt' }));

    await waitFor(() => {
      expect(updateFeedPurchaseOrderItemStatusMock).toHaveBeenCalledWith(
        'order-delivered',
        'item-delivered',
        'PARTIALLY_RECEIVED',
        expect.objectContaining({
          actualQuantityKg: 10,
          receiptLocation: 'RECEIVING_AREA',
        }),
      );
    });

    expect(await screen.findByText(/Receipt posted:/i)).toBeInTheDocument();
  });
});
