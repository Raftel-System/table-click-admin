// AdminOrderModal.tsx - Version Standalone
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, X } from 'lucide-react';

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

interface AdminOrderModalProps {
    order: Order;
    onClose: () => void;
    onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
}

const AdminOrderModal: React.FC<AdminOrderModalProps> = ({
                                                             order,
                                                             onClose,
                                                             onUpdateStatus
                                                         }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-gray-900/95 border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <ShoppingBag size={20} className="text-yellow-500" />
                            Commande {order.id}
                        </span>
                        <Button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white p-0"
                        >
                            <X size={16} />
                        </Button>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Client</p>
                            <p className="text-white font-medium">{order.customerInfo.name}</p>
                            <p className="text-gray-300">{order.customerInfo.phone}</p>
                            <p className="text-gray-300 text-xs">{order.customerInfo.email}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Type & Statut</p>
                            <p className="text-white">
                                {order.orderType === 'delivery' ? '🛵 Livraison' : '🏃 À emporter'}
                            </p>
                            <Badge className="mt-1 bg-blue-500 text-white">
                                {order.status}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-400 text-sm">📅 Commande passée</p>
                        <p className="text-white">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {order.orderType === 'delivery' && order.customerInfo.address && (
                        <div>
                            <p className="text-gray-400 text-sm">📍 Adresse</p>
                            <p className="text-white">{order.customerInfo.address}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-gray-400 text-sm mb-2">📦 Articles</p>
                        <div className="space-y-2">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between p-2 bg-gray-800/50 rounded">
                                    <span className="text-white">{item.name} x{item.quantity}</span>
                                    <span className="text-yellow-500">{(item.price * item.quantity).toFixed(2)} DH</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-600 mt-2 pt-2 flex justify-between font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-yellow-500">{order.total.toFixed(2)} DH</span>
                        </div>
                    </div>

                    {order.specialInstructions && (
                        <div>
                            <p className="text-gray-400 text-sm">📝 Instructions spéciales</p>
                            <p className="text-white bg-gray-800/50 p-2 rounded">{order.specialInstructions}</p>
                        </div>
                    )}

                    {/* Actions rapides */}
                    <div className="flex gap-2">
                        {order.status === 'pending' && (
                            <Button
                                onClick={() => onUpdateStatus(order.id, 'preparing')}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500"
                            >
                                🍳 Commencer
                            </Button>
                        )}
                        {order.status === 'preparing' && (
                            <Button
                                onClick={() => onUpdateStatus(order.id, 'ready')}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500"
                            >
                                ✅ Terminer
                            </Button>
                        )}
                        {order.status === 'ready' && (
                            <Button
                                onClick={() => onUpdateStatus(order.id, 'delivered')}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500"
                            >
                                🎉 Marquer comme livrée
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminOrderModal;