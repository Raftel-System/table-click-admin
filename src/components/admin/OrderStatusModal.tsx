// src/components/admin/OrderStatusModal.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { 
    X, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Clock,
    Coffee,
    Package
} from 'lucide-react';
import type { Order, OrderStatus } from '@/hooks/useOrders';

interface OrderStatusModalProps {
    order: Order;
    targetStatus: OrderStatus;
    onClose: () => void;
    onConfirm: (orderId: string, newStatus: OrderStatus, reason?: string) => Promise<void>;
}

const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
    order,
    targetStatus,
    onClose,
    onConfirm
}) => {
    const { toast } = useToast();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const statusConfig = {
        served: {
            title: 'Marquer comme servie',
            description: 'Cette commande sera marquée comme servie et déplacée vers les commandes terminées.',
            icon: <CheckCircle size={24} className="text-green-500" />,
            buttonText: 'Confirmer - Servie',
            buttonClass: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500',
            requiresReason: false
        },
        cancelled: {
            title: 'Annuler la commande',
            description: 'Cette commande sera annulée et ne pourra plus être modifiée.',
            icon: <XCircle size={24} className="text-red-500" />,
            buttonText: 'Confirmer - Annuler',
            buttonClass: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500',
            requiresReason: true
        },
        pending: {
            title: 'Remettre en attente',
            description: 'Cette commande sera remise en attente.',
            icon: <Clock size={24} className="text-yellow-500" />,
            buttonText: 'Confirmer - En attente',
            buttonClass: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500',
            requiresReason: false
        }
    }[targetStatus];

    const handleConfirm = async () => {
        if (statusConfig.requiresReason && !reason.trim()) {
            toast({
                title: "Raison requise",
                description: "Veuillez indiquer la raison de l'annulation",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            await onConfirm(order.id, targetStatus, reason.trim() || undefined);
            onClose();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-gray-900/95 border-gray-700 max-w-md w-full shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            {statusConfig.icon}
                            {statusConfig.title}
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
                    {/* Informations de la commande */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            {order.mode === 'sur_place' ? (
                                <Coffee size={20} className="text-blue-400" />
                            ) : (
                                <Package size={20} className="text-green-400" />
                            )}
                            <div>
                                <div className="font-medium text-white">
                                    {order.mode === 'sur_place' 
                                        ? `Table ${order.tableNumber}` 
                                        : `N°${order.numeroClient || 'EMPORTER'}`
                                    }
                                </div>
                                <div className="text-sm text-gray-400">
                                    {order.id.substring(0, 8)}... • {formatTime(order.createdAt)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm text-gray-400">Articles :</div>
                            {order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-300">
                                        {item.quantite}x {item.nom}
                                    </span>
                                    {item.prix && (
                                        <span className="text-yellow-500">
                                            {(item.prix * item.quantite).toFixed(2)}€
                                        </span>
                                    )}
                                </div>
                            ))}
                            {order.items.length > 3 && (
                                <div className="text-xs text-gray-500">
                                    +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''} article{order.items.length - 3 > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                            <span className="text-white font-semibold">Total</span>
                            <span className="text-yellow-500 font-bold text-lg">
                                {order.total.toFixed(2)}€
                            </span>
                        </div>
                    </div>

                    {/* Description de l'action */}
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-300">{statusConfig.description}</p>
                        </div>
                    </div>

                    {/* Champ raison (si requis) */}
                    {statusConfig.requiresReason && (
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-white">
                                Raison de l'annulation *
                            </Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ex: Client parti, erreur de commande, problème cuisine..."
                                className="input-premium min-h-[80px]"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Note de commande existante */}
                    {order.noteCommande && (
                        <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                            <div className="text-xs text-yellow-400 mb-1">Note de commande :</div>
                            <div className="text-sm text-yellow-200">{order.noteCommande}</div>
                        </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className={`flex-1 text-white ${statusConfig.buttonClass}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                statusConfig.buttonText
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderStatusModal;