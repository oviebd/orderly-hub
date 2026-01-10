import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Customer, Order } from '@/types';
import { Star, Phone, Calendar, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface CustomerDialogProps {
  customer: Customer | null;
  orders: Order[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCustomer: (customerId: string, updates: Partial<Customer>) => void;
}

export function CustomerDialog({ customer, orders, open, onOpenChange, onUpdateCustomer }: CustomerDialogProps) {
  const [rating, setRating] = useState(customer?.rating || 0);
  const [comment, setComment] = useState(customer?.comment || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!customer) return null;

  const customerOrders = orders.filter(o => o.customerId === customer.id);

  const handleSave = () => {
    onUpdateCustomer(customer.id, { rating, comment });
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Customer Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Customer Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl font-semibold text-primary">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{customer.name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Customer since {format(customer.createdAt, 'MMM yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Customer Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setRating(star);
                    setIsEditing(true);
                  }}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      star <= rating
                        ? "fill-accent text-accent"
                        : "text-muted hover:text-accent/50"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Private Notes */}
          <div className="space-y-2">
            <Label htmlFor="comment">Private Notes</Label>
            <Textarea
              id="comment"
              placeholder="Add notes about this customer..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setIsEditing(true);
              }}
              className="min-h-[80px] resize-none"
            />
          </div>

          {isEditing && (
            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          )}

          {/* Order History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <Label>Order History ({customerOrders.length})</Label>
            </div>
            
            {customerOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {customerOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{order.productDetails}</p>
                        <p className="text-muted-foreground">
                          {format(order.createdAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.price.toFixed(2)}</p>
                        <Badge variant={order.status} className="mt-1">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
