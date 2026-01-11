import { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBusinessRootPath } from '@/lib/utils';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Product } from '@/types';

export function useFirebaseProducts() {
    const { user, profile } = useFirebaseAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Helper to get collection ref
    const getCollectionRef = () => {
        if (!profile?.businessName || !profile?.email) return null;
        const rootPath = getBusinessRootPath(profile.businessName, profile.email);
        return collection(db, rootPath, 'products');
    };

    useEffect(() => {
        if (!user || !profile) {
            setProducts([]);
            setIsLoading(false);
            return;
        }

        const productsRef = getCollectionRef();
        if (!productsRef) {
            setIsLoading(false);
            return;
        }

        const q = query(
            productsRef,
            where('businessId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Product[];
            setProducts(productsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching products: ", error);
            setError(error as Error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, profile]);

    const createProduct = async (productData: { name: string; price: number; details: string }) => {
        if (!user || !profile) throw new Error('Not authenticated');
        const productsRef = getCollectionRef();
        if (!productsRef) throw new Error('Could not determine storage path');

        await addDoc(productsRef, {
            businessId: user.uid,
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    };

    return {
        products,
        isLoading,
        error,
        createProduct
    };
}
