// src/components/admin/menu/SidebarCategories.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import MenuCategoryModal from '../MenuCategoryModal';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    GripVertical,
    ChefHat
} from 'lucide-react';
import type { MenuCategory } from '@/hooks/useMenu';

interface SidebarCategoriesProps {
    slug: string;
    categories: MenuCategory[];
    selectedCategory: string | null;
    onSelect: (categoryId: string) => void;
    onAddCategory: (category: Omit<MenuCategory, 'id'>) => Promise<void>;
    onUpdateCategory: (id: string, category: Partial<MenuCategory>) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
    loading: boolean;
}

const SidebarCategories: React.FC<SidebarCategoriesProps> = ({
                                                                 slug,
                                                                 categories,
                                                                 selectedCategory,
                                                                 onSelect,
                                                                 onAddCategory,
                                                                 onUpdateCategory,
                                                                 onDeleteCategory,
                                                                 loading
                                                             }) => {
    const { toast } = useToast();
    const [selectedCategoryData, setSelectedCategoryData] = useState<MenuCategory | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

    // Actions catégories
    const handleAddCategory = () => {
        setSelectedCategoryData(null);
        setModalMode('add');
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: MenuCategory) => {
        setSelectedCategoryData(category);
        setModalMode('edit');
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = async (category: MenuCategory) => {
        if (confirm(`Supprimer la catégorie "${category.nom}" ?`)) {
            try {
                await onDeleteCategory(category.id);
                toast({
                    title: "Catégorie supprimée",
                    description: `"${category.nom}" a été supprimée avec succès`
                });
            } catch (error: any) {
                toast({
                    title: "Erreur",
                    description: error.message,
                    variant: "destructive"
                });
            }
        }
    };

    const handleToggleCategoryActive = async (category: MenuCategory) => {
        try {
            await onUpdateCategory(category.id, { active: !category.active });
            toast({
                title: category.active ? "Catégorie masquée" : "Catégorie affichée",
                description: `"${category.nom}" est maintenant ${category.active ? 'masquée' : 'visible'}`
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    if (loading && categories.length === 0) {
        return (
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                    <ChefHat size={20} className="text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Catégories</h2>
                </div>
                {/* Skeleton loading */}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-3 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-900/30">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <ChefHat size={20} className="text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Catégories</h2>
                    <Badge variant="outline" className="text-gray-400 ml-auto">
                        {categories.length}
                    </Badge>
                </div>

                <Button
                    onClick={handleAddCategory}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500"
                    size="sm"
                >
                    <Plus size={16} className="mr-2" />
                    Nouvelle Catégorie
                </Button>
            </div>

            {/* Liste des catégories */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {categories.length === 0 ? (
                    <div className="p-8 text-center">
                        <ChefHat size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 mb-4">Aucune catégorie</p>
                        <Button
                            onClick={handleAddCategory}
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                            size="sm"
                        >
                            <Plus size={14} className="mr-2" />
                            Créer une catégorie
                        </Button>
                    </div>
                ) : (
                    categories
                        .sort((a, b) => a.ordre - b.ordre)
                        .map((category) => (
                            <div
                                key={category.id}
                                className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                    selectedCategory === category.id
                                        ? 'bg-purple-500/20 border-purple-500/50 shadow-lg'
                                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600'
                                }`}
                                onClick={() => onSelect(category.id)}
                            >
                                {/* Contenu principal */}
                                <div className="flex items-center gap-3">
                                    <GripVertical size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-xl">{category.emoji}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium text-sm">
                                                    {category.nom}
                                                </span>
                                                {!category.active && (
                                                    <Badge className="bg-gray-600 text-white text-xs">
                                                        Inactif
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Ordre: {category.ordre}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions (visibles au hover) */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleCategoryActive(category);
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="w-6 h-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                    >
                                        {category.active ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </Button>

                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditCategory(category);
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="w-6 h-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                    >
                                        <Edit size={12} />
                                    </Button>

                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCategory(category);
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <Trash2 size={12} />
                                    </Button>
                                </div>

                                {/* Indicateur de sélection */}
                                {selectedCategory === category.id && (
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r"></div>
                                )}
                            </div>
                        ))
                )}
            </div>

            {/* Modal */}
            {isCategoryModalOpen && (
                <MenuCategoryModal
                    category={selectedCategoryData}
                    mode={modalMode}
                    onClose={() => setIsCategoryModalOpen(false)}
                    onSave={modalMode === 'add' ? onAddCategory : (data) => onUpdateCategory(selectedCategoryData!.id, data)}
                    existingCategories={categories}
                />
            )}
        </div>
    );
};

export default SidebarCategories;