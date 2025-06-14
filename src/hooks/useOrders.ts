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

export const useOrders = (restaurantSlug: string) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantSlug) {
            setLoading(false);
            return;
        }

        const ordersRef = ref(rtDatabase, `orders/${restaurantSlug}`);

        setLoading(true);
        setError(null);

        const unsubscribe = onValue(ordersRef,
            (snapshot) => {
                try {
                    const data = snapshot.val();
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
                                                tablePath: 'tables',
                                                tableId: tableId
                                            });
                                        }
                                    });
                                }
                            });
                        }

                        // Parcourir takeaway
                        if (data.takeaway) {
                            Object.entries(data.takeaway).forEach(([orderId, orderData]: [string, any]) => {
                                if (orderData && typeof orderData === 'object') {
                                    allOrders.push({
                                        id: orderId,
                                        ...orderData,
                                        tablePath: 'takeaway',
                                        tableId: 'takeaway'
                                    });
                                }
                            });
                        }
                    }

                    // Trier par date de création (plus récent en premier)
                    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    setOrders(allOrders);
                    setLoading(false);
                    console.log(`📦 ${allOrders.length} commandes chargées pour ${restaurantSlug}`);
                } catch (err) {
                    console.error('Erreur lors du parsing des commandes:', err);
                    setError('Erreur lors du chargement des commandes');
                    setLoading(false);
                }
            },
            (error) => {
                console.error('Erreur Firebase Realtime Database:', error);
                setError('Erreur de connexion à la base de données');
                setLoading(false);
            }
        );

        // Cleanup
        return () => {
            off(ordersRef, 'value', unsubscribe);
        };
    }, [restaurantSlug]);

    // Fonction pour imprimer un ticket
    const printTicket = async (order: Order, authToken?: string) => {
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

    // Statistiques des commandes
    const getOrderStats = () => {
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt).toDateString();
            return orderDate === today;
        });

        const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        return {
            totalOrders: todayOrders.length,
            totalRevenue,
            tableOrders: todayOrders.filter(order => order.mode === 'sur_place').length,
            takeawayOrders: todayOrders.filter(order => order.mode === 'emporter').length
        };
    };

    return {
        orders,
        loading,
        error,
        printTicket,
        getOrderStats
    };
};