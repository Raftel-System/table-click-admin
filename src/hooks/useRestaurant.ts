// src/hooks/useRestaurant.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface RestaurantConfig {
    nom: string;
    devise: string;
    theme: string;
    adresse: string;
    telephone: string;
    horaires: Record<string, any>;
}

export interface Restaurant {
    id: string;
    config: RestaurantConfig;
}

export const useRestaurant = (slug: string) => {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Créer la référence vers le document de configuration
                const configRef = doc(db, 'restaurants', slug, 'settings', 'config');

                // Récupérer le document
                const configSnap = await getDoc(configRef);

                if (configSnap.exists()) {
                    const configData = configSnap.data() as RestaurantConfig;

                    setRestaurant({
                        id: slug,
                        config: configData
                    });
                } else {
                    setError(`Restaurant "${slug}" not found`);
                }
            } catch (err) {
                console.error('Error fetching restaurant:', err);
                setError('Failed to fetch restaurant data');
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurant();
    }, [slug]);

    return { restaurant, loading, error };
};

// Hook pour vérifier si un restaurant existe
export const useRestaurantExists = (slug: string) => {
    const [exists, setExists] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkRestaurant = async () => {
            if (!slug) {
                setChecking(false);
                return;
            }

            try {
                setChecking(true);
                const configRef = doc(db, 'restaurants', slug, 'settings', 'config');
                const configSnap = await getDoc(configRef);
                setExists(configSnap.exists());
            } catch (err) {
                console.error('Error checking restaurant:', err);
                setExists(false);
            } finally {
                setChecking(false);
            }
        };

        checkRestaurant();
    }, [slug]);

    return { exists, checking };
};