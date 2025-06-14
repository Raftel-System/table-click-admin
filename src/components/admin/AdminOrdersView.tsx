// src/components/admin/AdminOrdersView.tsx - Version temps réel
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useOrders, type Order } from '@/hooks/useOrders';
import { useRestaurantContext } from '@/contexts/RestaurantContext';
import {
    Printer,
    Clock,
    Users,
    Package,
    MapPin,
    Euro,
    StickyNote,
    RefreshCw
} from 'lucide-react';

interface AdminOrdersViewProps {
    // Props supprimées car on utilise maintenant le hook useOrders
}

const AdminOrdersView: React.FC<AdminOrdersViewProps> = () => {
    const { toast } = useToast();
    const { restaurant } = useRestaurantContext();
    const { orders, loading, error, printTicket, getOrderStats } = useOrders(restaurant?.id || '');
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

    // Gérer l'impression d'un ticket
    const handlePrintTicket = async (order: Order) => {
        setPrintingOrderId(order.id);

        try {
            await printTicket(order, 'ma-cle-secrete');
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

    // Formatage de l'heure
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Formatage de la date relative
    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const orderTime = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Il y a ${diffInHours}h`;

        return orderTime.toLocaleDateString('fr-FR');
    };

    // Obtenir la couleur selon le type de commande
    const getOrderTypeColor = (order: Order) => {
        return order.mode === 'sur_place'
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
            : 'bg-green-500/20 text-green-400 border-green-500/50';
    };

    // Obtenir l'icône selon le type de commande
    const getOrderTypeIcon = (order: Order) => {
        return order.mode === 'sur_place' ? '🪑' : '📦';
    };

    // Affichage du chargement
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="animate-spin" size={20} />
                        <span className="text-gray-400">Chargement des commandes...</span>
                    </div>
                </div>
                {/* Skeleton cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                            <CardContent className="p-4">
                                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2 mb-3"></div>
                                <div className="h-8 bg-gray-700 rounded w-full"></div>
                            </CardContent>
                        </Card>
                    ))}
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
                            <Package size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Erreur de chargement</h3>
                        <p className="text-red-400 text-sm">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Pas de commandes
    if (orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Card className="bg-gray-900/50 border-gray-700 max-w-md">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Aucune commande</h3>
                        <p className="text-gray-400">Les nouvelles commandes apparaîtront ici en temps réel</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header avec statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{getOrderStats().totalOrders}</div>
                        <div className="text-sm text-blue-300">Commandes aujourd'hui</div>
                    </CardContent>
                </Card>

                <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{getOrderStats().totalRevenue.toFixed(2)}€</div>
                        <div className="text-sm text-green-300">Chiffre d'affaires</div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-500/10 border-purple-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{getOrderStats().tableOrders}</div>
                        <div className="text-sm text-purple-300">Sur place</div>
                    </CardContent>
                </Card>

                <Card className="bg-orange-500/10 border-orange-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-400">{getOrderStats().takeawayOrders}</div>
                        <div className="text-sm text-orange-300">À emporter</div>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des commandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                    <Card
                        key={order.id}
                        className="bg-gray-900/90 border-gray-700 hover:border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <CardContent className="p-4">
                            {/* Header de la commande */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{getOrderTypeIcon(order)}</span>
                                    <div>
                                        <div className="font-medium text-white text-sm">
                                            {order.mode === 'sur_place' ? `Table ${order.tableNumber}` : `N°${order.numeroClient || 'EMPORTER'}`}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {order.id.substring(0, 8)}...
                                        </div>
                                    </div>
                                </div>

                                <Badge className={`text-xs ${getOrderTypeColor(order)} border`}>
                                    {order.mode === 'sur_place' ? 'Sur place' : 'À emporter'}
                                </Badge>
                            </div>

                            {/* Informations temporelles */}
                            <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>{formatTime(order.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>{formatRelativeTime(order.createdAt)}</span>
                                </div>
                            </div>

                            {/* Articles de la commande */}
                            <div className="space-y-1 mb-3">
                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                    <Package size={12} />
                                    <span>{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
                                </div>
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

                            {/* Note de commande */}
                            {order.noteCommande && (
                                <div className="mb-3 p-2 bg-gray-800/50 rounded border border-gray-700">
                                    <div className="flex items-start gap-2">
                                        <StickyNote size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-gray-300">{order.noteCommande}</span>
                                    </div>
                                </div>
                            )}

                            {/* Total et actions */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                <div className="flex items-center gap-1">
                                    <Euro size={14} className="text-yellow-500" />
                                    <span className="text-lg font-bold text-yellow-500">
                                        {order.total.toFixed(2)}€
                                    </span>
                                </div>

                                {/* Bouton d'impression */}
                                <Button
                                    onClick={() => handlePrintTicket(order)}
                                    disabled={printingOrderId === order.id}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 text-xs px-3 py-1.5"
                                >
                                    {printingOrderId === order.id ? (
                                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Printer size={12} className="mr-1" />
                                            Imprimer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Statut de connexion temps réel */}
            <div className="fixed bottom-4 right-4 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400">Temps réel actif</span>
                </div>
            </div>
        </div>
    );
};

export default AdminOrdersView;