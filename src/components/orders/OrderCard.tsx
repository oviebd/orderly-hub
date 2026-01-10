import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Order, OrderStatus } from '@/types';
import { 
  MessageCircle, 
  Phone, 
  Calendar, 
  Clock,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onViewCustomer: (customerId: string) => void;
}

const sourceIcons = {
  whatsapp: MessageCircle,
  messenger: MessageCircle,
  phone: Phone,
};

const sourceLabels = {
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
  phone: 'Phone',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatDeliveryDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d, yyyy');
}

export function OrderCard({ order, onStatusChange, onViewCustomer }: OrderCardProps) {
  const SourceIcon = sourceIcons[order.source];
  const isOverdue = isPast(order.deliveryDate) && order.status === 'pending';

  return (
    <Card className="group relative overflow-hidden p-4 transition-all hover:shadow-md animate-fade-in">
      {/* Status indicator bar */}
      <div 
        className={`absolute left-0 top-0 h-full w-1 ${
          order.status === 'pending' ? 'bg-status-pending' :
          order.status === 'confirmed' ? 'bg-status-confirmed' :
          order.status === 'delivered' ? 'bg-status-delivered' :
          'bg-status-cancelled'
        }`}
      />
      
      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{order.customerName || order.phone}</h3>
              <Badge variant={order.source}>{sourceLabels[order.source]}</Badge>
            </div>
            <button 
              onClick={() => onViewCustomer(order.customerId)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {order.phone}
            </button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card">
              <DropdownMenuItem onClick={() => onStatusChange(order.id, 'confirmed')}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-status-confirmed" />
                Mark Confirmed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(order.id, 'delivered')}>
                <Truck className="mr-2 h-4 w-4 text-status-delivered" />
                Mark Delivered
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onStatusChange(order.id, 'cancelled')}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Product Details */}
        <p className="mt-3 text-sm text-foreground">{order.productDetails}</p>
        
        {/* Notes */}
        {order.notes && (
          <p className="mt-2 text-sm text-muted-foreground italic">"{order.notes}"</p>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              <Calendar className="h-4 w-4" />
              {formatDeliveryDate(order.deliveryDate)}
              {isOverdue && <span className="text-xs">(Overdue)</span>}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(order.createdAt, 'h:mm a')}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">${order.price.toFixed(2)}</span>
            <Badge variant={order.status}>{statusLabels[order.status]}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
