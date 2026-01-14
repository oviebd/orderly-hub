import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PlanDefinition {
    id: string;
    name: string;
    price: number;
    capabilities: {
        canAddOrder: boolean;
        canAddCustomer: boolean;
        canAddProducts: boolean;
        hasExportImportOption: boolean;
        maxOrderNumber: number;
        maxCustomerNumber: number;
        maxProductNumber: number;
    };
}

export function useFirebasePlans() {
    const [plans, setPlans] = useState<PlanDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoading(true);
                setError(null);

                const plansSnapshot = await getDocs(collection(db, 'Plan'));
                const plansData = plansSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as PlanDefinition));

                setPlans(plansData);
            } catch (err) {
                console.error('Error fetching plans:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    return { plans, loading, error };
}
