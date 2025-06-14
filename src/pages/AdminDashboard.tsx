// src/pages/AdminDashboard.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { RestaurantProvider, useRestaurantContext } from '@/contexts/RestaurantContext';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AdminOrdersView from '@/components/admin/AdminOrdersView';
import AdminStatsView from '@/components/admin/AdminStatsView';
import AdminMenuView from '@/components/admin/AdminMenuView.tsx';
import AdminOrderModal from '@/components/admin/AdminOrderModal';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';

// Types pour les commandes (sans Firebase)
export interface Order {
    id: string;
    customerInfo: {
        name: string;
        phone: string;
        email: string;
        address?: string;
    };
    items: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
    total: number;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
    orderType: 'delivery' | 'pickup';
    specialInstructions?: string;
    createdAt: string;
}

// Données de test (remplace Firebase)
const mockOrders: Order[] = [
    {
        id: 'ORD-001',
        customerInfo: {
            name: 'Ahmed Bennani',
            phone: '+212 6XX XX XX XX',
            email: 'ahmed@email.com',
            address: 'Rue Mohammed V, Errachidia'
        },
        items: [
            { name: 'Express', price: 2.5, quantity: 1 },
            { name: 'Café Américain', price: 1.5, quantity: 2 }
        ],
        total: 5.5,
        status: 'pending',
        orderType: 'delivery',
        specialInstructions: 'Sans sucre pour le café',
        createdAt: new Date().toISOString()
    },
    {
        id: 'ORD-002',
        customerInfo: {
            name: 'Fatima Alaoui',
            phone: '+212 6YY YY YY YY',
            email: 'fatima@email.com'
        },
        items: [
            { name: 'Tajine Agneau', price: 8.5, quantity: 1 }
        ],
        total: 8.5,
        status: 'preparing',
        orderType: 'pickup',
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'ORD-003',
        customerInfo: {
            name: 'Mohamed Chakir',
            phone: '+212 6ZZ ZZ ZZ ZZ',
            email: 'mohamed@email.com',
            address: 'Avenue des FAR, Errachidia'
        },
        items: [
            { name: 'Couscous Royal', price: 12.0, quantity: 1 },
            { name: 'Thé à la menthe', price: 1.0, quantity: 2 }
        ],
        total: 14.0,
        status: 'ready',
        orderType: 'delivery',
        createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 'ORD-004',
        customerInfo: {
            name: 'Aicha Berrada',
            phone: '+212 6AA AA AA AA',
            email: 'aicha@email.com'
        },
        items: [
            { name: 'Pastilla Poisson', price: 4.5, quantity: 2 }
        ],
        total: 9.0,
        status: 'delivered',
        orderType: 'pickup',
        createdAt: new Date(Date.now() - 10800000).toISOString()
    }
];

// Mock auth context (remplace Firebase Auth)
interface MockUser {
    id: string;
    name: string;
    email: string;
    role: 'admin';
}

const AdminDashboardContent: React.FC = () => {
    const { toast } = useToast();
    const { restaurant } = useRestaurantContext();
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'stats' | 'menu'>('orders');

    // Hooks pour le menu
    const {
        categories,
        loading: categoriesLoading,
        error: categoriesError,
        addCategory,
        updateCategory,
        deleteCategory
    } = useMenuCategories(restaurant?.id || '');

    const {
        items,
        loading: itemsLoading,
        error: itemsError,
        addItem,
        updateItem,
        deleteItem,
        getItemsByCategory
    } = useMenuItems(restaurant?.id || '');

    // Mock user basé sur le restaurant
    const mockUser: MockUser = {
        id: 'admin-1',
        name: 'Administrator',
        email: `admin@${restaurant?.id || 'restaurant'}.com`,
        role: 'admin'
    };

    // Simulation du logout
    const logout = () => {
        console.log('🚪 Déconnexion admin');
        alert('Fonctionnalité de déconnexion à implémenter');
    };

    // Mise à jour du statut d'une commande
    const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            console.log('🔄 Mise à jour statut:', orderId, '→', newStatus);

            // Simulation d'une API call
            await new Promise(resolve => setTimeout(resolve, 500));

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }

            toast({
                title: "Statut mis à jour",
                description: `Commande ${orderId} → "${newStatus}"`,
            });

            console.log('✅ Statut mis à jour avec succès');
        } catch (error) {
            console.error('❌ Erreur mise à jour statut:', error);
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le statut",
                variant: "destructive",
            });
        }
    };

    // Filtrer les commandes par statut
    const getOrdersByStatus = (status: Order['status']) => {
        return orders.filter(order => order.status === status);
    };

    // Calculer les statistiques du jour
    const getTodayStats = () => {
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt).toDateString();
            return orderDate === today;
        });

        const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const deliveredOrders = todayOrders.filter(order => order.status === 'delivered');

        return {
            totalOrders: todayOrders.length,
            totalRevenue,
            deliveredOrders: deliveredOrders.length,
            pendingOrders: todayOrders.filter(order => order.status !== 'delivered').length
        };
    };

    const orderStats = getTodayStats();

    // Stats menu
    const menuStats = {
        totalCategories: categories.length,
        totalItems: items.length,
        popularItems: items.filter(item => item.isPopular).length,
        specialItems: items.filter(item => item.isSpecial).length
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
                        orders={orders}
                        getOrdersByStatus={getOrdersByStatus}
                    />
                )}

                {activeTab === 'orders' && (
                    <AdminOrdersView
                        orders={orders}
                        getOrdersByStatus={getOrdersByStatus}
                        onOrderSelect={setSelectedOrder}
                        onUpdateOrderStatus={handleUpdateOrderStatus}
                    />
                )}

                {activeTab === 'menu' && (
                    <AdminMenuView />
                )}
            </div>

            {/* Modal détail commande */}
            {selectedOrder && (
                <AdminOrderModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateStatus={handleUpdateOrderStatus}
                />
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