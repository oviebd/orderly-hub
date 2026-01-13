import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Order, OrderStatus } from '@/types';
import {
  MessageCircle,
  Phone,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday, isTomorrow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onViewCustomer: (customerId: string) => void;
  onDelete?: (orderId: string) => void;
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

function formatShortDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export function OrderCard({ order, onStatusChange, onDelete, customerName }: OrderCardProps) {
  const navigate = useNavigate();
  const SourceIcon = sourceIcons[order.source];

  // Create a comma-separated product list
  const productList = order.products.map(p => `${p.name} x${p.quantity}`).join(', ');

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/orders/${order.id}`);
  };

  return (
    <div
      className="group relative flex items-center gap-4 p-3 bg-card rounded-lg border hover:shadow-md hover:border-primary/30 cursor-pointer transition-all"
      onClick={handleCardClick}
    >
      {/* Status Indicator */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${order.status === 'pending' ? 'bg-status-pending' :
            order.status === 'processing' ? 'bg-status-processing' :
              order.status === 'completed' ? 'bg-status-completed' :
                'bg-status-cancelled'
          }`}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 pl-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        {/* Row 1: Customer Name + Source | Status + Amount */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">{customerName || 'Unknown'}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <SourceIcon className="h-3 w-3" />
            <span>{sourceLabels[order.source]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-base font-bold font-mono">৳{order.totalAmount.toLocaleString()}</span>
          <Badge variant={order.status} className="text-[10px] px-2 py-0.5">
            {order.status}
          </Badge>
        </div>

        {/* Row 2: Products | Times */}
        <p className="text-xs text-muted-foreground truncate">
          {productList}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground justify-end">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatShortDate(order.orderDate)}
          </span>
          <span>→</span>
          <span className="font-medium text-foreground">
            {formatShortDate(order.deliveryDate)}
          </span>
        </div>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'processing')}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-status-processing" />
            Mark Processing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'completed')}>
            <Truck className="mr-2 h-4 w-4 text-status-completed" />
            Mark Completed
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onStatusChange(order.id, 'cancelled')}
            className="text-amber-600 focus:text-amber-600"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Order
          </DropdownMenuItem>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(order.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Order
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
