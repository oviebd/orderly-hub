import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrderCard } from '@/components/orders/OrderCard';
import { StatusTabs } from '@/components/orders/StatusTabs';
import { AddOrderDialog } from '@/components/orders/AddOrderDialog';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { ExperienceDialog } from '@/components/orders/ExperienceDialog';
import { Button } from '@/components/ui/button';
import { Plus, Package, Loader2, Search, ArrowUpDown, ShoppingBag } from 'lucide-react';
import { Order, OrderStatus, Customer, OrderSource } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseExperience } from '@/hooks/useFirebaseExperience';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useFirebaseAuth();
  const { orders, isLoading: ordersLoading, error: ordersError, createOrder, updateOrderStatus, isCreating } = useFirebaseOrders();
  const { customers, isLoading: customersLoading, error: customersError, createCustomer, updateCustomer, findCustomerByPhone } = useFirebaseCustomers();
  const { createExperience, isLoading: experienceLoading } = useFirebaseExperience();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState<Order | null>(null);
  const [targetFeedbackStatus, setTargetFeedbackStatus] = useState<OrderStatus>('delivered');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const getFilteredOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = [...orders];

    // Tab Filter
    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.deliveryDate);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
        break;
      case 'all':
        break;
      default:
        filtered = filtered.filter(order => order.status === activeTab);
        break;
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return (
          customer?.name.toLowerCase().includes(q) ||
          customer?.phone.includes(q) ||
          order.productDetails.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const timeA = a.orderDate.getTime();
      const timeB = b.orderDate.getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return filtered;
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

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    if (status === 'delivered' || status === 'cancelled') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setOrderToDeliver(order);
        setTargetFeedbackStatus(status);
        setExperienceOpen(true);
        return;
      }
    }

    try {
      await updateOrderStatus({ orderId, status });
      toast({
        title: 'Status updated',
        description: `Order marked as ${status}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const handleExperienceSubmit = async (rating: number, comment: string) => {
    if (!orderToDeliver) return;

    try {
      // 1. Update order status
      await updateOrderStatus({ orderId: orderToDeliver.id, status: targetFeedbackStatus });

      // 2. Create experience record
      await createExperience({
        rating,
        comment,
        orderId: orderToDeliver.id,
        customerId: orderToDeliver.customerId,
      });

      toast({
        title: targetFeedbackStatus === 'cancelled' ? 'Order cancelled' : 'Order delivered',
        description: 'Feedback recorded successfully',
      });

      setExperienceOpen(false);
      setOrderToDeliver(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete delivery',
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
    customerId: string;
    productId?: string;
    productName: string;
    productDetails?: string;
    price: number;
    orderDate: Date;
    deliveryDate: Date;
    hasOrderTime: boolean;
    hasDeliveryTime: boolean;
    source: OrderSource;
    notes: string;
    address?: string;
  }) => {
    try {
      // Customer creation is handled inside AddOrderDialog
      await createOrder({
        ownerId: user!.uid,
        businessId: profile!.businessId!,
        customerId: orderData.customerId,
        productId: orderData.productId,
        productName: orderData.productName,
        productDetails: orderData.productDetails || '',
        price: orderData.price,
        orderDate: orderData.orderDate,
        deliveryDate: orderData.deliveryDate,
        hasOrderTime: orderData.hasOrderTime,
        hasDeliveryTime: orderData.hasDeliveryTime,
        status: 'pending',
        source: orderData.source,
        notes: orderData.notes,
        address: orderData.address,
      });

      toast({
        title: 'Order created',
        description: 'New order added successfully',
      });
    } catch (error) {
      console.error(error);
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
    <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Error State */}
        {(ordersError || customersError) && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-lg border border-destructive/20 animate-fade-in">
            <h2 className="font-semibold">Error loading data</h2>
            <p className="text-sm">{(ordersError || customersError)?.message}</p>
          </div>
        )}

        {/* Permission Restriction Banner */}
        {profile?.status === 'disabled' && (
          <div className="bg-destructive text-destructive-foreground p-4 rounded-lg border animate-pulse">
            <h2 className="font-semibold italic">Account Disabled</h2>
            <p className="text-sm">Your account has been disabled by the administrator. Many features will be restricted.</p>
          </div>
        )}

        {profile?.canCreateOrders === false && (
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg border border-amber-200">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Order Creation Restricted
            </h2>
            <p className="text-sm">The administrator has restricted your capability to create new orders. Please contact support if this is an error.</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage your orders and track deliveries</p>
          </div>
          <Button
            onClick={() => setAddOrderOpen(true)}
            size="lg"
            className="gap-2"
            disabled={isCreating || profile?.canCreateOrders === false || profile?.status === 'disabled'}
          >
            {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            New Order
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className={cn("gap-2 bg-card")}
            >
              <ArrowUpDown className="h-4 w-4" />
              Order Time {sortOrder === 'asc' ? '(Oldest)' : '(Newest)'}
            </Button>
          </div>
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
                <Button
                  onClick={() => setAddOrderOpen(true)}
                  className="mt-4 gap-2"
                  disabled={profile?.canCreateOrders === false || profile?.status === 'disabled'}
                >
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
                  customerName={customers.find(c => c.id === order.customerId)?.name}
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

      <ExperienceDialog
        open={experienceOpen}
        onOpenChange={(open) => {
          setExperienceOpen(open);
          if (!open) setOrderToDeliver(null);
        }}
        order={orderToDeliver}
        customerName={customers.find(c => c.id === orderToDeliver?.customerId)?.name}
        targetStatus={targetFeedbackStatus}
        onSubmit={handleExperienceSubmit}
        isSubmitting={experienceLoading}
      />
    </DashboardLayout>
  );
}
