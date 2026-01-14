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
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBusinessRootPath } from '@/lib/utils';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Customer } from '@/types';

export function useFirebaseCustomers() {
  const { user, profile } = useFirebaseAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper to get collection ref
  const getCollectionRef = () => {
    if (!profile?.businessName || !profile?.email) return null;
    const rootPath = getBusinessRootPath(profile.businessName, profile.email);
    return collection(db, rootPath, 'customers');
  };

  // Helper to get doc ref
  const getDocRef = (id: string) => {
    if (!profile?.businessName || !profile?.email) return null;
    const rootPath = getBusinessRootPath(profile.businessName, profile.email);
    return doc(db, rootPath, 'customers', id);
  };

  useEffect(() => {
    if (!user || !profile) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    const customersRef = getCollectionRef();
    if (!customersRef) {
      setIsLoading(false);
      return;
    }

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
            email: data.email || '',
            address: data.address || '',
            rating: data.rating || 0,
            comment: data.comment || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || undefined,
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
  }, [user, profile]);

  const createCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'ownerId'> & { id?: string; ownerId?: string; createdAt?: Date; updatedAt?: Date }) => {
    if (!user || !profile) throw new Error('Not authenticated');

    const collectionRef = getCollectionRef();
    if (!collectionRef) throw new Error('Could not determine storage path');

    setIsCreating(true);

    try {
      // Capability Checks
      if (!profile.capabilities.canAddCustomer) {
        throw new Error('Customer creation is disabled for your account.');
      }

      if (customers.length >= profile.capabilities.maxCustomerNumber && !customer.id) {
        // Only check limit for NEW customers
        throw new Error(`Customer limit reached. Your current plan allows up to ${profile.capabilities.maxCustomerNumber} customers.`);
      }

      let customerRef;
      let isUpdate = false;

      if (customer.id) {
        customerRef = doc(collectionRef, customer.id);
        const docSnap = await getDoc(customerRef);
        isUpdate = docSnap.exists();
      } else {
        // Try to find by phone if no ID provided
        const q = query(collectionRef, where('phone', '==', customer.phone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          customerRef = querySnapshot.docs[0].ref;
          isUpdate = true;
        } else {
          // New customer, generate ID
          const newId = crypto.randomUUID();
          customerRef = doc(collectionRef, newId);
        }
      }

      const ownerIdToUse = customer.ownerId || user.uid;
      const data: any = {
        ownerId: ownerIdToUse,
        phone: customer.phone,
        name: customer.name,
        email: customer.email || '',
        address: customer.address || '',
        rating: customer.rating || 0,
        comment: customer.comment || '',
        updatedAt: customer.updatedAt || serverTimestamp(),
      };

      if (!isUpdate) {
        data.createdAt = customer.createdAt || serverTimestamp();
      } else if (customer.createdAt) {
        data.createdAt = customer.createdAt;
      }

      await setDoc(customerRef, data, { merge: true });

      return {
        id: customerRef.id,
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(),
      } as Customer;
    } finally {
      setIsCreating(false);
    }
  };

  const updateCustomer = async ({ customerId, updates }: { customerId: string; updates: Partial<Customer> }) => {
    const customerRef = getDocRef(customerId);
    if (!customerRef) throw new Error('Could not determine storage path');

    setIsUpdating(true);
    try {
      const firestoreUpdates: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Clean undefined values
      Object.keys(firestoreUpdates).forEach(key => {
        if (firestoreUpdates[key] === undefined) {
          delete firestoreUpdates[key];
        }
      });

      await updateDoc(customerRef, firestoreUpdates);
    } finally {
      setIsUpdating(false);
    }
  };

  const findCustomerByPhone = (inputPhone: string) => {
    const normalizedInput = inputPhone.replace(/\D/g, '');

    return customers.find(c => {
      const normalizedC = (c.phone || '').replace(/\D/g, '');

      // Exact match
      if (normalizedC === normalizedInput) return true;

      // Suffix match
      if (normalizedInput.length >= 8 && normalizedC.length >= 8) {
        return normalizedC.endsWith(normalizedInput) || normalizedInput.endsWith(normalizedC);
      }

      return false;
    });
  };

  const deleteCustomer = async (customerId: string) => {
    const customerRef = getDocRef(customerId);
    if (!customerRef) throw new Error('Could not determine storage path');

    try {
      await deleteDoc(customerRef);
    } catch (err) {
      console.error("Error deleting customer:", err);
      throw err;
    }
  };

  return {
    customers,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findCustomerByPhone,
    isCreating,
    isUpdating,
  };
}
