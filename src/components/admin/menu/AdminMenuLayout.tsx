// src/components/admin/menu/AdminMenuLayout.tsx
import React, { useState } from 'react';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { useRestaurantContext } from '@/contexts/RestaurantContext';
import SidebarCategories from './SidebarCategories.tsx';
import MenuItemPanel from './MenuItemPanel';
import LoadingScreen from '@/components/LoadingScreen';

const AdminMenuLayout: React.FC = () => {
    const { restaurant } = useRestaurantContext();
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

    // Hooks pour le menu
    const {
        categories,
        loading: categoriesLoading,
        error: categoriesError,
        addCategory,
        updateCategory,
        deleteCategory
    } = useMenuCategories(restaurant?.id || '');

    const {
        items,
        loading: itemsLoading,
        error: itemsError,
        addItem,
        updateItem,
        deleteItem,
        getItemsByCategory
    } = useMenuItems(restaurant?.id || '');

    // Auto-sélectionner la première catégorie si aucune n'est sélectionnée
    React.useEffect(() => {
        if (categories.length > 0 && !activeCategoryId) {
            setActiveCategoryId(categories[0].id);
        }
    }, [categories, activeCategoryId]);

    // Chargement
    if (categoriesLoading && categories.length === 0) {
        return <LoadingScreen />;
    }

    return (
        <div className="h-[calc(100vh-200px)] flex bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
            {/* Sidebar des catégories */}
            <div className="w-80 border-r border-gray-700 flex-shrink-0">
                <SidebarCategories
                    slug={restaurant?.id || ''}
                    categories={categories}
                    selectedCategory={activeCategoryId}
                    onSelect={setActiveCategoryId}
                    onAddCategory={addCategory}
                    onUpdateCategory={updateCategory}
                    onDeleteCategory={deleteCategory}
                    loading={categoriesLoading}
                />
            </div>

            {/* Panel des articles */}
            <div className="flex-1 flex flex-col">
                <MenuItemPanel
                    slug={restaurant?.id || ''}
                    categoryId={activeCategoryId}
                    categories={categories}
                    items={getItemsByCategory(activeCategoryId || '')}
                    onAddItem={addItem}
                    onUpdateItem={updateItem}
                    onDeleteItem={deleteItem}
                    loading={itemsLoading}
                />
            </div>
        </div>
    );
};

export default AdminMenuLayout;