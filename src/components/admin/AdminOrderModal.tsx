// src/components/admin/OrderStatusModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { type Order, type OrderStatus } from '@/hooks/useOrders';
import {
    CheckCircle,
    XCircle,
    CreditCard,
    Timer,
    AlertTriangle,
    ArrowRight,
    Coffee,
    Package,
    Euro,
    Clock,
    Ban
} from 'lucide-react';

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
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Debug: Vérifier les valeurs reçues
    console.log('🔍 OrderStatusModal - Debug:', {
        orderStatus: order.status,
        targetStatus,
        orderStatusType: typeof order.status,
        targetStatusType: typeof targetStatus
    });

    // ✅ Configuration des statuts et transitions
    const statusConfig: Record<OrderStatus, { text: string; className: string; icon: JSX.Element }> = {
        pending: {
            text: '🟡 En cours',
            className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
            icon: <Timer size={16} />
        },
        served: {
            text: '🟢 Servi',
            className: 'bg-green-500/20 text-green-300 border-green-500/50',
            icon: <CheckCircle size={16} />
        },
        paid: {
            text: '💶 Payé',
            className: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
            icon: <CreditCard size={16} />
        },
        cancelled: {
            text: '🔴 Annulé',
            className: 'bg-red-500/20 text-red-300 border-red-500/50',
            icon: <XCircle size={16} />
        }
    };

    // ✅ Messages et validations selon la transition avec protection
    const getTransitionConfig = () => {
        const transitionKey = `${order.status}->${targetStatus}`;
        console.log('🔍 Transition key:', transitionKey);
        
        switch (transitionKey) {
            case 'pending->served':
                return {
                    title: 'Marquer comme servie',
                    description: 'Cette commande va être marquée comme servie et pourra ensuite être payée.',
                    confirmText: 'Marquer comme servie',
                    confirmClass: 'bg-green-500 hover:bg-green-600',
                    requiresReason: false,
                    icon: <CheckCircle size={24} className="text-green-500" />
                };
            case 'served->paid':
                return {
                    title: 'Marquer comme payée',
                    description: 'Cette commande va être marquée comme payée. Cette action est définitive.',
                    confirmText: 'Marquer comme payée',
                    confirmClass: 'bg-blue-500 hover:bg-blue-600',
                    requiresReason: false,
                    icon: <CreditCard size={24} className="text-blue-500" />
                };
            case 'pending->cancelled':
                return {
                    title: 'Annuler la commande',
                    description: 'Cette commande va être annulée et n\'apparaîtra plus dans la liste active.',
                    confirmText: 'Annuler la commande',
                    confirmClass: 'bg-red-500 hover:bg-red-600',
                    requiresReason: true,
                    icon: <XCircle size={24} className="text-red-500" />
                };
            default:
                console.warn('⚠️ Transition non reconnue:', transitionKey);
                return {
                    title: 'Transition non autorisée',
                    description: 'Cette transition de statut n\'est pas autorisée.',
                    confirmText: 'Fermer',
                    confirmClass: 'bg-gray-500 hover:bg-gray-600',
                    requiresReason: false,
                    icon: <Ban size={24} className="text-gray-500" />
                };
        }
    };

    const transitionConfig = getTransitionConfig();

    // ✅ Validation avant soumission
    const validateSubmission = (): string | null => {
        if (transitionConfig.requiresReason && !reason.trim()) {
            return 'Une raison est requise pour cette action';
        }
        return null;
    };

    // ✅ Gérer la confirmation
    const handleConfirm = async () => {
        const validationError = validateSubmission();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onConfirm(order.id, targetStatus, reason.trim() || undefined);
            onClose();
        } catch (error: any) {
            setError(error.message || 'Une erreur est survenue');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ Calculer le temps écoulé depuis la commande
    const getOrderDuration = () => {
        const now = new Date();
        const orderTime = new Date(order.createdAt);
        const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `${diffInMinutes}min`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        const remainingMinutes = diffInMinutes % 60;
        return `${diffInHours}h${remainingMinutes > 0 ? `${remainingMinutes}min` : ''}`;
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-white">
                        {transitionConfig.icon}
                        {transitionConfig.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* ✅ Résumé de la commande */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {order.mode === 'sur_place' ? <Coffee size={16} className="text-gray-400" /> : <Package size={16} className="text-gray-400" />}
                                <span className="font-medium text-white">
                                    {order.mode === 'sur_place' 
                                        ? `Table ${order.tableNumber}` 
                                        : `N°${order.numeroClient || 'EMPORTER'}`
                                    }
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock size={14} />
                                <span>{getOrderDuration()}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Euro size={16} className="text-yellow-500" />
                                <span className="text-yellow-500 font-bold">{order.total.toFixed(2)}€</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Articles (affichage limité) */}
                        <div className="space-y-1">
                            {order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-300">
                                        {item.quantite}x {item.nom}
                                    </span>
                                    {item.prix && (
                                        <span className="text-gray-400">
                                            {(item.prix * item.quantite).toFixed(2)}€
                                        </span>
                                    )}
                                </div>
                            ))}
                            {order.items.length > 3 && (
                                <div className="text-sm text-gray-500">
                                    +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''} article{order.items.length - 3 > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ Visualisation de la transition */}
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-center gap-4">
                            <Badge className={`flex items-center gap-2 ${statusConfig[order.status]?.className || 'bg-gray-500/20 text-gray-300'}`}>
                                {statusConfig[order.status]?.icon || <Timer size={16} />}
                                {statusConfig[order.status]?.text || order.status}
                            </Badge>
                            
                            <ArrowRight size={20} className="text-gray-400" />
                            
                            <Badge className={`flex items-center gap-2 ${statusConfig[targetStatus]?.className || 'bg-gray-500/20 text-gray-300'}`}>
                                {statusConfig[targetStatus]?.icon || <Timer size={16} />}
                                {statusConfig[targetStatus]?.text || targetStatus}
                            </Badge>
                        </div>
                    </div>

                    {/* ✅ Description de l'action */}
                    <div className="text-center">
                        <p className="text-gray-300 text-sm">
                            {transitionConfig.description}
                        </p>
                    </div>

                    {/* ✅ Champ raison (si requis) */}
                    {transitionConfig.requiresReason && (
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-gray-300">
                                Raison de l'annulation *
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Expliquez pourquoi cette commande est annulée..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 resize-none"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500">
                                Cette information sera conservée pour le suivi
                            </p>
                        </div>
                    )}

                    {/* ✅ Message d'erreur */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                                <span className="text-red-400 text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* ✅ Avertissements spécifiques */}
                    {targetStatus === 'paid' && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="text-blue-400 text-sm">
                                    <div className="font-medium mb-1">Action définitive</div>
                                    <div>Une fois marquée comme payée, cette commande ne pourra plus être modifiée.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {targetStatus === 'cancelled' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-red-400 text-sm">
                                    <div className="font-medium mb-1">Annulation définitive</div>
                                    <div>Cette commande sera définitivement annulée et n'apparaîtra plus dans la liste active.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ Note de commande (si présente) */}
                    {order.noteCommande && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="text-yellow-400 text-sm">
                                    <div className="font-medium mb-1">Note de commande :</div>
                                    <div className="italic">"{order.noteCommande}"</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ Boutons d'action */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                            Annuler
                        </Button>
                        
                        <Button
                            onClick={handleConfirm}
                            disabled={isSubmitting || (transitionConfig.requiresReason && !reason.trim())}
                            className={`flex-1 text-white ${transitionConfig.confirmClass}`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Traitement...</span>
                                </div>
                            ) : (
                                transitionConfig.confirmText
                            )}
                        </Button>
                    </div>

                    {/* ✅ Informations supplémentaires en bas */}
                    <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-700">
                        Commande #{order.id.substring(0, 8)}... • 
                        Créée {new Date(order.createdAt).toLocaleString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OrderStatusModal;