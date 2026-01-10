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
  serverTimestamp,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Customer } from '@/types';

export function useFirebaseCustomers() {
  const { user } = useFirebaseAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    const customersRef = collection(db, 'customers');
    const q = query(
      customersRef,
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const customersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ownerId: data.ownerId,
            phone: data.phone,
            name: data.name,
            rating: data.rating || 0,
            comment: data.comment || '',
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Customer;
        });
        setCustomers(customersData);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching customers:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'ownerId'>) => {
    if (!user) throw new Error('Not authenticated');
    setIsCreating(true);

    // Normalize phone: keep only digits
    const normalizedPhone = customer.phone.replace(/\D/g, '');
    if (!normalizedPhone) throw new Error('Invalid phone number');

    try {
      const customerRef = doc(db, 'customers', normalizedPhone);
      const docSnap = await getDoc(customerRef);

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: existingData.ownerId,
          phone: existingData.phone,
          name: existingData.name,
          rating: existingData.rating || 0,
          comment: existingData.comment || '',
          createdAt: existingData.createdAt?.toDate() || new Date(),
        } as Customer;
      }

      const newCustomerData = {
        ownerId: user.uid,
        phone: customer.phone, // Store original format for display
        name: customer.name,
        rating: customer.rating,
        comment: customer.comment,
        createdAt: serverTimestamp(),
      };

      await setDoc(customerRef, newCustomerData);

      return {
        id: normalizedPhone,
        ownerId: user.uid,
        phone: customer.phone,
        name: customer.name,
        rating: customer.rating,
        comment: customer.comment,
        createdAt: new Date(),
      } as Customer;
    } finally {
      setIsCreating(false);
    }
  };

  const updateCustomer = async ({ customerId, updates }: { customerId: string; updates: Partial<Customer> }) => {
    setIsUpdating(true);
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.rating !== undefined && { rating: updates.rating }),
        ...(updates.comment !== undefined && { comment: updates.comment }),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const findCustomerByPhone = (phone: string) => {
    return customers.find(c => c.phone === phone);
  };

  return {
    customers,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    findCustomerByPhone,
    isCreating,
    isUpdating,
  };
}
