// src/pages/AdminDashboard.tsx - Version avec commandes temps réel
import React, { useState } from 'react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { useOrders } from '@/hooks/useOrders';
import { RestaurantProvider, useRestaurantContext } from '@/contexts/RestaurantContext';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AdminOrdersView from '@/components/admin/AdminOrdersView';
import AdminStatsView from '@/components/admin/AdminStatsView';
import AdminMenuView from '@/components/admin/AdminMenuView';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import { useParams, useNavigate } from 'react-router-dom';
import {
    signOut,
} from 'firebase/auth';
import {auth} from "@/lib/firebase.ts";


interface MockUser {
    id: string;
    name: string;
    email: string;
    role: 'admin';
}

const AdminDashboardContent: React.FC = () => {
    const { restaurant } = useRestaurantContext();
    const [activeTab, setActiveTab] = useState<'orders' | 'stats' | 'menu'>('orders');
    const navigate = useNavigate();

    // Hook pour les commandes en temps réel
    const { orders, error: ordersError, getOrderStats } = useOrders(restaurant?.id || '');

    // Hooks pour le menu
    const {
        categories,
        loading: categoriesLoading,
        error: categoriesError,
    } = useMenuCategories(restaurant?.id || '');

    const {
        items,
        loading: itemsLoading,
        error: itemsError,
    } = useMenuItems(restaurant?.id || '');

    // Mock user basé sur le restaurant
    const mockUser: MockUser = {
        id: 'admin-1',
        name: 'Administrator',
        email: `admin@${restaurant?.id || 'restaurant'}.com`,
        role: 'admin'
    };

    const logout = async () => {
        try {
            // Confirmation utilisateur
            const confirmLogout = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
            if (!confirmLogout) return;

            // Déconnexion Firebase
            await signOut(auth);

            // Nettoyage localStorage
            localStorage.removeItem(`saved-orders-${restaurant?.id}`);

            // Redirection vers login
            navigate('/', { replace: true });

        } catch (error) {
            // Gestion d'erreur
            alert('Erreur lors de la déconnexion. Veuillez réessayer.');
        }
    };

    // Statistiques des commandes (temps réel)
    const orderStats = getOrderStats();

    // Stats menu
    const menuStats = {
        totalCategories: categories.length,
        totalItems: items.length,
        popularItems: items.filter(item => item.isPopular).length,
        specialItems: items.filter(item => item.isSpecial).length
    };

    // Fonction pour filtrer les commandes par statut (pour compatibilité avec AdminStatsView)
    const getOrdersByStatus = () => {
        // Puisqu'on n'a plus de système de statut, on peut simuler ou laisser vide
        return [];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
            {/* Navbar avec nom du restaurant depuis Firebase */}
            <AdminNavbar
                user={mockUser}
                logout={logout}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                orderStats={orderStats}
                menuStats={menuStats}
                hasMenuData={categories.length > 0 || items.length > 0}
                menuLoading={categoriesLoading || itemsLoading}
            />

            {/* Contenu principal */}
            <div className="container mx-auto px-4 py-6">
                {activeTab === 'stats' && (
                    <AdminStatsView
                        orderStats={orderStats}
                        orders={orders.map(order => ({
                            id: order.id,
                            customerInfo: {
                                name: order.mode === 'sur_place' ? `Table ${order.tableNumber}` : `Client ${order.numeroClient || 'EMPORTER'}`,
                                phone: '',
                                email: '',
                                address: order.mode === 'emporter' ? 'À emporter' : undefined
                            },
                            items: order.items.map(item => ({
                                name: item.nom,
                                price: item.prix || 0,
                                quantity: item.quantite
                            })),
                            total: order.total,
                            status: 'pending' as const, // Status fictif pour compatibilité
                            orderType: order.mode === 'sur_place' ? 'pickup' as const : 'delivery' as const,
                            specialInstructions: order.noteCommande,
                            createdAt: order.createdAt
                        }))}
                        getOrdersByStatus={getOrdersByStatus}
                    />
                )}

                {activeTab === 'orders' && (
                    <AdminOrdersView />
                )}

                {activeTab === 'menu' && (
                    <AdminMenuView />
                )}
            </div>

            {/* Indicateur d'erreur pour les commandes */}
            {ordersError && (
                <div className="fixed bottom-4 left-4 bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2 shadow-lg">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-400">Erreur commandes: {ordersError}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { restaurant, loading, error } = useRestaurant(restaurantSlug || '');

    // Écran de chargement
    if (loading) {
        return <LoadingScreen />;
    }

    // Gestion des erreurs (restaurant not found)
    if (error || !restaurant) {
        return <ErrorScreen error={error || 'Restaurant not found'} slug={restaurantSlug || ''} />;
    }

    return (
        <RestaurantProvider restaurant={restaurant} loading={loading} error={error}>
            <AdminDashboardContent />
        </RestaurantProvider>
    );
};

export default AdminDashboard;