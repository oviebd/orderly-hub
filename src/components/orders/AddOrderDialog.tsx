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
import { CalendarIcon, Star, User, Search, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderSource, Customer, Product } from '@/types';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseProducts } from '@/hooks/useFirebaseProducts';

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: {
    customerId: string; // Add customerId
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
  }) => void;
  customers: Customer[];
}

export function AddOrderDialog({ open, onOpenChange, onSubmit, customers: initialCustomers }: AddOrderDialogProps) {
  // Local state for form
  const [phoneSearch, setPhoneSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [price, setPrice] = useState('');
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [orderTime, setOrderTime] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliveryTime, setDeliveryTime] = useState('');
  const [source, setSource] = useState<OrderSource>('whatsapp');
  const [notes, setNotes] = useState('');

  // Local state for search suggestions
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Selected entities
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const handleProductSearch = (value: string) => {
    setProductSearch(value);
    const searchLower = value.toLowerCase();

    if (searchLower.length >= 2) {
      const matches = products.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.code && p.code.toLowerCase().includes(searchLower))
      );
      setProductSuggestions(matches);
      setShowProductSuggestions(true);
    } else {
      setProductSuggestions([]);
      setShowProductSuggestions(false);
    }

    if (selectedProduct) {
      setSelectedProduct(null);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setProductDetails(product.name);
    setPrice(product.price.toString());
    setShowProductSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch || !productSearch || !price || !deliveryDate) return;

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
      productId: selectedProduct?.id,
      productName: productSearch, // Use the search input as the name
      productDetails,
      price: parseFloat(price),
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
    setProductSearch('');
    setProductDetails('');
    setPrice('');
    setDeliveryDate(undefined);
    setSource('whatsapp');
    setNotes('');
    setSelectedCustomer(null);
    setSelectedProduct(null);
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

          {/* Product Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" /> Product Details
            </h3>

            <div className="space-y-2 relative">
              <Label htmlFor="productSearch">Product Name *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="productSearch"
                  placeholder="Search by name or code..."
                  value={productSearch}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              {/* Product Suggestions */}
              {showProductSuggestions && productSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-popover text-popover-foreground border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                  {productSuggestions.map(product => (
                    <div
                      key={product.id}
                      className="px-3 py-2 cursor-pointer hover:bg-muted text-sm flex justify-between items-center"
                      onClick={() => selectProduct(product)}
                    >
                      <span>{product.name}</span>
                      <span className="text-muted-foreground text-xs">{product.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDetails">Details (Optional)</Label>
              <Textarea
                id="productDetails"
                placeholder="Product description... (Optional)"
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                className="min-h-[60px] resize-none"
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
            <Button type="submit" className="flex-1" disabled={!phoneSearch || !productSearch || !price || !deliveryDate}>
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
