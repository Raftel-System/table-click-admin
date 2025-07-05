// src/scripts/seedComposedMenus.ts
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ComposedMenuConfig } from '@/types/composedMenu';

// Configuration des menus Talya
const TALYA_MENU_CONFIGS: Record<string, ComposedMenuConfig> = {
  'menu-talya-express': {
    steps: [
      {
        id: 'sandwich',
        label: 'Choisir votre sandwich',
        description: 'Sélectionnez votre sandwich préféré',
        selectionType: 'single',
        required: true,
        allowCustomNote: true,
        sourceType: 'custom',
        customOptions: [
          {
            id: 'ch-poulet',
            label: 'Chawarma poulet',
            description: 'Émincé de poulet mariné',
            emoji: '🐔'
          },
          {
            id: 'ch-boeuf',
            label: 'Chawarma bœuf',
            description: 'Émincé de bœuf mariné',
            emoji: '🥩'
          },
          {
            id: 'taouk',
            label: 'Taouk',
            description: 'À base de poulet mariné et de jus de citron',
            emoji: '🍗'
          },
          {
            id: 'sawda',
            label: 'Sawda',
            description: 'Foies de volaille flambés au citron',
            emoji: '🍖'
          },
          {
            id: 'falafel',
            label: 'Falafel',
            description: 'Boulettes végétariennes aux pois chiches',
            emoji: '🌱'
          }
        ]
      },
      {
        id: 'beignets',
        label: 'Choisir vos beignets',
        description: 'Sélectionnez 2 beignets au choix',
        selectionType: 'multiple',
        minSelections: 2,
        maxSelections: 2,
        required: true,
        allowCustomNote: true,
        sourceType: 'category',
        sourceCategoryId: 'hors-doeuvre-chaud'
      },
      {
        id: 'boisson',
        label: 'Choisir votre boisson',
        description: 'Sélectionnez votre boisson 33cl',
        selectionType: 'single',
        required: true,
        allowCustomNote: true,
        sourceType: 'category',
        sourceCategoryId: 'boissons-froides'
      }
    ]
  },
  'menu-talya-gourmand': {
    steps: [
      {
        id: 'sandwich',
        label: 'Choisir votre sandwich',
        description: 'Sélectionnez votre sandwich préféré',
        selectionType: 'single',
        required: true,
        allowCustomNote: true,
        sourceType: 'custom',
        customOptions: [
          {
            id: 'ch-poulet',
            label: 'Chawarma poulet',
            emoji: '🐔'
          },
          {
            id: 'ch-boeuf',
            label: 'Chawarma bœuf',
            emoji: '🥩'
          },
          {
            id: 'taouk',
            label: 'Taouk',
            emoji: '🍗'
          },
          {
            id: 'sawda',
            label: 'Sawda',
            emoji: '🍖'
          },
          {
            id: 'falafel',
            label: 'Falafel',
            emoji: '🌱'
          }
        ]
      },
      {
        id: 'beignets',
        label: 'Choisir vos beignets',
        description: 'Sélectionnez 2 beignets au choix',
        selectionType: 'multiple',
        minSelections: 2,
        maxSelections: 2,
        required: true,
        allowCustomNote: true,
        sourceType: 'category',
        sourceCategoryId: 'hors-doeuvre-chaud'
      },
      {
        id: 'boisson',
        label: 'Choisir votre boisson',
        description: 'Sélectionnez votre boisson 33cl',
        selectionType: 'single',
        required: true,
        allowCustomNote: true,
        sourceType: 'category',
        sourceCategoryId: 'boissons-froides'
      },
      {
        id: 'dessert',
        label: 'Choisir votre dessert',
        description: 'Sélectionnez votre dessert',
        selectionType: 'single',
        required: true,
        allowCustomNote: true,
        sourceType: 'category',
        sourceCategoryId: 'desserts'
      }
    ]
  }
};

/**
 * Script pour ajouter les configurations de menus composés à Firebase
 * Usage: Exécutez cette fonction depuis votre console ou composant admin
 */
export async function seedComposedMenus(restaurantSlug: string) {
  try {
    console.log('🚀 Ajout des menus composés pour:', restaurantSlug);

    // Menu Talya Express
    const menuExpressRef = doc(db, 'restaurants', restaurantSlug, 'menuItems', 'menu-talya-express-id');
    await updateDoc(menuExpressRef, {
      isComposedMenu: true,
      composedMenuConfig: TALYA_MENU_CONFIGS['menu-talya-express']
    });
    console.log('✅ Menu Talya Express configuré');

    // Menu Talya Gourmand  
    const menuGourmandRef = doc(db, 'restaurants', restaurantSlug, 'menuItems', 'menu-talya-gourmand-id');
    await updateDoc(menuGourmandRef, {
      isComposedMenu: true,
      composedMenuConfig: TALYA_MENU_CONFIGS['menu-talya-gourmand']
    });
    console.log('✅ Menu Talya Gourmand configuré');

    console.log('🎉 Tous les menus composés ont été ajoutés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des menus composés:', error);
    throw error;
  }
}

/**
 * Script pour créer les menus composés s'ils n'existent pas encore
 */
export async function createComposedMenuItems(restaurantSlug: string, menusCategoryId: string) {
  try {
    const { addDoc, collection } = await import('firebase/firestore');
    
    // Créer Menu Talya Express
    const menusRef = collection(db, 'restaurants', restaurantSlug, 'menuItems');
    
    await addDoc(menusRef, {
      nom: 'Menu Talya express',
      categorieId: menusCategoryId,
      prix: 13.5,
      description: 'Sandwich au choix + 2 beignets + Boisson 33cl',
      disponible: true,
      ordre: 1,
      isPopular: true,
      isSpecial: false,
      isComposedMenu: true,
      composedMenuConfig: TALYA_MENU_CONFIGS['menu-talya-express']
    });

    await addDoc(menusRef, {
      nom: 'Menu Talya gourmand', 
      categorieId: menusCategoryId,
      prix: 16,
      description: 'Sandwich au choix + 2 beignets + Boisson 33cl + Dessert',
      disponible: true,
      ordre: 2,
      isPopular: true,
      isSpecial: false,
      isComposedMenu: true,
      composedMenuConfig: TALYA_MENU_CONFIGS['menu-talya-gourmand']
    });

    console.log('🎉 Menus composés créés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des menus:', error);
    throw error;
  }
}