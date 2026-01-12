import { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    addDoc,
    serverTimestamp,
    getDocs,
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
    setDoc
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
            where('businessId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Product[];

            // Client side sort
            productsData.sort((a, b) => {
                const dateA = a.createdAt?.getTime() || 0;
                const dateB = b.createdAt?.getTime() || 0;
                return dateB - dateA;
            });

            setProducts(productsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching products: ", error);
            setError(error as Error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, profile]);

    const createProduct = async (productData: {
        name: string;
        price: number;
        details: string;
        code?: string;
        ownerId?: string;
        productId?: string;
        createdAt?: Date;
    }) => {
        if (!user || !profile) throw new Error('Not authenticated');
        const productsRef = getCollectionRef();
        if (!productsRef) throw new Error('Could not determine storage path');

        // Determine if we use a specific ID or generate one
        const productDocRef = productData.productId
            ? doc(productsRef, productData.productId)
            : doc(productsRef);

        const actualProductId = productDocRef.id;

        // Check for unique code if provided (exclude current product if updating)
        if (productData.code) {
            const formattedQuery = query(productsRef,
                where('code', '==', productData.code),
                where('businessId', '==', user.uid)
            );
            const snapshot = await getDocs(formattedQuery);
            const duplicates = snapshot.docs.filter(d => d.id !== actualProductId);
            if (duplicates.length > 0) {
                throw new Error(`Product with code "${productData.code}" already exists.`);
            }
        }

        // Check for existing doc to handle createdAt default
        const docSnap = await getDoc(productDocRef);
        const data: any = {
            businessId: user.uid,
            ownerId: productData.ownerId || user.uid,
            productId: actualProductId,
            productName: productData.name,
            name: productData.name,
            price: Number(productData.price),
            details: productData.details || '',
            code: productData.code || null,
            updatedAt: serverTimestamp(),
        };

        if (!docSnap.exists()) {
            // New product: default createdAt to current time if missing
            data.createdAt = productData.createdAt || serverTimestamp();
        } else if (productData.createdAt) {
            // Updating existing product: only update createdAt if provided
            data.createdAt = productData.createdAt;
        }

        await setDoc(productDocRef, data, { merge: true });
    };

    const updateProduct = async (productId: string, updates: Partial<Product>) => {
        if (!user || !profile) throw new Error('Not authenticated');
        const productRef = getDocRef(productId);
        if (!productRef) throw new Error('Could not determine storage path');

        // If code is being updated, check uniqueness (excluding current product)
        if (updates.code) {
            const productsRef = getCollectionRef();
            if (productsRef) {
                const formattedQuery = query(productsRef,
                    where('code', '==', updates.code),
                    where('businessId', '==', user.uid)
                );
                const snapshot = await getDocs(formattedQuery);
                // Check if found doc is NOT the one we are updating
                const duplicateParams = snapshot.docs.filter(d => d.id !== productId);
                if (duplicateParams.length > 0) {
                    throw new Error(`Product with code "${updates.code}" already exists.`);
                }
            }
        }

        const firestoreUpdates = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        // Update productName if name is updated, for consistency
        if (updates.name) {
            (firestoreUpdates as any).productName = updates.name;
        }

        // Clean undefined
        Object.keys(firestoreUpdates).forEach(key => (firestoreUpdates as any)[key] === undefined && delete (firestoreUpdates as any)[key]);

        await updateDoc(productRef, firestoreUpdates);
    };

    const getDocRef = (id: string) => {
        if (!profile?.businessName || !profile?.email) return null;
        const rootPath = getBusinessRootPath(profile.businessName, profile.email);
        return doc(db, rootPath, 'products', id);
    };

    const deleteProduct = async (productId: string) => {
        const productRef = getDocRef(productId);
        if (!productRef) throw new Error('Could not determine storage path');

        try {
            await deleteDoc(productRef);
        } catch (err) {
            console.error("Error deleting product:", err);
            throw err;
        }
    };

    return {
        products,
        isLoading,
        error,
        createProduct,
        updateProduct,
        deleteProduct
    };
}
