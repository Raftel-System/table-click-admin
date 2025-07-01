// src/hooks/useOrders.ts
import { useState, useEffect } from 'react';
import { ref, onValue, off, update, push } from 'firebase/database';
import { rtDatabase } from '@/lib/firebase';
import {getRestaurantConfig} from "@/hooks/useRestaurant.ts";

export interface OrderItem {
    nom: string;
    quantite: number;
    prix?: number;
    specialInstructions?: string;
    // ✅ Nouveaux champs pour les menus composés
    isComposed?: boolean;
    originalPrice?: number; // Prix de base avant personnalisation
    portionType?: string; // normal, piece, demi
    portionLabel?: string; // Affichage portion
    // ✅ Sélections pour menus composés
    selections?: MenuSelection[];
    selectedItems?: ComposedOrderItem[];
}

// ✅ Types pour les menus composés dans les commandes
export interface MenuSelection {
    stepId: string;
    stepLabel: string;
    selectedItemIds?: string[];
    selectedCustomOptions?: string[];
    customNote?: string;
}

export interface ComposedOrderItem {
    stepId: string;
    stepLabel: string;
    items: Array<{
        id: string;
        nom: string;
        priceAdjustment?: number;
        customNote?: string;
        emoji?: string;
    }>;
}

// ✅ Types de statut selon le nouveau workflow
export type OrderStatus = 'pending' | 'served' | 'paid' | 'cancelled';

export interface Order {
    id: string;
    createdAt: string;
    status: OrderStatus; // ✅ Type strict avec 4 statuts
    mode: 'sur_place' | 'emporter';
    tableNumber?: number;
    numeroClient?: number;
    total: number;
    items: OrderItem[];
    noteCommande?: string;
    // ✅ Champs pour le suivi des statuts et transitions
    updatedAt?: string; // Date de dernière modification
    servedAt?: string; // Date de service (pending → served)
    paidAt?: string; // Date de paiement (served → paid)
    cancelledAt?: string; // Date d'annulation
    cancellationReason?: string; // Raison de l'annulation
    // Champs calculés
    tablePath?: string; // 'tables' ou 'takeaway'
    tableId?: string; // numéro de table ou 'takeaway'
}

export interface OrderStats {
    totalOrders: number;
    totalRevenue: number; // ✅ Basé uniquement sur les commandes 'paid'
    tableOrders: number;
    takeawayOrders: number;
    averageOrderValue: number;
    ordersThisHour: number;
    // ✅ Stats par statut
    pendingOrders: number;
    servedOrders: number;
    paidOrders: number;
    cancelledOrders: number;
}

interface OrderData {
    items: Array<{
        nom: string;
        prix: number;
        quantite: number;
        specialInstructions?: string;
        // ✅ Données pour menus composés
        isComposed?: boolean;
        originalPrice?: number;
        portionType?: string;
        portionLabel?: string;
        selections?: MenuSelection[];
        selectedItems?: ComposedOrderItem[];
    }>;
    total: number;
    createdAt: string;
    status?: OrderStatus; // ✅ Optionnel pour compatibilité
    numeroClient?: string;
    noteCommande?: string;
    updatedAt?: string;
    servedAt?: string;
    paidAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
}

// ✅ Interface pour les commandes à soumettre depuis OrderWorkflow
export interface ActiveOrder {
    id: string;
    name: string;
    cart: CartItem[];
    orderType: 'sur_place' | 'emporter';
    tableNumber: string;
    clientNumber: string;
    globalNote: string;
    total: number;
}

export interface CartItem {
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string;
    emoji: string;
    variant?: string;
    portionType?: string;
    originalPrice?: number;
    portionLabel?: string;
    isComposed?: boolean;
    selections?: MenuSelection[];
    selectedItems?: Array<{
        stepId: string;
        stepLabel: string;
        items: Array<{
            id: string;
            nom: string;
            priceAdjustment?: number;
            customNote?: string;
        }>;
    }>;
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

                    // ✅ Filtrer les commandes d'aujourd'hui seulement
                    const today = new Date();
                    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    const todayOrders = allOrders.filter(order => {
                        const orderDate = new Date(order.createdAt);
                        return orderDate >= startOfDay;
                    });

                    // Trier par date de création (plus récent en premier)
                    todayOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    setOrders(todayOrders);
                    setLoading(false);
                    setError(null);
                    console.log(`✅ ${todayOrders.length} commandes d'aujourd'hui chargées pour ${restaurantSlug}`);
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

