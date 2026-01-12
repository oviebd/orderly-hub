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

  const createCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'ownerId'> & { ownerId?: string; createdAt?: Date; updatedAt?: Date }) => {
    if (!user || !profile) throw new Error('Not authenticated');

    // Normalize phone: keep only digits
    const normalizedPhone = customer.phone.replace(/\D/g, '');
    if (!normalizedPhone) throw new Error('Invalid phone number');

    const collectionRef = getCollectionRef();
    if (!collectionRef) throw new Error('Could not determine storage path');

    setIsCreating(true);

    try {
      // Check for existing customer with same phone manually since ID is now UUID
      // This is a bit more expensive than direct ID lookup but necessary for UUID approach
      const q = query(collectionRef, where('phone', '==', customer.phone)); // Or use normalized if searching normalized
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Customer already exists, return existing
        const docSnap = querySnapshot.docs[0];
        const existingData = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: existingData.ownerId,
          phone: existingData.phone,
          name: existingData.name,
          email: existingData.email || '',
          address: existingData.address || '',
          rating: existingData.rating || 0,
          comment: existingData.comment || '',
          createdAt: existingData.createdAt?.toDate() || new Date(),
          updatedAt: existingData.updatedAt?.toDate() || undefined,
        } as Customer;
      }

      // Generate new UUID-like ID
      const newId = crypto.randomUUID();
      const customerRef = getDocRef(newId);
      if (!customerRef) throw new Error('Could not determine storage path');

      const ownerIdToUse = customer.ownerId || user.uid;
      const createdAtToUse = customer.createdAt ? customer.createdAt : serverTimestamp();
      const updatedAtToUse = customer.updatedAt ? customer.updatedAt : serverTimestamp();

      const newCustomerData = {
        ownerId: ownerIdToUse,
        phone: customer.phone, // Store original format for display
        name: customer.name,
        email: customer.email || '',
        address: customer.address || '',
        rating: customer.rating,
        comment: customer.comment,
        createdAt: createdAtToUse,
        updatedAt: updatedAtToUse,
      };

      await setDoc(customerRef, newCustomerData);

      return {
        id: newId,
        ownerId: ownerIdToUse,
        phone: customer.phone,
        name: customer.name,
        email: customer.email || '',
        address: customer.address || '',
        rating: customer.rating,
        comment: customer.comment,
        createdAt: customer.createdAt || new Date(),
        updatedAt: customer.updatedAt || new Date(),
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
