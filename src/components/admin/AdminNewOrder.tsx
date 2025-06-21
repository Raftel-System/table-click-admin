import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenuCategories, useMenuItems, type MenuCategory, type MenuItem } from '@/hooks/useMenu';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';
import { submitAdminOrder } from '@/services/ordersService';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ChefHat,
  Package,
  Euro,
  Save,
  StickyNote,
  Coffee,
  Utensils,
  Star,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Trash2,
  X,
  Shield,
  Grid,
  Target,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  note?: string;
  emoji: string;
  variant?: string;
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

const AdminNewOrder: React.FC = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hooks Firebase existants
  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurant(restaurantSlug || '');
  const { categories, loading: categoriesLoading, error: categoriesError } = useMenuCategories(restaurantSlug || '');
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems(restaurantSlug || '');
  
  // États pour la gestion multi-commandes
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string>('order-1');
  
  // États UI
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [activeInputField, setActiveInputField] = useState<'table' | 'client' | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedOrdersKey] = useState(`saved-orders-${restaurantSlug}`);

  const currency = restaurant?.config?.devise || '€';
  const isLoading = restaurantLoading || categoriesLoading || itemsLoading;
  const hasError = restaurantError || categoriesError || itemsError;

  // Commande courante
  const currentOrder = activeOrders.find(order => order.id === currentOrderId) || {
    id: currentOrderId,
    name: 'Commande 1',
    cart: [],
    orderType: 'sur_place' as const,
    tableNumber: '',
    clientNumber: '',
    globalNote: '',
    total: 0
  };

  // Initialiser la première commande
  useEffect(() => {
    if (activeOrders.length === 0) {
      const firstOrder: ActiveOrder = {
        id: 'order-1',
        name: 'Commande 1',
        cart: [],
        orderType: 'sur_place',
        tableNumber: '',
        clientNumber: '',
        globalNote: '',
        total: 0
      };
      setActiveOrders([firstOrder]);
      
      // Charger depuis localStorage
      const saved = localStorage.getItem(savedOrdersKey);
      if (saved) {
        try {
          const parsedOrders = JSON.parse(saved);
          setActiveOrders(parsedOrders);
        } catch (e) {
          console.warn('Erreur lors du chargement des commandes sauvegardées');
        }
      }
    }
  }, [savedOrdersKey, activeOrders.length]);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (activeOrders.length > 0) {
      localStorage.setItem(savedOrdersKey, JSON.stringify(activeOrders));
    }
  }, [activeOrders, savedOrdersKey]);

  // Auto-sélectionner la première catégorie active
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const firstActiveCategory = categories.find(cat => cat.active);
      if (firstActiveCategory) {
        setSelectedCategory(firstActiveCategory.id);
      }
    }
  }, [categories, selectedCategory]);

  // Raccourcis clavier
 /*  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          addNewOrder();
          break;
        case 'F2':
          e.preventDefault();
          clearCurrentCart();
          break;
        case 'F3':
          e.preventDefault();
          if (currentOrder.cart.length > 0) {
            setShowPinModal(true);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowItemModal(false);
          setShowPinModal(false);
          setShowVirtualKeyboard(false);
          break;
      }
    }; 

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentOrder.cart.length]);
*/
  // Optimisation des items filtrés
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.categorieId === selectedCategory && item.disponible
    ).sort((a, b) => a.ordre - b.ordre);
  }, [items, selectedCategory]);

  // Mettre à jour la commande courante
  const updateCurrentOrder = useCallback((updates: Partial<ActiveOrder>) => {
    setActiveOrders(prev => prev.map(order => 
      order.id === currentOrderId 
        ? { ...order, ...updates, total: calculateOrderTotal({ ...order, ...updates }) }
        : order
    ));
  }, [currentOrderId]);

  // Calculer le total d'une commande
  const calculateOrderTotal = (order: ActiveOrder) => {
    return order.cart.reduce((total, item) => total + (item.prix * item.quantite), 0);
  };

  // Ajouter une nouvelle commande
  const addNewOrder = () => {
    const newOrderNumber = activeOrders.length + 1;
    const newOrder: ActiveOrder = {
      id: `order-${Date.now()}`,
      name: `Commande ${newOrderNumber}`,
      cart: [],
      orderType: 'sur_place',
      tableNumber: '',
      clientNumber: '',
      globalNote: '',
      total: 0
    };
    
    setActiveOrders(prev => [...prev, newOrder]);
    setCurrentOrderId(newOrder.id);
    
    toast({
      title: "Nouvelle commande créée",
      description: `Commande ${newOrderNumber} est maintenant active`
    });
  };

  // Supprimer une commande
  const removeOrder = (orderId: string) => {
    if (activeOrders.length === 1) {
      toast({
        title: "Impossible",
        description: "Vous devez garder au moins une commande",
        variant: "destructive"
      });
      return;
    }

    setActiveOrders(prev => {
      const filtered = prev.filter(order => order.id !== orderId);
      if (currentOrderId === orderId) {
        setCurrentOrderId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Ajouter un article au panier
  const addToCart = (item: MenuItem, variant?: string) => {
    const existingItem = currentOrder.cart.find(cartItem => 
      cartItem.id === item.id && cartItem.variant === variant
    );
    
    const category = categories.find(cat => cat.id === item.categorieId);
    
    if (existingItem) {
      updateCurrentOrder({
        cart: currentOrder.cart.map(cartItem =>
          cartItem.id === item.id && cartItem.variant === variant
            ? { ...cartItem, quantite: cartItem.quantite + 1 }
            : cartItem
        )
      });
    } else {
      const newItem: CartItem = {
        id: item.id,
        nom: item.nom,
        prix: item.prix,
        quantite: 1,
        emoji: category?.emoji || '🍽️',
        variant
      };
      
      updateCurrentOrder({
        cart: [...currentOrder.cart, newItem]
      });
    }

    // Animation tactile
    const button = document.querySelector(`[data-item-id="${item.id}"]`);
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => button.classList.remove('animate-pulse'), 300);
    }
  };

  // Retirer un article du panier
  const removeFromCart = (itemId: string, variant?: string) => {
    const existingItem = currentOrder.cart.find(cartItem => 
      cartItem.id === itemId && cartItem.variant === variant
    );
    
    if (existingItem && existingItem.quantite > 1) {
      updateCurrentOrder({
        cart: currentOrder.cart.map(cartItem =>
          cartItem.id === itemId && cartItem.variant === variant
            ? { ...cartItem, quantite: cartItem.quantite - 1 }
            : cartItem
        )
      });
    } else {
      updateCurrentOrder({
        cart: currentOrder.cart.filter(cartItem => 
          !(cartItem.id === itemId && cartItem.variant === variant)
        )
      });
    }
  };

  // Vider le panier courant
  const clearCurrentCart = () => {
    if (currentOrder.cart.length === 0) return;
    
    updateCurrentOrder({ cart: [] });
    toast({
      title: "Panier vidé",
      description: "Tous les articles ont été supprimés"
    });
  };

  // Clavier virtuel
  const VirtualKeyboard = ({ onInput }: { onInput: (value: string) => void }) => (
    <div className="grid grid-cols-3 gap-3 p-4 bg-black/90 rounded-2xl border border-gray-700">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
        <Button
          key={num}
          onClick={() => onInput(num.toString())}
          className="h-16 text-2xl font-bold bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 rounded-xl transition-all duration-200 hover:scale-105"
        >
          {num}
        </Button>
      ))}
      <Button
        onClick={() => onInput('clear')}
        className="h-16 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200 hover:scale-105"
      >
        <X size={24} />
      </Button>
      <Button
        onClick={() => onInput('delete')}
        className="h-16 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition-all duration-200 hover:scale-105"
      >
        <Minus size={24} />
      </Button>
    </div>
  );

  // Modal détails produit
  const ItemDetailsModal = () => (
    <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
      <DialogContent className="max-w-2xl bg-black/95 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="text-4xl">
              {categories.find(cat => cat.id === selectedItem?.categorieId)?.emoji}
            </span>
            {selectedItem?.nom}
          </DialogTitle>
        </DialogHeader>
        
        {selectedItem && (
          <div className="space-y-6">
            <div className="text-gray-300 text-lg leading-relaxed">
              {selectedItem.description}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-yellow-500">
                {selectedItem.prix.toFixed(2)}{currency}
              </div>
              
              {selectedItem.isPopular && (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                  <Star size={16} className="mr-1" />
                  Populaire
                </Badge>
              )}
              
              {selectedItem.isSpecial && (
                <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles size={16} className="mr-1" />
                  Spécial
                </Badge>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  addToCart(selectedItem);
                  setShowItemModal(false);
                }}
                className="flex-1 h-16 text-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-xl transition-all duration-300"
              >
                <Plus size={24} className="mr-2" />
                Ajouter au panier
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

// Modal de confirmation de commande
const OrderConfirmationModal = () => (
  <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
    <DialogContent className="max-w-2xl bg-black/95 border-gray-700 text-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-2xl">
          <CheckCircle2 size={28} className="text-green-400" />
          Confirmer la commande
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Résumé du service */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                currentOrder.orderType === 'sur_place' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {currentOrder.orderType === 'sur_place' ? <Coffee size={20} /> : <Package size={20} />}
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {currentOrder.orderType === 'sur_place' ? 'Sur place' : 'À emporter'}
                </h3>
                <p className="text-sm text-gray-400">
                  {currentOrder.orderType === 'sur_place' 
                    ? `Table ${currentOrder.tableNumber}` 
                    : `Client ${currentOrder.clientNumber}`
                  }
                </p>
              </div>
            </div>
          </div>
          
          {currentOrder.globalNote && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mt-3">
              <div className="flex items-start gap-2">
                <StickyNote size={16} className="text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Instructions spéciales</p>
                  <p className="text-sm text-gray-300 mt-1">{currentOrder.globalNote}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste des articles commandés */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingCart size={20} className="text-green-400" />
            Articles commandés ({currentOrder.cart.length})
          </h3>
          
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
            {currentOrder.cart.map((item, index) => (
              <div key={`${item.id}-${item.variant || ''}-${index}`} className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">{item.nom}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span>{item.quantite} × {item.prix.toFixed(2)}{currency}</span>
                        <span className="text-green-400 font-medium">
                          = {(item.quantite * item.prix).toFixed(2)}{currency}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gray-700/50 rounded-lg px-2 py-1 text-sm font-bold text-white">
                      ×{item.quantite}
                    </div>
                  </div>
                </div>
                
                {item.note && (
                  <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                    <p className="text-xs text-blue-300 flex items-start gap-1">
                      <StickyNote size={12} className="mt-0.5" />
                      {item.note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold text-white">Total de la commande</span>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">
                {currentOrder.total.toFixed(2)}{currency}
              </div>
              <div className="text-sm text-gray-400">
                {currentOrder.cart.reduce((total, item) => total + item.quantite, 0)} article{currentOrder.cart.reduce((total, item) => total + item.quantite, 0) > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4 pt-2">
          <Button
            onClick={() => setShowPinModal(false)}
            variant="outline"
            className="flex-1 h-14 text-lg border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl"
          >
            <ArrowLeft size={20} className="mr-2" />
            Modifier
          </Button>
          
          <Button
            onClick={() => {
              handleValidateOrder();
              setShowPinModal(false);
            }}
            disabled={loading}
            className="flex-1 h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-xl shadow-lg transition-all duration-300"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <CheckCircle2 size={20} className="mr-2" />
            )}
            {loading ? 'Validation...' : 'Confirmer la commande'}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
// Valider la commande avec le service - VERSION CORRIGÉE
const handleValidateOrder = async () => {
  if (currentOrder.cart.length === 0) {
    toast({
      title: "Erreur",
      description: "Veuillez ajouter au moins un article à la commande",
      variant: "destructive"
    });
    return;
  }

  if (currentOrder.orderType === 'sur_place' && !currentOrder.tableNumber.trim()) {
    toast({
      title: "Erreur", 
      description: "Veuillez indiquer le numéro de table",
      variant: "destructive"
    });
    return;
  }

  if (currentOrder.orderType === 'emporter' && !currentOrder.clientNumber.trim()) {
    toast({
      title: "Erreur",
      description: "Veuillez indiquer le numéro client",
      variant: "destructive"
    });
    return;
  }

  setLoading(true);

  try {
    const orderData: any = {
      items: currentOrder.cart.map(item => ({
        nom: item.nom,
        prix: item.prix,
        quantite: item.quantite,
        ...(item.note?.trim() && { specialInstructions: item.note.trim() })
      })),
      total: currentOrder.total,
      mode: currentOrder.orderType
    };

    if (currentOrder.orderType === 'sur_place') {
      orderData.table = currentOrder.tableNumber;
    } else {
      orderData.numeroClient = currentOrder.clientNumber;
    }

    if (currentOrder.globalNote.trim()) {
      orderData.note = currentOrder.globalNote.trim();
    }

    const result = await submitAdminOrder(orderData, restaurantSlug || '');

    if (result.success) {
      toast({
        title: "Commande créée ✅",
        description: `Commande ${currentOrder.orderType === 'sur_place' ? `table ${currentOrder.tableNumber}` : `n°${currentOrder.clientNumber}`} créée avec succès`
      });

      // Au lieu de supprimer la commande, on la vide simplement
      if (activeOrders.length === 1) {
        // S'il n'y a qu'une seule commande, on la remet à zéro
        updateCurrentOrder({
          cart: [],
          tableNumber: '',
          clientNumber: '',
          globalNote: '',
          total: 0
        });
      } else {
        // S'il y a plusieurs commandes, on peut supprimer celle-ci
        removeOrder(currentOrderId);
      }
      
      // Nettoyer le localStorage
      localStorage.removeItem(savedOrdersKey);

    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }

  } catch (error: any) {
    console.error('Erreur création commande:', error);
    toast({
      title: "Erreur",
      description: error.message || "Impossible de créer la commande",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};

  // Navigation sécurisée vers le dashboard
  const handleGoToDashboard = () => {
    const hasActiveOrders = activeOrders.some(order => order.cart.length > 0);
    if (hasActiveOrders) {
      if (confirm('Voulez-vous vraiment retourner au dashboard? Les commandes en cours seront perdues.')) {
        localStorage.removeItem(savedOrdersKey);
        navigate(`/${restaurantSlug}`);
      }
    } else {
      navigate(`/${restaurantSlug}`);
    }
  };

  // Écrans d'état
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-4">Chargement de la caisse...</h2>
          <div className="space-y-2 text-sm text-gray-400">
            {restaurantLoading && <p>• Configuration restaurant...</p>}
            {categoriesLoading && <p>• Chargement des catégories...</p>}
            {itemsLoading && <p>• Chargement du menu...</p>}
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md bg-black/90 border-red-500/50 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
            <h2 className="text-2xl font-bold mb-4 text-red-400">Erreur de chargement</h2>
            <p className="text-gray-300 mb-6">
              {restaurantError || categoriesError || itemsError || `Restaurant "${restaurantSlug}" introuvable`}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                <RefreshCw size={18} className="mr-2" />
                Réessayer
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-gray-600 text-gray-300"
              >
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-gray-800/50 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGoToDashboard}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-2xl p-3 transition-all duration-300"
              >
                <ArrowLeft size={24} className="mr-2" />
                Dashboard
              </Button>
              
              <div className="h-8 w-px bg-gray-700"></div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <ChefHat size={20} className="text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{restaurant?.config?.nom || 'Restaurant'}</h1>
                  <p className="text-sm text-gray-400">Interface de caisse</p>
                </div>
              </div>
            </div>

            {/* Onglets commandes */}
            <div className="flex gap-2">
              {activeOrders.map((order) => (
                <Button
                  key={order.id}
                  onClick={() => setCurrentOrderId(order.id)}
                  variant={currentOrderId === order.id ? "default" : "outline"}
                  className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${
                    currentOrderId === order.id
                      ? 'bg-yellow-500 text-black'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {order.name}
                  {order.cart.length > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {order.cart.length}
                    </div>
                  )}
                </Button>
              ))}
              
              <Button
                onClick={addNewOrder}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl px-3 py-2"
              >
                <Plus size={16} />
              </Button>
            </div>

            
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Menu principal (8/12) */}
          <div className="col-span-8 space-y-6">
            {/* Sélecteur de catégories */}
            <Card className="bg-black/50 border-gray-800 backdrop-blur-xl rounded-3xl">
              <CardContent className="p-6">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {categories
                    .filter(cat => cat.active)
                    .sort((a, b) => a.ordre - b.ordre)
                    .map((category) => (
                      <Button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        className={`flex-shrink-0 h-16 px-6 rounded-2xl transition-all duration-300 ${
                          selectedCategory === category.id
                            ? 'bg-yellow-500 text-black scale-105 shadow-lg'
                            : 'border-gray-600 text-gray-300 hover:bg-gray-800/50'
                        }`}
                      >
                        <span className="text-2xl mr-3">{category.emoji}</span>
                        <span className="font-semibold">{category.nom}</span>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Grid des articles avec design tactile premium */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const cartItem = currentOrder.cart.find(c => c.id === item.id);
                  const quantity = cartItem?.quantite || 0;
                  const category = categories.find(cat => cat.id === item.categorieId);

                  return (
                    <Card 
                      key={item.id} 
                      className="group bg-black/40 border-gray-800 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-yellow-500/50 cursor-pointer overflow-hidden"
                      data-item-id={item.id}
                    >
                      <CardContent className="p-0">
                        {/* Image/Emoji Header */}
                        <div 
                          className="relative h-32 bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowItemModal(true);
                          }}
                        >
                          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                            {category?.emoji || '🍽️'}
                          </span>
                          
                          {/* Badges */}
                          <div className="absolute top-3 right-3 flex gap-1">
                            {item.isPopular && (
                              <Badge className="bg-red-500/90 text-white text-xs border-0 shadow-lg">
                                <Star size={10} className="mr-1" />
                                Hot
                              </Badge>
                            )}
                            {item.isSpecial && (
                              <Badge className="bg-purple-500/90 text-white text-xs border-0 shadow-lg">
                                <Sparkles size={10} className="mr-1" />
                                New
                              </Badge>
                            )}
                          </div>
                          
                          {/* Quantity Indicator */}
                          {quantity > 0 && (
                            <div className="absolute top-3 left-3 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg animate-pulse">
                              {quantity}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:text-yellow-400 transition-colors">
                              {item.nom}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-yellow-500">
                              {item.prix.toFixed(2)}{currency}
                            </span>

                            {/* Contrôles tactiles */}
                            <div className="flex items-center gap-2">
                              {quantity > 0 && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromCart(item.id);
                                  }}
                                  className="w-12 h-12 p-0 bg-red-500/20 border-2 border-red-500/50 hover:bg-red-500 hover:border-red-400 text-red-400 hover:text-white rounded-2xl transition-all duration-300 hover:scale-110"
                                >
                                  <Minus size={20} />
                                </Button>
                              )}
                              
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(item);
                                }}
                                className="w-12 h-12 p-0 bg-green-500/20 border-2 border-green-500/50 hover:bg-green-500 hover:border-green-400 text-green-400 hover:text-white rounded-2xl transition-all duration-300 hover:scale-110"
                              >
                                <Plus size={20} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <Card className="bg-black/40 border-gray-800 backdrop-blur-xl rounded-3xl">
                    <CardContent className="p-12 text-center">
                      <Utensils size={64} className="mx-auto text-gray-600 mb-6" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {selectedCategory 
                          ? 'Aucun article disponible' 
                          : 'Sélectionnez une catégorie'
                        }
                      </h3>
                      <p className="text-gray-400">
                        {selectedCategory 
                          ? 'Cette catégorie ne contient aucun article disponible' 
                          : 'Choisissez une catégorie pour voir les articles'
                        }
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Panneau latéral - Configuration & Panier (4/12) */}
          <div className="col-span-4 space-y-6">
            {/* Configuration de la commande */}
            <Card className="bg-black/50 border-gray-800 backdrop-blur-xl rounded-3xl shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    currentOrder.orderType === 'sur_place' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {currentOrder.orderType === 'sur_place' ? <Coffee size={20} /> : <Package size={20} />}
                  </div>
                  Type de service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toggle Sur place / À emporter */}
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <Coffee size={20} className="text-blue-400" />
                    <span className="text-white font-medium">Sur place</span>
                  </div>
                  <Switch
                    checked={currentOrder.orderType === 'sur_place'}
                    onCheckedChange={(checked) => 
                      updateCurrentOrder({ orderType: checked ? 'sur_place' : 'emporter' })
                    }
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                {/* Champ dynamique selon le type */}
                <div className="space-y-3">
                  <Label className="text-white font-medium flex items-center gap-2">
                    {currentOrder.orderType === 'sur_place' ? (
                      <>
                        <Target size={16} className="text-blue-400" />
                        Numéro de table *
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} className="text-green-400" />
                        Numéro client *
                      </>
                    )}
                  </Label>
                  
                  <div className="relative">
                    <Input
                      value={currentOrder.orderType === 'sur_place' ? currentOrder.tableNumber : currentOrder.clientNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (currentOrder.orderType === 'sur_place') {
                          updateCurrentOrder({ tableNumber: value });
                        } else {
                          updateCurrentOrder({ clientNumber: value });
                        }
                      }}
                      onFocus={() => {
                        setActiveInputField(currentOrder.orderType === 'sur_place' ? 'table' : 'client');
                        setShowVirtualKeyboard(true);
                      }}
                      placeholder={currentOrder.orderType === 'sur_place' ? "Ex: 12" : "Ex: 42"}
                      className="h-14 text-lg bg-gray-800/50 border-gray-600 text-white rounded-2xl pl-4 pr-16 font-mono"
                    />
                    
                    <Button
                      onClick={() => {
                        setActiveInputField(currentOrder.orderType === 'sur_place' ? 'table' : 'client');
                        setShowVirtualKeyboard(!showVirtualKeyboard);
                      }}
                      className="absolute right-2 top-2 w-10 h-10 p-0 bg-gray-700 hover:bg-gray-600 rounded-xl"
                    >
                      <Grid size={16} />
                    </Button>
                  </div>
                </div>

                {/* Note globale */}
                <div className="space-y-3">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <StickyNote size={16} className="text-yellow-400" />
                    Instructions spéciales
                  </Label>
                  <Textarea
                    value={currentOrder.globalNote}
                    onChange={(e) => updateCurrentOrder({ globalNote: e.target.value })}
                    placeholder="Allergies, préférences de cuisson..."
                    className="bg-gray-800/50 border-gray-600 text-white rounded-2xl resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Panier */}
            <Card className="bg-black/50 border-gray-800 backdrop-blur-xl rounded-3xl shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center">
                      <ShoppingCart size={20} />
                    </div>
                    Panier ({currentOrder.cart.length})
                  </span>
                  {currentOrder.cart.length > 0 && (
                    <Button
                      onClick={clearCurrentCart}
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl p-2"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto space-y-4">
                {currentOrder.cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart size={32} className="text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-lg">Panier vide</p>
                    <p className="text-gray-500 text-sm mt-1">Ajoutez des articles pour commencer</p>
                  </div>
                ) : (
                  currentOrder.cart.map((item, index) => (
                    <div key={`${item.id}-${item.variant || ''}-${index}`} className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            <span className="text-xl">{item.emoji}</span>
                            {item.nom}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {item.quantite} × {item.prix.toFixed(2)}{currency} = {(item.quantite * item.prix).toFixed(2)}{currency}
                          </p>
                        </div>
                        <Button
                          onClick={() => removeFromCart(item.id, item.variant)}
                          className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                        >
                          <X size={14} />
                        </Button>
                      </div>

                      {/* Contrôles quantité */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => removeFromCart(item.id, item.variant)}
                            className="w-10 h-10 p-0 bg-red-500/20 border border-red-500/50 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all duration-200"
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-12 text-center text-lg font-bold text-white">
                            {item.quantite}
                          </span>
                          <Button
                            onClick={() => {
                              const menuItem = items.find(i => i.id === item.id);
                              if (menuItem) addToCart(menuItem, item.variant);
                            }}
                            className="w-10 h-10 p-0 bg-green-500/20 border border-green-500/50 hover:bg-green-500 text-green-400 hover:text-white rounded-xl transition-all duration-200"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>

                      {/* Note pour l'article */}
                      <Input
                        value={item.note || ''}
                        onChange={(e) => {
                          const newCart = currentOrder.cart.map((cartItem, cartIndex) =>
                            cartIndex === index ? { ...cartItem, note: e.target.value } : cartItem
                          );
                          updateCurrentOrder({ cart: newCart });
                        }}
                        placeholder="Note pour cet article..."
                        className="mt-3 text-sm bg-gray-700/50 border-gray-600 text-white rounded-xl"
                      />
                    </div>
                  ))
                )}

                {/* Total */}
                {currentOrder.cart.length > 0 && (
                  <div className="border-t border-gray-700 pt-4 mt-6">
                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-yellow-500">
                        {currentOrder.total.toFixed(2)}{currency}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bouton de validation premium */}
            <Button
              onClick={() => setShowPinModal(true)}
              disabled={currentOrder.cart.length === 0 || loading || 
                (currentOrder.orderType === 'sur_place' && !currentOrder.tableNumber.trim()) ||
                (currentOrder.orderType === 'emporter' && !currentOrder.clientNumber.trim())
              }
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-2xl shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
              ) : (
                <Save size={24} className="mr-3" />
              )}
              {loading ? 'Validation...' : 'Valider la commande'}
            </Button>

            {/* Raccourci PIN visible */}
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>Code PIN par défaut: 1234</p>
              <p>F3 pour validation rapide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clavier virtuel flottant */}
   {/*    {showVirtualKeyboard && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="bg-black/95 border-gray-700 backdrop-blur-xl rounded-3xl shadow-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Clavier numérique</h3>
                <Button
                  onClick={() => setShowVirtualKeyboard(false)}
                  className="w-8 h-8 p-0 bg-gray-700 hover:bg-gray-600 rounded-xl"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <VirtualKeyboard
                onInput={(value) => {
                  if (!activeInputField) return;
                  
                  const currentValue = activeInputField === 'table' ? currentOrder.tableNumber : currentOrder.clientNumber;
                  
                  if (value === 'clear') {
                    if (activeInputField === 'table') {
                      updateCurrentOrder({ tableNumber: '' });
                    } else {
                      updateCurrentOrder({ clientNumber: '' });
                    }
                  } else if (value === 'delete') {
                    const newValue = currentValue.slice(0, -1);
                    if (activeInputField === 'table') {
                      updateCurrentOrder({ tableNumber: newValue });
                    } else {
                      updateCurrentOrder({ clientNumber: newValue });
                    }
                  } else {
                    const newValue = currentValue + value;
                    if (activeInputField === 'table') {
                      updateCurrentOrder({ tableNumber: newValue });
                    } else {
                      updateCurrentOrder({ clientNumber: newValue });
                    }
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Modales */}
      <ItemDetailsModal />
      <OrderConfirmationModal  />

      {/* Indicateur de sauvegarde */}
      {activeOrders.some(order => order.cart.length > 0) && (
        <div className="fixed bottom-6 left-6 bg-yellow-500/10 border border-yellow-500/50 rounded-2xl px-4 py-2 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-400">Commandes sauvegardées automatiquement</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewOrder;