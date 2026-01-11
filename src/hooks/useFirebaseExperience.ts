import { useState } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBusinessRootPath } from '@/lib/utils';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Experience } from '@/types';

export function useFirebaseExperience() {
    const { user, profile } = useFirebaseAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Helper to get collection ref
    const getCollectionRef = () => {
        if (!profile?.businessName || !profile?.email) return null;
        const rootPath = getBusinessRootPath(profile.businessName, profile.email);
        return collection(db, rootPath, 'experiences');
    };

    // Helper to get doc ref
    const getDocRef = (id: string) => {
        if (!profile?.businessName || !profile?.email) return null;
        const rootPath = getBusinessRootPath(profile.businessName, profile.email);
        return doc(db, rootPath, 'experiences', id);
    };

    const createExperience = async (experience: Omit<Experience, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !profile) throw new Error('Not authenticated');
        const experienceRef = getCollectionRef();
        if (!experienceRef) throw new Error('Could not determine storage path');

        setIsLoading(true);

        try {
            await addDoc(experienceRef, {
                ...experience,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getExperienceByOrderId = async (orderId: string) => {
        const experienceRef = getCollectionRef();
        if (!experienceRef) return null;

        const q = query(experienceRef, where('orderId', '==', orderId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        } as Experience;
    };

    const updateExperience = async (experienceId: string, updates: Partial<Experience>) => {
        const expRef = getDocRef(experienceId);
        if (!expRef) throw new Error('Could not determine storage path');

        setIsLoading(true);
        try {
            await updateDoc(expRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createExperience,
        updateExperience,
        getExperienceByOrderId,
        isLoading,
    };
}
