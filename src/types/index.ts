export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderSource = 'whatsapp' | 'messenger' | 'phone';

export interface Customer {
  id: string;
  ownerId: string;
  phone: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  ownerId: string;
  customerId: string;
  phone: string;
  customerName?: string;
  productDetails: string;
  price: number;
  deliveryDate: Date;
  status: OrderStatus;
  source: OrderSource;
  notes: string;
  createdAt: Date;
}

export interface User {
  id: string;
  businessName: string;
  email: string;
  plan: 'free' | 'paid';
  createdAt: Date;
}
