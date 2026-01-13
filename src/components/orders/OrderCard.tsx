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
import { useNavigate } from 'react-router-dom';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onViewCustomer: (customerId: string) => void;
  customerName?: string;
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

function formatDateTime(date: Date, hasTime: boolean): string {
  const datePart = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d');
  return hasTime ? `${datePart} at ${format(date, 'h:mm a')}` : datePart;
}

export function OrderCard({ order, onStatusChange, onViewCustomer, customerName }: OrderCardProps) {
  const navigate = useNavigate();
  const SourceIcon = sourceIcons[order.source];
  const isOverdue = isPast(order.deliveryDate) && order.status === 'pending';

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on a button or menu
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/orders/${order.id}`);
  };

  return (
    <Card
      className="group relative overflow-hidden p-4 transition-all hover:shadow-md cursor-pointer animate-fade-in"
      onClick={handleCardClick}
    >
      {/* Status indicator bar */}
      <div
        className={`absolute left-0 top-0 h-full w-1 ${order.status === 'pending' ? 'bg-status-pending' :
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
              <h3 className="font-semibold truncate">{customerName || 'Unknown Customer'}</h3>
              <Badge variant={order.source}>{sourceLabels[order.source]}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {order.products.length} {order.products.length === 1 ? 'item' : 'items'}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card" onClick={(e) => e.stopPropagation()}>
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
        <div className="mt-3 space-y-1">
          {order.products.map((p, i) => (
            <div key={i} className="text-sm flex justify-between gap-2">
              <span className="text-foreground truncate">
                {p.name} <span className="text-muted-foreground text-xs">x{p.quantity}</span>
              </span>
              <span className="text-muted-foreground text-xs shrink-0">${(p.price * p.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.deliveryCharge > 0 && (
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Delivery Charge</span>
              <span>${order.deliveryCharge.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <p className="mt-2 text-sm text-muted-foreground italic">"{order.notes}"</p>
        )}

        {/* Footer */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">Delivery:</span>
              <span>{formatDateTime(order.deliveryDate, order.hasDeliveryTime)}</span>
              {isOverdue && <span className="text-[10px] ml-1 uppercase font-bold">(Overdue)</span>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">Ordered:</span>
              <span>{formatDateTime(order.orderDate, order.hasOrderTime)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</span>
            <Badge variant={order.status}>{statusLabels[order.status]}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
