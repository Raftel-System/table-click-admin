// src/hooks/useOrders.ts
import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtDatabase } from '@/lib/firebase';

export interface OrderItem {
    nom: string;
    quantite: number;
    prix?: number;
    specialInstructions?: string;
}

export interface Order {
    id: string;
    createdAt: string;
    status: string;
    mode: 'sur_place' | 'emporter';
    tableNumber?: number;
    numeroClient?: number;
    total: number;
    items: OrderItem[];
    noteCommande?: string;
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
}

interface OrderData {
    items: Array<{
        nom: string;
        prix: number;
        quantite: number;
    }>;
    total: number;
    createdAt: string;
    numeroClient?: string;
    noteCommande?: string;
    // Ajoutez d'autres propriétés selon vos données
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

        // ✅ Utiliser la vraie structure Firebase: orders/${restaurantSlug}
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
                        // (structure: orders/restaurant/tables/tableX/orderId)
                        if (data.tables) {
                            Object.entries(data.tables).forEach(([tableId, tableData]: [string, any]) => {
                                if (tableData && typeof tableData === 'object') {
                                    Object.entries(tableData).forEach(([orderId, orderData]: [string, any]) => {
                                        if (orderData && typeof orderData === 'object') {
                                            allOrders.push({
                                                id: orderId,
                                                ...orderData,
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

                        // (structure: orders/restaurant/takeaway/orderId)
                        if (data.takeaway) {
                            Object.entries(data.takeaway).forEach(([orderId, orderData]) => {
                                // Vérification que orderData correspond à OrderData
                                if (orderData &&
                                    typeof orderData === 'object' &&
                                    'items' in orderData &&
                                    'total' in orderData &&
                                    'createdAt' in orderData) {

                                    const typedOrderData = orderData as OrderData;
                                    allOrders.push({
                                        id: orderId,
                                        ...typedOrderData,
                                        mode: 'emporter' as const,
                                        tablePath: 'takeaway',
                                        tableId: 'takeaway',
                                        status: 'pending',
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

        // ✅ Cleanup correct
        return () => {
            off(ordersRef, 'value', unsubscribe);
        };
    }, [restaurantSlug]);

    // Calculer les statistiques des commandes
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

        return {
            totalOrders: todayOrders.length,
            totalRevenue,
            tableOrders,
            takeawayOrders,
            averageOrderValue: todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0,
            ordersThisHour: thisHourOrders.length
        };
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

        // Convertir en tableau trié par date (plus récent en premier)
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
    const printTicket = async (order: Order) => {
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

            // Messages d'erreur plus explicites
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
        statusFilter: string = 'all',
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

        // Filtre par statut
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
        printTicket
    };
};