    // ✅ Fonction utilitaire pour nettoyer les valeurs undefined
    const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) return null;

        if (Array.isArray(obj)) {
            return obj.map(cleanObject).filter(item => item !== null && item !== undefined);
        }

        if (typeof obj === 'object') {
            const cleaned: any = {};
            Object.keys(obj).forEach(key => {
                const value = cleanObject(obj[key]);
                if (value !== null && value !== undefined) {
                    cleaned[key] = value;
                }
            });
            return cleaned;
        }

        return obj;
    };

    // ✅ Fonction pour transformer les CartItem en OrderItem pour Firebase
    const transformCartToOrderItems = (cartItems: CartItem[]): OrderItem[] => {
        return cartItems.map(cartItem => {
            const orderItem: OrderItem = {
                nom: cartItem.nom,
                quantite: cartItem.quantite,
                prix: cartItem.prix
            };

            // ✅ Ajouter specialInstructions seulement si présent et non vide
            if (cartItem.note && cartItem.note.trim()) {
                orderItem.specialInstructions = cartItem.note.trim();
            }

            // ✅ Ajouter les données de portion si présentes
            if (cartItem.portionType && cartItem.portionType !== 'normal') {
                orderItem.portionType = cartItem.portionType;
                if (cartItem.portionLabel) {
                    orderItem.portionLabel = cartItem.portionLabel;
                }
                if (cartItem.originalPrice) {
                    orderItem.originalPrice = cartItem.originalPrice;
                }
            }

            // ✅ Ajouter les données de menu composé si présentes
            if (cartItem.isComposed) {
                orderItem.isComposed = true;
                if (cartItem.originalPrice) {
                    orderItem.originalPrice = cartItem.originalPrice;
                }

                // Transformer les selections depuis CartItem vers OrderItem format
                if (cartItem.selections && cartItem.selections.length > 0) {
                    orderItem.selections = cartItem.selections.map(selection => ({
                        stepId: selection.stepId,
                        stepLabel: selection.stepLabel,
                        ...(selection.selectedItemIds && selection.selectedItemIds.length > 0 && {
                            selectedItemIds: selection.selectedItemIds
                        }),
                        ...(selection.selectedCustomOptions && selection.selectedCustomOptions.length > 0 && {
                            selectedCustomOptions: selection.selectedCustomOptions
                        }),
                        ...(selection.customNote && selection.customNote.trim() && {
                            customNote: selection.customNote.trim()
                        })
                    }));
                }

                // Transformer les selectedItems depuis CartItem vers OrderItem format
                if (cartItem.selectedItems && cartItem.selectedItems.length > 0) {
                    orderItem.selectedItems = cartItem.selectedItems.map(selection => ({
                        stepId: selection.stepId,
                        stepLabel: selection.stepLabel,
                        items: selection.items.map(item => {
                            const cleanItem: any = {
                                id: item.id,
                                nom: item.nom
                            };

                            if (item.priceAdjustment !== undefined && item.priceAdjustment !== 0) {
                                cleanItem.priceAdjustment = item.priceAdjustment;
                            }

                            if (item.customNote && item.customNote.trim()) {
                                cleanItem.customNote = item.customNote.trim();
                            }

                            return cleanItem;
                        })
                    }));
                }
            }

            // ✅ Nettoyer l'objet final pour supprimer toutes les valeurs undefined
            return cleanObject(orderItem);
        });
    };

    const submitOrder = async (activeOrder: ActiveOrder): Promise<string> => {
        if (!restaurantSlug) throw new Error('Restaurant slug requis');

        try {
            console.log('🔄 Soumission commande:', activeOrder);

            // Générer un ID unique pour la commande
            const now = new Date();
            const timestamp = now.toISOString();

            // Transformer les items du panier vers le format Firebase
            const orderItems = transformCartToOrderItems(activeOrder.cart);

            // Préparer les données de commande pour Firebase
            const orderData: OrderData = {
                items: orderItems,
                total: activeOrder.total,
                createdAt: timestamp,
                status: 'pending',
                updatedAt: timestamp
            };

            // ✅ Ajouter noteCommande seulement si présente et non vide
            if (activeOrder.globalNote && activeOrder.globalNote.trim()) {
                orderData.noteCommande = activeOrder.globalNote.trim();
            }

            // Déterminer le chemin selon le type de commande
            let orderPath: string;
            if (activeOrder.orderType === 'sur_place') {
                orderPath = `orders/${restaurantSlug}/tables/${activeOrder.tableNumber}`;
                // Pas besoin d'ajouter numeroClient pour sur_place
            } else {
                orderPath = `orders/${restaurantSlug}/takeaway`;
                if (activeOrder.clientNumber && activeOrder.clientNumber.trim()) {
                    orderData.numeroClient = activeOrder.clientNumber.trim();
                }
            }

            // ✅ Nettoyer les données finales avant envoi
            const cleanedOrderData = cleanObject(orderData);

            // Créer la référence et pousser la commande
            const ordersRef = ref(rtDatabase, orderPath);
            const newOrderRef = await push(ordersRef, cleanedOrderData);

            if (!newOrderRef.key) {
                throw new Error('Erreur lors de la génération de l\'ID de commande');
            }

            console.log(`✅ Commande créée avec succès: ${newOrderRef.key}`);
            console.log(`📍 Chemin: ${orderPath}/${newOrderRef.key}`);

            // ✅ 🖨️ IMPRESSION AUTOMATIQUE - directement après création réussie
            try {
                console.log('🖨️ Impression automatique du ticket...');

                // Reconstruire l'objet Order pour l'impression
                const orderForPrint: Order = {
                    id: newOrderRef.key,
                    createdAt: timestamp,
                    status: 'pending',
                    mode: activeOrder.orderType,
                    tableNumber: activeOrder.orderType === 'sur_place' ? parseInt(activeOrder.tableNumber) : undefined,
                    numeroClient: activeOrder.orderType === 'emporter' ? parseInt(activeOrder.clientNumber) : undefined,
                    total: activeOrder.total,
                    items: orderItems,
                    noteCommande: orderData.noteCommande,
                    updatedAt: timestamp,
                    tablePath: activeOrder.orderType === 'sur_place' ? 'tables' : 'takeaway',
                    tableId: activeOrder.orderType === 'sur_place' ? activeOrder.tableNumber : 'takeaway'
                };

                await printTicket(orderForPrint);
                console.log('✅ Ticket imprimé automatiquement avec succès');

            } catch (printError: any) {
                console.error('❌ Erreur impression automatique:', printError);
                // On ne throw pas l'erreur d'impression pour ne pas bloquer la création de commande
                // L'utilisateur sera informé dans le workflow que l'impression a échoué
                console.warn('⚠️ Commande créée mais impression échouée:', printError.message);
            }

            return newOrderRef.key;

        } catch (error) {
            console.error('❌ Erreur soumission commande:', error);
            throw new Error(`Impossible de soumettre la commande: ${error.message}`);
        }
    };

    // ✅ Fonction pour mettre à jour le statut d'une commande avec validation des transitions
    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, reason?: string): Promise<void> => {
        if (!restaurantSlug) throw new Error('Restaurant slug requis');

        try {
            // Trouver la commande pour connaître son chemin et statut actuel
            const order = orders.find(o => o.id === orderId);
            if (!order) throw new Error('Commande introuvable');

            // ✅ Validation stricte des transitions de statut
            const validTransitions: Record<OrderStatus, OrderStatus[]> = {
                pending: ['served', 'cancelled'],
                served: ['paid'],
                paid: [], // Aucune transition possible depuis paid
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

            // ✅ Ajouter timestamp spécifique selon le statut
            if (newStatus === 'served') {
                updateData.servedAt = now;
            } else if (newStatus === 'paid') {
                updateData.paidAt = now;
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

    // ✅ Statistiques basées uniquement sur les commandes 'paid' du jour
    const getOrderStats = (): OrderStats => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfHour = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());

        // Toutes les commandes du jour
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startOfDay;
        });

        const thisHourOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startOfHour;
        });

        // ✅ Revenus basés UNIQUEMENT sur les commandes payées
        const paidOrders = todayOrders.filter(order => order.status === 'paid');
        const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        const tableOrders = todayOrders.filter(order => order.mode === 'sur_place').length;
        const takeawayOrders = todayOrders.filter(order => order.mode === 'emporter').length;

        // ✅ Stats par statut
        const pendingOrders = todayOrders.filter(order => order.status === 'pending').length;
        const servedOrders = todayOrders.filter(order => order.status === 'served').length;
        const paidOrdersCount = paidOrders.length;
        const cancelledOrders = todayOrders.filter(order => order.status === 'cancelled').length;

        return {
            totalOrders: todayOrders.length,
            totalRevenue, // ✅ Uniquement les commandes payées
            tableOrders,
            takeawayOrders,
            averageOrderValue: paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0,
            ordersThisHour: thisHourOrders.length,
            pendingOrders,
            servedOrders,
            paidOrders: paidOrdersCount,
            cancelledOrders
        };
    };

    // ✅ Filtres par statut pour les 3 onglets
    const getPendingOrders = (): Order[] => {
        return orders.filter(order => order.status === 'pending')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    const getServedOrders = (): Order[] => {
        return orders.filter(order => order.status === 'served')
            .sort((a, b) => new Date(b.servedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.servedAt || a.updatedAt || a.createdAt).getTime());
    };

    const getPaidOrders = (): Order[] => {
        return orders.filter(order => order.status === 'paid')
            .sort((a, b) => new Date(b.paidAt || b.updatedAt || b.createdAt).getTime() - new Date(a.paidAt || a.updatedAt || a.createdAt).getTime());
    };

    // ✅ Les commandes annulées ne sont pas affichées dans l'interface normale
    // Uniquement accessible pour debug/export
    const getCancelledOrders = (): Order[] => {
        return orders.filter(order => order.status === 'cancelled')
            .sort((a, b) => new Date(b.cancelledAt || b.updatedAt || b.createdAt).getTime() - new Date(a.cancelledAt || a.updatedAt || a.createdAt).getTime());
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
                totalRevenue: orders.filter(o => o.status === 'paid').reduce((sum, order) => sum + order.total, 0)
            }));
    };

    const printTicket = async (order: Order): Promise<{ success: boolean; result?: any }> => {
        try {
            // 1. Récupérer la configuration du restaurant
            const config = await getRestaurantConfig(restaurantSlug);

            if (!config) {
                throw new Error('Configuration du restaurant introuvable');
            }

            // 2. Vérifier que les IPs sont configurées
            if (!config.printerIp || !config.serverPrinterIp) {
                throw new Error('Configuration d\'impression incomplète (printerIp ou serverPrinterIp manquant)');
            }

            // 3. Préparer les données d'impression
            const printData = {
                ip: config.printerIp,
                table: order.mode === 'sur_place' ? order.tableNumber?.toString() : 'EMPORTER',
                commandeId: order.id,
                // ✅ Note globale de la commande si présente
                ...(order.noteCommande && { noteCommande: order.noteCommande }),
                produits: order.items.map(item => {
                    const baseProduct = {
                        nom: item.nom,
                        quantite: item.quantite,
                        ...(item.specialInstructions && { specialInstructions: item.specialInstructions })
                    };

                    // ✅ Ajouter les détails des menus composés pour l'impression
                    if (item.isComposed && item.selectedItems) {
                        return {
                            ...baseProduct,
                            isComposed: true,
                            composedDetails: item.selectedItems.map(selection => ({
                                stepLabel: selection.stepLabel,
                                items: selection.items.map(selectedItem => ({
                                    nom: selectedItem.nom,
                                    ...(selectedItem.customNote && { note: selectedItem.customNote })
                                }))
                            }))
                        };
                    }

                    // ✅ Ajouter les infos de portion si présentes
                    if (item.portionType && item.portionType !== 'normal' && item.portionLabel) {
                        return {
                            ...baseProduct,
                            portionInfo: item.portionLabel
                        };
                    }

                    return baseProduct;
                })
            };

            console.log('🖨️ Envoi vers imprimante:', {
                commandeId: printData.commandeId,
                table: printData.table,
                produits: printData.produits.length,
                serverUrl: `https://zeus-lab.tailfdaef5.ts.net/print-ticket`
            });

            // 4. Envoyer la requête au serveur d'impression
            const response = await fetch(`https://zeus-lab.tailfdaef5.ts.net/print-ticket`, {
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

    return {
        orders,
        loading,
        error,
        getOrderStats,
        getOrdersByDate,
        printTicket,
        // ✅ Fonctions pour le nouveau workflow
        updateOrderStatus,
        getPendingOrders,
        getServedOrders,
        getPaidOrders,
        getCancelledOrders, // Pour debug uniquement
        // ✅ Nouvelle fonction pour soumettre les commandes
        submitOrder
    };
};