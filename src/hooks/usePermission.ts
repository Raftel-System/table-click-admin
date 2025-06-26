// src/hooks/usePermissions.ts
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface UserPermissions {
    canViewStats: boolean;
    canViewMenu: boolean;
    canViewFinancialData: boolean;
    canManageOrders: boolean;
    canCreateNewOrder: boolean;
    canViewDetailedOrderInfo: boolean;
}

export const usePermissions = (): UserPermissions => {
    const { user } = useAuth();

    return useMemo(() => {
        const isAdmin = user?.role === 'admin';

        return {
            canViewStats: isAdmin,
            canViewMenu: isAdmin,
            canViewFinancialData: isAdmin,
            canManageOrders: true, // Tous les utilisateurs connectés peuvent voir les commandes
            canCreateNewOrder: true, // Tous les utilisateurs connectés peuvent créer des commandes
            canViewDetailedOrderInfo: isAdmin, // Seuls les admins voient les détails complets
        };
    }, [user?.role]);
};