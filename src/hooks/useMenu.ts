// src/hooks/useMenu.ts
import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface MenuCategory {
    id: string;
    nom: string;
    ordre: number;
    active: boolean;
    emoji: string;
}

export interface MenuItem {
    id: string;
    nom: string;
    categorieId: string;
    prix: number; // En euros (ex: 12.50)
    description: string;
    disponible: boolean;
    ordre: number;
    isPopular: boolean;
    isSpecial: boolean;
}

export const useMenuCategories = (restaurantSlug: string) => {
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantSlug) return;

        const categoriesRef = collection(db, 'restaurants', restaurantSlug, 'menuCategories');
        const q = query(categoriesRef, orderBy('ordre', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const categoriesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MenuCategory[];

                setCategories(categoriesData);
                setLoading(false);
                setError(null);
            },
            (error) => {
                console.error('Error fetching categories:', error);
                setError('Erreur lors du chargement des catégories');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [restaurantSlug]);

    const addCategory = async (categoryData: Omit<MenuCategory, 'id'>) => {
        try {
            const categoriesRef = collection(db, 'restaurants', restaurantSlug, 'menuCategories');
            await addDoc(categoriesRef, categoryData);
        } catch (error) {
            console.error('Error adding category:', error);
            throw new Error('Erreur lors de l\'ajout de la catégorie');
        }
    };

    const updateCategory = async (categoryId: string, categoryData: Partial<MenuCategory>) => {
        try {
            const categoryRef = doc(db, 'restaurants', restaurantSlug, 'menuCategories', categoryId);

            // Filtrer les valeurs undefined pour éviter l'erreur Firebase
            const cleanData = Object.entries(categoryData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, any>);

            if (Object.keys(cleanData).length === 0) {
                console.warn('No valid data to update');
                return;
            }

            await updateDoc(categoryRef, cleanData);
        } catch (error) {
            console.error('Error updating category:', error);
            throw new Error('Erreur lors de la mise à jour de la catégorie');
        }
    };

    const deleteCategory = async (categoryId: string) => {
        try {
            // Vérifier s'il y a des articles dans cette catégorie
            const itemsRef = collection(db, 'restaurants', restaurantSlug, 'menuItems');
            const itemsQuery = query(itemsRef, where('categorieId', '==', categoryId));
            const itemsSnapshot = await getDocs(itemsQuery);

            if (!itemsSnapshot.empty) {
                throw new Error('Impossible de supprimer une catégorie qui contient des articles');
            }

            const categoryRef = doc(db, 'restaurants', restaurantSlug, 'menuCategories', categoryId);
            await deleteDoc(categoryRef);
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    };

    return {
        categories,
        loading,
        error,
        addCategory,
        updateCategory,
        deleteCategory
    };
};

export const useMenuItems = (restaurantSlug: string) => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantSlug) return;

        const itemsRef = collection(db, 'restaurants', restaurantSlug, 'menuItems');
        const q = query(itemsRef, orderBy('categorieId'), orderBy('ordre', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const itemsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MenuItem[];

                setItems(itemsData);
                setLoading(false);
                setError(null);
            },
            (error) => {
                console.error('Error fetching items:', error);
                setError('Erreur lors du chargement des articles');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [restaurantSlug]);

    const addItem = async (itemData: Omit<MenuItem, 'id'>) => {
        try {
            const itemsRef = collection(db, 'restaurants', restaurantSlug, 'menuItems');
            await addDoc(itemsRef, itemData);
        } catch (error) {
            console.error('Error adding item:', error);
            throw new Error('Erreur lors de l\'ajout de l\'article');
        }
    };

    const updateItem = async (itemId: string, itemData: Partial<MenuItem>) => {
        try {
            const itemRef = doc(db, 'restaurants', restaurantSlug, 'menuItems', itemId);

            // Filtrer les valeurs undefined pour éviter l'erreur Firebase
            const cleanData = Object.entries(itemData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, any>);

            if (Object.keys(cleanData).length === 0) {
                console.warn('No valid data to update');
                return;
            }

            await updateDoc(itemRef, cleanData);
        } catch (error) {
            console.error('Error updating item:', error);
            throw new Error('Erreur lors de la mise à jour de l\'article');
        }
    };

    const deleteItem = async (itemId: string) => {
        try {
            const itemRef = doc(db, 'restaurants', restaurantSlug, 'menuItems', itemId);
            await deleteDoc(itemRef);
        } catch (error) {
            console.error('Error deleting item:', error);
            throw new Error('Erreur lors de la suppression de l\'article');
        }
    };

    const updateItemsOrder = async (itemsToUpdate: { id: string; ordre: number }[]) => {
        try {
            const batch = writeBatch(db);

            itemsToUpdate.forEach(({ id, ordre }) => {
                const itemRef = doc(db, 'restaurants', restaurantSlug, 'menuItems', id);
                batch.update(itemRef, { ordre });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error updating items order:', error);
            throw new Error('Erreur lors de la réorganisation');
        }
    };

    const getItemsByCategory = (categoryId: string) => {
        return items.filter(item => item.categorieId === categoryId);
    };

    return {
        items,
        loading,
        error,
        addItem,
        updateItem,
        deleteItem,
        updateItemsOrder,
        getItemsByCategory
    };
};