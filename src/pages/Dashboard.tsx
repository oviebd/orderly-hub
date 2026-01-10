import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrderCard } from '@/components/orders/OrderCard';
import { StatusTabs } from '@/components/orders/StatusTabs';
import { AddOrderDialog } from '@/components/orders/AddOrderDialog';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import { mockOrders, mockCustomers, getOrdersByStatus, getStatusCounts } from '@/lib/mock-data';
import { Order, OrderStatus, Customer, OrderSource } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [activeTab, setActiveTab] = useState('all');
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  const filteredOrders = getOrdersByStatus(orders, activeTab as OrderStatus | 'all' | 'today');
  const statusCounts = getStatusCounts(orders);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleViewCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerDialogOpen(true);
    }
  };

  const handleUpdateCustomer = (customerId: string, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId ? { ...customer, ...updates } : customer
      )
    );
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleAddOrder = (orderData: {
    phone: string;
    customerName: string;
    productDetails: string;
    price: number;
    deliveryDate: Date;
    source: OrderSource;
    notes: string;
  }) => {
    // Check if customer exists
    let customer = customers.find(c => c.phone === orderData.phone);
    
    if (!customer) {
      // Create new customer
      customer = {
        id: Date.now().toString(),
        ownerId: 'user1',
        phone: orderData.phone,
        name: orderData.customerName || 'Unknown',
        rating: 0,
        comment: '',
        createdAt: new Date(),
      };
      setCustomers(prev => [...prev, customer!]);
    }

    // Create new order
    const newOrder: Order = {
      id: Date.now().toString(),
      ownerId: 'user1',
      customerId: customer.id,
      phone: orderData.phone,
      customerName: orderData.customerName || customer.name,
      productDetails: orderData.productDetails,
      price: orderData.price,
      deliveryDate: orderData.deliveryDate,
      status: 'pending',
      source: orderData.source,
      notes: orderData.notes,
      createdAt: new Date(),
    };

    setOrders(prev => [newOrder, ...prev]);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <DashboardLayout businessName="Sweet Delights Bakery" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage your orders and track deliveries</p>
          </div>
          <Button onClick={() => setAddOrderOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            New Order
          </Button>
        </div>

        {/* Status Tabs */}
        <StatusTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          counts={statusCounts}
        />

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 animate-fade-in">
              <Package className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No orders found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeTab === 'all' 
                  ? "Create your first order to get started"
                  : `No ${activeTab} orders at the moment`
                }
              </p>
              {activeTab === 'all' && (
                <Button onClick={() => setAddOrderOpen(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Order
                </Button>
              )}
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <div key={order.id} style={{ animationDelay: `${index * 50}ms` }}>
                <OrderCard
                  order={order}
                  onStatusChange={handleStatusChange}
                  onViewCustomer={handleViewCustomer}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddOrderDialog
        open={addOrderOpen}
        onOpenChange={setAddOrderOpen}
        onSubmit={handleAddOrder}
      />
      
      <CustomerDialog
        customer={selectedCustomer}
        orders={orders}
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onUpdateCustomer={handleUpdateCustomer}
      />
    </DashboardLayout>
  );
}
