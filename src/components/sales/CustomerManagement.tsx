import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Users, Plus, Edit, Phone, Mail, MapPin, Loader2, UserX } from 'lucide-react';
import { User, Farm } from '../../types';
import {
  createSalesCustomer,
  deleteSalesCustomer,
  getSalesCustomers,
  SalesCustomerCreatePayload,
  SalesCustomerRecord,
  updateSalesCustomer,
} from '../../services/salesApi';

interface CustomerManagementProps {
  user: User;
  selectedFarm: Farm;
  onCustomersChanged?: () => void;
}

interface CustomerFormState {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  customerType: 'WHOLESALER' | 'RETAILER' | 'RESTAURANT' | 'INDIVIDUAL';
  isActive: boolean;
  notes: string;
}

const initialFormState: CustomerFormState = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  customerType: 'WHOLESALER',
  isActive: true,
  notes: '',
};

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unable to process customer request.';
};

export default function CustomerManagement({ onCustomersChanged }: CustomerManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<SalesCustomerRecord | null>(null);

  const [customers, setCustomers] = useState<SalesCustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomerFormState>(initialFormState);

  const activeCustomers = useMemo(() => customers.filter((customer) => customer.isActive), [customers]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getSalesCustomers({ limit: 200 });
      setCustomers(response);
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'WHOLESALER':
        return 'bg-[#3B82F6] text-white';
      case 'RETAILER':
        return 'bg-[#10B981] text-white';
      case 'RESTAURANT':
        return 'bg-[#F59E0B] text-white';
      case 'INDIVIDUAL':
        return 'bg-[#6B7280] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingCustomer(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (customer: SalesCustomerRecord) => {
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || '',
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      customerType: customer.customerType as CustomerFormState['customerType'],
      isActive: customer.isActive,
      notes: customer.notes || '',
    });
    setEditingCustomer(customer);
    setShowCreateModal(true);
  };

  const toPayload = (): SalesCustomerCreatePayload => ({
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim() || undefined,
    address: formData.address.trim() || undefined,
    customerType: formData.customerType,
    contactPerson: formData.contactPerson.trim() || undefined,
    notes: formData.notes.trim() || undefined,
    isActive: formData.isActive,
  });

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      window.alert('Customer name and phone are required.');
      return;
    }

    try {
      setSubmitting(true);

      if (editingCustomer) {
        await updateSalesCustomer(editingCustomer.id, toPayload());
      } else {
        await createSalesCustomer(toPayload());
      }

      setShowCreateModal(false);
      resetForm();
      await loadCustomers();
      onCustomersChanged?.();
      window.alert(editingCustomer ? 'Customer updated successfully.' : 'Customer created successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (customer: SalesCustomerRecord) => {
    const confirmed = window.confirm(`Deactivate customer \"${customer.name}\"?`);
    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteSalesCustomer(customer.id);
      await loadCustomers();
      onCustomersChanged?.();
      window.alert('Customer deactivated successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Customer Database</h2>
        <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={handleOpenCreate} disabled={submitting}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {errorMessage && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" onClick={() => void loadCustomers()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 text-center text-gray-600 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading customers...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
              <Card key={customer.id} className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                        {customer.isActive ? (
                          <Badge className="bg-[#10B981] text-white text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-[#9CA3AF] text-white text-xs">Inactive</Badge>
                        )}
                      </div>
                      {customer.contactPerson && (
                        <p className="text-sm text-gray-600 mt-1">{customer.contactPerson}</p>
                      )}
                      <Badge className={`${getCustomerTypeColor(customer.customerType)} mt-2 text-xs`}>
                        {customer.customerType}
                      </Badge>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#E0F4F5] flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#088395]" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="text-xs">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className={customer.currentBalance > 0 ? 'font-medium text-[#F59E0B]' : 'font-medium text-[#10B981]'}>
                        {customer.currentBalance.toLocaleString()} EGP
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(customer)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    {customer.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => void handleDeactivate(customer)}
                        disabled={submitting}
                      >
                        <UserX className="w-3 h-3 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {customers.length === 0 && (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-8 text-center text-gray-600">No customers found.</CardContent>
            </Card>
          )}

          {activeCustomers.length === 0 && customers.length > 0 && (
            <Card className="bg-[#FEF3C7] border-[#F59E0B]">
              <CardContent className="p-4 text-sm text-[#92400E]">
                All customers are currently inactive. Activate one to use it in sales orders.
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Customer Name *</Label>
                  <Input
                    placeholder="e.g., Cairo Fresh Fish Market"
                    value={formData.name}
                    onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    placeholder="e.g., Ahmed Hassan"
                    value={formData.contactPerson}
                    onChange={(event) =>
                      setFormData((previous) => ({ ...previous, contactPerson: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Customer Type *</Label>
                  <Select
                    value={formData.customerType}
                    onValueChange={(value) =>
                      setFormData((previous) => ({
                        ...previous,
                        customerType: value as CustomerFormState['customerType'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WHOLESALER">Wholesaler</SelectItem>
                      <SelectItem value="RETAILER">Retailer</SelectItem>
                      <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+20 100 123 4567"
                    value={formData.phone}
                    onChange={(event) => setFormData((previous) => ({ ...previous, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    placeholder="Full address..."
                    value={formData.address}
                    onChange={(event) => setFormData((previous) => ({ ...previous, address: event.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-xs text-gray-600">Enable this customer for orders</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, isActive: checked }))}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes about this customer..."
                  value={formData.notes}
                  onChange={(event) => setFormData((previous) => ({ ...previous, notes: event.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" onClick={() => void handleSave()} disabled={submitting}>
                {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
