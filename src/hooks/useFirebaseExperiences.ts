import { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBusinessRootPath } from '@/lib/utils';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Experience } from '@/types';

export function useFirebaseExperiences() {
    const { user, profile } = useFirebaseAuth();
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Helper to get collection ref
    const getCollectionRef = () => {
        if (!profile?.businessName || !profile?.email) return null;
        const rootPath = getBusinessRootPath(profile.businessName, profile.email);
        return collection(db, rootPath, 'experiences');
    };

    useEffect(() => {
        if (!user || !profile) {
            setExperiences([]);
            setIsLoading(false);
            return;
        }

        const experiencesRef = getCollectionRef();
        if (!experiencesRef) {
            setIsLoading(false);
            return;
        }

        const q = query(
            experiencesRef,
            where('ownerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const experiencesData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        rating: data.rating,
                        comment: data.comment,
                        orderId: data.orderId,
                        ownerId: data.ownerId,
                        customerId: data.customerId,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
                    } as Experience;
                });
                setExperiences(experiencesData);
                setIsLoading(false);
            },
            (err) => {
                console.error('Error fetching experiences:', err);
                setError(err as Error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, profile]);

    return {
        experiences,
        isLoading,
        error,
    };
}
