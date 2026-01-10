import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderSource, Customer } from '@/types';

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: {
    phone: string;
    customerName: string;
    productDetails: string;
    price: number;
    orderDate: Date;
    deliveryDate: Date;
    hasOrderTime: boolean;
    hasDeliveryTime: boolean;
    source: OrderSource;
    notes: string;
  }) => void;
  customers: Customer[];
}

export function AddOrderDialog({ open, onOpenChange, onSubmit, customers }: AddOrderDialogProps) {
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [price, setPrice] = useState('');
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [orderTime, setOrderTime] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliveryTime, setDeliveryTime] = useState('');
  const [source, setSource] = useState<OrderSource>('whatsapp');
  const [notes, setNotes] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const normalizedInput = value.replace(/\D/g, '');

    // Look up customer by normalized phone
    if (normalizedInput.length >= 5) { // Only search if we have a reasonable length
      const customer = customers.find(c => {
        const normalizedC = c.phone.replace(/\D/g, '');
        return normalizedC === normalizedInput || c.id === normalizedInput;
      });

      if (customer) {
        setMatchedCustomer(customer);
        setCustomerName(customer.name);
      } else {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !productDetails || !price || !deliveryDate) return;

    const finalOrderDate = orderTime
      ? new Date(`${format(orderDate, 'yyyy-MM-dd')}T${orderTime}`)
      : orderDate;

    const finalDeliveryDate = deliveryTime && deliveryDate
      ? new Date(`${format(deliveryDate, 'yyyy-MM-dd')}T${deliveryTime}`)
      : (deliveryDate || new Date());

    onSubmit({
      phone,
      customerName,
      productDetails,
      price: parseFloat(price),
      orderDate: finalOrderDate,
      deliveryDate: finalDeliveryDate,
      hasOrderTime: !!orderTime,
      hasDeliveryTime: !!deliveryTime,
      source,
      notes,
    });

    // Reset form
    setPhone('');
    setCustomerName('');
    setProductDetails('');
    setPrice('');
    setDeliveryDate(undefined);
    setSource('whatsapp');
    setNotes('');
    setMatchedCustomer(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Customer Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Customer Phone *</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* Customer Match */}
            {matchedCustomer && (
              <div className="rounded-lg border bg-secondary/50 p-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{matchedCustomer.name}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < matchedCustomer.rating
                              ? "fill-accent text-accent"
                              : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {matchedCustomer.comment && (
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    "{matchedCustomer.comment}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Customer Name</Label>
                {matchedCustomer && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">
                    Existing Customer
                  </span>
                )}
              </div>
              <Input
                id="name"
                placeholder={matchedCustomer ? "" : "Optional"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                readOnly={!!matchedCustomer}
                className={cn(
                  matchedCustomer && "bg-muted/50 cursor-not-allowed border-dashed opacity-80"
                )}
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product Details *</Label>
              <Textarea
                id="product"
                placeholder="e.g., 2x Chocolate Cake, 1x Vanilla Cupcakes"
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={(v) => setSource(v as OrderSource)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Order Date *</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal px-3",
                          !orderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{orderDate ? format(orderDate, "PP") : "Select date"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card" align="start">
                      <Calendar
                        mode="single"
                        selected={orderDate}
                        onSelect={(d) => d && setOrderDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={orderTime}
                    onChange={(e) => setOrderTime(e.target.value)}
                    className="w-[110px] px-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery Date *</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal px-3",
                          !deliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{deliveryDate ? format(deliveryDate, "PP") : "Select date"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card" align="start">
                      <Calendar
                        mode="single"
                        selected={deliveryDate}
                        onSelect={setDeliveryDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-[110px] px-2"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!phone || !productDetails || !price || !deliveryDate}>
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
