import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Save, Star, Phone, Mail, MapPin, Calendar, Package, User, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseExperiences } from '@/hooks/useFirebaseExperiences';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Customer } from '@/types';

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile, signOut } = useFirebaseAuth();
    const { orders, isLoading: ordersLoading } = useFirebaseOrders();
    const { customers, isLoading: customersLoading, updateCustomer, deleteCustomer, isUpdating } = useFirebaseCustomers();
    const { experiences, isLoading: experiencesLoading } = useFirebaseExperiences();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        comment: '',
    });

    const customer = customers.find(c => c.id === id);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone,
                address: customer.address || '',
                comment: customer.comment || '',
            });
        }
    }, [customer]);

    const customerOrders = orders
        .filter(o => o.customerId === id)
        .sort((a, b) => b.deliveryDate.getTime() - a.deliveryDate.getTime());

    const customerExperiences = experiences.filter(e => e.customerId === id);
    const averageRating = customerExperiences.length > 0
        ? customerExperiences.reduce((sum, e) => sum + e.rating, 0) / customerExperiences.length
        : 0;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            await updateCustomer({
                customerId: id,
                updates: formData,
            });
            toast({
                title: 'Success',
                description: 'Customer details updated successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update customer details',
                variant: 'destructive',
            });
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (ordersLoading || customersLoading || experiencesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!customer) {
        return (
            <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
                <div className="flex flex-col items-center justify-center py-20">
                    <h2 className="text-2xl font-bold">Customer not found</h2>
                    <Button onClick={() => navigate('/customers')} variant="link">Back to customers</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate('/customers')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Customers
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                        onClick={async () => {
                            if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
                                if (id) {
                                    await deleteCustomer(id);
                                    toast({
                                        title: 'Customer deleted',
                                        description: 'Customer has been removed permanently.'
                                    });
                                    navigate('/customers');
                                }
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Customer
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Info Form */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Edit Profile
                            </h2>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="customer@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number (Can't be changed)</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            readOnly
                                            className="bg-muted"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Average Customer Experience ({customerExperiences.length} reviews)</Label>
                                        <div className="flex items-center gap-1 h-10">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        "h-6 w-6 transition-colors",
                                                        star <= Math.round(averageRating)
                                                            ? "fill-accent text-accent"
                                                            : "text-muted"
                                                    )}
                                                />
                                            ))}
                                            <span className="ml-2 text-sm font-medium">{averageRating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Delivery Address</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Enter full delivery address..."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comment">Private Notes</Label>
                                    <Textarea
                                        id="comment"
                                        value={formData.comment}
                                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                        placeholder="Internal notes about this customer..."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <Button type="submit" className="w-full gap-2" disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </form>
                        </div>

                        {/* Order History */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Order History ({customerOrders.length})
                            </h2>

                            {customerOrders.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    No orders found for this customer.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {customerOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                            className="group flex items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/50 cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium group-hover:text-primary transition-colors">
                                                    {order.products.map(p => `${p.name} (x${p.quantity})`).join(', ')}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{format(order.deliveryDate, 'MMM d, yyyy')}</span>
                                                    <span className="text-muted-foreground/30">•</span>
                                                    <span>{order.source}</span>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="font-bold">${order.totalAmount.toLocaleString()}</p>
                                                <Badge variant={order.status} className="capitalize">{order.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Stats */}
                    <div className="space-y-6">
                        <div className="rounded-xl border bg-card p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary/5" />
                            <div className="relative space-y-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    <span className="text-2xl font-bold text-primary">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold truncate">{customer.name}</h3>
                                    <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{customer.phone}</span>
                                    </div>
                                    {customer.email && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{customer.email}</span>
                                        </div>
                                    )}
                                    {customer.address && (
                                        <div className="flex items-start gap-3 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                            <span className="leading-tight">{customer.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Delivered</p>
                                <p className="text-2xl font-bold text-primary">{customerOrders.filter(o => o.status === 'delivered').length}</p>
                            </div>
                            <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
                                <p className="text-2xl font-bold text-primary">
                                    ${customerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
