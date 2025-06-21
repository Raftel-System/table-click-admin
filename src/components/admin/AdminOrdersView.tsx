// src/components/admin/AdminOrdersViewComplete.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { useOrders, type Order, type OrderStatus } from '@/hooks/useOrders';
import { useRestaurantContext } from '@/contexts/RestaurantContext';
import OrderStatusModal from './OrderStatusModal';
import {
    Printer,
    Clock,
    Package,
    Euro,
    StickyNote,
    Search,
    Coffee,
    Utensils,
    CheckCircle,
    XCircle,
    Timer,
    AlertCircle,
    CheckCheck,
    RefreshCw
} from 'lucide-react';

interface StatusChangeRequest {
    orderId: string;
    targetStatus: OrderStatus;
}

const AdminOrdersView: React.FC = () => {
    const { toast } = useToast();
    const { restaurant } = useRestaurantContext();
    const { 
        orders, 
        loading, 
        error, 
        printTicket, 
        getOrderStats, 
        updateOrderStatus,
        getPendingOrders,
        getCompletedOrders
    } = useOrders(restaurant?.id || '');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [statusChangeRequest, setStatusChangeRequest] = useState<StatusChangeRequest | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    // ✅ Filtrer les commandes selon le terme de recherche
    const filteredPendingOrders = useMemo(() => {
        const pending = getPendingOrders();
        if (!searchTerm.trim()) return pending;
        
        const term = searchTerm.toLowerCase();
        return pending.filter(order => {
            const matchesId = order.id.toLowerCase().includes(term);
            const matchesTable = order.tableNumber?.toString().includes(term);
            const matchesClient = order.numeroClient?.toString().includes(term);
            const matchesItems = order.items.some(item => 
                item.nom.toLowerCase().includes(term)
            );
            const matchesTotal = order.total.toString().includes(term);
            
            return matchesId || matchesTable || matchesClient || matchesItems || matchesTotal;
        });
    }, [getPendingOrders, searchTerm]);

    const filteredCompletedOrders = useMemo(() => {
        const completed = getCompletedOrders();
        if (!searchTerm.trim()) return completed;
        
        const term = searchTerm.toLowerCase();
        return completed.filter(order => {
            const matchesId = order.id.toLowerCase().includes(term);
            const matchesTable = order.tableNumber?.toString().includes(term);
            const matchesClient = order.numeroClient?.toString().includes(term);
            const matchesItems = order.items.some(item => 
                item.nom.toLowerCase().includes(term)
            );
            const matchesTotal = order.total.toString().includes(term);
            
            return matchesId || matchesTable || matchesClient || matchesItems || matchesTotal;
        });
    }, [getCompletedOrders, searchTerm]);

    // ✅ Gérer les demandes de changement de statut
    const handleStatusChangeRequest = (orderId: string, targetStatus: OrderStatus) => {
        setStatusChangeRequest({ orderId, targetStatus });
    };

    const handleStatusChangeConfirm = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
        try {
            await updateOrderStatus(orderId, newStatus, reason);
            
            const statusText = {
                served: 'servie',
                cancelled: 'annulée',
                pending: 'en attente'
            }[newStatus];

            toast({
                title: "Statut mis à jour",
                description: `Commande ${orderId.substring(0, 8)}... marquée comme ${statusText}${reason ? ` (${reason})` : ''}`
            });

            setStatusChangeRequest(null);
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
            throw error; // Re-throw pour que le modal puisse gérer l'erreur
        }
    };

    // ✅ Gérer l'impression d'un ticket
    const handlePrintTicket = async (order: Order) => {
        setPrintingOrderId(order.id);

        try {
            await printTicket(order);
            toast({
                title: "Ticket imprimé",
                description: `Ticket pour ${order.mode === 'sur_place' ? `Table ${order.tableNumber}` : `N°${order.numeroClient || 'EMPORTER'}`} envoyé à l'imprimante`
            });
        } catch (error: any) {
            toast({
                title: "Erreur d'impression",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setPrintingOrderId(null);
        }
    };

    // ✅ Composant Badge de statut
    const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
        const config = {
            pending: {
                text: 'Commandée',
                className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                icon: <Timer size={12} />
            },
            served: {
                text: 'Servie',
                className: 'bg-green-500/20 text-green-300 border-green-500/50',
                icon: <CheckCircle size={12} />
            },
            cancelled: {
                text: 'Annulée',
                className: 'bg-red-500/20 text-red-300 border-red-500/50',
                icon: <XCircle size={12} />
            }
        }[status];

        return (
            <Badge className={`text-xs border flex items-center gap-1 ${config.className}`}>
                {config.icon}
                {config.text}
            </Badge>
        );
    };

    // ✅ Composant carte de commande amélioré
    const OrderCard: React.FC<{ order: Order; showActions?: boolean }> = ({ order, showActions = true }) => {
        const isPrinting = printingOrderId === order.id;
        const canModify = order.status === 'pending' && showActions;

        return (
            <Card className={`border-gray-700 transition-all duration-200 shadow-lg ${
                order.status === 'pending' 
                    ? 'bg-gray-800/50 hover:border-gray-600 hover:scale-[1.02] hover:shadow-xl' 
                    : 'bg-gray-800/30 opacity-90'
            }`}>
                <CardContent className="p-4">
                    {/* Header avec statut */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-gray-400">
                                {order.mode === 'sur_place' ? <Coffee size={16} /> : <Package size={16} />}
                            </div>
                            <div>
                                <div className="font-medium text-white text-sm">
                                    {order.mode === 'sur_place' 
                                        ? `Table ${order.tableNumber}` 
                                        : `N°${order.numeroClient || 'EMPORTER'}`
                                    }
                                </div>
                                <div className="text-xs text-gray-400">
                                    {order.id.substring(0, 8)}...
                                </div>
                            </div>
                        </div>

                        <StatusBadge status={order.status} />
                    </div>

                    {/* Informations temporelles */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>{(() => {
                                const now = new Date();
                                const orderTime = new Date(order.createdAt);
                                const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
                                
                                if (diffInMinutes < 1) return 'À l\'instant';
                                if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
                                
                                const diffInHours = Math.floor(diffInMinutes / 60);
                                if (diffInHours < 24) return `Il y a ${diffInHours}h`;
                                
                                return orderTime.toLocaleDateString('fr-FR');
                            })()}</span>
                        </div>
                    </div>

                    {/* Articles de la commande */}
                    <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            <Utensils size={12} />
                            <span>{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
                        </div>
                        {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-300 truncate mr-2">
                                    {item.quantite}x {item.nom}
                                </span>
                                {item.prix && (
                                    <span className="text-yellow-500 flex-shrink-0">
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

                    {/* Note de commande */}
                    {order.noteCommande && (
                        <div className="mb-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                            <div className="flex items-start gap-2">
                                <StickyNote size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-yellow-200">{order.noteCommande}</span>
                            </div>
                        </div>
                    )}

                    {/* Raison d'annulation (si applicable) */}
                    {order.status === 'cancelled' && order.cancellationReason && (
                        <div className="mb-3 p-2 bg-red-500/10 rounded border border-red-500/20">
                            <div className="flex items-start gap-2">
                                <XCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-xs text-red-400 font-medium">Raison d'annulation :</div>
                                    <div className="text-xs text-red-200">{order.cancellationReason}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Total et date de finalisation */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1">
                            <Euro size={14} className="text-yellow-500" />
                            <span className="text-lg font-bold text-yellow-500">
                                {order.total.toFixed(2)}€
                            </span>
                        </div>

                        {/* Date de service/annulation */}
                        {order.status !== 'pending' && (order.servedAt || order.cancelledAt) && (
                            <div className="text-xs text-gray-500">
                                {order.status === 'served' ? 'Servie' : 'Annulée'} à{' '}
                                {new Date(order.servedAt || order.cancelledAt!).toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        {/* Boutons de changement de statut (seulement si pending) */}
                        {canModify && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleStatusChangeRequest(order.id, 'served')}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 text-xs py-2"
                                >
                                    <CheckCircle size={14} className="mr-1" />
                                    Marquer comme servie
                                </Button>

                                <Button
                                    onClick={() => handleStatusChangeRequest(order.id, 'cancelled')}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 text-xs py-2"
                                >
                                    <XCircle size={14} className="mr-1" />
                                    Annuler
                                </Button>
                            </div>
                        )}

                        {/* Bouton d'impression (toujours disponible) */}
                        <Button
                            onClick={() => handlePrintTicket(order)}
                            disabled={isPrinting}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 text-xs py-2"
                        >
                            {isPrinting ? (
                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Printer size={14} className="mr-1" />
                                    Imprimer le ticket
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Affichage du chargement
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                            <CardContent className="p-4">
                                <div className="h-8 bg-gray-700 rounded w-16 mb-2"></div>
                                <div className="h-4 bg-gray-700 rounded w-24"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-800/50 rounded w-64"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-800/50 rounded animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Affichage des erreurs
    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <Card className="bg-red-500/10 border-red-500/50 max-w-md">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Erreur de chargement</h3>
                        <p className="text-red-400 text-sm">{error}</p>
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 bg-red-500 hover:bg-red-600"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Réessayer
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const orderStats = getOrderStats();

    return (
        <div className="space-y-6">
            {/* ✅ Statistiques détaillées avec statuts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{orderStats.totalOrders}</div>
                        <div className="text-sm text-blue-300">Total aujourd'hui</div>
                    </CardContent>
                </Card>

                <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{orderStats.pendingOrders}</div>
                        <div className="text-sm text-yellow-300">En cours</div>
                    </CardContent>
                </Card>

                <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{orderStats.servedOrders}</div>
                        <div className="text-sm text-green-300">Servies</div>
                    </CardContent>
                </Card>

                <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">{orderStats.cancelledOrders}</div>
                        <div className="text-sm text-red-300">Annulées</div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-500/10 border-purple-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{orderStats.totalRevenue.toFixed(2)}€</div>
                        <div className="text-sm text-purple-300">Chiffre d'affaires</div>
                    </CardContent>
                </Card>
            </div>

            {/* ✅ Barre de recherche améliorée */}
            <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Rechercher par table, client, plat ou montant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 input-premium"
                        />
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                        <div className="flex items-center gap-4">
                            <span>
                                En cours: {filteredPendingOrders.length} • 
                                Terminé: {filteredCompletedOrders.length}
                            </span>
                            {searchTerm && (
                                <span className="text-yellow-400">
                                    • Recherche: "{searchTerm}"
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Temps réel</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ✅ Onglets En cours / Terminé */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'completed')} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700">
                    <TabsTrigger 
                        value="pending" 
                        className="flex items-center gap-2 data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300"
                    >
                        <Timer size={16} />
                        En cours ({filteredPendingOrders.length})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="completed"
                        className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-gray-200"
                    >
                        <CheckCheck size={16} />
                        Terminé ({filteredCompletedOrders.length})
                    </TabsTrigger>
                </TabsList>

                {/* ✅ Onglet Commandes en cours */}
                <TabsContent value="pending" className="space-y-4">
                    {filteredPendingOrders.length === 0 ? (
                        <Card className="bg-gray-900/50 border-gray-700">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Timer size={32} className="text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {searchTerm ? 'Aucune commande en cours correspondante' : 'Aucune commande en cours'}
                                </h3>
                                <p className="text-gray-400">
                                    {searchTerm 
                                        ? 'Essayez de modifier votre recherche' 
                                        : 'Les nouvelles commandes apparaîtront ici en temps réel'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPendingOrders.map((order) => (
                                <OrderCard key={order.id} order={order} showActions={true} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ✅ Onglet Commandes terminées */}
                <TabsContent value="completed" className="space-y-4">
                    {filteredCompletedOrders.length === 0 ? (
                        <Card className="bg-gray-900/50 border-gray-700">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCheck size={32} className="text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {searchTerm ? 'Aucune commande terminée correspondante' : 'Aucune commande terminée'}
                                </h3>
                                <p className="text-gray-400">
                                    {searchTerm 
                                        ? 'Essayez de modifier votre recherche' 
                                        : 'Les commandes servies et annulées apparaîtront ici'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCompletedOrders.map((order) => (
                                <OrderCard key={order.id} order={order} showActions={false} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* ✅ Modal de confirmation de changement de statut */}
            {statusChangeRequest && (
                <OrderStatusModal
                    order={orders.find(o => o.id === statusChangeRequest.orderId)!}
                    targetStatus={statusChangeRequest.targetStatus}
                    onClose={() => setStatusChangeRequest(null)}
                    onConfirm={handleStatusChangeConfirm}
                />
            )}

            {/* ✅ Indicateur de connexion temps réel */}
            <div className="fixed bottom-4 right-4 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400">
                        {orders.length} commande{orders.length !== 1 ? 's' : ''} • 
                        {orderStats.pendingOrders} en cours
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AdminOrdersView;