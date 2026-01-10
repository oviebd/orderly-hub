import { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Experience } from '@/types';

export function useFirebaseExperiences() {
    const { user } = useFirebaseAuth();
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setExperiences([]);
            setIsLoading(false);
            return;
        }

        const experiencesRef = collection(db, 'experiences');
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
    }, [user]);

    return {
        experiences,
        isLoading,
        error,
    };
}
