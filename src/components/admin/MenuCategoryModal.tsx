// src/components/admin/MenuCategoryModal.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/useToast';
import { X, Save, Palette } from 'lucide-react';
import type { MenuCategory } from '@/hooks/useMenu';

interface MenuCategoryModalProps {
    category: MenuCategory | null;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSave: (category: Omit<MenuCategory, 'id'>) => Promise<void>;
    existingCategories: MenuCategory[];
}

// Emojis suggérés pour les catégories
const SUGGESTED_EMOJIS = [
    '🌅', '☕', '🥐', '🍳', '🥪', '🍔', '🍕', '🍝', '🍚', '🍲',
    '🥗', '🍖', '🐟', '🍤', '🥘', '🍰', '🧁', '🍨', '🥤', '🍹',
    '🍷', '🍺', '🥃', '🍫', '🍭', '🎂', '🥧', '🧀', '🍞', '🥯'
];

const MenuCategoryModal: React.FC<MenuCategoryModalProps> = ({
                                                                 category,
                                                                 mode,
                                                                 onClose,
                                                                 onSave,
                                                                 existingCategories
                                                             }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        nom: '',
        emoji: '📋',
        active: true,
        ordre: 1
    });
    const [loading, setLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        if (category && mode === 'edit') {
            setFormData({
                nom: category.nom,
                emoji: category.emoji,
                active: category.active,
                ordre: category.ordre
            });
        } else {
            // Pour un nouvel ajout, calculer l'ordre suivant
            const maxOrdre = Math.max(...existingCategories.map(c => c.ordre), 0);
            setFormData(prev => ({
                ...prev,
                ordre: maxOrdre + 1
            }));
        }
    }, [category, mode, existingCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nom.trim()) {
            toast({
                title: "Erreur",
                description: "Le nom de la catégorie est requis",
                variant: "destructive"
            });
            return;
        }

        // Vérifier si le nom existe déjà (sauf pour la catégorie actuelle en mode edit)
        const nameExists = existingCategories.some(cat =>
            cat.nom.toLowerCase() === formData.nom.toLowerCase() &&
            (mode === 'add' || cat.id !== category?.id)
        );

        if (nameExists) {
            toast({
                title: "Erreur",
                description: "Une catégorie avec ce nom existe déjà",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            await onSave(formData);
            toast({
                title: mode === 'add' ? "Catégorie créée" : "Catégorie modifiée",
                description: `"${formData.nom}" a été ${mode === 'add' ? 'créée' : 'modifiée'} avec succès`
            });
            onClose();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setFormData(prev => ({ ...prev, emoji }));
        setShowEmojiPicker(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-gray-900/95 border-gray-700 max-w-lg w-full shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <Palette size={20} className="text-yellow-500" />
                            {mode === 'add' ? 'Nouvelle Catégorie' : 'Modifier la Catégorie'}
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
                        {/* Nom de la catégorie */}
                        <div className="space-y-2">
                            <Label htmlFor="nom" className="text-white">
                                Nom de la catégorie *
                            </Label>
                            <Input
                                id="nom"
                                value={formData.nom}
                                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                                placeholder="Ex: Petit Déjeuner, Plats Principaux..."
                                className="input-premium"
                                required
                            />
                        </div>

                        {/* Emoji */}
                        <div className="space-y-2">
                            <Label className="text-white">Emoji de la catégorie</Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="w-16 h-16 text-3xl bg-gray-800 hover:bg-gray-700 border border-gray-600"
                                >
                                    {formData.emoji}
                                </Button>
                                <div className="text-gray-400 text-sm">
                                    Cliquez pour choisir un emoji
                                </div>
                            </div>

                            {/* Sélecteur d'emojis */}
                            {showEmojiPicker && (
                                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                                    {SUGGESTED_EMOJIS.map((emoji, index) => (
                                        <Button
                                            key={index}
                                            type="button"
                                            onClick={() => handleEmojiSelect(emoji)}
                                            className="w-10 h-10 text-xl bg-transparent hover:bg-gray-700 border border-gray-600"
                                        >
                                            {emoji}
                                        </Button>
                                    ))}
                                </div>
                            )}
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
                                Plus le nombre est petit, plus la catégorie apparaîtra en haut
                            </p>
                        </div>

                        {/* Statut actif/inactif */}
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div>
                                <Label className="text-white font-medium">
                                    Catégorie active
                                </Label>
                                <p className="text-sm text-gray-400">
                                    Les catégories inactives ne sont pas visibles dans le menu
                                </p>
                            </div>
                            <Switch
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                            />
                        </div>

                        {/* Aperçu */}
                        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                            <Label className="text-white text-sm font-medium mb-2 block">
                                Aperçu
                            </Label>
                            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-600">
                                <span className="text-2xl">{formData.emoji}</span>
                                <span className="text-white font-medium">{formData.nom || 'Nom de la catégorie'}</span>
                                {formData.active ? (
                                    <span className="text-xs bg-green-500 text-black px-2 py-1 rounded">Actif</span>
                                ) : (
                                    <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Inactif</span>
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

export default MenuCategoryModal;