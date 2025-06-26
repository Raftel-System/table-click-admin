// src/components/admin/AdminOrdersViewWorkflow.tsx
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
    RefreshCw,
    CreditCard,
    Ban,
    TrendingUp,
    Banknote, ShoppingCart
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
        getServedOrders,
        getPaidOrders
    } = useOrders(restaurant?.id || '');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [statusChangeRequest, setStatusChangeRequest] = useState<StatusChangeRequest | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'served' | 'paid'>('pending');

    // ✅ Filtrer les commandes selon le terme de recherche pour chaque onglet
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

    const filteredServedOrders = useMemo(() => {
        const served = getServedOrders();
        if (!searchTerm.trim()) return served;
        
        const term = searchTerm.toLowerCase();
        return served.filter(order => {
            const matchesId = order.id.toLowerCase().includes(term);
            const matchesTable = order.tableNumber?.toString().includes(term);
            const matchesClient = order.numeroClient?.toString().includes(term);
            const matchesItems = order.items.some(item => 
                item.nom.toLowerCase().includes(term)
            );
            const matchesTotal = order.total.toString().includes(term);
            
            return matchesId || matchesTable || matchesClient || matchesItems || matchesTotal;
        });
    }, [getServedOrders, searchTerm]);

    const filteredPaidOrders = useMemo(() => {
        const paid = getPaidOrders();
        if (!searchTerm.trim()) return paid;
        
        const term = searchTerm.toLowerCase();
        return paid.filter(order => {
            const matchesId = order.id.toLowerCase().includes(term);
            const matchesTable = order.tableNumber?.toString().includes(term);
            const matchesClient = order.numeroClient?.toString().includes(term);
            const matchesItems = order.items.some(item => 
                item.nom.toLowerCase().includes(term)
            );
            const matchesTotal = order.total.toString().includes(term);
            
            return matchesId || matchesTable || matchesClient || matchesItems || matchesTotal;
        });
    }, [getPaidOrders, searchTerm]);

    // ✅ Gérer les demandes de changement de statut
    const handleStatusChangeRequest = (orderId: string, targetStatus: OrderStatus) => {
        setStatusChangeRequest({ orderId, targetStatus });
    };

    const handleStatusChangeConfirm = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
        try {
            await updateOrderStatus(orderId, newStatus, reason);
            
            const statusText = {
                served: 'servie',
                paid: 'payée',
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

    // ✅ Composant Badge de statut selon le nouveau workflow
    const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
        const config = {
            pending: {
                text: '🟡 En cours',
                className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                icon: <Timer size={12} />
            },
            served: {
                text: '🟢 Servi',
                className: 'bg-green-500/20 text-green-300 border-green-500/50',
                icon: <CheckCircle size={12} />
            },
            paid: {
                text: '💶 Payé',
                className: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
                icon: <CreditCard size={12} />
            },
            cancelled: {
                text: '🔴 Annulé',
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

    // ✅ Composant carte de commande selon le workflow
    const OrderCard: React.FC<{ order: Order; activeTab: string }> = ({ order, activeTab }) => {
        const isPrinting = printingOrderId === order.id;

        // ✅ Actions disponibles selon le statut et l'onglet actuel
        const availableActions = {
            pending: ['served', 'cancelled', 'print'],
            served: ['paid', 'print'],
            paid: ['print'] // Seule l'impression est possible pour les commandes payées
        }[order.status] || ['print'];

        return (
            <Card className={`border-gray-700 transition-all duration-200 shadow-lg ${
                order.status === 'pending'
                    ? 'bg-yellow-500/5 hover:border-yellow-600 hover:scale-[1.02] hover:shadow-xl border-yellow-500/30'
                    : order.status === 'served'
                        ? 'bg-green-500/5 hover:border-green-600 hover:scale-[1.02] hover:shadow-xl border-green-500/30'
                        : order.status === 'paid'
                            ? 'bg-blue-500/5 hover:border-blue-600 hover:scale-[1.02] hover:shadow-xl border-blue-500/30'
                            : 'bg-gray-500/5 hover:border-gray-600 hover:scale-[1.02] hover:shadow-xl border-gray-500/30'
            }`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                order.mode === 'sur_place'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-green-500/20 text-green-400'
                            }`}>
                                {order.mode === 'sur_place' ? <Coffee size={18} /> : <Package size={18} />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">
                                    {order.mode === 'sur_place' ? 'Sur place' : 'À emporter'}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {order.mode === 'sur_place'
                                        ? `Table ${order.tableNumber}`
                                        : `N°${order.numeroClient || 'EMPORTER'}`
                                    }
                                </p>
                            </div>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* ✅ Liste des articles avec instructions spéciales */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <ShoppingCart size={14} />
                            Articles ({order.items.length})
                        </h4>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {order.items.map((item, index) => (
                                <div key={index} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🍽️</span> {/* Emoji par défaut */}
                                                <span className="font-medium text-white text-sm">{item.nom}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                <span>×{item.quantite}</span>
                                                {item.prix && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{item.prix.toFixed(2)}€</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-700/50 rounded-md px-2 py-1 text-xs font-bold text-white">
                                            ×{item.quantite}
                                        </div>
                                    </div>

                                    {/* ✅ Affichage des instructions spéciales par article */}
                                    {item.specialInstructions && (
                                        <div className="mt-2 bg-orange-500/10 border border-orange-500/30 rounded-md p-2">
                                            <div className="flex items-start gap-2">
                                                <StickyNote size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-orange-300 leading-relaxed">
                                                    {item.specialInstructions}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ✅ Note globale de la commande (si elle existe) */}
                    {order.noteCommande && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <StickyNote size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-yellow-400 mb-1">Instructions générales</p>
                                    <p className="text-xs text-yellow-300 leading-relaxed">{order.noteCommande}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Total de la commande */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                        <span className="text-sm font-medium text-gray-300">Total</span>
                        <span className="text-lg font-bold text-green-400">
                        {order.total.toFixed(2)}€
                    </span>
                    </div>

                    {/* Informations temporelles */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                        <div className="flex justify-between items-center">
                        <span>Créée: {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                            <span className="font-mono">#{order.id.substring(0, 8)}</span>
                        </div>

                        {/* Timestamps selon le statut */}
                        {order.status === 'served' && order.servedAt && (
                            <div className="mt-1 text-green-400">
                                Servi: {new Date(order.servedAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                            </div>
                        )}

                        {order.status === 'paid' && order.paidAt && (
                            <div className="mt-1 text-blue-400">
                                Payé: {new Date(order.paidAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                            </div>
                        )}
                    </div>

                    {/* ✅ Boutons d'action selon le statut */}
                    <div className="space-y-2 pt-3">
                        {/* Actions pour commandes en cours */}
                        {activeTab === 'pending' && order.status === 'pending' && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleStatusChangeRequest(order.id, 'served')}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 text-xs py-2"
                                >
                                    <CheckCircle size={14} className="mr-1" />
                                    Marquer comme servi
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

                        {/* Actions pour commandes servies */}
                        {activeTab === 'served' && order.status === 'served' && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleStatusChangeRequest(order.id, 'paid')}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 text-xs py-2"
                                >
                                    <CreditCard size={14} className="mr-1" />
                                    Marquer comme payé
                                </Button>
                            </div>
                        )}

                        {/* Bouton d'impression (toujours disponible) */}
                        <Button
                            onClick={() => handlePrintTicket(order)}
                            disabled={isPrinting}
                            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-400 hover:to-gray-500 text-xs py-2"
                        >
                            {isPrinting ? (
                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-1" />
                            ) : (
                                <Printer size={14} className="mr-1" />
                            )}
                            {isPrinting ? 'Impression...' : 'Imprimer ticket'}
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
            {/*/!* ✅ Statistiques détaillées avec le nouveau workflow *!/*/}
            {/*<div className="grid grid-cols-2 md:grid-cols-5 gap-4">*/}
            {/*    <Card className="bg-blue-500/10 border-blue-500/20">*/}
            {/*        <CardContent className="p-4 text-center">*/}
            {/*            <div className="text-2xl font-bold text-blue-400">{orderStats.totalOrders}</div>*/}
            {/*            <div className="text-sm text-blue-300">Total aujourd'hui</div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}

            {/*    <Card className="bg-yellow-500/10 border-yellow-500/20">*/}
            {/*        <CardContent className="p-4 text-center">*/}
            {/*            <div className="text-2xl font-bold text-yellow-400">{orderStats.pendingOrders}</div>*/}
            {/*            <div className="text-sm text-yellow-300">🟡 En cours</div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}

            {/*    <Card className="bg-green-500/10 border-green-500/20">*/}
            {/*        <CardContent className="p-4 text-center">*/}
            {/*            <div className="text-2xl font-bold text-green-400">{orderStats.servedOrders}</div>*/}
            {/*            <div className="text-sm text-green-300">🟢 Servi</div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}

            {/*    <Card className="bg-blue-600/10 border-blue-600/20">*/}
            {/*        <CardContent className="p-4 text-center">*/}
            {/*            <div className="text-2xl font-bold text-blue-400">{orderStats.paidOrders}</div>*/}
            {/*            <div className="text-sm text-blue-300">💶 Payé</div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}

            {/*    <Card className="bg-purple-500/10 border-purple-500/20">*/}
            {/*        <CardContent className="p-4 text-center">*/}
            {/*            <div className="text-2xl font-bold text-purple-400">{orderStats.totalRevenue.toFixed(2)}€</div>*/}
            {/*            <div className="text-sm text-purple-300">CA (payé uniquement)</div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*</div>*/}

            {/* ✅ Barre de recherche */}
            {/*<Card className="bg-gray-900/50 border-gray-700">*/}
            {/*    /!*<CardContent className="p-4">*!/*/}
            {/*    /!*    <div className="relative">*!/*/}
            {/*    /!*        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />*!/*/}
            {/*    /!*        <Input*!/*/}
            {/*    /!*            placeholder="Rechercher par table, client, plat ou montant..."*!/*/}
            {/*    /!*            value={searchTerm}*!/*/}
            {/*    /!*            onChange={(e) => setSearchTerm(e.target.value)}*!/*/}
            {/*    /!*            className="pl-10 input-premium"*!/*/}
            {/*    /!*        />*!/*/}
            {/*    /!*    </div>*!/*/}

            {/*    /!*    <div className="flex items-center justify-between mt-4 text-sm text-gray-400">*!/*/}
            {/*    /!*        <div className="flex items-center gap-4">*!/*/}
            {/*    /!*            /!*<span>*!/*!/*/}
            {/*    /!*            /!*    🟡 En cours: {filteredPendingOrders.length} • *!/*!/*/}
            {/*    /!*            /!*    🟢 Servi: {filteredServedOrders.length} • *!/*!/*/}
            {/*    /!*            /!*    💶 Payé: {filteredPaidOrders.length}*!/*!/*/}
            {/*    /!*            /!*</span>*!/*!/*/}
            {/*    /!*            {searchTerm && (*!/*/}
            {/*    /!*                <span className="text-yellow-400">*!/*/}
            {/*    /!*                    • Recherche: "{searchTerm}"*!/*/}
            {/*    /!*                </span>*!/*/}
            {/*    /!*            )}*!/*/}
            {/*    /!*        </div>*!/*/}
            {/*    /!*        /!*<div className="flex items-center gap-2">*!/*!/*/}
            {/*    /!*        /!*    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>*!/*!/*/}
            {/*    /!*        /!*    <span>Temps réel</span>*!/*!/*/}
            {/*    /!*        /!*</div>*!/*!/*/}
            {/*    /!*    </div>*!/*/}
            {/*    /!*</CardContent>*!/*/}
            {/*</Card>*/}

            {/* ✅ Onglets En cours / Servi / Payé selon le nouveau workflow */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'served' | 'paid')} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700">
                    <TabsTrigger 
                        value="pending" 
                        className="flex items-center gap-2 data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300"
                    >
                        <Timer size={16} />
                        🟡 En cours ({filteredPendingOrders.length})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="served"
                        className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
                    >
                        <CheckCircle size={16} />
                        🟢 Servi ({filteredServedOrders.length})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="paid"
                        className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
                    >
                        <CreditCard size={16} />
                        💶 Payé ({filteredPaidOrders.length})
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
                                <OrderCard key={order.id} order={order} activeTab="pending" />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ✅ Onglet Commandes servies */}
                <TabsContent value="served" className="space-y-4">
                    {filteredServedOrders.length === 0 ? (
                        <Card className="bg-gray-900/50 border-gray-700">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {searchTerm ? 'Aucune commande servie correspondante' : 'Aucune commande servie'}
                                </h3>
                                <p className="text-gray-400">
                                    {searchTerm 
                                        ? 'Essayez de modifier votre recherche' 
                                        : 'Les commandes servies en attente de paiement apparaîtront ici'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredServedOrders.map((order) => (
                                <OrderCard key={order.id} order={order} activeTab="served" />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ✅ Onglet Commandes payées */}
                <TabsContent value="paid" className="space-y-4">
                    {filteredPaidOrders.length === 0 ? (
                        <Card className="bg-gray-900/50 border-gray-700">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard size={32} className="text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {searchTerm ? 'Aucune commande payée correspondante' : 'Aucune commande payée aujourd\'hui'}
                                </h3>
                                <p className="text-gray-400">
                                    {searchTerm 
                                        ? 'Essayez de modifier votre recherche' 
                                        : 'Les commandes payées d\'aujourd\'hui apparaîtront ici'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPaidOrders.map((order) => (
                                <OrderCard key={order.id} order={order} activeTab="paid" />
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

            {/* ✅ Indicateur de connexion temps réel amélioré */}
            <div className="fixed bottom-4 right-4 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400">
                        {orders.length} commande{orders.length !== 1 ? 's' : ''} aujourd'hui • 
                        {orderStats.pendingOrders} en cours • 
                        {orderStats.totalRevenue.toFixed(2)}€ CA
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AdminOrdersView;