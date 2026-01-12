import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowUpDown, User, Mail, Phone, Calendar, DollarSign, Package, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseExperiences } from '@/hooks/useFirebaseExperiences';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Customers() {
    const navigate = useNavigate();
    const { profile, signOut } = useFirebaseAuth();
    const { orders, isLoading: ordersLoading } = useFirebaseOrders();
    const { customers, isLoading: customersLoading, deleteCustomer } = useFirebaseCustomers();
    const { experiences, isLoading: experiencesLoading } = useFirebaseExperiences();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<'name' | 'lastOrder'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const customerStats = useMemo(() => {
        return customers.map(customer => {
            const customerOrders = orders.filter(o => o.customerId === customer.id);
            const deliveredOrders = customerOrders.filter(o => o.status === 'delivered');
            const totalSpend = deliveredOrders.reduce((sum, o) => sum + o.price, 0);
            const lastOrder = customerOrders.length > 0
                ? new Date(Math.max(...customerOrders.map(o => o.deliveryDate.getTime())))
                : null;

            const customerExperiences = experiences.filter(e => e.customerId === customer.id);
            const averageRating = customerExperiences.length > 0
                ? customerExperiences.reduce((sum, e) => sum + e.rating, 0) / customerExperiences.length
                : 0;

            return {
                ...customer,
                totalOrders: deliveredOrders.length,
                totalSpend,
                lastOrder,
                calculatedRating: averageRating,
            };
        });
    }, [customers, orders, experiences]);

    const filteredAndSortedCustomers = useMemo(() => {
        let result = customerStats.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            c.phone.includes(searchQuery)
        );

        result.sort((a, b) => {
            if (sortField === 'name') {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            } else {
                const dateA = a.lastOrder?.getTime() || 0;
                const dateB = b.lastOrder?.getTime() || 0;
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        return result;
    }, [customerStats, searchQuery, sortField, sortOrder]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const toggleSort = (field: 'name' | 'lastOrder') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    if (ordersLoading || customersLoading || experiencesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                        <p className="text-muted-foreground">Manage your customer relationships and view order history</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSort('name')}
                            className={cn("gap-2", sortField === 'name' && "bg-secondary")}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            Name {sortField === 'name' && (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSort('lastOrder')}
                            className={cn("gap-2", sortField === 'lastOrder' && "bg-secondary")}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            Last Order {sortField === 'lastOrder' && (sortOrder === 'asc' ? 'Oldest' : 'Newest')}
                        </Button>
                    </div>
                </div>

                {/* Customer List */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedCustomers.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                            <User className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">No customers found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search query</p>
                        </div>
                    ) : (
                        filteredAndSortedCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                onClick={() => navigate(`/customers/${customer.id}`)}
                                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between relative">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                <span className="text-sm font-bold text-primary">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold leading-none">{customer.name}</h3>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={cn(
                                                                "h-3 w-3",
                                                                star <= Math.round(customer.calculatedRating) ? "fill-accent text-accent" : "text-muted"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this customer?')) {
                                                    deleteCustomer(customer.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 shrink-0" />
                                            <span>{customer.phone}</span>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{customer.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-3">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Successful Orders</p>
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Package className="h-4 w-4 text-primary" />
                                                <span className="font-bold">{customer.totalOrders}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Purchase</p>
                                            <div className="flex items-center gap-2 text-foreground">
                                                <DollarSign className="h-4 w-4 text-primary" />
                                                <span className="font-bold">${customer.totalSpend.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t pt-4 text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Customer since {format(customer.createdAt, 'MMM d, yyyy')}</span>
                                    </div>
                                    {customer.lastOrder && (
                                        <span>Last: {format(customer.lastOrder, 'MMM d, yyyy')}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
