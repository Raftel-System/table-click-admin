// MenuItemModal.tsx - Correction complète

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { X, Save, Package, Star, Sparkles, Euro } from 'lucide-react';
import type { MenuItem, MenuCategory } from '@/hooks/useMenu';

interface MenuItemModalProps {
    item: MenuItem | null;
    mode: 'add' | 'edit';
    categories: MenuCategory[];
    onClose: () => void;
    onSave: (item: Omit<MenuItem, 'id'>) => Promise<void>;
    existingItems: MenuItem[];
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({
                                                         item,
                                                         mode,
                                                         categories,
                                                         onClose,
                                                         onSave,
                                                         existingItems
                                                     }) => {
    const { toast } = useToast();

    // ✅ Initialisation avec des valeurs par défaut pour éviter undefined
    const [formData, setFormData] = useState({
        nom: '',
        categorieId: '',
        prix: 0,
        description: '',
        disponible: true,
        ordre: 1,
        isPopular: false,
        isSpecial: false
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('🔧 MenuItemModal useEffect:', { item, mode });

        if (mode === 'edit' && item) {
            console.log('📝 Mode édition - item:', item);
            // ✅ Mode édition : utiliser des valeurs par défaut pour éviter undefined
            setFormData({
                nom: item.nom || '',
                categorieId: item.categorieId || '',
                prix: item.prix || 0,
                description: item.description || '',
                disponible: item.disponible ?? true, // ✅ Utiliser ?? pour gérer false
                ordre: item.ordre || 1,
                isPopular: item.isPopular ?? false, // ✅ Utiliser ?? pour gérer false
                isSpecial: item.isSpecial ?? false   // ✅ Utiliser ?? pour gérer false
            });
        } else if (mode === 'add') {
            console.log('➕ Mode ajout');
            // ✅ Réinitialisation complète pour le mode ajout
            const baseFormData = {
                nom: '',
                categorieId: '',
                prix: 0,
                description: '',
                disponible: true,
                ordre: 1,
                isPopular: false,
                isSpecial: false
            };

            // Si une catégorie est pré-sélectionnée
            if (item && item.categorieId) {
                console.log('➕ Avec catégorie pré-sélectionnée:', item.categorieId);
                const categoryItems = existingItems.filter(i => i.categorieId === item.categorieId);
                const maxOrdre = Math.max(...categoryItems.map(i => i.ordre), 0);

                setFormData({
                    ...baseFormData,
                    categorieId: item.categorieId,
                    ordre: maxOrdre + 1
                });
            } else {
                setFormData(baseFormData);
            }
        }
    }, [item, mode, existingItems]);

    // ✅ Debug pour voir le formData
    useEffect(() => {
        console.log('🔍 FormData mis à jour:', formData);
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validations
        if (!formData.nom.trim()) {
            toast({
                title: "Erreur",
                description: "Le nom de l'article est requis",
                variant: "destructive"
            });
            return;
        }

        if (!formData.categorieId) {
            toast({
                title: "Erreur",
                description: "Veuillez sélectionner une catégorie",
                variant: "destructive"
            });
            return;
        }

        if (formData.prix <= 0) {
            toast({
                title: "Erreur",
                description: "Le prix doit être supérieur à 0",
                variant: "destructive"
            });
            return;
        }

        // Vérifier si le nom existe déjà dans la même catégorie
        const nameExists = existingItems.some(existingItem =>
            existingItem.nom.toLowerCase() === formData.nom.toLowerCase() &&
            existingItem.categorieId === formData.categorieId &&
            (mode === 'add' || existingItem.id !== item?.id)
        );

        if (nameExists) {
            toast({
                title: "Erreur",
                description: "Un article avec ce nom existe déjà dans cette catégorie",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            await onSave(formData);
            toast({
                title: mode === 'add' ? "Article créé" : "Article modifié",
                description: `"${formData.nom}" a été ${mode === 'add' ? 'créé' : 'modifié'} avec succès`
            });
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (value: string) => {
        // Permettre seulement les nombres avec maximum 2 décimales
        const regex = /^\d+\.?\d{0,2}$/;
        if (value === '' || regex.test(value)) {
            setFormData(prev => ({ ...prev, prix: parseFloat(value) || 0 }));
        }
    };

    const selectedCategory = categories.find(cat => cat.id === formData.categorieId);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-gray-900/95 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <Package size={20} className="text-yellow-500" />
                            {mode === 'add' ? 'Nouvel Article' : 'Modifier l\'Article'}
                        </span>
                        <Button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white p-0"
                        >
                            <X size={16} />
                        </Button>
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nom de l'article */}
                        <div className="space-y-2">
                            <Label htmlFor="nom" className="text-white">
                                Nom de l'article *
                            </Label>
                            <Input
                                id="nom"
                                value={formData.nom}
                                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                                placeholder="Ex: Café Américain, Croissant aux Amandes..."
                                className="input-premium"
                                required
                            />
                        </div>

                        {/* Catégorie et Prix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white">
                                    Catégorie *
                                </Label>
                                <Select
                                    value={formData.categorieId}
                                    onValueChange={(value) => {
                                        console.log('🔄 Changement catégorie:', value);
                                        setFormData(prev => ({ ...prev, categorieId: value }));
                                        // Recalculer l'ordre pour la nouvelle catégorie
                                        const categoryItems = existingItems.filter(i => i.categorieId === value);
                                        const maxOrdre = Math.max(...categoryItems.map(i => i.ordre), 0);
                                        setFormData(prev => ({ ...prev, ordre: maxOrdre + 1 }));
                                    }}
                                >
                                    <SelectTrigger className="input-premium">
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600">
                                        {categories
                                            .filter(cat => cat.active)
                                            .sort((a, b) => a.ordre - b.ordre)
                                            .map((category) => (
                                                <SelectItem key={category.id} value={category.id} className="text-white hover:bg-gray-700">
                                                    {category.emoji} {category.nom}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prix" className="text-white">
                                    Prix (€) *
                                </Label>
                                <div className="relative">
                                    <Euro size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="prix"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.prix || ''}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                        placeholder="0.00"
                                        className="input-premium pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Décrivez l'article, ses ingrédients, ses spécificités..."
                                className="input-premium min-h-[100px]"
                                rows={4}
                            />
                        </div>

                        {/* Ordre d'affichage */}
                        <div className="space-y-2">
                            <Label htmlFor="ordre" className="text-white">
                                Ordre d'affichage
                            </Label>
                            <Input
                                id="ordre"
                                type="number"
                                min="1"
                                value={formData.ordre}
                                onChange={(e) => setFormData(prev => ({ ...prev, ordre: parseInt(e.target.value) || 1 }))}
                                className="input-premium"
                            />
                            <p className="text-xs text-gray-400">
                                Position de l'article dans la catégorie {selectedCategory?.nom || ''}
                            </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-4">
                            <Label className="text-white font-medium">Options</Label>

                            {/* Disponible - ✅ S'assurer que checked est toujours boolean */}
                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <div>
                                    <Label className="text-white font-medium">
                                        Article disponible
                                    </Label>
                                    <p className="text-sm text-gray-400">
                                        Les articles indisponibles sont grisés dans le menu
                                    </p>
                                </div>
                                <Switch
                                    checked={Boolean(formData.disponible)}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, disponible: checked }))}
                                />
                            </div>

                            {/* Populaire - ✅ S'assurer que checked est toujours boolean */}
                            <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                <div className="flex items-center gap-2">
                                    <Star size={16} className="text-yellow-500" />
                                    <div>
                                        <Label className="text-white font-medium">
                                            Article populaire
                                        </Label>
                                        <p className="text-sm text-gray-400">
                                            Mis en avant avec une étoile
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={Boolean(formData.isPopular)}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopular: checked }))}
                                />
                            </div>

                            {/* Spécial - ✅ S'assurer que checked est toujours boolean */}
                            <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-purple-500" />
                                    <div>
                                        <Label className="text-white font-medium">
                                            Article spécial
                                        </Label>
                                        <p className="text-sm text-gray-400">
                                            Mis en avant comme plat du jour ou nouveauté
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={Boolean(formData.isSpecial)}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSpecial: checked }))}
                                />
                            </div>
                        </div>

                        {/* Aperçu */}
                        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                            <Label className="text-white text-sm font-medium mb-3 block">
                                Aperçu
                            </Label>
                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-white">{formData.nom || 'Nom de l\'article'}</h4>
                                    <div className="flex gap-1">
                                        {formData.isPopular && <Star size={14} className="text-yellow-500" />}
                                        {formData.isSpecial && <Sparkles size={14} className="text-purple-500" />}
                                    </div>
                                </div>

                                {formData.description && (
                                    <p className="text-xs text-gray-400 mb-3">{formData.description}</p>
                                )}

                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-yellow-500">
                                        {formData.prix ? `${formData.prix.toFixed(2)}€` : '0.00€'}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        formData.disponible
                                            ? 'bg-green-500 text-black'
                                            : 'bg-red-500 text-white'
                                    }`}>
                                        {formData.disponible ? 'Disponible' : 'Indisponible'}
                                    </span>
                                </div>

                                {selectedCategory && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        Catégorie: {selectedCategory.emoji} {selectedCategory.nom}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={16} className="mr-2" />
                                        {mode === 'add' ? 'Créer' : 'Modifier'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default MenuItemModal;