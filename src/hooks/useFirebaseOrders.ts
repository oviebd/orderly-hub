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
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBusinessRootPath } from '@/lib/utils';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Order, OrderStatus, OrderSource } from '@/types';

export function useFirebaseOrders() {
  const { user, profile } = useFirebaseAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper to get collection ref
  const getCollectionRef = () => {
    if (!profile?.businessName || !profile?.email) return null;
    const rootPath = getBusinessRootPath(profile.businessName, profile.email);
    return collection(db, rootPath, 'orders');
  };

  // Helper to get doc ref
  const getDocRef = (id: string) => {
    if (!profile?.businessName || !profile?.email) return null;
    const rootPath = getBusinessRootPath(profile.businessName, profile.email);
    return doc(db, rootPath, 'orders', id);
  };

  useEffect(() => {
    if (!user || !profile) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const ordersRef = getCollectionRef();
    if (!ordersRef) {
      console.error("Could not determine storage path. Missing business name or email.");
      setIsLoading(false);
      return;
    }

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
            productDetails: data.productDetails,
            price: Number(data.price),
            orderDate: data.orderDate?.toDate() || data.createdAt?.toDate() || new Date(),
            deliveryDate: data.deliveryDate?.toDate() || new Date(),
            hasOrderTime: data.hasOrderTime || false,
            hasDeliveryTime: data.hasDeliveryTime || false,
            status: data.status as OrderStatus,
            source: data.source as OrderSource,
            notes: data.notes || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
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
  }, [user, profile]);

  const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !profile) throw new Error('Not authenticated');
    const ordersRef = getCollectionRef();
    if (!ordersRef) throw new Error('Could not determine storage path');

    setIsCreating(true);

    try {
      await addDoc(ordersRef, {
        ownerId: user.uid,
        customerId: order.customerId || null,
        phone: order.phone,
        productDetails: order.productDetails,
        price: order.price,
        orderDate: order.orderDate,
        deliveryDate: order.deliveryDate,
        hasOrderTime: order.hasOrderTime,
        hasDeliveryTime: order.hasDeliveryTime,
        status: order.status,
        source: order.source,
        notes: order.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateOrderStatus = async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
    const orderRef = getDocRef(orderId);
    if (!orderRef) throw new Error('Could not determine storage path');

    setIsUpdating(true);
    try {
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getOrderById = async (orderId: string) => {
    try {
      const orderRef = getDocRef(orderId);
      if (!orderRef) return null;

      const docSnap = await getDoc(orderRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: data.ownerId,
          customerId: data.customerId || '',
          phone: data.phone,
          productDetails: data.productDetails,
          price: Number(data.price),
          orderDate: data.orderDate?.toDate() || data.createdAt?.toDate() || new Date(),
          deliveryDate: data.deliveryDate?.toDate() || new Date(),
          hasOrderTime: data.hasOrderTime || false,
          hasDeliveryTime: data.hasDeliveryTime || false,
          status: data.status as OrderStatus,
          source: data.source as OrderSource,
          notes: data.notes || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      return null;
    }
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    const orderRef = getDocRef(orderId);
    if (!orderRef) throw new Error('Could not determine storage path');

    setIsUpdating(true);
    try {
      const firestoreUpdates: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      // Convert Date objects to server-friendly format if they exist
      if (updates.orderDate) firestoreUpdates.orderDate = updates.orderDate;
      if (updates.deliveryDate) firestoreUpdates.deliveryDate = updates.deliveryDate;

      await updateDoc(orderRef, firestoreUpdates);
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
    updateOrder,
    getOrderById,
    isCreating,
    isUpdating,
  };
}
