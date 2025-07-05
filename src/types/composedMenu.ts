// src/types/composedMenu.ts
import type { MenuItem as BaseMenuItem, MenuCategory } from '@/hooks/useMenu';

// Extension du MenuItem existant pour Firebase
export interface MenuItem extends BaseMenuItem {
  isComposedMenu?: boolean;
  composedMenuConfig?: ComposedMenuConfig;
}

export interface ComposedMenuConfig {
  steps: MenuStep[];
}

export interface MenuStep {
  id: string;
  label: string;
  description?: string;
  selectionType: 'single' | 'multiple';
  minSelections?: number;
  maxSelections?: number;
  required: boolean;
  allowCustomNote?: boolean;
  sourceType: 'category' | 'items' | 'custom';
  sourceCategoryId?: string;
  sourceItemIds?: string[];
  customOptions?: MenuStepOption[];
}

export interface MenuStepOption {
  id: string;
  label: string;
  description?: string;
  priceAdjustment?: number;
  emoji?: string;
}

export interface MenuSelection {
  stepId: string;
  selectedItemIds?: string[];
  selectedCustomOptions?: string[];
  customNote?: string;
}

// Extension du CartItem pour les menus composés
export interface ComposedCartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  emoji: string;
  isComposed: true;
  selections: MenuSelection[];
  basePrice: number;
  totalAdjustments: number;
  selectedItems: Array<{
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

// Utilitaires pour gérer les menus composés
export class ComposedMenuHelper {
  static isComposedMenu(item: MenuItem): boolean {
    return Boolean(item.isComposedMenu && item.composedMenuConfig);
  }

  static getStepOptions(
    step: MenuStep, 
    allItems: MenuItem[], 
    categories: MenuCategory[]
  ): MenuStepOption[] {
    switch (step.sourceType) {
      case 'category':
        if (step.sourceCategoryId) {
          return allItems
            .filter(item => item.categorieId === step.sourceCategoryId && item.disponible)
            .sort((a, b) => a.ordre - b.ordre)
            .map(item => ({
              id: item.id,
              label: item.nom,
              description: item.description,
              priceAdjustment: 0,
              emoji: this.getItemEmoji(item, categories)
            }));
        }
        return [];

      case 'items':
        if (step.sourceItemIds) {
          return step.sourceItemIds
            .map(itemId => allItems.find(item => item.id === itemId))
            .filter(Boolean)
            .filter(item => item!.disponible)
            .map(item => ({
              id: item!.id,
              label: item!.nom,
              description: item!.description,
              priceAdjustment: 0,
              emoji: this.getItemEmoji(item!, categories)
            }));
        }
        return [];

      case 'custom':
        return step.customOptions || [];

      default:
        return [];
    }
  }

  static getItemEmoji(item: MenuItem, categories: MenuCategory[]): string {
    const category = categories.find(cat => cat.id === item.categorieId);
    return category?.emoji || '🍽️';
  }

  static formatComposedCartItem(
    baseItem: MenuItem,
    selections: MenuSelection[],
    allItems: MenuItem[],
    categories: MenuCategory[]
  ): ComposedCartItem {
    const selectedItems = selections.map(selection => {
      const step = baseItem.composedMenuConfig?.steps.find(s => s.id === selection.stepId);
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

    const category = categories.find(cat => cat.id === baseItem.categorieId);

    return {
      id: baseItem.id,
      nom: baseItem.nom,
      prix: baseItem.prix,
      quantite: 1,
      emoji: category?.emoji || '🍽️',
      isComposed: true,
      selections,
      basePrice: baseItem.prix,
      totalAdjustments: 0,
      selectedItems
    };
  }
}