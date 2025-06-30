// OrderWorkflow modifié avec TableSelectorDialog et gestion "à emporter"
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coffee, 
  Package, 
  ArrowLeft, 
  ArrowRight,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Check,
  Target,
  ShoppingBag,
  StickyNote,
  Save,
  ChefHat,
  Utensils,
  Star,
  Sparkles,
  Grid3X3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import MenuStepper from '@/components/MenuStepper';
import { 
  isComposedMenu, 
  getComposedMenuConfig,
  type MenuSelection,
  type ComposedMenuConfig 
} from '@/data/composedMenus';
import TableSelectorDialog from './TableSelectorDialog ';

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

interface Restaurant {
  config?: {
    nom?: string;
    devise?: string;
  };
}

interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  note?: string;
  emoji: string;
  variant?: string;
  portionType?: string;
  originalPrice?: number;
  portionLabel?: string;
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

interface ActiveOrder {
  id: string;
  name: string;
  cart: CartItem[];
  orderType: 'sur_place' | 'emporter';
  tableNumber: string;
  clientNumber: string;
  globalNote: string;
  total: number;
}

type WorkflowStep = 'service-type' | 'categories' | 'items' | 'cart-review' | 'finalization';

interface OrderWorkflowProps {
  categories: Category[];
  items: MenuItem[];
  restaurant: Restaurant;
  onOrderSubmit: (order: ActiveOrder) => Promise<void>;
  onBack: () => void;
  occupiedTables?: string[];
}

// Helpers pour les portions
const PORTION_OPTIONS = {
  normal: { label: '', priceMultiplier: 1, suffix: '' },
  piece: { label: 'à la pièce', priceMultiplier: 0.3, suffix: ' 🔸' },
  demi: { label: 'demi part', priceMultiplier: 0.5, suffix: ' 🔸' }
};

const canHavePortions = (categoryId: string): boolean => {
  return categoryId === '5f4d89' || categoryId === '4bad96';
};

const getAvailablePortions = (categoryId: string): string[] => {
  if (categoryId === '5f4d89') {
    return ['normal', 'piece'];
  }
  if (categoryId === '4bad96') {
    return ['normal', 'demi'];
  }
  return ['normal'];
};

const calculateAdjustedPrice = (originalPrice: number, portionType: string): number => {
  const option = PORTION_OPTIONS[portionType as keyof typeof PORTION_OPTIONS];
  return Math.round(originalPrice * option.priceMultiplier * 100) / 100;
};

