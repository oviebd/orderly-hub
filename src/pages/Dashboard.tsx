import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrderCard } from '@/components/orders/OrderCard';
import { StatusTabs } from '@/components/orders/StatusTabs';
import { AddOrderDialog } from '@/components/orders/AddOrderDialog';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { Button } from '@/components/ui/button';
import { Plus, Package, Loader2 } from 'lucide-react';
import { Order, OrderStatus, Customer, OrderSource } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { orders, isLoading: ordersLoading, createOrder, updateOrderStatus, isCreating } = useOrders();
  const { customers, isLoading: customersLoading, createCustomer, updateCustomer, findCustomerByPhone } = useCustomers();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('all');
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const getFilteredOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeTab) {
      case 'today':
        return orders.filter(order => {
          const orderDate = new Date(order.deliveryDate);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
      case 'all':
        return orders;
      default:
        return orders.filter(order => order.status === activeTab);
    }
  };

  const getStatusCounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      all: orders.length,
      today: orders.filter(order => {
        const orderDate = new Date(order.deliveryDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const filteredOrders = getFilteredOrders();
  const statusCounts = getStatusCounts();

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus });
      toast({
        title: 'Status updated',
        description: `Order marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const handleViewCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerDialogOpen(true);
    }
  };

  const handleUpdateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      await updateCustomer({ customerId, updates });
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, ...updates } : null);
      }
      toast({
        title: 'Customer updated',
        description: 'Customer information saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
    }
  };

  const handleAddOrder = async (orderData: {
    phone: string;
    customerName: string;
    productDetails: string;
    price: number;
    deliveryDate: Date;
    source: OrderSource;
    notes: string;
  }) => {
    try {
      // Check if customer exists
      let customer = findCustomerByPhone(orderData.phone);
      
      if (!customer) {
        // Create new customer
        const newCustomer = await createCustomer({
          phone: orderData.phone,
          name: orderData.customerName || 'Unknown',
          rating: 0,
          comment: '',
        });
        customer = {
          id: newCustomer.id,
          ownerId: newCustomer.owner_id,
          phone: newCustomer.phone,
          name: newCustomer.name,
          rating: newCustomer.rating,
          comment: newCustomer.comment,
          createdAt: new Date(newCustomer.created_at),
        };
      }

      // Create order
      await createOrder({
        ownerId: user!.id,
        customerId: customer.id,
        phone: orderData.phone,
        customerName: orderData.customerName || customer.name,
        productDetails: orderData.productDetails,
        price: orderData.price,
        deliveryDate: orderData.deliveryDate,
        status: 'pending',
        source: orderData.source,
        notes: orderData.notes,
      });

      toast({
        title: 'Order created',
        description: 'New order added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || ordersLoading || customersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout businessName={profile?.business_name || 'My Business'} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage your orders and track deliveries</p>
          </div>
          <Button onClick={() => setAddOrderOpen(true)} size="lg" className="gap-2" disabled={isCreating}>
            {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
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
        customers={customers}
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
