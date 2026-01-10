import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Order, OrderStatus, OrderSource } from '@/types';

export function useFirebaseOrders() {
  const { user } = useFirebaseAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ownerId: data.ownerId,
            customerId: data.customerId || '',
            phone: data.phone,
            customerName: data.customerName,
            productDetails: data.productDetails,
            price: Number(data.price),
            deliveryDate: data.deliveryDate?.toDate() || new Date(),
            status: data.status as OrderStatus,
            source: data.source as OrderSource,
            notes: data.notes || '',
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Order;
        });
        setOrders(ordersData);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    setIsCreating(true);

    try {
      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, {
        ownerId: user.uid,
        customerId: order.customerId || null,
        phone: order.phone,
        customerName: order.customerName,
        productDetails: order.productDetails,
        price: order.price,
        deliveryDate: order.deliveryDate,
        status: order.status,
        source: order.source,
        notes: order.notes,
        createdAt: serverTimestamp(),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateOrderStatus = async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
    setIsUpdating(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    orders,
    isLoading,
    error,
    createOrder,
    updateOrderStatus,
    isCreating,
    isUpdating,
  };
}
