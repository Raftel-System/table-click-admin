// src/hooks/useOrders.ts
import { useState, useEffect } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { rtDatabase } from '@/lib/firebase';

export interface OrderItem {
    nom: string;
    quantite: number;
    prix?: number;
    specialInstructions?: string;
}

// ✅ Type de statut strict
export type OrderStatus = 'pending' | 'served' | 'cancelled';

export interface Order {
    id: string;
    createdAt: string;
    status: OrderStatus; // ✅ Type strict au lieu de string
    mode: 'sur_place' | 'emporter';
    tableNumber?: number;
    numeroClient?: number;
    total: number;
    items: OrderItem[];
    noteCommande?: string;
    // ✅ Nouveaux champs pour le suivi des statuts
    updatedAt?: string; // Date de dernière modification
    servedAt?: string; // Date de service
    cancelledAt?: string; // Date d'annulation
    cancellationReason?: string; // Raison de l'annulation
    // Champs calculés
    tablePath?: string; // 'tables' ou 'takeaway'
    tableId?: string; // numéro de table ou 'takeaway'
}

export interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    tableOrders: number;
    takeawayOrders: number;
    averageOrderValue: number;
    ordersThisHour: number;
    // ✅ Nouvelles stats par statut
    pendingOrders: number;
    servedOrders: number;
    cancelledOrders: number;
}

interface OrderData {
    items: Array<{
        nom: string;
        prix: number;
        quantite: number;
    }>;
    total: number;
    createdAt: string;
    status?: OrderStatus; // ✅ Optionnel pour compatibilité
    numeroClient?: string;
    noteCommande?: string;
    updatedAt?: string;
    servedAt?: string;
    cancelledAt?: string;
}

