import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShoppingCart,
  StickyNote,
  X
} from 'lucide-react';
import { getStepOptions, type MenuSelection, type ComposedMenuConfig } from '@/data/composedMenus';

// Types
interface MenuItem {
  id: string;
  nom: string;
  prix: number;
  description?: string;
  disponible: boolean;
  categorieId: string;
  ordre: number;
  isPopular?: boolean;
  isSpecial?: boolean;
}

interface Category {
  id: string;
  nom: string;
  emoji: string;
  active: boolean;
  ordre: number;
}

interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  note?: string;
  emoji: string;
  variant?: string;
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

interface MenuStepperProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
  menuConfig: ComposedMenuConfig;
  allItems: MenuItem[];
  categories: Category[];
  onAddToCart: (item: CartItem) => void;
  currency?: string;
}

const MenuStepper: React.FC<MenuStepperProps> = ({
  isOpen,
  onClose,
  menuItem,
  menuConfig,
  allItems,
  categories,
  onAddToCart,
  currency = '€'
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selections, setSelections] = useState<MenuSelection[]>([]);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});

  const steps = menuConfig?.steps || [];
  const currentStep = steps[currentStepIndex];

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setSelections([]);
      setStepNotes({});
    }
  }, [isOpen]);

  // Obtenir les options pour l'étape courante
  const getCurrentStepOptions = () => {
    if (!currentStep) return [];
    
    // 🔍 DEBUG: Afficher les catégories pour trouver les bons IDs
    console.log('🔍 DEBUG - Catégories disponibles:', categories);
    console.log('🔍 DEBUG - ID recherché:', currentStep.sourceCategoryId);
    console.log('🔍 DEBUG - Items disponibles:', allItems.filter(item => 
      item.categorieId === currentStep.sourceCategoryId && item.disponible
    ));
    
    return getStepOptions(currentStep, allItems, categories);
  };

  // Obtenir la sélection courante pour cette étape
  const getCurrentSelection = (): MenuSelection | undefined => {
    return selections.find(sel => sel.stepId === currentStep?.id);
  };

  // Mettre à jour la sélection pour l'étape courante
  const updateSelection = (
    selectedItemIds?: string[],
    selectedCustomOptions?: string[]
  ) => {
    if (!currentStep) return;

    const newSelection: MenuSelection = {
      stepId: currentStep.id,
      selectedItemIds,
      selectedCustomOptions,
      customNote: stepNotes[currentStep.id] || ''
    };

    setSelections(prev => {
      const filtered = prev.filter(sel => sel.stepId !== currentStep.id);
      return [...filtered, newSelection];
    });
  };

  // Gérer la sélection d'une option
  const handleOptionSelect = (optionId: string, isCustom: boolean = false) => {
    const currentSelection = getCurrentSelection();
    
    if (currentStep?.selectionType === 'single') {
      // Sélection unique
      if (isCustom) {
        updateSelection(undefined, [optionId]);
      } else {
        updateSelection([optionId], undefined);
      }
    } else {
      // Sélection multiple
      const currentIds = isCustom 
        ? (currentSelection?.selectedCustomOptions || [])
        : (currentSelection?.selectedItemIds || []);

      let newIds: string[];
      if (currentIds.includes(optionId)) {
        // Déselectionner
        newIds = currentIds.filter(id => id !== optionId);
      } else {
        // Sélectionner (en respectant maxSelections)
        newIds = [...currentIds, optionId];
        if (currentStep.maxSelections && newIds.length > currentStep.maxSelections) {
          newIds = newIds.slice(-currentStep.maxSelections);
        }
      }

      if (isCustom) {
        updateSelection(currentSelection?.selectedItemIds, newIds);
      } else {
        updateSelection(newIds, currentSelection?.selectedCustomOptions);
      }
    }
  };

  // Vérifier si l'étape courante est valide
  const isCurrentStepValid = (): boolean => {
    if (!currentStep) return false;
    
    const selection = getCurrentSelection();
    if (!selection) return !currentStep.required;

    const totalSelected = (selection.selectedItemIds?.length || 0) + 
                         (selection.selectedCustomOptions?.length || 0);

    if (currentStep.required && totalSelected === 0) return false;
    if (currentStep.minSelections && totalSelected < currentStep.minSelections) return false;
    if (currentStep.maxSelections && totalSelected > currentStep.maxSelections) return false;

    return true;
  };

  // Navigation
  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Finaliser et ajouter au panier
  const handleFinalize = () => {
    // Mettre à jour les notes
    const finalSelections = selections.map(sel => ({
      ...sel,
      customNote: stepNotes[sel.stepId] || ''
    }));

    // Construire l'item composé
    const selectedItems = finalSelections.map(selection => {
      const step = steps.find(s => s.id === selection.stepId);
      const items: Array<{id: string; nom: string; priceAdjustment?: number; customNote?: string}> = [];

      if (selection.selectedItemIds) {
        selection.selectedItemIds.forEach(itemId => {
          const item = allItems.find(i => i.id === itemId);
          if (item) {
            items.push({
              id: item.id,
              nom: item.nom,
              priceAdjustment: 0,
              customNote: selection.customNote
            });
          }
        });
      }

      if (selection.selectedCustomOptions && step?.customOptions) {
        selection.selectedCustomOptions.forEach(optionId => {
          const option = step.customOptions?.find(o => o.id === optionId);
          if (option) {
            items.push({
              id: option.id,
              nom: option.label,
              priceAdjustment: option.priceAdjustment || 0,
              customNote: selection.customNote
            });
          }
        });
      }

      return {
        stepId: selection.stepId,
        stepLabel: step?.label || '',
        items
      };
    });

    const category = categories.find(cat => cat.id === menuItem.categorieId);
    
    const composedItem: CartItem = {
      id: menuItem.id,
      nom: menuItem.nom,
      prix: menuItem.prix,
      quantite: 1,
      emoji: category?.emoji || '🍽️',
      isComposed: true,
      selections: finalSelections,
      selectedItems
    };

    onAddToCart(composedItem);
    onClose();
  };

  // Indicateur de progression
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            index < currentStepIndex 
              ? 'bg-green-500 text-white' 
              : index === currentStepIndex
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-600 text-gray-400'
          }`}>
            {index < currentStepIndex ? <Check size={16} /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-px ${
              index < currentStepIndex ? 'bg-green-500' : 'bg-gray-600'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  if (!isOpen || !currentStep) return null;

  const options = getCurrentStepOptions();
  const currentSelection = getCurrentSelection();
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900/98 border-gray-700 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-3">
            <span className="text-3xl">{categories.find(cat => cat.id === menuItem.categorieId)?.emoji || '🍽️'}</span>
            {menuItem.nom}
            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              {menuItem.prix.toFixed(2)}{currency}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Indicateur de progression */}
          <ProgressIndicator />

          {/* Titre de l'étape */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">{currentStep.label}</h3>
            {currentStep.description && (
              <p className="text-gray-400">{currentStep.description}</p>
            )}
            {currentStep.selectionType === 'multiple' && (
              <p className="text-sm text-yellow-400 mt-1">
                {currentStep.minSelections && currentStep.maxSelections && 
                 currentStep.minSelections === currentStep.maxSelections
                  ? `Sélectionnez exactement ${currentStep.minSelections} option${currentStep.minSelections > 1 ? 's' : ''}`
                  : `Sélectionnez ${currentStep.minSelections || 1} à ${currentStep.maxSelections || 'plusieurs'} option${(currentStep.maxSelections || 2) > 1 ? 's' : ''}`
                }
              </p>
            )}
          </div>

          {/* Options de sélection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {options.map((option) => {
              const isSelected = currentStep.sourceType === 'custom'
                ? currentSelection?.selectedCustomOptions?.includes(option.id)
                : currentSelection?.selectedItemIds?.includes(option.id);

              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-yellow-500/20 border-yellow-500 ring-2 ring-yellow-500/50 scale-105'
                      : 'bg-gray-800/50 border-gray-700 hover:border-yellow-500/50 hover:scale-102'
                  }`}
                  onClick={() => handleOptionSelect(option.id, currentStep.sourceType === 'custom')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <h4 className="font-semibold text-white mb-1">{option.label}</h4>
                    {option.description && (
                      <p className="text-xs text-gray-400 mb-2">{option.description}</p>
                    )}
                    {option.priceAdjustment && option.priceAdjustment !== 0 && (
                      <Badge variant={option.priceAdjustment > 0 ? "destructive" : "default"}>
                        {option.priceAdjustment > 0 ? '+' : ''}{option.priceAdjustment.toFixed(2)}{currency}
                      </Badge>
                    )}
                    {isSelected && (
                      <div className="mt-2">
                        <Badge className="bg-green-500 text-white">
                          <Check size={12} className="mr-1" />
                          Sélectionné
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Note personnalisée */}
          {/* {currentStep.allowCustomNote && (
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <StickyNote size={16} className="text-yellow-400" />
                Instructions spéciales pour cette étape (optionnel)
              </Label>
              <Textarea
                value={stepNotes[currentStep.id] || ''}
                onChange={(e) => setStepNotes(prev => ({
                  ...prev,
                  [currentStep.id]: e.target.value
                }))}
                placeholder="Ex: sans sauce, bien cuit, glace supplémentaire..."
                className="bg-gray-800/50 border-gray-600 text-white rounded-lg resize-none"
                rows={2}
              />
            </div>
          )} */}

          {/* Récapitulatif des sélections (étape finale) */}
          {isLastStep && (
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-green-400" />
                  Récapitulatif de votre menu
                </h4>
                <div className="space-y-3">
                  {selections.map(selection => {
                    const step = steps.find(s => s.id === selection.stepId);
                    if (!step) return null;

                    const selectedOptions = [
                      ...(selection.selectedItemIds?.map(id => 
                        allItems.find(item => item.id === id)?.nom
                      ).filter(Boolean) || []),
                      ...(selection.selectedCustomOptions?.map(id => 
                        step.customOptions?.find(opt => opt.id === id)?.label
                      ).filter(Boolean) || [])
                    ];

                    return (
                      <div key={selection.stepId} className="bg-gray-800/50 rounded p-3">
                        <div className="font-medium text-white">{step.label}</div>
                        <div className="text-sm text-gray-300 mt-1">
                          {selectedOptions.join(', ')}
                        </div>
                        {selection.customNote && (
                          <div className="text-xs text-yellow-400 mt-2 flex items-start gap-1">
                            <StickyNote size={12} className="mt-0.5 flex-shrink-0" />
                            {selection.customNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-yellow-500">{menuItem.prix.toFixed(2)}{currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boutons de navigation */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={currentStepIndex === 0 ? onClose : goToPreviousStep}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl h-12"
            >
              <ArrowLeft size={20} className="mr-2" />
              {currentStepIndex === 0 ? 'Annuler' : 'Précédent'}
            </Button>

            <Button
              onClick={isLastStep ? handleFinalize : goToNextStep}
              disabled={!isCurrentStepValid()}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? (
                <>
                  <ShoppingCart size={20} className="mr-2" />
                  Ajouter au panier
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Indication d'étape invalide */}
          {!isCurrentStepValid() && (
            <div className="text-center">
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {currentStep.required && !getCurrentSelection() 
                  ? "Cette étape est obligatoire"
                  : currentStep.minSelections && (getCurrentSelection()?.selectedItemIds?.length || 0) + (getCurrentSelection()?.selectedCustomOptions?.length || 0) < currentStep.minSelections
                  ? `Veuillez sélectionner au moins ${currentStep.minSelections} option${currentStep.minSelections > 1 ? 's' : ''}`
                  : currentStep.maxSelections && (getCurrentSelection()?.selectedItemIds?.length || 0) + (getCurrentSelection()?.selectedCustomOptions?.length || 0) > currentStep.maxSelections
                  ? `Veuillez sélectionner au maximum ${currentStep.maxSelections} option${currentStep.maxSelections > 1 ? 's' : ''}`
                  : "Sélection non valide"
                }
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuStepper;