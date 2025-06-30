// src/data/composedMenus.ts
// Configuration statique des menus composés - SANS BD

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
  
  export interface ComposedMenuConfig {
    steps: MenuStep[];
  }
  
  export interface MenuSelection {
    stepId: string;
    selectedItemIds?: string[];
    selectedCustomOptions?: string[];
    customNote?: string;
  }
  
  // 🎯 Configuration statique des menus Talya
  export const STATIC_COMPOSED_MENUS: Record<string, ComposedMenuConfig> = {
    // 🥪 Menus sandwichs
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
          sourceType: 'custom',
          customOptions: [
            { id: 'falafel-beignet', label: 'Falafel', emoji: '🌱' },
            { id: 'kebbe', label: 'Kebbé', emoji: '🥩' },
            { id: 'sfiha', label: 'Sfiha', emoji: '🍕' },
            { id: 'samboussik-viande', label: 'Samboussik lahmé', emoji: '🥟' },
            { id: 'samboussik-fromage', label: 'Samboussik jebné', emoji: '🧀' },
            { id: 'fattayer', label: 'Fattayer', emoji: '🥬' }
          ]
        },
        {
          id: 'boisson',
          label: 'Choisir votre boisson',
          description: 'Sélectionnez votre boisson 33cl',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'coca-cola', label: 'Coca-Cola', emoji: '🥤' },
            { id: 'coca-zero', label: 'Coca-Cola Zéro', emoji: '🥤' },
            { id: 'orangina', label: 'Orangina', emoji: '🍊' },
            { id: 'sprite', label: 'Sprite', emoji: '🍋' },
            { id: 'fanta', label: 'Fanta', emoji: '🍊' },
            { id: 'perrier', label: 'Perrier', emoji: '💧' },
            { id: 'eau-plate', label: 'Eau plate', emoji: '💧' }
          ]
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
            { id: 'ch-poulet', label: 'Chawarma poulet', emoji: '🐔' },
            { id: 'ch-boeuf', label: 'Chawarma bœuf', emoji: '🥩' },
            { id: 'taouk', label: 'Taouk', emoji: '🍗' },
            { id: 'sawda', label: 'Sawda', emoji: '🍖' },
            { id: 'falafel', label: 'Falafel', emoji: '🌱' }
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
          sourceType: 'custom',
          customOptions: [
            { id: 'falafel-beignet', label: 'Falafel', emoji: '🌱' },
            { id: 'kebbe', label: 'Kebbé', emoji: '🥩' },
            { id: 'sfiha', label: 'Sfiha', emoji: '🍕' },
            { id: 'samboussik-viande', label: 'Samboussik lahmé', emoji: '🥟' },
            { id: 'samboussik-fromage', label: 'Samboussik jebné', emoji: '🧀' },
            { id: 'fattayer', label: 'Fattayer', emoji: '🥬' }
          ]
        },
        {
          id: 'boisson',
          label: 'Choisir votre boisson',
          description: 'Sélectionnez votre boisson 33cl',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'coca-cola', label: 'Coca-Cola', emoji: '🥤' },
            { id: 'coca-zero', label: 'Coca-Cola Zéro', emoji: '🥤' },
            { id: 'orangina', label: 'Orangina', emoji: '🍊' },
            { id: 'sprite', label: 'Sprite', emoji: '🍋' },
            { id: 'fanta', label: 'Fanta', emoji: '🍊' },
            { id: 'perrier', label: 'Perrier', emoji: '💧' },
            { id: 'eau-plate', label: 'Eau plate', emoji: '💧' }
          ]
        },
        {
          id: 'dessert',
          label: 'Choisir votre dessert',
          description: 'Sélectionnez votre dessert',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'baklawa', label: 'Baklawa', emoji: '🥧' },
            { id: 'mouhalabia', label: 'Mouhalabia', emoji: '🍮' },
            { id: 'knefeh', label: 'Knefeh', emoji: '🧀' }
          ]
        }
      ]
    },
  
    // 🍽️ Menus midi & soir
    'assiette-chawarma-poulet-boisson': {
      steps: [
        {
          id: 'boisson-ou-cafe',
          label: 'Choisir votre boisson',
          description: 'Boisson 33cl ou café',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'coca-cola', label: 'Coca-Cola 33cl', emoji: '🥤' },
            { id: 'orangina', label: 'Orangina 33cl', emoji: '🍊' },
            { id: 'sprite', label: 'Sprite 33cl', emoji: '🍋' },
            { id: 'eau-plate', label: 'Eau plate 33cl', emoji: '💧' },
            { id: 'cafe', label: 'Café', emoji: '☕' },
            { id: 'the', label: 'Thé', emoji: '🍵' }
          ]
        }
      ]
    },
  
    'assiette-chawarma-boisson-dessert': {
      steps: [
        {
          id: 'viande',
          label: 'Choisir votre viande',
          description: 'Bœuf ou poulet',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'chawarma-boeuf', label: 'Chawarma bœuf', emoji: '🥩' },
            { id: 'chawarma-poulet', label: 'Chawarma poulet', emoji: '🐔' }
          ]
        },
        {
          id: 'boisson-ou-cafe',
          label: 'Choisir votre boisson',
          description: 'Boisson 33cl ou café',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'coca-cola', label: 'Coca-Cola 33cl', emoji: '🥤' },
            { id: 'orangina', label: 'Orangina 33cl', emoji: '🍊' },
            { id: 'sprite', label: 'Sprite 33cl', emoji: '🍋' },
            { id: 'eau-plate', label: 'Eau plate 33cl', emoji: '💧' },
            { id: 'cafe', label: 'Café', emoji: '☕' },
            { id: 'the', label: 'Thé', emoji: '🍵' }
          ]
        },
        {
          id: 'dessert',
          label: 'Votre dessert',
          description: '1 baklawa inclus',
          selectionType: 'single',
          required: false,
          allowCustomNote: false,
          sourceType: 'custom',
          customOptions: [
            { id: 'baklawa', label: 'Baklawa', emoji: '🥧' }
          ]
        }
      ]
    },
  
    'assiette-au-choix-boisson-dessert': {
      steps: [
        {
          id: 'assiette',
          label: 'Choisir votre assiette',
          description: 'Sélectionnez votre assiette préférée',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'assiette-chawarma', label: 'Assiette chawarma', emoji: '🥩' },
            { id: 'assiette-taouk', label: 'Assiette taouk', emoji: '🍗' },
            { id: 'assiette-kafta', label: 'Assiette kafta', emoji: '🍖' },
            { id: 'assiette-mixte', label: 'Assiette mixte', emoji: '🍽️' }
          ]
        },
        {
          id: 'boisson-ou-cafe',
          label: 'Choisir votre boisson',
          description: 'Boisson 33cl ou café',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'coca-cola', label: 'Coca-Cola 33cl', emoji: '🥤' },
            { id: 'orangina', label: 'Orangina 33cl', emoji: '🍊' },
            { id: 'sprite', label: 'Sprite 33cl', emoji: '🍋' },
            { id: 'eau-plate', label: 'Eau plate 33cl', emoji: '💧' },
            { id: 'cafe', label: 'Café', emoji: '☕' },
            { id: 'the', label: 'Thé', emoji: '🍵' }
          ]
        },
        {
          id: 'dessert',
          label: 'Choisir votre dessert',
          description: 'Baklawa ou mouhalabia',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'baklawa', label: 'Baklawa', emoji: '🥧' },
            { id: 'mouhalabia', label: 'Mouhalabia', emoji: '🍮' }
          ]
        }
      ]
    },
  
    'menu-enfant': {
      steps: [
        {
          id: 'viande',
          label: 'Choisir la viande',
          description: 'Brochette de poulet ou kafta',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'brochette-poulet', label: 'Brochette de poulet mariné', emoji: '🍗' },
            { id: 'kafta', label: 'Kafta', emoji: '🍖' }
          ]
        },
        {
          id: 'accompagnement',
          label: 'Choisir l\'accompagnement',
          description: 'Frites, riz ou blé',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'frites', label: 'Frites', emoji: '🍟' },
            { id: 'riz', label: 'Riz', emoji: '🍚' },
            { id: 'ble', label: 'Blé', emoji: '🌾' }
          ]
        },
        {
          id: 'boisson',
          label: 'Choisir la boisson',
          description: 'Boisson au choix 33cl',
          selectionType: 'single',
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'coca-cola', label: 'Coca-Cola', emoji: '🥤' },
            { id: 'orangina', label: 'Orangina', emoji: '🍊' },
            { id: 'sprite', label: 'Sprite', emoji: '🍋' },
            { id: 'jus-orange', label: 'Jus d\'orange', emoji: '🧃' },
            { id: 'eau-plate', label: 'Eau plate', emoji: '💧' }
          ]
        }
      ]
    },
  
    // 🍽️ Mezzés
    'mezze-2-personnes': {
      steps: [
        {
          id: 'hors-doeuvre-froids',
          label: 'Choisir 4 hors-d\'œuvre froids',
          description: 'Sélectionnez 4 variétés',
          selectionType: 'multiple',
          minSelections: 4,
          maxSelections: 4,
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'hommouss', label: 'Hommouss', emoji: '🟡' },
            { id: 'tabouleh', label: 'Tabouleh', emoji: '🥗' },
            { id: 'fattoush', label: 'Fattoush', emoji: '🥗' },
            { id: 'moutabbal', label: 'Moutabbal', emoji: '🍆' },
            { id: 'salata-el-raheb', label: 'Salata el raheb', emoji: '🍆' },
            { id: 'salata-sharkieh', label: 'Salata sharkieh', emoji: '🥗' },
            { id: 'warak-inab', label: 'Warak inab', emoji: '🍇' },
            { id: 'moussakaa', label: 'Moussakaa', emoji: '🍆' },
            { id: 'loubieh', label: 'Loubieh', emoji: '🫘' },
            { id: 'labneh', label: 'Labneh', emoji: '🧀' },
            { id: 'muhammara', label: 'Muhammara', emoji: '🌶️' },
            { id: 'bamieh', label: 'Bamieh', emoji: '🌿' }
          ]
        },
        {
          id: 'hors-doeuvre-chauds',
          label: 'Choisir 3 hors-d\'œuvre chauds',
          description: 'Sélectionnez 3 variétés',
          selectionType: 'multiple',
          minSelections: 3,
          maxSelections: 3,
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'falafel', label: 'Falafel', emoji: '🌱' },
            { id: 'kebbe', label: 'Kebbé', emoji: '🥩' },
            { id: 'sfiha', label: 'Sfiha', emoji: '🍕' },
            { id: 'samboussik-viande', label: 'Samboussik lahmé', emoji: '🥟' },
            { id: 'samboussik-fromage', label: 'Samboussik jebné', emoji: '🧀' },
            { id: 'fattayer', label: 'Fattayer', emoji: '🥬' },
            { id: 'rakakat', label: 'Rakakat', emoji: '🧀' },
            { id: 'manouche-zaatar', label: 'Manouché zaatar', emoji: '🌿' },
            { id: 'fatteh-hommous', label: 'Fatteh hommous', emoji: '🟡' },
            { id: 'arayess-viande', label: 'Arayess viande', emoji: '🥩' },
            { id: 'soujouk', label: 'Soujouk', emoji: '🌭' },
            { id: 'makanek', label: 'Makanek', emoji: '🌭' },
            { id: 'sawda-dajaj', label: 'Sawda dajaj', emoji: '🍖' },
            { id: 'batata-harra', label: 'Batata harra', emoji: '🥔' }
          ]
        }
      ]
    },
  
    'mezze-4-personnes': {
      steps: [
        {
          id: 'hors-doeuvre-froids',
          label: 'Choisir 8 hors-d\'œuvre froids',
          description: 'Sélectionnez 8 variétés',
          selectionType: 'multiple',
          minSelections: 8,
          maxSelections: 8,
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'hommouss', label: 'Hommouss', emoji: '🟡' },
            { id: 'tabouleh', label: 'Tabouleh', emoji: '🥗' },
            { id: 'fattoush', label: 'Fattoush', emoji: '🥗' },
            { id: 'moutabbal', label: 'Moutabbal', emoji: '🍆' },
            { id: 'salata-el-raheb', label: 'Salata el raheb', emoji: '🍆' },
            { id: 'salata-sharkieh', label: 'Salata sharkieh', emoji: '🥗' },
            { id: 'warak-inab', label: 'Warak inab', emoji: '🍇' },
            { id: 'moussakaa', label: 'Moussakaa', emoji: '🍆' },
            { id: 'loubieh', label: 'Loubieh', emoji: '🫘' },
            { id: 'labneh', label: 'Labneh', emoji: '🧀' },
            { id: 'muhammara', label: 'Muhammara', emoji: '🌶️' },
            { id: 'bamieh', label: 'Bamieh', emoji: '🌿' }
          ]
        },
        {
          id: 'hors-doeuvre-chauds',
          label: 'Choisir 4 hors-d\'œuvre chauds',
          description: 'Sélectionnez 4 variétés',
          selectionType: 'multiple',
          minSelections: 4,
          maxSelections: 4,
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'falafel', label: 'Falafel', emoji: '🌱' },
            { id: 'kebbe', label: 'Kebbé', emoji: '🥩' },
            { id: 'sfiha', label: 'Sfiha', emoji: '🍕' },
            { id: 'samboussik-viande', label: 'Samboussik lahmé', emoji: '🥟' },
            { id: 'samboussik-fromage', label: 'Samboussik jebné', emoji: '🧀' },
            { id: 'fattayer', label: 'Fattayer', emoji: '🥬' },
            { id: 'rakakat', label: 'Rakakat', emoji: '🧀' },
            { id: 'manouche-zaatar', label: 'Manouché zaatar', emoji: '🌿' },
            { id: 'fatteh-hommous', label: 'Fatteh hommous', emoji: '🟡' },
            { id: 'arayess-viande', label: 'Arayess viande', emoji: '🥩' },
            { id: 'soujouk', label: 'Soujouk', emoji: '🌭' },
            { id: 'makanek', label: 'Makanek', emoji: '🌭' },
            { id: 'sawda-dajaj', label: 'Sawda dajaj', emoji: '🍖' },
            { id: 'batata-harra', label: 'Batata harra', emoji: '🥔' }
          ]
        }
      ]
    },
  
    'mezze-vegetarien': {
      steps: [
        {
          id: 'hors-doeuvre-froids',
          label: 'Choisir 4 hors-d\'œuvre froids',
          description: 'Sélectionnez 4 variétés végétariennes',
          selectionType: 'multiple',
          minSelections: 4,
          maxSelections: 4,
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'hommouss', label: 'Hommouss', emoji: '🟡' },
            { id: 'tabouleh', label: 'Tabouleh', emoji: '🥗' },
            { id: 'fattoush', label: 'Fattoush', emoji: '🥗' },
            { id: 'moutabbal', label: 'Moutabbal', emoji: '🍆' },
            { id: 'salata-el-raheb', label: 'Salata el raheb', emoji: '🍆' },
            { id: 'salata-sharkieh', label: 'Salata sharkieh', emoji: '🥗' },
            { id: 'warak-inab', label: 'Warak inab', emoji: '🍇' },
            { id: 'moussakaa', label: 'Moussakaa', emoji: '🍆' },
            { id: 'loubieh', label: 'Loubieh', emoji: '🫘' },
            { id: 'labneh', label: 'Labneh', emoji: '🧀' },
            { id: 'muhammara', label: 'Muhammara', emoji: '🌶️' },
            { id: 'bamieh', label: 'Bamieh', emoji: '🌿' }
          ]
        },
        {
          id: 'hors-doeuvre-chauds',
          label: 'Choisir 3 hors-d\'œuvre chauds',
          description: 'Sélectionnez 3 variétés végétariennes',
          selectionType: 'multiple',
          minSelections: 3,
          maxSelections: 3,
          required: true,
          allowCustomNote: true,
          sourceType: 'custom',
          customOptions: [
            { id: 'falafel', label: 'Falafel', emoji: '🌱' },
            { id: 'samboussik-fromage', label: 'Samboussik jebné', emoji: '🧀' },
            { id: 'fattayer', label: 'Fattayer', emoji: '🥬' },
            { id: 'rakakat', label: 'Rakakat', emoji: '🧀' },
            { id: 'manouche-zaatar', label: 'Manouché zaatar', emoji: '🌿' },
            { id: 'fatteh-hommous', label: 'Fatteh hommous', emoji: '🟡' },
            { id: 'batata-harra', label: 'Batata harra', emoji: '🥔' }
          ]
        }
      ]
    }
  };
  
  // 🎯 Liste statique des menus qui sont composés (basé sur le nom)
  export const STATIC_COMPOSED_MENU_NAMES = [
    'Menu Talya express',
    'Menu Talya gourmand',
    'Assiette chawarma poulet & boisson',
    'Assiette chawarma (bœuf ou poulet) & boisson',
    'Assiette au choix & boisson',
    'Menu enfant',
    'Mezzé 2',
    'Mezzé 4', 
    'Mezze végétarien'
  ];
  
  // 🎯 Helper pour vérifier si un item est un menu composé
  export function isComposedMenu(itemName: string): boolean {
    return STATIC_COMPOSED_MENU_NAMES.some(name => 
      itemName.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  // 🎯 Helper pour obtenir la config d'un menu composé
  export function getComposedMenuConfig(itemName: string): ComposedMenuConfig | null {
    const name = itemName.toLowerCase();
    
    if (name.includes('menu talya express')) {
      return STATIC_COMPOSED_MENUS['menu-talya-express'];
    }
    
    if (name.includes('menu talya gourmand')) {
      return STATIC_COMPOSED_MENUS['menu-talya-gourmand'];
    }
  
    if (name.includes('assiette chawarma poulet & boisson')) {
      return STATIC_COMPOSED_MENUS['assiette-chawarma-poulet-boisson'];
    }
  
    if (name.includes('assiette chawarma (bœuf ou poulet)') && name.includes('boisson')) {
      return STATIC_COMPOSED_MENUS['assiette-chawarma-boisson-dessert'];
    }
  
    if (name.includes('assiette au choix') && name.includes('boisson')) {
      return STATIC_COMPOSED_MENUS['assiette-au-choix-boisson-dessert'];
    }
  
    if (name.includes('menu enfant')) {
      return STATIC_COMPOSED_MENUS['menu-enfant'];
    }
  
    if (name.includes('mezzé 2')) {
      return STATIC_COMPOSED_MENUS['mezze-2-personnes'];
    }
  
    if (name.includes('mezzé 4')) {
      return STATIC_COMPOSED_MENUS['mezze-4-personnes'];
    }
  
    if (name.includes('mezze végétarien')) {
      return STATIC_COMPOSED_MENUS['mezze-vegetarien'];
    }
    
    return null;
  }
  
  // 🎯 Interface pour les options de portion
  export interface PortionOption {
    id: string;
    label: string;
    priceMultiplier: number; // 1 = prix normal, 0.5 = demi-prix, 0.3 = prix à la pièce, etc.
  }
  
  // 🎯 Helper pour obtenir les options d'une étape
  export function getStepOptions(
    step: MenuStep, 
    allItems: any[], 
    categories: any[]
  ): MenuStepOption[] {
    switch (step.sourceType) {
      case 'category':
        if (step.sourceCategoryId) {
          const categoryItems = allItems
            .filter(item => item.categorieId === step.sourceCategoryId && item.disponible)
            .sort((a, b) => a.ordre - b.ordre);
  
          // 🎯 Pour les hors d'œuvre froids : ajouter l'option "à la pièce"
          if (step.sourceCategoryId === 'hors-doeuvre-froid') {
            const options: MenuStepOption[] = [];
            categoryItems.forEach(item => {
              // Option portion normale
              options.push({
                id: item.id,
                label: item.nom,
                description: item.description,
                priceAdjustment: 0,
                emoji: getItemEmoji(item, categories)
              });
              
              // Option à la pièce (environ 30% du prix normal)
              options.push({
                id: `${item.id}-piece`,
                label: `${item.nom} (à la pièce)`,
                description: `${item.description || ''} - portion individuelle`,
                priceAdjustment: -Math.round(item.prix * 0.7), // Réduction de 70% pour faire environ 30% du prix
                emoji: `${getItemEmoji(item, categories)}🔸`
              });
            });
            return options;
          }
  
          // 🎯 Pour les hors d'œuvre chauds : ajouter l'option "demi part"
          if (step.sourceCategoryId === 'hors-doeuvre-chaud') {
            const options: MenuStepOption[] = [];
            categoryItems.forEach(item => {
              // Option portion normale
              options.push({
                id: item.id,
                label: item.nom,
                description: item.description,
                priceAdjustment: 0,
                emoji: getItemEmoji(item, categories)
              });
              
              // Option demi part (50% du prix)
              options.push({
                id: `${item.id}-demi`,
                label: `${item.nom} (demi part)`,
                description: `${item.description || ''} - portion réduite`,
                priceAdjustment: -Math.round(item.prix * 0.5), // Réduction de 50%
                emoji: `${getItemEmoji(item, categories)}🔸`
              });
            });
            return options;
          }
  
          // Pour les autres catégories, options normales
          return categoryItems.map(item => ({
            id: item.id,
            label: item.nom,
            description: item.description,
            priceAdjustment: 0,
            emoji: getItemEmoji(item, categories)
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
              emoji: getItemEmoji(item!, categories)
            }));
        }
        return [];
  
      case 'custom':
        return step.customOptions || [];
  
      default:
        return [];
    }
  }
  
  // 🎯 Helper pour obtenir l'emoji d'un item basé sur sa catégorie
  function getItemEmoji(item: any, categories: any[]): string {
    const category = categories.find(cat => cat.id === item.categorieId);
    return category?.emoji || '🍽️';
  }