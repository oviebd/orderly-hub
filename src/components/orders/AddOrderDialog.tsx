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
import { CalendarIcon, Star, User, Search, MapPin, Package, Plus, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderSource, Customer, Product } from '@/types';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseProducts } from '@/hooks/useFirebaseProducts';

export interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: {
    customerId: string;
    products: {
      id: string;
      name: string;
      code?: string;
      quantity: number;
      price: number;
      description?: string;
    }[];
    deliveryCharge: number;
    totalAmount: number;
    orderDate: Date;
    deliveryDate: Date;
    hasOrderTime: boolean;
    hasDeliveryTime: boolean;
    source: OrderSource;
    notes: string;
    address?: string;
  }) => void;
  customers: Customer[];
}

export function AddOrderDialog({ open, onOpenChange, onSubmit, customers: initialCustomers }: AddOrderDialogProps) {
  // Local state for form
  const [phoneSearch, setPhoneSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  // Selected entities
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Multiple Products state
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
  }[]>([{
    id: '1',
    name: '',
    price: 0,
    quantity: 1,
    search: '',
    suggestions: [],
    showSuggestions: false
  }]);

  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [orderTime, setOrderTime] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliveryTime, setDeliveryTime] = useState('');
  const [source, setSource] = useState<OrderSource>('whatsapp');
  const [notes, setNotes] = useState('');

  // Local state for search suggestions
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);

  const { products } = useFirebaseProducts(); // Fetch products for search
  const { createCustomer, updateCustomer } = useFirebaseCustomers(); // Need actions to create/update customer

  const handlePhoneChange = (value: string) => {
    setPhoneSearch(value);
    const normalizedInput = value.replace(/\D/g, '');

    if (normalizedInput.length >= 2) {
      const matches = initialCustomers.filter(c => {
        const normalizedC = c.phone.replace(/\D/g, '');
        return normalizedC.includes(normalizedInput);
      });
      setPhoneSuggestions(matches);
      setShowPhoneSuggestions(true);
    } else {
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
    }

    // Reset selected customer if user changes input
    if (selectedCustomer) {
      setSelectedCustomer(null);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPhoneSearch(customer.phone);
    setCustomerName(customer.name);
    setAddress(customer.address || '');
    setShowPhoneSuggestions(false);
  };

  const handleProductSearch = (index: number, value: string) => {
    const newItems = [...orderItems];
    newItems[index].search = value;
    newItems[index].name = value; // Keep name in sync with search if not selected

    const searchLower = value.toLowerCase();
    if (searchLower.length >= 2) {
      const matches = products.filter(p =>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch || orderItems.some(i => !i.name || i.price <= 0) || !deliveryDate) return;

    let finalCustomerId = selectedCustomer?.id;

    // Handle Customer Creation/Update
    if (selectedCustomer) {
      // Update address if changed and currently empty in record
      if (address && !selectedCustomer.address) {
        await updateCustomer({ customerId: selectedCustomer.id, updates: { address } });
      }
    } else {
      // Create new customer
      try {
        const newCustomer = await createCustomer({
          phone: phoneSearch,
          name: customerName || 'New Customer',
          address: address,
          rating: 0,
          comment: '',
        });
        finalCustomerId = newCustomer.id;
      } catch (err) {
        console.error("Failed to create customer", err);
        return;
      }
    }

    if (!finalCustomerId) return;

    const finalOrderDate = orderTime
      ? new Date(`${format(orderDate, 'yyyy-MM-dd')}T${orderTime}`)
      : orderDate;

    const finalDeliveryDate = deliveryTime && deliveryDate
      ? new Date(`${format(deliveryDate, 'yyyy-MM-dd')}T${deliveryTime}`)
      : (deliveryDate || new Date());

    onSubmit({
      customerId: finalCustomerId,
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
      totalAmount,
      orderDate: finalOrderDate,
      deliveryDate: finalDeliveryDate,
      hasOrderTime: !!orderTime,
      hasDeliveryTime: !!deliveryTime,
      source,
      notes,
      address,
    });

    // Reset form
    setPhoneSearch('');
    setCustomerName('');
    setAddress('');
    setOrderItems([{
      id: '1',
      name: '',
      price: 0,
      quantity: 1,
      search: '',
      suggestions: [],
      showSuggestions: false
    }]);
    setDeliveryCharge('0');
    setDeliveryDate(undefined);
    setSource('whatsapp');
    setNotes('');
    setSelectedCustomer(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Customer Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" /> Customer Details
            </h3>

            <div className="space-y-2 relative">
              <Label htmlFor="phone">Phone *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="Search by phone..."
                  value={phoneSearch}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              {/* Phone Suggestions */}
              {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-popover text-popover-foreground border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                  {phoneSuggestions.map(customer => (
                    <div
                      key={customer.id}
                      className="px-3 py-2 cursor-pointer hover:bg-muted text-sm flex justify-between items-center"
                      onClick={() => selectCustomer(customer)}
                    >
                      <span>{customer.phone}</span>
                      <span className="text-muted-foreground text-xs">{customer.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  readOnly={!!selectedCustomer}
                  className={cn(selectedCustomer && "bg-muted")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Delivery Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Source Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" /> Order Source
            </h3>
            <div className="space-y-2">
              <Label>Source *</Label>
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

          {/* Product Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Products
              </h3>
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

            <div className="space-y-6">
              {orderItems.map((item, index) => (
                <div key={item.id} className="space-y-3 p-3 rounded-md border bg-background/50 relative group">
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
                      {/* Product Suggestions */}
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

          {/* Schedule Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                    className="w-[85px] px-2"
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
                    className="w-[85px] px-2"
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!phoneSearch || orderItems.some(i => !i.name || i.price <= 0) || !deliveryDate}>
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
