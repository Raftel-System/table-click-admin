// src/services/ordersService.ts
import { ref, push, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { rtDatabase } from '@/lib/firebase';

// Types pour les commandes
export interface OrderItem {
    nom: string;
    prix: number;
    quantite: number;
    specialInstructions?: string;
}

export interface OrderData {
    table?: string | number;
    numeroClient?: string;
    items: OrderItem[];
    total: number;
    note?: string;
    mode: 'sur_place' | 'emporter';
    source?: 'admin' | 'client';
    createdAt?: string;
    status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
}

export interface Order extends OrderData {
    id: string;
    tableNumber?: number;
    noteCommande?: string;
}

export const submitAdminOrder = async (orderData: OrderData, restaurantSlug: string): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    try {
        // Validation des données (identique)
        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('Aucun article dans la commande');
        }

        if (!orderData.total || orderData.total <= 0) {
            throw new Error('Total invalide');
        }

        if (orderData.mode === 'sur_place' && !orderData.table) {
            throw new Error('Numéro de table requis pour les commandes sur place');
        }

        if (orderData.mode === 'emporter' && !orderData.numeroClient) {
            throw new Error('Numéro client requis pour les commandes à emporter');
        }

        // Générer un ID unique et ajouter les métadonnées
        const orderToSubmit: any = {
            source: 'admin',
            createdAt: new Date().toISOString(),
            status: 'pending',
            items: orderData.items,
            total: orderData.total,
            mode: orderData.mode
        };

        if (orderData.mode === 'sur_place' && orderData.table) {
            orderToSubmit.tableNumber = orderData.table;
        }

        if (orderData.mode === 'emporter' && orderData.numeroClient) {
            orderToSubmit.numeroClient = orderData.numeroClient;
        }

        if (orderData.note && orderData.note.trim()) {
            orderToSubmit.noteCommande = orderData.note.trim();
        }

        const orderPath = orderData.mode === 'sur_place'
            ? `orders/${restaurantSlug}/tables`
            : `orders/${restaurantSlug}/takeaway`;

        // Créer la référence et pousser la commande
        const orderRef = ref(rtDatabase, orderPath);
        const result = await push(orderRef, orderToSubmit);

        console.log('✅ Commande admin créée avec succès:', result.key);

        return {
            success: true,
            orderId: result.key || undefined
        };

    } catch (error: any) {
        console.error('❌ Erreur lors de la création de la commande admin:', error);
        return {
            success: false,
            error: error.message || 'Erreur inconnue lors de la création de la commande'
        };
    }
};

// ✅ Fonction pour écouter les commandes admin en temps réel
export const listenToAdminOrders = (
    restaurantSlug: string,
    callback: (orders: Order[]) => void,
    errorCallback?: (error: Error) => void
): (() => void) => {
    try {
        // Références pour les deux types de commandes
        const tablesRef = ref(rtDatabase, `orders/${restaurantSlug}/tables`);
        const takeawayRef = ref(rtDatabase, `orders/${restaurantSlug}/takeaway`);

        const allOrders: Order[] = [];
        let tablesLoaded = false;
        let takeawayLoaded = false;

        const processOrders = () => {
            if (tablesLoaded && takeawayLoaded) {
                // Filtrer uniquement les commandes admin et trier par date
                const adminOrders = allOrders
                    .filter(order => order.source === 'admin')
                    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

                callback(adminOrders);
            }
        };

        // Écouter les commandes sur place
        const unsubscribeTables = onValue(tablesRef, (snapshot) => {
            try {
                // Nettoyer les commandes tables existantes
                const existingTablesOrders = allOrders.filter(order => order.mode !== 'sur_place');
                allOrders.length = 0;
                allOrders.push(...existingTablesOrders);

                if (snapshot.exists()) {
                    const tablesData = snapshot.val();

                    // Parcourir chaque table
                    Object.entries(tablesData).forEach(([tableNumber, tableOrders]: [string, any]) => {
                        if (tableOrders && typeof tableOrders === 'object') {
                            Object.entries(tableOrders).forEach(([orderId, orderData]: [string, any]) => {
                                if (orderData && typeof orderData === 'object') {
                                    allOrders.push({
                                        id: orderId,
                                        tableNumber: tableNumber,
                                        mode: 'sur_place',
                                        ...orderData
                                    } as Order);
                                }
                            });
                        }
                    });
                }

                tablesLoaded = true;
                processOrders();
            } catch (error: any) {
                console.error('Erreur lors du traitement des commandes tables:', error);
                errorCallback?.(error);
            }
        }, (error) => {
            console.error('Erreur Firebase tables:', error);
            errorCallback?.(error);
        });

        // Écouter les commandes à emporter
        const unsubscribeTakeaway = onValue(takeawayRef, (snapshot) => {
            try {
                // Nettoyer les commandes takeaway existantes
                const existingTakeawayOrders = allOrders.filter(order => order.mode !== 'emporter');
                allOrders.length = 0;
                allOrders.push(...existingTakeawayOrders);

                if (snapshot.exists()) {
                    const takeawayData = snapshot.val();

                    Object.entries(takeawayData).forEach(([orderId, orderData]: [string, any]) => {
                        if (orderData && typeof orderData === 'object') {
                            allOrders.push({
                                id: orderId,
                                mode: 'emporter',
                                ...orderData
                            } as Order);
                        }
                    });
                }

                takeawayLoaded = true;
                processOrders();
            } catch (error: any) {
                console.error('Erreur lors du traitement des commandes takeaway:', error);
                errorCallback?.(error);
            }
        }, (error) => {
            console.error('Erreur Firebase takeaway:', error);
            errorCallback?.(error);
        });

        // Retourner une fonction de nettoyage
        return () => {
            off(tablesRef);
            off(takeawayRef);
            unsubscribeTables();
            unsubscribeTakeaway();
        };

    } catch (error: any) {
        console.error('Erreur lors de la configuration des listeners:', error);
        errorCallback?.(error);
        return () => {}; // Fonction de nettoyage vide en cas d'erreur
    }
};

// ✅ Hook React pour écouter les commandes admin
export const useAdminOrders = (restaurantSlug: string) => {
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!restaurantSlug) return;

        setLoading(true);
        setError(null);

        const unsubscribe = listenToAdminOrders(
            restaurantSlug,
            (adminOrders) => {
                setOrders(adminOrders);
                setLoading(false);
            },
            (error) => {
                setError(error.message);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [restaurantSlug]);

    return { orders, loading, error };
};

// ✅ Fonction utilitaire pour obtenir les statistiques des commandes admin
export const getAdminOrderStats = (orders: Order[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || '');
        return orderDate >= today;
    });

    return {
        total: todayOrders.length,
        pending: todayOrders.filter(order => order.status === 'pending').length,
        preparing: todayOrders.filter(order => order.status === 'preparing').length,
        ready: todayOrders.filter(order => order.status === 'ready').length,
        delivered: todayOrders.filter(order => order.status === 'delivered').length,
        revenue: todayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        averageOrderValue: todayOrders.length > 0
            ? todayOrders.reduce((sum, order) => sum + (order.total || 0), 0) / todayOrders.length
            : 0
    };
};

export default {
    submitAdminOrder,
    listenToAdminOrders,
    useAdminOrders,
    getAdminOrderStats
};