export const useOrders = (restaurantSlug: string) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantSlug) {
            setLoading(false);
            return;
        }

        console.log('🔄 Initializing real-time orders listener for:', restaurantSlug);

        const ordersRef = ref(rtDatabase, `orders/${restaurantSlug}`);

        setLoading(true);
        setError(null);

        const unsubscribe = onValue(ordersRef,
            (snapshot) => {
                try {
                    const data = snapshot.val();
                    console.log('📥 Orders data received:', data);
                    const allOrders: Order[] = [];

                    if (data) {
                        // Parcourir les tables
                        if (data.tables) {
                            Object.entries(data.tables).forEach(([tableId, tableData]: [string, any]) => {
                                if (tableData && typeof tableData === 'object') {
                                    Object.entries(tableData).forEach(([orderId, orderData]: [string, any]) => {
                                        if (orderData && typeof orderData === 'object') {
                                            allOrders.push({
                                                id: orderId,
                                                ...orderData,
                                                status: orderData.status || 'pending', // ✅ Défaut pending
                                                mode: 'sur_place' as const,
                                                tableNumber: parseInt(tableId) || 0,
                                                tablePath: 'tables',
                                                tableId: tableId
                                            });
                                        }
                                    });
                                }
                            });
                        }

                        // Parcourir les commandes à emporter
                        if (data.takeaway) {
                            Object.entries(data.takeaway).forEach(([orderId, orderData]) => {
                                if (orderData &&
                                    typeof orderData === 'object' &&
                                    'items' in orderData &&
                                    'total' in orderData &&
                                    'createdAt' in orderData) {

                                    const typedOrderData = orderData as OrderData;
                                    allOrders.push({
                                        id: orderId,
                                        ...typedOrderData,
                                        status: typedOrderData.status || 'pending', // ✅ Défaut pending
                                        mode: 'emporter' as const,
                                        tablePath: 'takeaway',
                                        tableId: 'takeaway',
                                        numeroClient: typedOrderData.numeroClient ? Number(typedOrderData.numeroClient) : undefined
                                    });
                                }
                            });
                        }
                    }

                    // Trier par date de création (plus récent en premier)
                    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    setOrders(allOrders);
                    setLoading(false);
                    setError(null);
                    console.log(`✅ ${allOrders.length} commandes chargées pour ${restaurantSlug}`);
                } catch (err) {
                    console.error('❌ Erreur lors du parsing des commandes:', err);
                    setError('Erreur lors du traitement des commandes');
                    setLoading(false);
                }
            },
            (error) => {
                console.error('❌ Firebase orders listener error:', error);
                setError(`Erreur de connexion: ${error.message}`);
                setLoading(false);
            }
        );

        return () => {
            off(ordersRef, 'value', unsubscribe);
        };
    }, [restaurantSlug]);

    // ✅ Fonction pour mettre à jour le statut d'une commande
    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, reason?: string): Promise<void> => {
        if (!restaurantSlug) throw new Error('Restaurant slug requis');

        try {
            // Trouver la commande pour connaître son chemin
            const order = orders.find(o => o.id === orderId);
            if (!order) throw new Error('Commande introuvable');

            // ✅ Validation des transitions de statut
            const validTransitions: Record<OrderStatus, OrderStatus[]> = {
                pending: ['served', 'cancelled'],
                served: [], // Aucune transition possible depuis served
                cancelled: [] // Aucune transition possible depuis cancelled
            };

            if (!validTransitions[order.status].includes(newStatus)) {
                throw new Error(`Transition non autorisée: ${order.status} → ${newStatus}`);
            }

            const orderPath = `orders/${restaurantSlug}/${order.tablePath}/${order.tableId}/${orderId}`;
            const now = new Date().toISOString();

            // Données à mettre à jour
            const updateData: Record<string, any> = {
                status: newStatus,
                updatedAt: now
            };

            // Ajouter timestamp et raison spécifique selon le statut
            if (newStatus === 'served') {
                updateData.servedAt = now;
            } else if (newStatus === 'cancelled') {
                updateData.cancelledAt = now;
                if (reason) {
                    updateData.cancellationReason = reason;
                }
            }

            console.log(`🔄 Mise à jour statut commande ${orderId}: ${order.status} → ${newStatus}`, reason ? `(${reason})` : '');

            await update(ref(rtDatabase, orderPath), updateData);

            console.log(`✅ Statut mis à jour avec succès pour ${orderId}`);
        } catch (error) {
            console.error('❌ Erreur mise à jour statut:', error);
            throw new Error(`Impossible de mettre à jour le statut: ${error.message}`);
        }
    };

    // ✅ Statistiques mises à jour avec statuts
    const getOrderStats = (): OrderStats => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfHour = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());

        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startOfDay;
        });

        const thisHourOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startOfHour;
        });

        const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const tableOrders = todayOrders.filter(order => order.mode === 'sur_place').length;
        const takeawayOrders = todayOrders.filter(order => order.mode === 'emporter').length;

        // ✅ Stats par statut
        const pendingOrders = todayOrders.filter(order => order.status === 'pending').length;
        const servedOrders = todayOrders.filter(order => order.status === 'served').length;
        const cancelledOrders = todayOrders.filter(order => order.status === 'cancelled').length;

        return {
            totalOrders: todayOrders.length,
            totalRevenue,
            tableOrders,
            takeawayOrders,
            averageOrderValue: todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0,
            ordersThisHour: thisHourOrders.length,
            pendingOrders,
            servedOrders,
            cancelledOrders
        };
    };

    // ✅ Filtres par statut
    const getOrdersByStatus = (status: OrderStatus | 'all' = 'all'): Order[] => {
        if (status === 'all') return orders;
        return orders.filter(order => order.status === status);
    };

    const getPendingOrders = (): Order[] => {
        return orders.filter(order => order.status === 'pending')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    const getCompletedOrders = (): Order[] => {
        return orders.filter(order => order.status === 'served' || order.status === 'cancelled')
            .sort((a, b) => {
                const dateA = new Date(a.servedAt || a.cancelledAt || a.updatedAt || a.createdAt);
                const dateB = new Date(b.servedAt || b.cancelledAt || b.updatedAt || b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });
    };

    // Fonction pour grouper les commandes par date
    const getOrdersByDate = () => {
        const grouped = orders.reduce((acc, order) => {
            const date = new Date(order.createdAt).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(order);
            return acc;
        }, {} as Record<string, Order[]>);

        return Object.entries(grouped)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, orders]) => ({
                date,
                orders: orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                count: orders.length,
                totalRevenue: orders.reduce((sum, order) => sum + order.total, 0)
            }));
    };

    // Fonction pour imprimer un ticket
    const printTicket = async (order: Order): Promise<{ success: boolean; result?: any }> => {
        try {
            const printData = {
                table: order.mode === 'sur_place' ? order.tableNumber?.toString() : 'EMPORTER',
                commandeId: order.id,
                produits: order.items.map(item => ({
                    nom: item.nom,
                    quantite: item.quantite,
                    ...(item.specialInstructions && { specialInstructions: item.specialInstructions })
                }))
            };

            console.log('🖨️ Envoi vers imprimante:', printData);

            const response = await fetch(`http://localhost:3001/print-ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ma-cle-secrete'
                },
                body: JSON.stringify(printData),
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                throw new Error(`Erreur d'impression: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Ticket imprimé avec succès:', result);
            return { success: true, result };

        } catch (error: any) {
            console.error('❌ Erreur impression ticket:', error);

            let errorMessage = 'Erreur lors de l\'impression';
            if (error.name === 'AbortError') {
                errorMessage = 'Timeout: L\'imprimante ne répond pas';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Impossible de contacter le serveur d\'impression';
            } else {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    };

    // Fonction pour filtrer les commandes
    const filterOrders = (
        searchTerm: string = '',
        dateRange: { start?: Date; end?: Date } = {},
        statusFilter: OrderStatus | 'all' = 'all',
        typeFilter: string = 'all',
        amountRange: { min?: number; max?: number } = {}
    ) => {
        let filtered = [...orders];

        // Filtre par terme de recherche
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(order => {
                const matchesId = order.id.toLowerCase().includes(term);
                const matchesTable = order.tableNumber?.toString().includes(term);
                const matchesClient = order.numeroClient?.toString().includes(term);
                const matchesItems = order.items.some(item => 
                    item.nom.toLowerCase().includes(term)
                );
                const matchesTotal = order.total.toString().includes(term);
                
                return matchesId || matchesTable || matchesClient || matchesItems || matchesTotal;
            });
        }

        // Filtre par plage de dates
        if (dateRange.start || dateRange.end) {
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt);
                const afterStart = !dateRange.start || orderDate >= dateRange.start;
                const beforeEnd = !dateRange.end || orderDate <= dateRange.end;
                return afterStart && beforeEnd;
            });
        }

        // ✅ Filtre par statut
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Filtre par type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(order => order.mode === typeFilter);
        }

        // Filtre par montant
        if (amountRange.min !== undefined || amountRange.max !== undefined) {
            filtered = filtered.filter(order => {
                const aboveMin = amountRange.min === undefined || order.total >= amountRange.min;
                const belowMax = amountRange.max === undefined || order.total <= amountRange.max;
                return aboveMin && belowMax;
            });
        }

        return filtered;
    };

    return {
        orders,
        loading,
        error,
        getOrderStats,
        getOrdersByDate,
        filterOrders,
        printTicket,
        // ✅ Nouvelles fonctions pour les statuts
        updateOrderStatus,
        getOrdersByStatus,
        getPendingOrders,
        getCompletedOrders
    };
};