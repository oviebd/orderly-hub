import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Package, Clock, AlertTriangle, DollarSign, ArrowRight, Users, ListOrdered, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isToday, isPast, format } from 'date-fns';


export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useFirebaseAuth();
  const { orders, isLoading: ordersLoading } = useFirebaseOrders();
  const { customers, isLoading: customersLoading } = useFirebaseCustomers();

  const [dateRangeType, setDateRangeType] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const getFilteredOrders = () => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (dateRangeType === 'today') {
      start = startOfDay(now);
      end = endOfDay(now);
    } else if (dateRangeType === 'week') {
      start = startOfWeek(now);
      end = endOfWeek(now);
    } else if (dateRangeType === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (dateRangeType === 'custom' && customDateRange?.from) {
      start = startOfDay(customDateRange.from);
      end = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
    }

    let filtered = [...orders];

    // Date Range Filter
    if (start && end) {
      filtered = filtered.filter(order =>
        isWithinInterval(new Date(order.deliveryDate), { start: start!, end: end! })
      );
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Urgent and At Risk orders (always based on ALL orders, not filtered)
  const urgentOrders = orders.filter(
    (o) =>
      (o.status === "pending" || o.status === "processing") &&
      isToday(new Date(o.deliveryDate))
  ).slice(0, 5);

  const atRiskOrders = orders.filter(
    (o) =>
      (o.status === "pending" || o.status === "processing") &&
      isPast(new Date(o.deliveryDate)) &&
      !isToday(new Date(o.deliveryDate))
  ).slice(0, 5);

  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())
    .slice(0, 5);

  // Calculate stats
  const stats = {
    totalRevenue: filteredOrders
      .filter((o) => o.status === "completed")
      .reduce((acc, o) => acc + o.totalAmount, 0),
    completed: filteredOrders.filter((o) => o.status === "completed").length,
    pending: filteredOrders.filter((o) => o.status === "pending").length,
    processing: filteredOrders.filter((o) => o.status === "processing").length,
    cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
    totalOrders: filteredOrders.length,
    totalCustomers: customers.length,
  };

  // Calculate top selling products
  const productSales = filteredOrders.reduce((acc: { [key: string]: { name: string; quantity: number; revenue: number } }, order) => {
    order.products.forEach((p) => {
      const key = p.name;
      if (!acc[key]) {
        acc[key] = { name: p.name, quantity: 0, revenue: 0 };
      }
      acc[key].quantity += p.quantity;
      acc[key].revenue += p.price * p.quantity;
    });
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  const maxQty = topProducts.length > 0 ? topProducts[0].quantity : 1;

  // Order status for donut chart visualization
  const statusData = [
    { name: 'Pending', value: stats.pending, color: 'hsl(var(--status-pending))' },
    { name: 'Processing', value: stats.processing, color: 'hsl(var(--status-processing))' },
    { name: 'Completed', value: stats.completed, color: 'hsl(var(--status-completed))' },
    { name: 'Cancelled', value: stats.cancelled, color: 'hsl(var(--status-cancelled))' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
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
        {/* Permission Restriction Banner */}
        {profile?.status === 'disabled' && (
          <div className="bg-destructive text-destructive-foreground p-4 rounded-lg border animate-pulse">
            <h2 className="font-semibold italic">Account Disabled</h2>
            <p className="text-sm">Your account has been disabled by the administrator.</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back! Here's your business at a glance.</p>
          </div>
          <Button onClick={() => navigate('/orders')} className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <ListOrdered className="h-4 w-4" />
            View All Orders
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2 bg-card p-1.5 rounded-xl border w-fit shadow-sm">
          {(['all', 'today', 'week', 'month'] as const).map((type) => (
            <Button
              key={type}
              variant={dateRangeType === type ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setDateRangeType(type); setCustomDateRange(undefined); }}
              className="h-8 text-xs"
            >
              {type === 'all' ? 'All Time' : type === 'today' ? 'Today' : type === 'week' ? 'This Week' : 'This Month'}
            </Button>
          ))}
          <div className="h-4 w-[1px] bg-border mx-1" />
          <DateRangePicker
            date={customDateRange}
            onDateChange={(range) => {
              setCustomDateRange(range);
              setDateRangeType('custom');
            }}
            className="w-[220px] border-none"
          />
        </div>

        {/* Hero Stats Row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Revenue</p>
                  <p className="text-2xl font-bold text-green-700 font-mono mt-1">৳{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-full bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Orders</p>
                  <p className="text-2xl font-bold text-blue-700 font-mono mt-1">{stats.totalOrders}</p>
                </div>
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/customers')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Customers</p>
                  <p className="text-2xl font-bold text-purple-700 font-mono mt-1">{stats.totalCustomers}</p>
                </div>
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Completed</p>
                  <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">{stats.completed}</p>
                </div>
                <div className="p-2 rounded-full bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent & At Risk Orders */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Urgent Orders */}
          <Card className="border-amber-500/30 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Urgent - Due Today
                </CardTitle>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {urgentOrders.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {urgentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No urgent orders</p>
              ) : (
                <div className="space-y-2">
                  {urgentOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 hover:bg-amber-100/50 cursor-pointer transition-colors border border-amber-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getCustomerName(order.customerId)}</p>
                        <p className="text-xs text-muted-foreground">{order.products.length} item(s) • ৳{order.totalAmount}</p>
                      </div>
                      <Badge variant={order.status as any} className="text-[10px]">
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* At Risk Orders */}
          <Card className="border-rose-500/30 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  At Risk - Overdue
                </CardTitle>
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                  {atRiskOrders.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {atRiskOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No overdue orders</p>
              ) : (
                <div className="space-y-2">
                  {atRiskOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/50 hover:bg-rose-100/50 cursor-pointer transition-colors border border-rose-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getCustomerName(order.customerId)}</p>
                        <p className="text-xs text-muted-foreground">Due: {format(new Date(order.deliveryDate), 'MMM d')}</p>
                      </div>
                      <Badge variant={order.status as any} className="text-[10px]">
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Status & Top Products Row */}
        <div className="grid gap-4 md:grid-cols-5">
          {/* Order Status - Compact Donut Style */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {/* Simple Donut Visualization */}
                <div className="relative h-24 w-24 flex-shrink-0">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    {(() => {
                      const total = stats.totalOrders || 1;
                      let cumulative = 0;
                      return statusData.map((item, i) => {
                        const percentage = (item.value / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = -cumulative;
                        cumulative += percentage;
                        return (
                          <circle
                            key={i}
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="4"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{stats.totalOrders}</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products - Horizontal Bar Chart Style */}
          <Card className="md:col-span-3 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No sales data</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-4 text-muted-foreground">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate max-w-[120px]">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.quantity} sold</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                            style={{ width: `${(p.quantity / maxQty) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Recent Orders
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">No orders yet</p>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-6 px-6 cursor-pointer transition-colors first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {getCustomerName(order.customerId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{getCustomerName(order.customerId)}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.products.map(p => p.name).slice(0, 2).join(', ')}
                          {order.products.length > 2 && ` +${order.products.length - 2} more`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold font-mono">৳{order.totalAmount}</p>
                      <p className="text-xs text-muted-foreground">{format(order.orderDate, 'MMM d, h:mm a')}</p>
                    </div>
                    <Badge variant={order.status as any} className="ml-3 text-[10px]">
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-3 grid-cols-3">
          <Card className="group cursor-pointer hover:shadow-md transition-all hover:border-primary/50" onClick={() => navigate('/orders')}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <ListOrdered className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Orders</h3>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-md transition-all hover:border-primary/50" onClick={() => navigate('/products')}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Products</h3>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-md transition-all hover:border-primary/50" onClick={() => navigate('/customers')}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Customers</h3>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
