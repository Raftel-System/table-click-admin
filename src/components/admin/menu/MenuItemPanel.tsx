// src/components/admin/menu/MenuItemPanel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import MenuItemModal from '../MenuItemModal';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Star,
    Sparkles,
    Package,
    Euro
} from 'lucide-react';
import type { MenuItem, MenuCategory } from '@/hooks/useMenu';

interface MenuItemPanelProps {
    slug: string;
    categoryId: string | null;
    categories: MenuCategory[];
    items: MenuItem[];
    onAddItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
    onUpdateItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
    loading: boolean;
}

const MenuItemPanel: React.FC<MenuItemPanelProps> = ({
                                                         categoryId,
                                                         categories,
                                                         items,
                                                         onAddItem,
                                                         onUpdateItem,
                                                         onDeleteItem,
                                                         loading
                                                     }) => {
    const { toast } = useToast();
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

    const selectedCategory = categories.find(cat => cat.id === categoryId);

    // Actions articles
    const handleAddItem = () => {
        if (!categoryId) {
            toast({
                title: "Erreur",
                description: "Veuillez sélectionner une catégorie",
                variant: "destructive"
            });
            return;
        }

        setSelectedItem({ categorieId: categoryId } as MenuItem);
        setModalMode('add');
        setIsItemModalOpen(true);
    };

    const handleEditItem = (item: MenuItem) => {
        setSelectedItem(item);
        setModalMode('edit');
        setIsItemModalOpen(true);
    };

    const handleDeleteItem = async (item: MenuItem) => {
        if (confirm(`Supprimer l'article "${item.nom}" ?`)) {
            try {
                await onDeleteItem(item.id);
                toast({
                    title: "Article supprimé",
                    description: `"${item.nom}" a été supprimé avec succès`
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

    const handleToggleItemAvailable = async (item: MenuItem) => {
        try {
            await onUpdateItem(item.id, { disponible: !item.disponible });
            toast({
                title: item.disponible ? "Article indisponible" : "Article disponible",
                description: `"${item.nom}" est maintenant ${item.disponible ? 'indisponible' : 'disponible'}`
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleToggleItemSpecial = async (item: MenuItem, field: 'isPopular' | 'isSpecial') => {
        try {
            await onUpdateItem(item.id, { [field]: !item[field] });
            const label = field === 'isPopular' ? 'populaire' : 'spécial';
            toast({
                title: `Article ${item[field] ? 'normal' : label}`,
                description: `"${item.nom}" est maintenant ${item[field] ? 'normal' : label}`
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    // Pas de catégorie sélectionnée
    if (!categoryId || !selectedCategory) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-900/20">
                <div className="text-center">
                    <Package size={64} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Aucune catégorie sélectionnée</h3>
                    <p className="text-gray-400">Sélectionnez une catégorie pour voir ses articles</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header de la catégorie */}
            <div className="p-4 border-b border-gray-700 bg-gray-900/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedCategory.emoji}</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{selectedCategory.nom}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>{items.length} article{items.length !== 1 ? 's' : ''}</span>
                                {!selectedCategory.active && (
                                    <Badge className="bg-red-500 text-white text-xs">
                                        Catégorie inactive
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleAddItem}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500"
                        disabled={!selectedCategory.active}
                    >
                        <Plus size={16} className="mr-2" />
                        Nouvel Article
                    </Button>
                </div>
            </div>

            {/* Liste des articles */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && items.length === 0 ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Package size={48} className="mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">Aucun article</h3>
                            <p className="text-gray-400 mb-4">Cette catégorie ne contient aucun article</p>
                            <Button
                                onClick={handleAddItem}
                                variant="outline"
                                className="border-gray-600 text-gray-300"
                                disabled={!selectedCategory.active}
                            >
                                <Plus size={16} className="mr-2" />
                                Ajouter un article
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items
                            .sort((a, b) => a.ordre - b.ordre)
                            .map((item) => (
                                <div
                                    key={item.id}
                                    className={`group p-4 rounded-lg border transition-all duration-200 ${
                                        item.disponible
                                            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600'
                                            : 'bg-gray-800/30 border-gray-800 opacity-75'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        {/* Informations de l'article */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className={`font-medium ${item.disponible ? 'text-white' : 'text-gray-400'}`}>
                                                    {item.nom}
                                                </h4>

                                                {/* Badges */}
                                                <div className="flex gap-1">
                                                    {item.isPopular && (
                                                        <Star size={14} className="text-yellow-500" />
                                                    )}
                                                    {item.isSpecial && (
                                                        <Sparkles size={14} className="text-purple-500" />
                                                    )}
                                                    {!item.disponible && (
                                                        <Badge className="bg-red-500 text-white text-xs">
                                                            Indisponible
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {item.description && (
                                                <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}

                                            {/* Prix et ordre */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Euro size={14} className="text-yellow-500" />
                                                    <span className="text-lg font-bold text-yellow-500">
                                                        {item.prix.toFixed(2)}€
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    Ordre: {item.ordre}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                onClick={() => handleToggleItemAvailable(item)}
                                                size="sm"
                                                variant="ghost"
                                                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                                title={item.disponible ? 'Rendre indisponible' : 'Rendre disponible'}
                                            >
                                                {item.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </Button>

                                            <Button
                                                onClick={() => handleToggleItemSpecial(item, 'isPopular')}
                                                size="sm"
                                                variant="ghost"
                                                className={`w-8 h-8 p-0 hover:bg-gray-700 ${
                                                    item.isPopular ? 'text-yellow-500' : 'text-gray-400 hover:text-white'
                                                }`}
                                                title="Marquer comme populaire"
                                            >
                                                <Star size={14} />
                                            </Button>

                                            <Button
                                                onClick={() => handleToggleItemSpecial(item, 'isSpecial')}
                                                size="sm"
                                                variant="ghost"
                                                className={`w-8 h-8 p-0 hover:bg-gray-700 ${
                                                    item.isSpecial ? 'text-purple-500' : 'text-gray-400 hover:text-white'
                                                }`}
                                                title="Marquer comme spécial"
                                            >
                                                <Sparkles size={14} />
                                            </Button>

                                            <Button
                                                onClick={() => handleEditItem(item)}
                                                size="sm"
                                                variant="ghost"
                                                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                                title="Modifier"
                                            >
                                                <Edit size={14} />
                                            </Button>

                                            <Button
                                                onClick={() => handleDeleteItem(item)}
                                                size="sm"
                                                variant="ghost"
                                                className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isItemModalOpen && (
                <MenuItemModal
                    item={selectedItem}
                    mode={modalMode}
                    categories={categories.filter(cat => cat.active)}
                    onClose={() => setIsItemModalOpen(false)}
                    onSave={modalMode === 'add' ? onAddItem : (data) => onUpdateItem(selectedItem!.id, data)}
                    existingItems={items}
                />
            )}
        </div>
    );
};

export default MenuItemPanel;