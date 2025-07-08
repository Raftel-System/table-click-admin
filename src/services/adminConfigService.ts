// src/services/adminConfigService.ts
import {
    doc,
    setDoc,
    collection,
    addDoc,
    writeBatch,
    getDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

// Types basés sur votre structure existante
export interface RestaurantConfig {
    id: string;
    nom: string;
    adresse: string;
    printerIp?: string;
    serverPrinterIp?: string;
    kitchenMode: 'printer' | 'kds';
    theme: string;
    devise: 'EUR' | 'USD' | 'MAD';
    telephone?: string;
    horaires?: Record<string, any>;
    logoUrl?: string;
    dateCreation: string;
}

export interface UserAccount {
    email: string;
    password: string;
    role: 'admin' | 'serveur';
    restaurant: string;
}

export interface MenuCategory {
    id?: string;
    nom: string;
    ordre: number;
    active: boolean;
    emoji: string;
}

export interface MenuItem {
    id?: string;
    nom: string;
    categorieId: string;
    prix: number;
    description: string;
    disponible: boolean;
    ordre: number;
    isPopular: boolean;
    isSpecial: boolean;
}

/**
 * Service pour créer un restaurant avec sa structure complète dans Firestore
 */
export const createRestaurant = async (config: RestaurantConfig): Promise<{ success: boolean; id: string; error?: string }> => {
    try {
        console.log('🏪 Création du restaurant avec structure complète:', config.id);

        // Vérifier si le restaurant existe déjà
        const existingDoc = await getDoc(doc(db, 'restaurants', config.id));
        if (existingDoc.exists()) {
            throw new Error(`Un restaurant avec l'ID "${config.id}" existe déjà`);
        }

        // Utiliser une batch pour créer la structure complète atomiquement
        const batch = writeBatch(db);

        // 1. Créer le document restaurant principal (vide)
        const restaurantRef = doc(db, 'restaurants', config.id);
        batch.set(restaurantRef, {});

        // 2. Créer la sous-collection 'settings' avec document 'config'
        const configRef = doc(db, 'restaurants', config.id, 'settings', 'config');
        const configData = {
            nom: config.nom,
            adresse: config.adresse,
            theme: config.theme,
            devise: config.devise,
            telephone: config.telephone || '',
            horaires: config.horaires || {},
            printerIp: config.printerIp || '',
            serverPrinterIp: config.serverPrinterIp || '',
            kitchenMode: config.kitchenMode,
            logoUrl: config.logoUrl || '',
            dateCreation: config.dateCreation
        };
        batch.set(configRef, configData);

        // 3. Créer une catégorie de test
        const testCategoryRef = doc(db, 'restaurants', config.id, 'menuCategories', 'test-category');
        batch.set(testCategoryRef, {
            nom: 'Catégorie Test',
            ordre: 1,
            active: true,
            emoji: '🧪'
        });

        // 4. Créer un article de test
        const testItemRef = doc(db, 'restaurants', config.id, 'menuItems', 'test-item');
        batch.set(testItemRef, {
            nom: 'Article Test',
            categorieId: 'test-category',
            prix: 10.00,
            description: 'Article de démonstration créé automatiquement',
            disponible: true,
            ordre: 1,
            isPopular: false,
            isSpecial: false
        });

        // Exécuter toutes les opérations atomiquement
        await batch.commit();

        console.log('✅ Restaurant créé avec structure complète:', {
            restaurant: config.id,
            settings: 'settings/config',
            menuCategories: 'Catégorie test créée',
            menuItems: 'Article test créé'
        });

        return { success: true, id: config.id };

    } catch (error: any) {
        console.error('❌ Erreur création restaurant:', error);
        return {
            success: false,
            id: config.id,
            error: error.message || 'Erreur inconnue lors de la création du restaurant'
        };
    }
};

/**
 * Service pour créer un utilisateur avec Firebase Auth + Firestore
 */
export const createUser = async (userData: UserAccount): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
        console.log('👤 Création utilisateur:', userData.email, userData.role);

        // 1. Créer l'utilisateur dans Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
        );

        const firebaseUser = userCredential.user;

        // 2. Créer le document utilisateur dans Firestore
        // Structure basée sur votre useAuth.ts
        const userDocData = {
            role: userData.role,
            restaurant: userData.restaurant,
            dateCreation: new Date().toISOString(),
            email: userData.email
        };

        // Utiliser l'email comme ID du document (comme dans votre code existant)
        await setDoc(doc(db, 'users', userData.email), userDocData);

        console.log('✅ Utilisateur créé avec succès');
        return { success: true, id: firebaseUser.uid };

    } catch (error: any) {
        console.error('❌ Erreur création utilisateur:', error);

        // Messages d'erreur Firebase Auth en français
        let errorMessage = 'Erreur lors de la création de l\'utilisateur';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Cette adresse email est déjà utilisée';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Adresse email invalide';
                break;
            case 'auth/weak-password':
                errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
                break;
            default:
                errorMessage = error.message || errorMessage;
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Service pour importer un menu complet (catégories + articles)
 * Vérifie d'abord que le restaurant existe
 */
export const importMenu = async (
    restaurantId: string,
    categories: MenuCategory[],
    items: MenuItem[]
): Promise<{ success: boolean; categoriesCount?: number; itemsCount?: number; error?: string }> => {
    try {
        console.log('📋 Import menu pour restaurant:', restaurantId);
        console.log('Catégories:', categories.length, 'Articles:', items.length);

        // 1. Vérifier que le restaurant existe
        const restaurantExists = await checkRestaurantExists(restaurantId);
        if (!restaurantExists) {
            throw new Error(`Restaurant introuvable. Le restaurant avec l'ID "${restaurantId}" n'existe pas. Veuillez d'abord créer le restaurant.`);
        }

        // 2. Utiliser une batch pour garantir l'atomicité
        const batch = writeBatch(db);

        // 3. Supprimer les éléments de test s'ils existent
        try {
            const testCategoryRef = doc(db, 'restaurants', restaurantId, 'menuCategories', 'test-category');
            const testItemRef = doc(db, 'restaurants', restaurantId, 'menuItems', 'test-item');

            batch.delete(testCategoryRef);
            batch.delete(testItemRef);
        } catch (error) {
            // Les éléments de test n'existent peut-être pas, on continue
            console.log('Éléments de test non trouvés, on continue...');
        }

        // 4. Créer les catégories
        const categoriesRef = collection(db, 'restaurants', restaurantId, 'menuCategories');
        const categoryIds: Record<string, string> = {}; // Mapping ancien ID -> nouveau ID

        for (const category of categories) {
            const categoryDocRef = doc(categoriesRef);

            const categoryData = {
                nom: category.nom,
                ordre: category.ordre,
                active: category.active,
                emoji: category.emoji
            };

            batch.set(categoryDocRef, categoryData);

            // Garder la correspondance pour les articles
            if (category.id) {
                categoryIds[category.id] = categoryDocRef.id;
            }
        }

        // 5. Créer les articles avec les bons categorieId
        const itemsRef = collection(db, 'restaurants', restaurantId, 'menuItems');

        for (const item of items) {
            const itemDocRef = doc(itemsRef);

            // Résoudre le categorieId correct
            let categorieId = item.categorieId;
            if (categoryIds[item.categorieId]) {
                categorieId = categoryIds[item.categorieId];
            }

            const itemData = {
                nom: item.nom,
                categorieId: categorieId,
                prix: item.prix,
                description: item.description,
                disponible: item.disponible,
                ordre: item.ordre,
                isPopular: item.isPopular,
                isSpecial: item.isSpecial
            };

            batch.set(itemDocRef, itemData);
        }

        // 6. Exécuter toutes les opérations
        await batch.commit();

        console.log('✅ Menu importé avec succès');
        return {
            success: true,
            categoriesCount: categories.length,
            itemsCount: items.length
        };

    } catch (error: any) {
        console.error('❌ Erreur import menu:', error);
        return {
            success: false,
            error: error.message || 'Erreur lors de l\'import du menu'
        };
    }
};

/**
 * Service pour récupérer la configuration d'un restaurant (compatible avec différentes structures)
 */
export const getRestaurantConfig = async (restaurantId: string): Promise<{ success: boolean; config?: any; error?: string }> => {
    try {
        // 1. Essayer la structure nouvelle : settings/config
        const newConfigRef = doc(db, 'restaurants', restaurantId, 'settings', 'config');
        const newConfigSnap = await getDoc(newConfigRef);

        if (newConfigSnap.exists()) {
            return { success: true, config: newConfigSnap.data() };
        }

        // 2. Essayer la structure intermédiaire : config/{id}
        const oldConfigRef = doc(db, 'restaurants', restaurantId, 'config', restaurantId);
        const oldConfigSnap = await getDoc(oldConfigRef);

        if (oldConfigSnap.exists()) {
            return { success: true, config: oldConfigSnap.data() };
        }

        // 3. Essayer la structure ancienne : données directes dans le document principal
        const docRef = doc(db, 'restaurants', restaurantId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Object.keys(data).length > 0) {
                return { success: true, config: data };
            }
        }

        return { success: false, error: `Configuration du restaurant "${restaurantId}" non trouvée` };
    } catch (error: any) {
        console.error('Erreur récupération config restaurant:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Service pour vérifier si un restaurant existe (compatible avec différentes structures)
 */
export const checkRestaurantExists = async (restaurantId: string): Promise<boolean> => {
    try {
        console.log('🔍 Vérification du restaurant:', restaurantId);

        // Vérifier l'existence du document principal du restaurant
        const docRef = doc(db, 'restaurants', restaurantId);
        const docSnap = await getDoc(docRef);

        console.log('📄 Document principal existe:', docSnap.exists());
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('📊 Données du document principal:', data);
            console.log('🔑 Clés du document:', Object.keys(data || {}));
        }

        if (docSnap.exists()) {
            // Structure nouvelle : vérifier settings/config
            const newConfigRef = doc(db, 'restaurants', restaurantId, 'settings', 'config');
            const newConfigSnap = await getDoc(newConfigRef);
            console.log('⚙️ settings/config existe:', newConfigSnap.exists());

            if (newConfigSnap.exists()) {
                console.log('✅ Restaurant trouvé (structure nouvelle):', restaurantId);
                return true;
            }

            // Structure ancienne : vérifier si le document principal contient des données
            const data = docSnap.data();
            if (data && Object.keys(data).length > 0) {
                console.log('✅ Restaurant trouvé (structure ancienne):', restaurantId);
                return true;
            }

            // Structure intermédiaire : vérifier config/{id}
            const oldConfigRef = doc(db, 'restaurants', restaurantId, 'config', restaurantId);
            const oldConfigSnap = await getDoc(oldConfigRef);
            console.log('🔧 config/{id} existe:', oldConfigSnap.exists());

            if (oldConfigSnap.exists()) {
                console.log('✅ Restaurant trouvé (structure intermédiaire):', restaurantId);
                return true;
            }

            // Vérifier d'autres structures possibles
            console.log('🔍 Vérification de structures alternatives...');

            // Peut-être que c'est juste un document vide mais avec des sous-collections
            return true; // On considère que le restaurant existe s'il y a un document
        }

        console.log('❌ Restaurant non trouvé:', restaurantId);
        return false;
    } catch (error) {
        console.error('Erreur vérification restaurant:', error);
        return false;
    }
};

/**
 * Utilitaire pour valider le JSON du menu
 */
export const validateMenuJson = (jsonString: string): { valid: boolean; data?: any; error?: string } => {
    try {
        const parsed = JSON.parse(jsonString);

        // Vérifications de structure
        if (!parsed.categories || !Array.isArray(parsed.categories)) {
            return { valid: false, error: 'Le JSON doit contenir un tableau "categories"' };
        }

        if (!parsed.items || !Array.isArray(parsed.items)) {
            return { valid: false, error: 'Le JSON doit contenir un tableau "items"' };
        }

        // Vérifications basiques des catégories
        for (let i = 0; i < parsed.categories.length; i++) {
            const cat = parsed.categories[i];
            if (!cat.nom && !cat.name) {
                return { valid: false, error: `Catégorie ${i + 1}: nom manquant` };
            }
        }

        // Vérifications basiques des articles
        for (let i = 0; i < parsed.items.length; i++) {
            const item = parsed.items[i];
            if (!item.nom && !item.name) {
                return { valid: false, error: `Article ${i + 1}: nom manquant` };
            }
            if (item.prix === undefined && item.price === undefined) {
                return { valid: false, error: `Article ${i + 1}: prix manquant` };
            }
        }

        return { valid: true, data: parsed };

    } catch (error: any) {
        return { valid: false, error: 'JSON invalide: ' + error.message };
    }
};

/**
 * Service pour exporter le menu d'un restaurant existant en JSON
 */
export const exportRestaurantMenu = async (restaurantId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        console.log('📤 Export menu pour restaurant:', restaurantId);

        // 1. Vérifier que le restaurant existe (compatible avec toutes les structures)
        const restaurantExists = await checkRestaurantExists(restaurantId);
        if (!restaurantExists) {
            throw new Error(`Restaurant introuvable. Le restaurant avec l'ID "${restaurantId}" n'existe pas.`);
        }

        // 2. Récupérer les catégories
        const categoriesRef = collection(db, 'restaurants', restaurantId, 'menuCategories');
        const categoriesQuery = query(categoriesRef, orderBy('ordre', 'asc'));
        const categoriesSnapshot = await getDocs(categoriesQuery);

        const categories: MenuCategory[] = [];
        categoriesSnapshot.forEach((doc) => {
            const data = doc.data();
            // Ignorer les placeholders et éléments de test
            if (doc.id !== '_placeholder' && doc.id !== 'test-category') {
                categories.push({
                    id: doc.id,
                    nom: data.nom || '',
                    ordre: data.ordre || 1,
                    active: data.active ?? true,
                    emoji: data.emoji || '📋'
                });
            }
        });

        // 3. Récupérer les articles
        const itemsRef = collection(db, 'restaurants', restaurantId, 'menuItems');
        const itemsQuery = query(itemsRef, orderBy('ordre', 'asc'));
        const itemsSnapshot = await getDocs(itemsQuery);

        const items: MenuItem[] = [];
        itemsSnapshot.forEach((doc) => {
            const data = doc.data();
            // Ignorer les placeholders et éléments de test
            if (doc.id !== '_placeholder' && doc.id !== 'test-item') {
                items.push({
                    id: doc.id,
                    nom: data.nom || '',
                    categorieId: data.categorieId || '',
                    prix: data.prix || 0,
                    description: data.description || '',
                    disponible: data.disponible ?? true,
                    ordre: data.ordre || 1,
                    isPopular: data.isPopular ?? false,
                    isSpecial: data.isSpecial ?? false
                });
            }
        });

        const exportData = {
            categories: categories,
            items: items,
            metadata: {
                exportedFrom: restaurantId,
                exportDate: new Date().toISOString(),
                totalCategories: categories.length,
                totalItems: items.length
            }
        };

        console.log('✅ Menu exporté avec succès:', {
            categories: categories.length,
            items: items.length
        });

        return { success: true, data: exportData };

    } catch (error: any) {
        console.error('❌ Erreur export menu:', error);
        return {
            success: false,
            error: error.message || 'Erreur lors de l\'export du menu'
        };
    }
};

/**
 * Utilitaire pour normaliser les données du menu importé
 */
export const normalizeMenuData = (rawData: any): { categories: MenuCategory[], items: MenuItem[] } => {
    const categories: MenuCategory[] = rawData.categories.map((cat: any, index: number) => ({
        id: cat.id || `cat-${index}`,
        nom: cat.nom || cat.name || 'Catégorie sans nom',
        ordre: cat.ordre || cat.order || index + 1,
        active: cat.active ?? cat.enabled ?? true,
        emoji: cat.emoji || '📋'
    }));

    const items: MenuItem[] = rawData.items.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        nom: item.nom || item.name || 'Article sans nom',
        categorieId: item.categorieId || item.categoryId || 'default',
        prix: Number(item.prix || item.price || 0),
        description: item.description || '',
        disponible: item.disponible ?? item.available ?? true,
        ordre: item.ordre || item.order || index + 1,
        isPopular: item.isPopular ?? item.popular ?? false,
        isSpecial: item.isSpecial ?? item.special ?? false
    }));

    return { categories, items };
};