const OrderWorkflow: React.FC<OrderWorkflowProps> = ({
  categories,
  items,
  restaurant,
  onOrderSubmit,
  onBack,
  occupiedTables = []
}) => {
  // États
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('service-type');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showMenuStepper, setShowMenuStepper] = useState(false);
  const [currentComposedItem, setCurrentComposedItem] = useState<{
    item: MenuItem;
    config: ComposedMenuConfig;
  } | null>(null);
  const [showPortionOptions, setShowPortionOptions] = useState<Record<string, boolean>>({});
  const [showTableSelector, setShowTableSelector] = useState(false);

  const [order, setOrder] = useState<ActiveOrder>({
    id: 'order-1',
    name: 'Nouvelle commande',
    cart: [],
    orderType: 'sur_place',
    tableNumber: '',
    clientNumber: '',
    globalNote: '',
    total: 0
  });

  const currency = restaurant?.config?.devise || '€';

  // Effects
  useEffect(() => {
    const total = order.cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    setOrder(prev => ({ ...prev, total }));
  }, [order.cart]);

  useEffect(() => {
    if (order.orderType === 'sur_place') {
      setOrder(prev => ({ ...prev, clientNumber: '' }));
    } else {
      setOrder(prev => ({ ...prev, tableNumber: '' }));
    }
  }, [order.orderType]);

  // Items filtrés
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    return items
      .filter(item => item.categorieId === selectedCategory && item.disponible)
      .sort((a, b) => a.ordre - b.ordre);
  }, [items, selectedCategory]);

  // Navigation
  const goBack = () => {
    switch (currentStep) {
      case 'service-type': onBack(); break;
      case 'categories': setCurrentStep('service-type'); break;
      case 'items': setCurrentStep('categories'); setSelectedCategory(''); break;
      case 'cart-review': setCurrentStep('categories'); break;
      case 'finalization': setCurrentStep('cart-review'); break;
    }
  };

  const goNext = () => {
    switch (currentStep) {
      case 'service-type': setCurrentStep('categories'); break;
      case 'categories': if (selectedCategory) setCurrentStep('items'); break;
      case 'items': if (order.cart.length > 0) setCurrentStep('cart-review'); break;
      case 'cart-review': setCurrentStep('finalization'); break;
    }
  };

  // Gestion menus composés
  const handleComposedMenuClick = (item: MenuItem) => {
    const config = getComposedMenuConfig(item.nom);
    if (config) {
      setCurrentComposedItem({ item, config });
      setShowMenuStepper(true);
    }
  };

  const handleAddComposedToCart = (composedItem: CartItem) => {
    setOrder(prev => ({ ...prev, cart: [...prev.cart, composedItem] }));
    setShowMenuStepper(false);
    setCurrentComposedItem(null);
  };

  // Gestion panier
  const addToCart = (item: MenuItem, portionType: string = 'normal', adjustedPrice?: number) => {
    if (isComposedMenu(item.nom)) {
      handleComposedMenuClick(item);
      return;
    }

    const finalPrice = adjustedPrice || item.prix;
    const portionOption = PORTION_OPTIONS[portionType as keyof typeof PORTION_OPTIONS];
    const portionLabel = portionOption.suffix;

    const existingItemIndex = order.cart.findIndex(cartItem => 
      cartItem.id === item.id && cartItem.portionType === portionType
    );
    
    const category = categories.find(cat => cat.id === item.categorieId);
    
    if (existingItemIndex !== -1) {
      setOrder(prev => ({
        ...prev,
        cart: prev.cart.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantite: cartItem.quantite + 1 }
            : cartItem
        )
      }));
    } else {
      const newItem: CartItem = {
        id: item.id,
        nom: `${item.nom}${portionLabel}`,
        prix: finalPrice,
        quantite: 1,
        emoji: category?.emoji || '🍽️',
        portionType,
        originalPrice: item.prix,
        portionLabel: portionLabel || undefined
      };
      
      setOrder(prev => ({ ...prev, cart: [...prev.cart, newItem] }));
    }
  };

  const removeFromCart = (itemId: string, portionType: string = 'normal') => {
    const existingItemIndex = order.cart.findIndex(cartItem => 
      cartItem.id === itemId && cartItem.portionType === portionType
    );
    
    if (existingItemIndex === -1) return;
    
    const existingItem = order.cart[existingItemIndex];
    
    if (existingItem.quantite > 1) {
      setOrder(prev => ({
        ...prev,
        cart: prev.cart.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantite: cartItem.quantite - 1 }
            : cartItem
        )
      }));
    } else {
      setOrder(prev => ({
        ...prev,
        cart: prev.cart.filter((_, index) => index !== existingItemIndex)
      }));
    }
  };

  const getCartQuantity = (itemId: string, portionType: string = 'normal'): number => {
    const cartItem = order.cart.find(item => 
      item.id === itemId && item.portionType === portionType
    );
    return cartItem?.quantite || 0;
  };

  const clearCart = () => {
    setOrder(prev => ({ ...prev, cart: [] }));
  };

  const handleSelectTable = (tableNumber: string) => {
    setOrder(prev => ({ ...prev, tableNumber }));
    setShowTableSelector(false);
  };

  // Soumission
  const handleSubmit = async () => {
    if (order.cart.length === 0) return;
    
    if (order.orderType === 'sur_place' && !order.tableNumber.trim()) {
      alert('Veuillez sélectionner une table');
      return;
    }
    if (order.orderType === 'emporter' && !order.clientNumber.trim()) {
      alert('Veuillez indiquer un numéro client');
      return;
    }

    setLoading(true);
    try {
      await onOrderSubmit(order);
      setOrder(prev => ({
        ...prev,
        cart: [],
        tableNumber: '',
        clientNumber: '',
        globalNote: '',
        total: 0
      }));
      setCurrentStep('service-type');
    } catch (error) {
      console.error('Erreur soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  // Composants d'étapes
  const StepIndicator = () => {
    const steps = [
      { key: 'service-type', label: 'Service', icon: <Coffee size={16} /> },
      { key: 'categories', label: 'Menu', icon: <ChefHat size={16} /> },
      { key: 'items', label: 'Articles', icon: <Utensils size={16} /> },
      { key: 'cart-review', label: 'Panier', icon: <ShoppingCart size={16} /> },
      { key: 'finalization', label: 'Validation', icon: <Check size={16} /> }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              index <= currentIndex ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-700 text-gray-400'
            }`}>
              {step.icon}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-px transition-all duration-300 ${
                index < currentIndex ? 'bg-yellow-500' : 'bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const ServiceTypeStep = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Comment souhaitez-vous être servi ?</h2>
        <p className="text-gray-400 text-lg">Choisissez votre mode de service</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                order.orderType === 'emporter' ? 'bg-green-500/20' : 'bg-blue-500/20'
              }`}>
                {order.orderType === 'emporter' ? 
                  <Package size={32} className="text-green-400" /> : 
                  <Coffee size={32} className="text-blue-400" />
                }
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {order.orderType === 'emporter' ? 'À emporter' : 'Sur place'}
                </h3>
                <p className="text-gray-400">
                  {order.orderType === 'emporter' 
                    ? 'Commande à récupérer au comptoir' 
                    : 'Service à table dans notre restaurant'
                  }
                </p>
              </div>
            </div>
            
            <Switch
              checked={order.orderType === 'emporter'}
              onCheckedChange={(checked) => 
                setOrder(prev => ({ ...prev, orderType: checked ? 'emporter' : 'sur_place' }))
              }
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          onClick={goNext}
          className="h-16 px-12 text-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl transition-all duration-300 hover:scale-105"
        >
          Continuer
          <ArrowRight size={24} className="ml-3" />
        </Button>
      </div>
    </div>
  );

  const CategoriesStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Que souhaitez-vous commander ?</h2>
        <p className="text-gray-400 text-lg">Choisissez une catégorie pour voir nos délicieux produits</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories
          .filter(cat => cat.active)
          .sort((a, b) => a.ordre - b.ordre)
          .map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-yellow-500/20 border-yellow-500 ring-2 ring-yellow-500/50'
                  : 'bg-gray-800/50 border-gray-700 hover:border-yellow-500/50'
              }`}
              onClick={() => {
                setSelectedCategory(category.id);
                setTimeout(goNext, 300);
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4">{category.emoji}</div>
                <h3 className="text-xl font-bold text-white">{category.nom}</h3>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );

  const ItemsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            {categories.find(cat => cat.id === selectedCategory)?.nom}
          </h2>
          <p className="text-gray-400">Ajoutez vos articles favoris au panier</p>
        </div>
        
        {order.cart.length > 0 && (
          <Button
            onClick={() => setCurrentStep('cart-review')}
            className="bg-green-500 hover:bg-green-400 text-white rounded-2xl px-6 py-3"
          >
            Voir le panier ({order.cart.length})
            <ShoppingCart size={20} className="ml-2" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const category = categories.find(cat => cat.id === item.categorieId);
          const isComposed = isComposedMenu(item.nom);
          const hasPortionOptions = canHavePortions(item.categorieId);
          const availablePortions = getAvailablePortions(item.categorieId);
          const showOptions = showPortionOptions[item.id] || false;

          return (
            <Card key={item.id} className="bg-gray-800/50 border-gray-700 hover:border-yellow-500/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{category?.emoji || '🍽️'}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.nom}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-yellow-500">
                      {item.prix.toFixed(2)}{currency}
                    </span>
                    
                    {item.isPopular && (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                        <Star size={12} className="mr-1" />
                        Populaire
                      </Badge>
                    )}
                    
                    {item.isSpecial && (
                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Sparkles size={12} className="mr-1" />
                        Nouveau
                      </Badge>
                    )}

                    {isComposed && (
                      <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        <ChefHat size={12} className="mr-1" />
                        Menu
                      </Badge>
                    )}

                    {hasPortionOptions && (
                      <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        Portions
                      </Badge>
                    )}
                  </div>
                </div>

                {hasPortionOptions && showOptions && (
                  <div className="mb-4 space-y-2 bg-gray-700/30 rounded-lg p-3">
                    <div className="text-sm text-yellow-400 font-medium mb-2">
                      Options de portion :
                    </div>
                    {availablePortions.map((portionType) => {
                      const adjustedPrice = calculateAdjustedPrice(item.prix, portionType);
                      const quantity = getCartQuantity(item.id, portionType);
                      const portionOption = PORTION_OPTIONS[portionType as keyof typeof PORTION_OPTIONS];
                      
                      return (
                        <div
                          key={portionType}
                          className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-600"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-white">
                              {portionType === 'normal' ? 'Portion normale' : portionOption.label}
                              {portionOption.suffix}
                            </div>
                            <div className="text-xs text-gray-400">
                              {adjustedPrice.toFixed(2)}{currency}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {quantity > 0 && (
                              <>
                                <Button
                                  onClick={() => removeFromCart(item.id, portionType)}
                                  className="w-8 h-8 p-0 bg-red-500/20 border border-red-500/50 hover:bg-red-500 text-red-400 hover:text-white rounded"
                                >
                                  <Minus size={12} />
                                </Button>
                                <span className="w-6 text-center text-sm font-bold text-white">
                                  {quantity}
                                </span>
                              </>
                            )}
                            
                            <Button
                              onClick={() => addToCart(item, portionType, adjustedPrice)}
                              className="w-8 h-8 p-0 bg-green-500/20 border border-green-500/50 hover:bg-green-500 text-green-400 hover:text-white rounded"
                            >
                              <Plus size={12} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  {isComposed ? (
                    <Button
                      onClick={() => addToCart(item)}
                      className="w-full h-12 bg-blue-500/20 border-2 border-blue-500/50 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all duration-300"
                    >
                      <ChefHat size={20} className="mr-2" />
                      Personnaliser
                    </Button>
                  ) : hasPortionOptions ? (
                    <Button
                      onClick={() => setShowPortionOptions(prev => ({
                        ...prev,
                        [item.id]: !prev[item.id]
                      }))}
                      className="w-full h-12 bg-orange-500/20 border-2 border-orange-500/50 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl transition-all duration-300"
                    >
                      {showOptions ? 'Fermer' : 'Voir portions'}
                    </Button>
                  ) : (
                    <>
                      {getCartQuantity(item.id) > 0 && (
                        <Button
                          onClick={() => removeFromCart(item.id)}
                          className="w-12 h-12 p-0 bg-red-500/20 border border-red-500/50 hover:bg-red-500 text-red-400 hover:text-white rounded-xl"
                        >
                          <Minus size={20} />
                        </Button>
                      )}
                      
                      {getCartQuantity(item.id) > 0 && (
                        <span className="w-12 text-center text-2xl font-bold text-white">
                          {getCartQuantity(item.id)}
                        </span>
                      )}
                      
                      <Button
                        onClick={() => addToCart(item)}
                        className="w-12 h-12 p-0 bg-green-500/20 border border-green-500/50 hover:bg-green-500 text-green-400 hover:text-white rounded-xl"
                      >
                        <Plus size={20} />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderComposedCartItem = (item: CartItem, index: number) => (
    <Card key={`${item.id}-${index}`} className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <h4 className="text-lg font-semibold text-white">{item.nom}</h4>
              <p className="text-gray-400">Menu personnalisé</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-yellow-500">
              {(item.quantite * item.prix).toFixed(2)}{currency}
            </span>
            
            <Button
              onClick={() => {
                setOrder(prev => ({
                  ...prev,
                  cart: prev.cart.filter((_, i) => i !== index)
                }));
              }}
              className="w-10 h-10 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {item.selectedItems && (
          <div className="space-y-2">
            {item.selectedItems.map((selection) => (
              <div key={selection.stepId} className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm font-medium text-yellow-400 mb-1">
                  {selection.stepLabel}
                </div>
                <div className="text-sm text-gray-300">
                  {selection.items.map(selectedItem => selectedItem.nom).join(', ')}
                </div>
                {selection.items.some(selectedItem => selectedItem.customNote) && (
                  <div className="text-xs text-blue-400 mt-1 flex items-start gap-1">
                    <StickyNote size={10} className="mt-0.5" />
                    {selection.items.find(selectedItem => selectedItem.customNote)?.customNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CartReviewStep = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Votre commande</h2>
        <p className="text-gray-400 text-lg">Vérifiez vos articles avant de finaliser</p>
      </div>

      {order.cart.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart size={64} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Panier vide</h3>
            <p className="text-gray-400 mb-6">Ajoutez des articles pour continuer</p>
            <Button
              onClick={() => setCurrentStep('categories')}
              className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl px-8 py-3"
            >
              Choisir des articles
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {order.cart.map((item, index) => (
              item.isComposed ? 
                renderComposedCartItem(item, index) :
                <Card key={`${item.id}-${item.portionType || 'normal'}-${index}`} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{item.emoji}</span>
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            {item.nom}
                            {item.portionLabel && (
                              <span className="text-sm text-orange-400 ml-2">
                                {item.portionLabel}
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-400">
                            {item.quantite} × {item.prix.toFixed(2)}{currency}
                            {item.originalPrice && item.originalPrice !== item.prix && (
                              <span className="text-xs text-gray-500 ml-2">
                                (prix normal: {item.originalPrice.toFixed(2)}{currency})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-yellow-500">
                          {(item.quantite * item.prix).toFixed(2)}{currency}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => removeFromCart(item.id, item.portionType)}
                            className="w-10 h-10 p-0 bg-red-500/20 border border-red-500/50 hover:bg-red-500 text-red-400 hover:text-white rounded-xl"
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center text-lg font-bold text-white">
                            {item.quantite}
                          </span>
                          <Button
                            onClick={() => {
                              const menuItem = items.find(i => i.id === item.id);
                              if (menuItem) {
                                const adjustedPrice = item.originalPrice ? 
                                  calculateAdjustedPrice(item.originalPrice, item.portionType || 'normal') : 
                                  item.prix;
                                addToCart(menuItem, item.portionType, adjustedPrice);
                              }
                            }}
                            className="w-10 h-10 p-0 bg-green-500/20 border border-green-500/50 hover:bg-green-500 text-green-400 hover:text-white rounded-xl"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => {
                            setOrder(prev => ({
                              ...prev,
                              cart: prev.cart.filter((_, i) => i !== index)
                            }));
                          }}
                          className="w-10 h-10 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-2xl font-bold">
                <span className="text-white">Total</span>
                <span className="text-yellow-500">{order.total.toFixed(2)}{currency}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={clearCart}
              variant="outline"
              className="flex-1 h-14 text-lg border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl"
            >
              Vider le panier
            </Button>
            <Button
              onClick={goNext}
              className="flex-1 h-14 text-lg bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl"
            >
              Finaliser la commande
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const FinalizationStep = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Finaliser votre commande</h2>
        <p className="text-gray-400 text-lg">Derniers détails avant validation</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              order.orderType === 'sur_place' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-green-500/20 text-green-400'
            }`}>
              {order.orderType === 'sur_place' ? <Coffee size={20} /> : <Package size={20} />}
            </div>
            Informations de service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {order.orderType === 'sur_place' ? (
            <div className="space-y-3">
              <Label className="text-white font-medium flex items-center gap-2">
                <Target size={16} className="text-blue-400" />
                Numéro de table *
              </Label>
              
              <div className="flex gap-3">
                <Input
                  value={order.tableNumber}
                  onChange={(e) => setOrder(prev => ({ ...prev, tableNumber: e.target.value }))}
                  placeholder="Ex: 12"
                  className="flex-1 h-14 text-lg bg-gray-700/50 border-gray-600 text-white rounded-2xl"
                />
                <Button
                  onClick={() => setShowTableSelector(true)}
                  className="h-14 px-4 bg-blue-500/20 border-2 border-blue-500/50 hover:bg-blue-500 text-blue-400 hover:text-white rounded-2xl transition-all duration-300"
                  title="Plan de salle"
                >
                  <Grid3X3 size={20} />
                </Button>
              </div>
              
              {order.tableNumber && (
                <div className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  ✅ Table {order.tableNumber} sélectionnée
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-white font-medium flex items-center gap-2">
                <ShoppingBag size={16} className="text-green-400" />
                Numéro client *
              </Label>
              
              <Input
                value={order.clientNumber}
                onChange={(e) => setOrder(prev => ({ ...prev, clientNumber: e.target.value }))}
                placeholder="Ex: 42"
                className="h-14 text-lg bg-gray-700/50 border-gray-600 text-white rounded-2xl"
              />
              
              {order.clientNumber && (
                <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  📦 Commande à emporter - Client n°{order.clientNumber}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-white font-medium flex items-center gap-2">
              <StickyNote size={16} className="text-yellow-400" />
              Instructions spéciales (optionnel)
            </Label>
            <Textarea
              value={order.globalNote}
              onChange={(e) => setOrder(prev => ({ ...prev, globalNote: e.target.value }))}
              placeholder="Allergies, préférences de cuisson..."
              className="bg-gray-700/50 border-gray-600 text-white rounded-2xl resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-3xl font-bold text-green-400">
              Total: {order.total.toFixed(2)}{currency}
            </div>
            <div className="text-gray-400">
              {order.cart.reduce((total, item) => total + item.quantite, 0)} article{order.cart.reduce((total, item) => total + item.quantite, 0) > 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={loading || order.cart.length === 0 || 
          (order.orderType === 'sur_place' && !order.tableNumber.trim()) ||
          (order.orderType === 'emporter' && !order.clientNumber.trim())
        }
        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-2xl disabled:opacity-50"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
        ) : (
          <Save size={24} className="mr-3" />
        )}
        {loading ? 'Validation en cours...' : 'Valider la commande'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={goBack}
          variant="ghost"
          className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-2xl p-3"
        >
          <ArrowLeft size={24} className="mr-2" />
          Retour
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{restaurant?.config?.nom || 'Restaurant'}</h1>
            <p className="text-sm text-gray-400">Nouvelle commande</p>
          </div>
        </div>

        {order.cart.length > 0 && currentStep !== 'cart-review' && currentStep !== 'finalization' && (
          <Button
            onClick={() => setCurrentStep('cart-review')}
            className="bg-green-500 hover:bg-green-400 text-white rounded-2xl px-6 py-3 shadow-lg"
          >
            <ShoppingCart size={20} className="mr-2" />
            {order.cart.length} • {order.total.toFixed(2)}{currency}
          </Button>
        )}
      </div>

      <StepIndicator />

      <div className="container mx-auto">
        {currentStep === 'service-type' && <ServiceTypeStep />}
        {currentStep === 'categories' && <CategoriesStep />}
        {currentStep === 'items' && <ItemsStep />}
        {currentStep === 'cart-review' && <CartReviewStep />}
        {currentStep === 'finalization' && <FinalizationStep />}
      </div>

      {currentComposedItem && (
        <MenuStepper
          isOpen={showMenuStepper}
          onClose={() => {
            setShowMenuStepper(false);
            setCurrentComposedItem(null);
          }}
          menuItem={currentComposedItem.item}
          menuConfig={currentComposedItem.config}
          allItems={items}
          categories={categories}
          onAddToCart={handleAddComposedToCart}
          currency={currency}
        />
      )}

      <TableSelectorDialog
        isOpen={showTableSelector}
        onClose={() => setShowTableSelector(false)}
        onSelectTable={handleSelectTable}
        currentTable={order.tableNumber}
        occupiedTables={occupiedTables}
      />
    </div>
  );
};

export default OrderWorkflow;