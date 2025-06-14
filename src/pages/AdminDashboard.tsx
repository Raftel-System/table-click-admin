// AdminDashboard.tsx
import React, { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AdminOrdersView from '@/components/admin/AdminOrdersView';
import AdminStatsView from '@/components/admin/AdminStatsView';
import AdminOrderModal from '@/components/admin/AdminOrderModal';
import { Card, CardContent } from '@/components/ui/card';

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
            { name: 'Express', price: 25, quantity: 1 },
            { name: 'Café Américain', price: 15, quantity: 2 }
        ],
        total: 55,
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
            { name: 'Tajine Agneau', price: 85, quantity: 1 }
        ],
        total: 85,
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
            { name: 'Couscous Royal', price: 120, quantity: 1 },
            { name: 'Thé à la menthe', price: 10, quantity: 2 }
        ],
        total: 140,
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
            { name: 'Pastilla Poisson', price: 45, quantity: 2 }
        ],
        total: 90,
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

const mockUser: MockUser = {
    id: 'admin-1',
    name: 'Administrator',
    email: 'admin@cafeo2ice.com',
    role: 'admin'
};

const AdminDashboard: React.FC = () => {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'stats'>('orders');
    const [isLoading, setIsLoading] = useState(false);

    // Simulation du logout
    const logout = () => {
        console.log('🚪 Déconnexion admin');
        // Dans un vrai projet, rediriger vers la page de login
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

    // Stats menu (vides car pas de gestion menu)
    const menuStats = {
        totalCategories: 0,
        totalItems: 0,
        popularItems: 0,
        specialItems: 0
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
                <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white text-lg font-semibold">Chargement du dashboard...</p>
                        <p className="text-gray-400 text-sm mt-2">Initialisation en cours</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
            {/* Navbar simplifiée (sans menu et livraison) */}
            <AdminNavbar
                user={mockUser}
                logout={logout}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                orderStats={orderStats}
                menuStats={menuStats}
                hasMenuData={false}
                menuLoading={false}
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

export default AdminDashboard;