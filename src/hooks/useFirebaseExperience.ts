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
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Experience } from '@/types';

export function useFirebaseExperience() {
    const { user } = useFirebaseAuth();
    const [isLoading, setIsLoading] = useState(false);

    const createExperience = async (experience: Omit<Experience, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
        if (!user) throw new Error('Not authenticated');
        setIsLoading(true);

        try {
            const experienceRef = collection(db, 'experiences');
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
        const experienceRef = collection(db, 'experiences');
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
        setIsLoading(true);
        try {
            const expRef = doc(db, 'experiences', experienceId);
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
