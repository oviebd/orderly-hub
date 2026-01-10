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
import { CalendarIcon, Loader2, ArrowLeft, Save, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order, OrderSource, Experience } from '@/types';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseExperience } from '@/hooks/useFirebaseExperience';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ExperienceDialog } from '@/components/orders/ExperienceDialog';
import { OrderStatus } from '@/types';

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { profile, signOut } = useFirebaseAuth();
    const { getOrderById, updateOrder, isUpdating } = useFirebaseOrders();
    const { getExperienceByOrderId, createExperience, updateExperience, isLoading: experienceLoading } = useFirebaseExperience();
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [experienceOpen, setExperienceOpen] = useState(false);
    const [targetFeedbackStatus, setTargetFeedbackStatus] = useState<OrderStatus>('delivered');
    const [isEditingExperience, setIsEditingExperience] = useState(false);

    // Form state
    const [productDetails, setProductDetails] = useState('');
    const [price, setPrice] = useState('');
    const [orderDate, setOrderDate] = useState<Date>(new Date());
    const [orderTime, setOrderTime] = useState('');
    const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
    const [deliveryTime, setDeliveryTime] = useState('');
    const [source, setSource] = useState<OrderSource>('whatsapp');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        async function loadData() {
            if (!orderId) return;

            const orderData = await getOrderById(orderId);
            if (orderData) {
                setOrder(orderData);
                setProductDetails(orderData.productDetails);
                setPrice(orderData.price.toString());
                setOrderDate(orderData.orderDate);
                setOrderTime(orderData.hasOrderTime ? format(orderData.orderDate, 'HH:mm') : '');
                setDeliveryDate(orderData.deliveryDate);
                setDeliveryTime(orderData.hasDeliveryTime ? format(orderData.deliveryDate, 'HH:mm') : '');
                setSource(orderData.source);
                setNotes(orderData.notes);

                if (orderData.status === 'delivered' || orderData.status === 'cancelled') {
                    const expData = await getExperienceByOrderId(orderId);
                    setExperience(expData);
                }
            }
            setLoading(false);
        }

        loadData();
    }, [orderId]);

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
                productDetails,
                price: parseFloat(price),
                orderDate: finalOrderDate,
                deliveryDate: finalDeliveryDate,
                hasOrderTime: !!orderTime,
                hasDeliveryTime: !!deliveryTime,
                source,
                notes,
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

        if (newStatus === 'delivered' || newStatus === 'cancelled') {
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

    if (loading) {
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
                    <Button variant="ghost" className="mt-4 gap-2" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <Select value={order.status} onValueChange={(v) => handleStatusChange(v as OrderStatus)}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
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
                        <p className="text-muted-foreground">{order.customerName} • {order.phone}</p>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label>Product Details</Label>
                            <Textarea
                                value={productDetails}
                                onChange={(e) => setProductDetails(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="pl-7"
                                    />
                                </div>
                            </div>
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
                                {order.status === 'cancelled' ? 'Cancellation Feedback' : 'Delivery Experience'}
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
