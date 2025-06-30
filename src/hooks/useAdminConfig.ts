// src/hooks/useAdminConfig.ts
import { useState } from 'react';
import {
    createRestaurant,
    createUser,
    importMenu,
    checkRestaurantExists,
    validateMenuJson,
    normalizeMenuData,
    exportRestaurantMenu,
    type RestaurantConfig,
    type UserAccount,
    type MenuCategory,
    type MenuItem
} from '@/services/adminConfigService';

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning';
    message: string;
}

export const useAdminConfig = () => {
    // États de chargement
    const [loading, setLoading] = useState<string | null>(null);

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Gestion des notifications
    const addNotification = (type: Notification['type'], message: string) => {
        const id = Date.now().toString();
        const notification: Notification = { id, type, message };

        setNotifications(prev => [...prev, notification]);

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Validation du restaurant
    const validateRestaurant = (restaurant: RestaurantConfig): boolean => {
        if (!restaurant.nom.trim()) {
            addNotification('error', 'Le nom du restaurant est obligatoire');
            return false;
        }

        if (!restaurant.adresse.trim()) {
            addNotification('error', 'L\'adresse du restaurant est obligatoire');
            return false;
        }

        if (!restaurant.id.trim()) {
            addNotification('error', 'L\'ID du restaurant est obligatoire');
            return false;
        }

        // Validation de l'ID (8 chiffres recommandé)
        if (!/^\d{8}$/.test(restaurant.id) && restaurant.id.length !== 8) {
            addNotification('warning', 'L\'ID du restaurant devrait contenir 8 chiffres');
        }

        return true;
    };

    // Création d'un restaurant
    const handleCreateRestaurant = async (restaurant: RestaurantConfig): Promise<boolean> => {
        if (!validateRestaurant(restaurant)) return false;

        setLoading('restaurant');

        try {
            // Vérifier si le restaurant existe déjà
            const exists = await checkRestaurantExists(restaurant.id);
            if (exists) {
                addNotification('error', `Un restaurant avec l'ID "${restaurant.id}" existe déjà`);
                return false;
            }

            const result = await createRestaurant(restaurant);

            if (result.success) {
                addNotification('success', `Restaurant "${restaurant.nom}" créé avec l'ID: ${restaurant.id}`);
                return true;
            } else {
                addNotification('error', result.error || 'Erreur lors de la création du restaurant');
                return false;
            }
        } catch (error: any) {
            addNotification('error', 'Erreur lors de la création du restaurant: ' + error.message);
            return false;
        } finally {
            setLoading(null);
        }
    };

    // Validation d'un utilisateur
    const validateUser = (user: Omit<UserAccount, 'restaurant'>, restaurantId: string): boolean => {
        if (!user.email.trim()) {
            addNotification('error', 'L\'email est obligatoire');
            return false;
        }

        if (!user.password.trim()) {
            addNotification('error', 'Le mot de passe est obligatoire');
            return false;
        }

        if (user.password.length < 6) {
            addNotification('error', 'Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        if (!restaurantId) {
            addNotification('error', 'Veuillez d\'abord créer le restaurant');
            return false;
        }

        // Validation email basique
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
            addNotification('error', 'Format d\'email invalide');
            return false;
        }

        return true;
    };

    // Création d'un utilisateur
    const handleCreateUser = async (
        user: Omit<UserAccount, 'restaurant'>,
        restaurantId: string
    ): Promise<boolean> => {
        if (!validateUser(user, restaurantId)) return false;

        setLoading('user');

        try {
            const userAccount: UserAccount = {
                ...user,
                restaurant: restaurantId
            };

            const result = await createUser(userAccount);

            if (result.success) {
                addNotification('success', `Utilisateur ${user.role} créé avec succès: ${user.email}`);
                return true;
            } else {
                addNotification('error', result.error || 'Erreur lors de la création de l\'utilisateur');
                return false;
            }
        } catch (error: any) {
            addNotification('error', 'Erreur lors de la création de l\'utilisateur: ' + error.message);
            return false;
        } finally {
            setLoading(null);
        }
    };

    // Validation et parsing du JSON menu
    const parseMenuJson = (jsonString: string): { categories: MenuCategory[], items: MenuItem[] } | null => {
        if (!jsonString.trim()) {
            addNotification('error', 'Veuillez saisir le JSON du menu');
            return null;
        }

        const validation = validateMenuJson(jsonString);

        if (!validation.valid) {
            addNotification('error', validation.error || 'JSON invalide');
            return null;
        }

        try {
            const normalized = normalizeMenuData(validation.data);
            addNotification('success', `Menu parsé: ${normalized.categories.length} catégories, ${normalized.items.length} articles`);
            return normalized;
        } catch (error: any) {
            addNotification('error', 'Erreur lors du traitement du menu: ' + error.message);
            return null;
        }
    };

    // Import du menu avec vérification du restaurant
    const handleImportMenu = async (
        restaurantId: string,
        categories: MenuCategory[],
        items: MenuItem[]
    ): Promise<boolean> => {
        if (!restaurantId) {
            addNotification('error', 'Slug du restaurant requis pour l\'import');
            return false;
        }

        if (categories.length === 0) {
            addNotification('error', 'Aucune catégorie à importer');
            return false;
        }

        if (items.length === 0) {
            addNotification('error', 'Aucun article à importer');
            return false;
        }

        setLoading('menu');

        try {
            const result = await importMenu(restaurantId, categories, items);

            if (result.success) {
                addNotification(
                    'success',
                    `Menu importé avec succès: ${result.categoriesCount} catégories, ${result.itemsCount} articles`
                );
                return true;
            } else {
                // Le service gère maintenant la vérification d'existence du restaurant
                addNotification('error', result.error || 'Erreur lors de l\'import du menu');
                return false;
            }
        } catch (error: any) {
            addNotification('error', 'Erreur lors de l\'import du menu: ' + error.message);
            return false;
        } finally {
            setLoading(null);
        }
    };

    // Génération d'un ID restaurant unique
    const generateRestaurantId = (): string => {
        return Math.random().toString().slice(2, 10);
    };

    // Export du menu d'un restaurant existant
    const handleExportMenu = async (restaurantId: string): Promise<boolean> => {
        if (!restaurantId.trim()) {
            addNotification('error', 'Slug du restaurant requis pour l\'export');
            return false;
        }

        setLoading('export');

        try {
            const result = await exportRestaurantMenu(restaurantId);

            if (result.success && result.data) {
                // Télécharger le fichier JSON
                const dataStr = JSON.stringify(result.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });

                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `menu-export-${restaurantId}-${new Date().getTime()}.json`;
                link.click();

                URL.revokeObjectURL(url);

                addNotification(
                    'success',
                    `Menu exporté: ${result.data.metadata.totalCategories} catégories, ${result.data.metadata.totalItems} articles`
                );
                return true;
            } else {
                addNotification('error', result.error || 'Erreur lors de l\'export du menu');
                return false;
            }
        } catch (error: any) {
            addNotification('error', 'Erreur lors de l\'export du menu: ' + error.message);
            return false;
        } finally {
            setLoading(null);
        }
    };

    // Export des données de configuration
    const exportConfiguration = (
        restaurant: RestaurantConfig,
        users: UserAccount[],
        menuData?: { categories: MenuCategory[], items: MenuItem[] }
    ) => {
        const configData = {
            restaurant,
            users: users.map(u => ({ ...u, password: '[MASKED]' })), // Masquer les mots de passe
            menu: menuData || null,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(configData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `restaurant-config-${restaurant.id}-${new Date().getTime()}.json`;
        link.click();

        URL.revokeObjectURL(url);
        addNotification('success', 'Configuration exportée avec succès');
    };

    return {
        // États
        loading,
        notifications,

        // Actions
        addNotification,
        removeNotification,
        handleCreateRestaurant,
        handleCreateUser,
        parseMenuJson,
        handleImportMenu,
        handleExportMenu,
        generateRestaurantId,
        exportConfiguration,

        // Utilitaires
        validateRestaurant,
        validateUser
    };
};