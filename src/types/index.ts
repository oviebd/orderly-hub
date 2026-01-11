export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderSource = 'whatsapp' | 'messenger' | 'phone';

export interface Customer {
  id: string;
  ownerId: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Order {
  id: string;
  ownerId: string;
  customerId: string;
  phone: string;
  productDetails: string;
  price: number;
  orderDate: Date;
  deliveryDate: Date;
  hasOrderTime: boolean;
  hasDeliveryTime: boolean;
  status: OrderStatus;
  source: OrderSource;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  businessName: string;
  phone?: string;
  userName?: string;
  email: string;
  plan: 'free' | 'paid';
  createdAt: Date;
  businessAddress?: string;
  socialLinks?: {
    whatsapp?: string;
    facebook?: string;
    youtube?: string;
  };
}

export interface Experience {
  id: string;
  rating: number;
  comment: string;
  orderId: string;
  ownerId: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  price: number;
  details?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

