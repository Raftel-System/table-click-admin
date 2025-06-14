// AdminOrdersView.tsx - Version Standalone
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface AdminOrdersViewProps {
    orders: Order[];
    getOrdersByStatus: (status: Order['status']) => Order[];
    onOrderSelect: (order: Order) => void;
    onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
}

const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
                                                             getOrdersByStatus,
                                                             onOrderSelect,
                                                             onUpdateOrderStatus
                                                         }) => {
    return (
        <div className="space-y-4">
            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {(['pending', 'preparing', 'ready', 'delivered'] as const).map((status) => (
                    <div key={status} className="space-y-4">
                        <h3 className="font-semibold text-white text-center p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
                            {status === 'pending' && '🕒 En attente'}
                            {status === 'preparing' && '🍳 En préparation'}
                            {status === 'ready' && '✅ Prêtes'}
                            {status === 'delivered' && '🎉 Livrées'}
                            <Badge className="ml-2 bg-yellow-500 text-black">
                                {getOrdersByStatus(status).length}
                            </Badge>
                        </h3>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {getOrdersByStatus(status).map((order) => (
                                <Card
                                    key={order.id}
                                    className="bg-gray-900/90 border-gray-700 cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    onClick={() => onOrderSelect(order)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-yellow-500 text-sm">{order.id}</span>
                                            <Badge className={order.orderType === 'delivery' ? 'bg-cyan-500 text-black' : 'bg-gray-600 text-white'}>
                                                {order.orderType === 'delivery' ? '🛵' : '🏃'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1 text-xs">
                                            <p className="text-white">{order.customerInfo.name}</p>
                                            <p className="text-gray-400">{order.items.length} article{order.items.length > 1 ? 's' : ''}</p>
                                            <p className="text-yellow-500 font-medium">{order.total.toFixed(2)} DH</p>
                                            <p className="text-gray-500">
                                                {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        {status !== 'delivered' && (
                                            <div className="mt-3 space-y-1">
                                                {status === 'pending' && (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateOrderStatus(order.id, 'preparing');
                                                        }}
                                                        className="w-full text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 py-1"
                                                    >
                                                        🍳 Commencer
                                                    </Button>
                                                )}
                                                {status === 'preparing' && (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateOrderStatus(order.id, 'ready');
                                                        }}
                                                        className="w-full text-xs bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 py-1"
                                                    >
                                                        ✅ Terminer
                                                    </Button>
                                                )}
                                                {status === 'ready' && (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateOrderStatus(order.id, 'delivered');
                                                        }}
                                                        className="w-full text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500 py-1"
                                                    >
                                                        {order.orderType === 'delivery' ? '🎉 Livrée' : '🎉 Récupérée'}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminOrdersView;