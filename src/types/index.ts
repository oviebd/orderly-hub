export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderSource = 'whatsapp' | 'messenger' | 'phone';

export interface Customer {
  id: string; // Unique UUID
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
  businessId: string; // ID of the business account
  customerId: string;
  // phone removed as per request, linked via customerId
  productId?: string;
  productName: string;
  productDetails?: string;
  address?: string;
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
  ownerId: string; // User ID of the business owner
  businessId: string;
  code?: string; // Unique product code
  name: string;
  productName?: string;
  price: number;
  details?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

