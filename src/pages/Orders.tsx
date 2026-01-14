import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrderCard } from '@/components/orders/OrderCard';
import { AddOrderDialog, AddOrderDialogProps } from '@/components/orders/AddOrderDialog';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { ExperienceDialog } from '@/components/orders/ExperienceDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Loader2, Search, ArrowUpDown, ShoppingBag, Download, Upload, Filter, Calendar, X, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Order, OrderStatus, Customer, OrderSource } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseExperience } from '@/hooks/useFirebaseExperience';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast as sonnerToast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const STATUS_OPTIONS: { id: OrderStatus; label: string; color: string }[] = [
    { id: 'pending', label: 'Pending', color: 'bg-status-pending' },
    { id: 'processing', label: 'Processing', color: 'bg-status-processing' },
    { id: 'completed', label: 'Completed', color: 'bg-status-completed' },
    { id: 'cancelled', label: 'Cancelled', color: 'bg-status-cancelled' },
];

export default function Orders() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signOut } = useFirebaseAuth();
    const { orders, isLoading: ordersLoading, error: ordersError, createOrder, updateOrderStatus, deleteOrder, isCreating } = useFirebaseOrders();
    const { customers, isLoading: customersLoading, error: customersError, updateCustomer } = useFirebaseCustomers();
    const { createExperience, isLoading: experienceLoading } = useFirebaseExperience();
    const { toast } = useToast();

    const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
    const [dateRangeType, setDateRangeType] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [addOrderOpen, setAddOrderOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
    const [experienceOpen, setExperienceOpen] = useState(false);
    const [orderToDeliver, setOrderToDeliver] = useState<Order | null>(null);
    const [targetFeedbackStatus, setTargetFeedbackStatus] = useState<OrderStatus>('completed');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);
    const [currentItem, setCurrentItem] = useState('');


    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleStatus = (status: OrderStatus) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
        setDateRangeType('all');
        setCustomDateRange(undefined);
        setSearchQuery('');
    };

    const hasActiveFilters = selectedStatuses.length > 0 || dateRangeType !== 'all' || searchQuery.trim().length > 0;

    const handleExport = () => {
        const dataToExport = orders.map(o => {
            const customer = customers.find(c => c.id === o.customerId);
            const productSummary = o.products.map(p => `${p.name} (x${p.quantity})`).join(', ');
            return {
                'Order ID': o.id,
                'Owner ID': o.ownerId,
                'Business ID': o.businessId,
                'Customer ID': o.customerId,
                'Customer Name': customer?.name || '',
                'Customer Phone': customer?.phone || '',
                'Products': productSummary,
                'Delivery Charge': o.deliveryCharge,
                'Total Amount': o.totalAmount,
                'Status': o.status,
                'Source': o.source,
                'Order Date': o.orderDate.toISOString(),
                'Delivery Date': o.deliveryDate.toISOString(),
                'Notes': o.notes,
                'Address': o.address || '',
                'Has Order Time': o.hasOrderTime,
                'Has Delivery Time': o.hasDeliveryTime,
                'Created At': o.createdAt.toISOString(),
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");
        XLSX.writeFile(wb, "Orders.xlsx");
        sonnerToast.success("Orders exported successfully");
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    sonnerToast.error("The selected file is empty");
                    return;
                }

                setIsImporting(true);
                setImportTotal(data.length);
                setImportProgress(0);

                let successCount = 0;
                let errorCount = 0;

                const loadingToast = sonnerToast.loading(`Importing 0/${data.length} orders...`);

                for (let i = 0; i < data.length; i++) {
                    const row = data[i] as any;
                    const itemName = row['Product Name'] || row['Order ID'] || `Order ${i + 1}`;
                    setCurrentItem(itemName);
                    setImportProgress(i + 1);

                    sonnerToast.loading(`Processing ${itemName}...`, { id: loadingToast });

                    try {
                        if (!row['Customer ID'] || !row['Product Name'] || row['Price'] === undefined) {
                            console.warn("Skipping invalid row:", row);
                            sonnerToast.error(`Invalid data for ${itemName}`, { duration: 2000 });
                            errorCount++;
                            continue;
                        }

                        const price = Number(row['Price'] || 0);
                        const deliveryCharge = Number(row['Delivery Charge'] || 0);
                        const quantity = Number(row['Quantity'] || 1);

                        await createOrder({
                            id: row['Order ID'] || row['ID'],
                            ownerId: row['Owner ID'] || user!.uid,
                            businessId: row['Business ID'] || profile!.businessId!,
                            customerId: row['Customer ID'],
                            products: row['Products'] ? [] : [{
                                id: row['Product ID'] || Math.random().toString(36).substr(2, 9),
                                name: String(row['Product Name']),
                                price: price,
                                quantity: quantity,
                            }],
                            deliveryCharge: deliveryCharge,
                            totalAmount: price * quantity + deliveryCharge,
                            status: (row['Status'] as OrderStatus) || 'pending',
                            source: (row['Source'] as OrderSource) || 'phone',
                            orderDate: row['Order Date'] ? new Date(row['Order Date']) : new Date(),
                            deliveryDate: row['Delivery Date'] ? new Date(row['Delivery Date']) : new Date(),
                            notes: row['Notes'] || '',
                            address: row['Address'] || '',
                            hasOrderTime: !!row['Has Order Time'],
                            hasDeliveryTime: !!row['Has Delivery Time'],
                            createdAt: row['Created At'] ? new Date(row['Created At']) : undefined,
                            updatedAt: row['Updated At'] ? new Date(row['Updated At']) : undefined,
                        });

                        successCount++;
                        sonnerToast.success(`Succeeded: ${itemName}`, { duration: 1000 });
                    } catch (error) {
                        console.error("Error importing order:", row, error);
                        errorCount++;
                        sonnerToast.error(`Failed: ${itemName}`, { duration: 3000 });
                    }

                    sonnerToast.loading(`Importing ${i + 1}/${data.length} orders...`, { id: loadingToast });
                }

                sonnerToast.success(`Import complete! Added/Updated: ${successCount}, Failed/Skipped: ${errorCount}`, { id: loadingToast, duration: 5000 });

            } catch (error) {
                console.error("Error parsing file:", error);
                sonnerToast.error("Failed to parse Excel file");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsBinaryString(file);
    };


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

        // Multi-Status Filter
        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(order => selectedStatuses.includes(order.status));
        }

        // Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(order => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                    customer?.name.toLowerCase().includes(q) ||
                    customer?.phone.includes(q) ||
                    order.products.some(p =>
                        p.name.toLowerCase().includes(q) ||
                        p.code?.toLowerCase().includes(q) ||
                        p.description?.toLowerCase().includes(q)
                    )
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
        return {
            pending: orders.filter(o => o.status === 'pending').length,
            processing: orders.filter(o => o.status === 'processing').length,
            completed: orders.filter(o => o.status === 'completed').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
        };
    };

    const filteredOrders = getFilteredOrders();
    const statusCounts = getStatusCounts();

    const handleStatusChange = async (orderId: string, status: OrderStatus) => {
        if (status === 'completed' || status === 'cancelled') {
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
            await updateOrderStatus({ orderId: orderToDeliver.id, status: targetFeedbackStatus });

            await createExperience({
                rating,
                comment,
                orderId: orderToDeliver.id,
                customerId: orderToDeliver.customerId,
            });

            toast({
                title: targetFeedbackStatus === 'cancelled' ? 'Order cancelled' : 'Order completed',
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

    const handleDeleteOrder = async (orderId: string) => {
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }
        try {
            await deleteOrder(orderId);
            toast({
                title: 'Order deleted',
                description: 'The order has been permanently removed.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete order',
                variant: 'destructive',
            });
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

    const handleAddOrder = async (orderData: Parameters<AddOrderDialogProps['onSubmit']>[0]) => {
        try {
            await createOrder({
                ownerId: user!.uid,
                businessId: profile!.businessId!,
                customerId: orderData.customerId,
                products: orderData.products,
                deliveryCharge: orderData.deliveryCharge,
                totalAmount: orderData.totalAmount,
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
            {isImporting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-card border shadow-2xl animate-in fade-in zoom-in duration-200 max-w-md w-full mx-4">
                        <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold">{Math.round((importProgress / importTotal) * 100)}%</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-center w-full">
                            <p className="text-xl font-bold tracking-tight">Importing Orders</p>
                            <p className="text-sm text-muted-foreground">
                                Processing {importProgress} of {importTotal}
                            </p>
                            <Progress value={(importProgress / importTotal) * 100} className="h-2 w-full" />
                            <p className="text-xs text-muted-foreground truncate italic">
                                {currentItem && `Adding: ${currentItem}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <p className="text-[10px] font-medium uppercase tracking-wider">Please do not close this window</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-5">
                {/* Error State */}
                {(ordersError || customersError) && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-lg border border-destructive/20 animate-fade-in">
                        <h2 className="font-semibold">Error loading data</h2>
                        <p className="text-sm">{(ordersError || customersError)?.message}</p>
                    </div>
                )}

                {/* Permission Restriction Banners */}
                {profile?.status === 'disabled' && (
                    <div className="bg-destructive text-destructive-foreground p-4 rounded-lg border animate-pulse">
                        <h2 className="font-semibold italic">Account Disabled</h2>
                        <p className="text-sm">Your account has been disabled by the administrator.</p>
                    </div>
                )}

                {profile?.canCreateOrders === false && (
                    <div className="bg-amber-100 text-amber-800 p-4 rounded-lg border border-amber-200">
                        <h2 className="font-semibold flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Order Creation Restricted
                        </h2>
                        <p className="text-sm">The administrator has restricted your capability to create new orders.</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                        <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="inline-block">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleImportClick}
                                            className="gap-1.5"
                                            disabled={profile?.capabilities?.hasExportImportOption === false}
                                        >
                                            <Upload className="h-4 w-4" />
                                            Import
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {profile?.capabilities?.hasExportImportOption === false && (
                                    <TooltipContent>
                                        <p className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Upgrade your plan to use Import feature</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="inline-block">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExport}
                                            className="gap-1.5"
                                            disabled={profile?.capabilities?.hasExportImportOption === false}
                                        >
                                            <Download className="h-4 w-4" />
                                            Export
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {profile?.capabilities?.hasExportImportOption === false && (
                                    <TooltipContent>
                                        <p className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Upgrade your plan to use Export feature</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="inline-block">
                                        {(() => {
                                            const isRestricted = profile?.capabilities?.canAddOrder === false;
                                            const isLimitReached = orders.length >= (profile?.capabilities?.maxOrderNumber || 0);
                                            const isDisabled = isCreating || isRestricted || isLimitReached || profile?.status === 'disabled';

                                            return (
                                                <Button
                                                    onClick={() => setAddOrderOpen(true)}
                                                    size="sm"
                                                    className="gap-1.5"
                                                    disabled={isDisabled}
                                                >
                                                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                    New Order
                                                </Button>
                                            );
                                        })()}
                                    </div>
                                </TooltipTrigger>
                                {(() => {
                                    const isRestricted = profile?.capabilities?.canAddOrder === false;
                                    const isLimitReached = orders.length >= (profile?.capabilities?.maxOrderNumber || 0);

                                    if (isRestricted) {
                                        return <TooltipContent><p className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Order creation is disabled for your plan</p></TooltipContent>;
                                    }
                                    if (isLimitReached) {
                                        return <TooltipContent><p className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Order limit reached ({profile?.capabilities?.maxOrderNumber}). Upgrade to add more.</p></TooltipContent>;
                                    }
                                    return null;
                                })()}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Unified Filter Card */}
                <div className="bg-card rounded-xl border shadow-sm p-4 space-y-4">
                    {/* Search & Sort Row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search orders by customer, phone, or product..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 bg-background"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="gap-2 h-10 px-4 whitespace-nowrap"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                        </Button>
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Filters */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {STATUS_OPTIONS.map((status) => {
                                const isSelected = selectedStatuses.includes(status.id);
                                const count = statusCounts[status.id];
                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => toggleStatus(status.id)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                            isSelected
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                        )}
                                    >
                                        <div className={cn("h-2 w-2 rounded-full", isSelected ? "bg-primary-foreground" : status.color)} />
                                        {status.label}
                                        <span className={cn(
                                            "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]",
                                            isSelected ? "bg-primary-foreground/20" : "bg-background"
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

                        {/* Date Filters */}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(['all', 'today', 'week', 'month'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => { setDateRangeType(type); setCustomDateRange(undefined); }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        dateRangeType === type
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                    )}
                                >
                                    {type === 'all' ? 'All' : type === 'today' ? 'Today' : type === 'week' ? 'Week' : 'Month'}
                                </button>
                            ))}
                            <DateRangePicker
                                date={customDateRange}
                                onDateChange={(range) => {
                                    setCustomDateRange(range);
                                    setDateRangeType('custom');
                                }}
                                className="w-[200px]"
                            />
                        </div>
                    </div>

                    {/* Active Filters Summary */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                                Showing {filteredOrders.length} of {orders.length} orders
                            </span>
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs gap-1">
                                <X className="h-3 w-3" />
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Orders List */}
                <div className="space-y-3">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 bg-card/50">
                            <Package className="h-14 w-14 text-muted-foreground/30" />
                            <h3 className="mt-4 text-lg font-medium">No orders found</h3>
                            <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
                                {hasActiveFilters
                                    ? "Try adjusting your filters to see more results"
                                    : "Create your first order to get started"
                                }
                            </p>
                            {!hasActiveFilters && (
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
                            <div key={order.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                                <OrderCard
                                    order={order}
                                    customerName={customers.find(c => c.id === order.customerId)?.name}
                                    onStatusChange={handleStatusChange}
                                    onViewCustomer={handleViewCustomer}
                                    onDelete={handleDeleteOrder}
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
