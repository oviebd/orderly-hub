import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ArrowLeft, Save, Star, MessageSquare, Trash2, Plus, Minus, Search, Package, FileText } from 'lucide-react';
import { cn, generateInvoiceNumber } from '@/lib/utils';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseProducts } from '@/hooks/useFirebaseProducts';
import { useFirebaseExperience } from '@/hooks/useFirebaseExperience';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ExperienceDialog } from '@/components/orders/ExperienceDialog';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { OrderStatus, Product, Order, OrderSource, Experience } from '@/types';

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { profile, signOut } = useFirebaseAuth();
    const { getOrderById, updateOrder, deleteOrder, isUpdating } = useFirebaseOrders();
    const { customers, isLoading: customersLoading } = useFirebaseCustomers();
    const { getExperienceByOrderId, createExperience, updateExperience, isLoading: experienceLoading } = useFirebaseExperience();
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [experienceOpen, setExperienceOpen] = useState(false);
    const [targetFeedbackStatus, setTargetFeedbackStatus] = useState<OrderStatus>('completed');
    const [isEditingExperience, setIsEditingExperience] = useState(false);

    // Form state
    const [orderItems, setOrderItems] = useState<{
        id: string;
        productId?: string;
        name: string;
        code?: string;
        price: number;
        quantity: number;
        description?: string;
        search: string;
        suggestions: Product[];
        showSuggestions: boolean;
    }[]>([]);
    const [deliveryCharge, setDeliveryCharge] = useState('0');
    const [orderDate, setOrderDate] = useState<Date>(new Date());
    const [orderTime, setOrderTime] = useState('');
    const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
    const [deliveryTime, setDeliveryTime] = useState('');
    const [source, setSource] = useState<OrderSource>('whatsapp');
    const [notes, setNotes] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');

    const { products: allProducts } = useFirebaseProducts();

    useEffect(() => {
        async function loadData() {
            if (!orderId) return;

            const orderData = await getOrderById(orderId);
            if (orderData) {
                setOrder(orderData);
                setOrderItems(orderData.products.map(p => ({
                    id: p.id || Math.random().toString(36).substr(2, 9),
                    productId: p.id,
                    name: p.name,
                    code: p.code,
                    price: p.price,
                    quantity: p.quantity,
                    description: p.description,
                    search: p.name,
                    suggestions: [],
                    showSuggestions: false
                })));
                setDeliveryCharge(orderData.deliveryCharge.toString());
                setOrderDate(orderData.orderDate);
                setOrderTime(orderData.hasOrderTime ? format(orderData.orderDate, 'HH:mm') : '');
                setDeliveryDate(orderData.deliveryDate);
                setDeliveryTime(orderData.hasDeliveryTime ? format(orderData.deliveryDate, 'HH:mm') : '');
                setSource(orderData.source);
                setNotes(orderData.notes);

                let currentInvNum = orderData.invoiceNumber;
                if (!currentInvNum) {
                    currentInvNum = generateInvoiceNumber();
                    updateOrder(orderId, { invoiceNumber: currentInvNum });
                }
                setInvoiceNumber(currentInvNum);

                if (orderData.status === 'completed' || orderData.status === 'cancelled') {
                    const expData = await getExperienceByOrderId(orderId);
                    setExperience(expData);
                }
            }
            setLoading(false);
        }

        loadData();
    }, [orderId]);

    const handleProductSearch = (index: number, value: string) => {
        const newItems = [...orderItems];
        newItems[index].search = value;
        newItems[index].name = value;

        const searchLower = value.toLowerCase();
        if (searchLower.length >= 2) {
            const matches = allProducts.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                (p.code && p.code.toLowerCase().includes(searchLower))
            );
            newItems[index].suggestions = matches;
            newItems[index].showSuggestions = true;
        } else {
            newItems[index].suggestions = [];
            newItems[index].showSuggestions = false;
        }
        setOrderItems(newItems);
    };

    const selectProduct = (index: number, product: Product) => {
        const newItems = [...orderItems];
        newItems[index].productId = product.id;
        newItems[index].name = product.name;
        newItems[index].code = product.code;
        newItems[index].price = product.price;
        newItems[index].search = product.name;
        newItems[index].showSuggestions = false;
        setOrderItems(newItems);
    };

    const updateQuantity = (index: number, delta: number) => {
        const newItems = [...orderItems];
        newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
        setOrderItems(newItems);
    };

    const handleQuantityManual = (index: number, value: string) => {
        const newItems = [...orderItems];
        const qty = parseInt(value) || 0;
        newItems[index].quantity = qty;
        setOrderItems(newItems);
    };

    const handlePriceChange = (index: number, value: string) => {
        const newItems = [...orderItems];
        newItems[index].price = parseFloat(value) || 0;
        setOrderItems(newItems);
    };

    const handleDescriptionChange = (index: number, value: string) => {
        const newItems = [...orderItems];
        newItems[index].description = value;
        setOrderItems(newItems);
    };

    const addProductRow = () => {
        setOrderItems([...orderItems, {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            price: 0,
            quantity: 1,
            search: '',
            suggestions: [],
            showSuggestions: false
        }]);
    };

    const removeProductRow = (index: number) => {
        if (orderItems.length === 1) return;
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => {
        return orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    const totalAmount = calculateSubtotal() + parseFloat(deliveryCharge || '0');

    const handleSave = async () => {
        if (!orderId || !order) return;

        const finalOrderDate = orderTime
            ? new Date(`${format(orderDate, 'yyyy-MM-dd')}T${orderTime}`)
            : orderDate;

        const finalDeliveryDate = deliveryTime
            ? new Date(`${format(deliveryDate, 'yyyy-MM-dd')}T${deliveryTime}`)
            : deliveryDate;

        try {
            await updateOrder(orderId, {
                products: orderItems.map(item => {
                    const product: any = {
                        id: item.productId || item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                    };
                    if (item.code) product.code = item.code;
                    if (item.description) product.description = item.description;
                    return product;
                }),
                deliveryCharge: parseFloat(deliveryCharge),
                totalAmount: totalAmount,
                orderDate: finalOrderDate,
                deliveryDate: finalDeliveryDate,
                hasOrderTime: !!orderTime,
                hasDeliveryTime: !!deliveryTime,
                source,
                notes,
                invoiceNumber,
            });

            toast({
                title: 'Order updated',
                description: 'Changes saved successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update order',
                variant: 'destructive',
            });
        }
    };

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!order) return;

        if (newStatus === 'completed' || newStatus === 'cancelled') {
            setTargetFeedbackStatus(newStatus);
            setIsEditingExperience(false);
            setExperienceOpen(true);
            return;
        }

        try {
            await updateOrder(orderId!, { status: newStatus });
            setOrder(prev => prev ? { ...prev, status: newStatus } : null);
            toast({
                title: 'Status updated',
                description: `Order marked as ${newStatus}`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update status',
                variant: 'destructive',
            });
        }
    };

    const handleExperienceSubmit = async (rating: number, comment: string) => {
        if (!orderId || !order) return;

        try {
            if (isEditingExperience && experience) {
                // Update existing experience
                await updateExperience(experience.id, { rating, comment });
                setExperience(prev => prev ? { ...prev, rating, comment, updatedAt: new Date() } : null);
                toast({ title: 'Experience updated' });
            } else {
                // Create new experience & update status
                await createExperience({
                    rating,
                    comment,
                    orderId,
                    customerId: order.customerId,
                });
                await updateOrder(orderId, { status: targetFeedbackStatus });
                setOrder(prev => prev ? { ...prev, status: targetFeedbackStatus } : null);

                // Refresh experience
                const newExp = await getExperienceByOrderId(orderId);
                setExperience(newExp);

                toast({
                    title: 'Feedback recorded',
                    description: 'Status updated and feedback saved',
                });
            }
            setExperienceOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save feedback',
                variant: 'destructive',
            });
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (loading || customersLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
                <div className="flex flex-col items-center justify-center py-12">
                    <h2 className="text-xl font-semibold">Order not found</h2>
                    <Button variant="ghost" className="mt-4 gap-2" onClick={() => navigate('/orders')}>
                        <ArrowLeft className="h-4 w-4" /> Back to Orders
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2" onClick={() => navigate('/orders')}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this order?')) {
                                    await deleteOrder(orderId!);
                                    toast({ title: 'Order deleted' });
                                    navigate('/orders');
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Generate Invoice"
                            onClick={() => {
                                const customer = customers.find(c => c.id === order.customerId);
                                if (customer) {
                                    generateInvoice(order, customer, profile);
                                } else {
                                    toast({
                                        title: 'Error',
                                        description: 'Customer information missing',
                                        variant: 'destructive',
                                    });
                                }
                            }}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Select value={order.status} onValueChange={(v) => handleStatusChange(v as OrderStatus)}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="bg-card rounded-xl border p-6 shadow-sm space-y-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold">Order Details</h1>
                        <p className="text-muted-foreground">
                            {customers.find(c => c.id === order.customerId)?.name || 'Unknown Customer'} • {customers.find(c => c.id === order.customerId)?.phone}
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Products</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addProductRow}
                                    className="h-8 gap-1"
                                >
                                    <Plus className="h-3 w-3" /> Add Product
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {orderItems.map((item, index) => (
                                    <div key={item.id} className="space-y-3 p-4 rounded-lg border bg-muted/20 relative group">
                                        {orderItems.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeProductRow(index)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 relative">
                                                <Label>Product Name *</Label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search or enter name..."
                                                        value={item.search}
                                                        onChange={(e) => handleProductSearch(index, e.target.value)}
                                                        className="pl-9"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                {/* Suggestions */}
                                                {item.showSuggestions && item.suggestions.length > 0 && (
                                                    <div className="absolute z-20 w-full bg-popover text-popover-foreground border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                                                        {item.suggestions.map(product => (
                                                            <div
                                                                key={product.id}
                                                                className="px-3 py-2 cursor-pointer hover:bg-muted text-sm flex justify-between items-center"
                                                                onClick={() => selectProduct(index, product)}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{product.name}</span>
                                                                    {product.code && <span className="text-xs text-muted-foreground">{product.code}</span>}
                                                                </div>
                                                                <span className="text-muted-foreground text-xs">${product.price.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-2">
                                                    <Label>Price *</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.price || ''}
                                                            onChange={(e) => handlePriceChange(index, e.target.value)}
                                                            className="pl-6"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Quantity</Label>
                                                    <div className="flex items-center">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-r-none border-r-0"
                                                            onClick={() => updateQuantity(index, -1)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityManual(index, e.target.value)}
                                                            className="h-10 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-l-none border-l-0"
                                                            onClick={() => updateQuantity(index, 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Details (Optional)</Label>
                                            <Input
                                                placeholder="Color, size, etc."
                                                value={item.description || ''}
                                                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <div className="flex justify-between items-center px-2">
                                    <Label htmlFor="deliveryCharge">Delivery Charge</Label>
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                        <Input
                                            id="deliveryCharge"
                                            type="number"
                                            step="0.01"
                                            value={deliveryCharge}
                                            onChange={(e) => setDeliveryCharge(e.target.value)}
                                            className="pl-6 text-right"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center px-2 py-2 bg-primary/5 rounded-md">
                                    <span className="font-semibold text-lg">Total Amount</span>
                                    <span className="font-bold text-xl text-primary">${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Source</Label>
                                <Select value={source} onValueChange={(v) => setSource(v as OrderSource)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="messenger">Messenger</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Invoice Number</Label>
                                <Input
                                    value={invoiceNumber}
                                    readOnly
                                    className="bg-muted text-muted-foreground cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Order Date & Time</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(orderDate, "PPP")}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={orderDate} onSelect={(d) => d && setOrderDate(d)} />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        value={orderTime}
                                        onChange={(e) => setOrderTime(e.target.value)}
                                        className="w-[120px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Delivery Date & Time</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(deliveryDate, "PPP")}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={deliveryDate} onSelect={(d) => d && setDeliveryDate(d)} />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        value={deliveryTime}
                                        onChange={(e) => setDeliveryTime(e.target.value)}
                                        className="w-[120px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="No notes provided"
                            />
                        </div>
                    </div>
                </div>

                {experience && (
                    <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 space-y-4 animate-fade-in relative group">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                                setIsEditingExperience(true);
                                setExperienceOpen(true);
                            }}
                        >
                            Edit
                        </Button>
                        <div className="flex items-center gap-2 text-primary">
                            <MessageSquare className="h-5 w-5" />
                            <h2 className="font-semibold text-lg">
                                {order.status === 'cancelled' ? 'Cancellation Feedback' : 'Completion Experience'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "h-5 w-5",
                                        i < experience.rating ? "fill-primary text-primary" : "text-primary/20"
                                    )}
                                />
                            ))}
                        </div>

                        {experience.comment && (
                            <p className="text-foreground italic">"{experience.comment}"</p>
                        )}

                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-muted-foreground">
                                Recorded on {format(experience.createdAt, 'PPP p')}
                            </p>
                            {experience.updatedAt && format(experience.updatedAt, 'T') !== format(experience.createdAt, 'T') && (
                                <p className="text-[10px] text-muted-foreground italic">
                                    Last updated {format(experience.updatedAt, 'PPP p')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <ExperienceDialog
                    open={experienceOpen}
                    onOpenChange={setExperienceOpen}
                    order={order}
                    customerName={customers.find(c => c.id === order?.customerId)?.name}
                    targetStatus={targetFeedbackStatus}
                    initialRating={isEditingExperience ? experience?.rating : 0}
                    initialComment={isEditingExperience ? experience?.comment : ''}
                    isEditing={isEditingExperience}
                    onSubmit={handleExperienceSubmit}
                    isSubmitting={isUpdating || experienceLoading}
                />
            </div>
        </DashboardLayout>
    );
}
