// src/contexts/RestaurantContext.tsx
import React, { createContext, useContext, type ReactNode } from 'react';
import type {Restaurant} from '@/hooks/useRestaurant';

interface RestaurantContextType {
    restaurant: Restaurant | null;
    loading: boolean;
    error: string | null;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
    children: ReactNode;
    restaurant: Restaurant | null;
    loading: boolean;
    error: string | null;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({
                                                                          children,
                                                                          restaurant,
                                                                          loading,
                                                                          error
                                                                      }) => {
    return (
        <RestaurantContext.Provider value={{ restaurant, loading, error }}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurantContext = () => {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurantContext must be used within a RestaurantProvider');
    }
    return context;
};