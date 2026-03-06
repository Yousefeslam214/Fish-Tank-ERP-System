import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Users, Plus, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { User, Farm, CustomerType, Customer } from '../../types';

interface CustomerManagementProps {
  user: User;
  selectedFarm: Farm;
}

export default function CustomerManagement({ user, selectedFarm }: CustomerManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mock customers
  const customers: Customer[] = [
    {
      id: 'cust-001',
      name: 'Cairo Fresh Fish Market',
      contactPerson: 'Ahmed Hassan',
      phone: '+20 100 123 4567',
      email: 'ahmed@cairofresh.com',
      address: '123 Market Street, Cairo',
      customerType: 'WHOLESALER',
      creditLimit: 50000,
      outstandingBalance: 0,
      isActive: true,
      createdAt: new Date('2025-01-15')
    },
    {
      id: 'cust-002',
      name: 'Mediterranean Seafood Restaurant',
      contactPerson: 'Maria Ibrahim',
      phone: '+20 100 234 5678',
      email: 'maria@medseafood.com',
      address: '45 Corniche Road, Alexandria',
      customerType: 'RESTAURANT',
      creditLimit: 20000,
      outstandingBalance: 3500,
      isActive: true,
      createdAt: new Date('2025-02-01')
    },
    {
      id: 'cust-003',
      name: 'Delta Fish Retailers Co.',
      contactPerson: 'Mohamed Ali',
      phone: '+20 100 345 6789',
      email: 'mohamed@deltafish.com',
      customerType: 'RETAILER',
      creditLimit: 30000,
      outstandingBalance: 0,
      isActive: true,
      createdAt: new Date('2025-01-20')
    }
  ];

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    customerType: 'WHOLESALER',
    creditLimit: 0,
    outstandingBalance: 0,
    isActive: true,
    notes: ''
  });

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setEditingId(customer.id);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    console.log('Saving customer:', formData);
    setShowCreateModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      customerType: 'WHOLESALER',
      creditLimit: 0,
      outstandingBalance: 0,
      isActive: true,
      notes: ''
    });
  };

  const getCustomerTypeColor = (type: CustomerType) => {
    switch (type) {
      case 'WHOLESALER': return 'bg-[#3B82F6] text-white';
      case 'RETAILER': return 'bg-[#10B981] text-white';
      case 'RESTAURANT': return 'bg-[#F59E0B] text-white';
      case 'INDIVIDUAL': return 'bg-[#6B7280] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Customer Database</h2>
        <Button 
          className="bg-[#088395] hover:bg-[#0A4D68]"
          onClick={() => {
            setEditingId(null);
            setShowCreateModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    {customer.isActive && (
                      <Badge className="bg-[#10B981] text-white text-xs">Active</Badge>
                    )}
                  </div>
                  {customer.contactPerson && (
                    <p className="text-sm text-gray-600 mt-1">{customer.contactPerson}</p>
                  )}
                  <Badge className={getCustomerTypeColor(customer.customerType) + ' mt-2 text-xs'}>
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
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="font-medium">{customer.creditLimit?.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Outstanding:</span>
                  <span className={customer.outstandingBalance > 0 ? 'font-medium text-[#F59E0B]' : 'font-medium text-[#10B981]'}>
                    {customer.outstandingBalance.toLocaleString()} EGP
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEdit(customer)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  View Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Customer Name *</Label>
                  <Input 
                    placeholder="e.g., Cairo Fresh Fish Market"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input 
                    placeholder="e.g., Ahmed Hassan"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Customer Type *</Label>
                  <Select 
                    value={formData.customerType}
                    onValueChange={(value) => setFormData({...formData, customerType: value as CustomerType})}
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

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input 
                    type="tel"
                    placeholder="+20 100 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input 
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Textarea 
                    placeholder="Full address..."
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Financial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Credit Limit (EGP)</Label>
                  <Input 
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Outstanding Balance (EGP)</Label>
                  <Input 
                    type="number"
                    min="0"
                    value={formData.outstandingBalance}
                    onChange={(e) => setFormData({...formData, outstandingBalance: parseFloat(e.target.value)})}
                    disabled={!!editingId}
                  />
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1">Managed through orders</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Notes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-xs text-gray-600">Enable this customer for orders</p>
                </div>
                <Switch 
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Additional notes about this customer..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleSave}
              >
                {editingId ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
