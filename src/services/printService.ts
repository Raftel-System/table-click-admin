// src/services/printService.ts
import { getRestaurantConfig } from '@/hooks/useRestaurant';

export interface PrintData {
    restaurantSlug: string;
    commandeId: string;
    type: 'sur_place' | 'emporter';
    table?: string; // Numéro de table pour sur_place
    numeroClient?: string; // Numéro client pour emporter
    total: number;
    currency: string;
    createdAt: string;
    globalNote?: string;
    produits: PrintProduct[];
}

export interface PrintProduct {
    nom: string;
    quantite: number;
    prix: number;
    emoji?: string;
    specialInstructions?: string; // ✅ Instructions spéciales par article
}

export interface PrintResponse {
    success: boolean;
    message?: string;
    error?: string;
    result?: any;
}

/**
 * Service d'impression automatique pour les tickets de commande
 * Gère l'envoi vers l'API d'impression avec retry et gestion d'erreurs
 */
export class PrintService {
    private static readonly PRINT_ENDPOINT = 'https://zeus-lab.tailfdaef5.ts.net/print-ticket';
    private static readonly AUTH_TOKEN = 'ma-cle-secrete';
    private static readonly TIMEOUT_MS = 15000;
    private static readonly MAX_RETRIES = 2;

    /**
     * Imprimer un ticket automatiquement après validation de commande
     */
    static async printOrderTicket(
        orderData: {
            items: Array<{
                nom: string;
                prix: number;
                quantite: number;
                specialInstructions?: string;
                emoji?: string;
            }>;
            total: number;
            mode: 'sur_place' | 'emporter';
            table?: string;
            numeroClient?: string;
            note?: string; // Note globale de la commande
        },
        restaurantSlug: string,
        orderId: string
    ): Promise<PrintResponse> {
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < this.MAX_RETRIES) {
            try {
                console.log(`🖨️ Tentative d'impression ${attempt + 1}/${this.MAX_RETRIES} pour commande ${orderId}`);

                const result = await this.executePrint(orderData, restaurantSlug, orderId);
                console.log('✅ Impression réussie:', result);

                return {
                    success: true,
                    message: 'Ticket imprimé avec succès',
                    result
                };

            } catch (error: any) {
                lastError = error;
                attempt++;

                console.warn(`❌ Échec impression tentative ${attempt}:`, error.message);

                // Attendre avant de retry (sauf pour la dernière tentative)
                if (attempt < this.MAX_RETRIES) {
                    await this.delay(1000 * attempt); // 1s, 2s, etc.
                }
            }
        }

        // Toutes les tentatives ont échoué
        console.error('❌ Impression échouée après', this.MAX_RETRIES, 'tentatives:', lastError?.message);

        return {
            success: false,
            error: lastError?.message || 'Erreur d\'impression inconnue'
        };
    }

    /**
     * Exécuter l'impression (une tentative)
     */
    private static async executePrint(
        orderData: {
            items: Array<{
                nom: string;
                prix: number;
                quantite: number;
                specialInstructions?: string;
                emoji?: string;
            }>;
            total: number;
            mode: 'sur_place' | 'emporter';
            table?: string;
            numeroClient?: string;
            note?: string;
        },
        restaurantSlug: string,
        orderId: string
    ): Promise<any> {
        // 1. Récupérer la configuration du restaurant
        const config = await getRestaurantConfig(restaurantSlug);

        if (!config) {
            throw new Error('Configuration du restaurant introuvable');
        }

        if (!config.printerIp) {
            throw new Error('Adresse IP de l\'imprimante non configurée');
        }

        // 2. Préparer les données d'impression complètes
        const printData: PrintData = {
            restaurantSlug,
            commandeId: orderId,
            type: orderData.mode,
            total: orderData.total,
            currency: config.devise || '€',
            createdAt: new Date().toISOString(),
            // ✅ Données de livraison selon le type
            ...(orderData.mode === 'sur_place' && {
                table: orderData.table
            }),
            ...(orderData.mode === 'emporter' && {
                numeroClient: orderData.numeroClient
            }),
            // ✅ Note globale si présente
            ...(orderData.note?.trim() && {
                globalNote: orderData.note.trim()
            }),
            // ✅ Articles avec toutes les informations
            produits: orderData.items.map(item => ({
                nom: item.nom,
                quantite: item.quantite,
                prix: item.prix,
                ...(item.emoji && { emoji: item.emoji }),
                // ✅ Instructions spéciales par article
                ...(item.specialInstructions?.trim() && {
                    specialInstructions: item.specialInstructions.trim()
                })
            }))
        };

        // 3. Préparer la requête avec l'IP de l'imprimante
        const requestPayload = {
            ip: config.printerIp,
            ...printData
        };

        console.log('🖨️ Envoi données impression:', {
            endpoint: this.PRINT_ENDPOINT,
            ip: config.printerIp,
            orderId,
            itemsCount: printData.produits.length,
            total: printData.total
        });

        // 4. Envoyer la requête
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
            const response = await fetch(this.PRINT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.AUTH_TOKEN}`
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Réponse invalide');
                throw new Error(`Erreur serveur: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            return result;

        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Timeout: L\'imprimante ne répond pas dans les temps');
            }

            if (error.message.includes('fetch')) {
                throw new Error('Impossible de contacter le serveur d\'impression');
            }

            throw error;
        }
    }

    /**
     * Utilitaire pour attendre un délai
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Valider les données avant impression
     */
    static validatePrintData(orderData: any): { valid: boolean; error?: string } {
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            return { valid: false, error: 'Aucun article dans la commande' };
        }

        if (typeof orderData.total !== 'number' || orderData.total <= 0) {
            return { valid: false, error: 'Total de commande invalide' };
        }

        if (!['sur_place', 'emporter'].includes(orderData.mode)) {
            return { valid: false, error: 'Type de commande invalide' };
        }

        if (orderData.mode === 'sur_place' && !orderData.table?.trim()) {
            return { valid: false, error: 'Numéro de table requis pour commande sur place' };
        }

        if (orderData.mode === 'emporter' && !orderData.numeroClient?.trim()) {
            return { valid: false, error: 'Numéro client requis pour commande à emporter' };
        }

        // Valider chaque article
        for (const item of orderData.items) {
            if (!item.nom?.trim()) {
                return { valid: false, error: 'Nom d\'article manquant' };
            }
            if (typeof item.quantite !== 'number' || item.quantite <= 0) {
                return { valid: false, error: `Quantité invalide pour ${item.nom}` };
            }
            if (typeof item.prix !== 'number' || item.prix < 0) {
                return { valid: false, error: `Prix invalide pour ${item.nom}` };
            }
        }

        return { valid: true };
    }
}