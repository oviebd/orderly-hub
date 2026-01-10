import { Order, Customer, OrderStatus, OrderSource } from '@/types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    ownerId: 'user1',
    phone: '+1234567890',
    name: 'Sarah Johnson',
    rating: 5,
    comment: 'Excellent customer, always pays on time',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    ownerId: 'user1',
    phone: '+1987654321',
    name: 'Mike Chen',
    rating: 4,
    comment: 'Regular customer, prefers morning delivery',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    ownerId: 'user1',
    phone: '+1555666777',
    name: 'Emily Davis',
    rating: 3,
    comment: 'Sometimes delays payment',
    createdAt: new Date('2024-03-10'),
  },
];

export const mockOrders: Order[] = [
  {
    id: '1',
    ownerId: 'user1',
    customerId: '1',
    phone: '+1234567890',
    customerName: 'Sarah Johnson',
    productDetails: '2x Chocolate Cake, 1x Vanilla Cupcakes (12pcs)',
    price: 85.00,
    deliveryDate: new Date(),
    status: 'pending',
    source: 'whatsapp',
    notes: 'Birthday celebration, add candles',
    createdAt: new Date(),
  },
  {
    id: '2',
    ownerId: 'user1',
    customerId: '2',
    phone: '+1987654321',
    customerName: 'Mike Chen',
    productDetails: 'Custom Wedding Cake - 3 tiers',
    price: 350.00,
    deliveryDate: new Date(Date.now() + 86400000 * 3),
    status: 'confirmed',
    source: 'phone',
    notes: 'White and gold theme',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    ownerId: 'user1',
    customerId: '3',
    phone: '+1555666777',
    customerName: 'Emily Davis',
    productDetails: '24x Assorted Cookies',
    price: 45.00,
    deliveryDate: new Date(Date.now() - 86400000),
    status: 'delivered',
    source: 'messenger',
    notes: '',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: '4',
    ownerId: 'user1',
    customerId: '1',
    phone: '+1234567890',
    customerName: 'Sarah Johnson',
    productDetails: '1x Red Velvet Cake',
    price: 55.00,
    deliveryDate: new Date(Date.now() + 86400000),
    status: 'pending',
    source: 'whatsapp',
    notes: 'Afternoon delivery preferred',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '5',
    ownerId: 'user1',
    customerId: '2',
    phone: '+1987654321',
    customerName: 'Mike Chen',
    productDetails: '6x Brownies',
    price: 25.00,
    deliveryDate: new Date(Date.now() - 86400000 * 5),
    status: 'cancelled',
    source: 'phone',
    notes: 'Customer cancelled due to change of plans',
    createdAt: new Date(Date.now() - 86400000 * 6),
  },
];

export const getOrdersByStatus = (orders: Order[], status: OrderStatus | 'all' | 'today'): Order[] => {
  if (status === 'all') return orders;
  if (status === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return orders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate >= today && deliveryDate < tomorrow;
    });
  }
  return orders.filter(order => order.status === status);
};

export const getStatusCounts = (orders: Order[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    today: orders.filter(o => {
      const deliveryDate = new Date(o.deliveryDate);
      return deliveryDate >= today && deliveryDate < tomorrow;
    }).length,
  };
};
