// AdminStatsView.tsx - Version Standalone
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

// Types standalone (sans Firebase)
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

interface AdminStatsViewProps {
    orderStats: {
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        pendingOrders: number;
    };
    orders: Order[];
    getOrdersByStatus: (status: Order['status']) => Order[];
}

const AdminStatsView: React.FC<AdminStatsViewProps> = ({
                                                           orderStats,
                                                           orders,
                                                           getOrdersByStatus
                                                       }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gray-900/90 border-gray-700 shadow-xl">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-500">{orderStats.totalOrders}</div>
                        <div className="text-sm text-gray-400">Commandes aujourd'hui</div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900/90 border-gray-700 shadow-xl">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-cyan-500">{orderStats.totalRevenue.toFixed(2)} DH</div>
                        <div className="text-sm text-gray-400">Chiffre d'affaires</div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900/90 border-gray-700 shadow-xl">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">{orderStats.deliveredOrders}</div>
                        <div className="text-sm text-gray-400">Commandes livrées</div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900/90 border-gray-700 shadow-xl">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-500">{orderStats.pendingOrders}</div>
                        <div className="text-sm text-gray-400">En cours</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gray-900/90 border-gray-700 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 size={24} className="text-green-400" />
                        Récapitulatif du jour
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-white mb-2">💰 Résumé financier</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Total des ventes :</span>
                                    <span className="text-yellow-500 font-medium">{orderStats.totalRevenue.toFixed(2)} DH</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Commandes traitées :</span>
                                    <span className="text-white font-medium">{orderStats.deliveredOrders}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Moyenne par commande :</span>
                                    <span className="text-white font-medium">
                                        {orderStats.totalOrders > 0 ? (orderStats.totalRevenue / orderStats.totalOrders).toFixed(2) : '0'} DH
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-2">📊 Statistiques commandes</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Total commandes :</span>
                                    <span className="text-white">{orders.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">En attente :</span>
                                    <span className="text-yellow-500">{getOrdersByStatus('pending').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">En préparation :</span>
                                    <span className="text-blue-500">{getOrdersByStatus('preparing').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Prêtes :</span>
                                    <span className="text-green-500">{getOrdersByStatus('ready').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminStatsView;