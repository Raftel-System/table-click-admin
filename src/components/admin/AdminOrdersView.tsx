import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Coffee,
  Package,
  Clock,
  CheckCircle,
  CreditCard,
  Printer,
  Edit3,
  X,
  Eye,
  Utensils,
  StickyNote,
  User,
  MoreVertical,
  Plus,
  Minus,
  Save,
  Trash2,
  RefreshCw,
  Target,
  ShoppingBag,
  AlertCircle,
  CheckCheck,
  Ban,
  ChefHat,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { useOrders, type Order, type OrderStatus, type OrderItem } from '@/hooks/useOrders';
import { useRestaurantContext } from '@/contexts/RestaurantContext';

// Configuration dynamique du thème par restaurant
interface RestaurantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  font?: string;
  backgroundImage?: string;
  logo?: string;
}

const defaultTheme: RestaurantTheme = {
  primaryColor: "#176D63", // Vert foncé Talya
  secondaryColor: "#1D8577", // Vert clair Talya
  accentColor: "#F4BE3C", // Jaune Talya
  font: "Inter"
};


// Hook pour récupérer le thème du restaurant
const useRestaurantTheme = (restaurantId?: string): RestaurantTheme => {
  // En production, ceci ferait un appel API pour récupérer le thème
  // Pour l'instant, on retourne le thème par défaut Talya
  return defaultTheme;
};

// Version responsive du composant AdminOrdersView
const AdminOrdersView: React.FC = () => {
  const { toast } = useToast();
  const { restaurant } = useRestaurantContext();
  const theme = useRestaurantTheme(restaurant?.id);

  // ✅ Utilisation du hook useOrders mis à jour
  const {
    orders,
    loading,
    error,
    printTicket,
    updateOrderStatus,
    getPendingOrders,
    getServedOrders,
    getPaidOrders,
    getOrderStats // ✅ Nouveau hook pour les statistiques
  } = useOrders(restaurant?.id || '');

  // États locaux
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'served' | 'paid'>('pending');
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [confirmingCancellation, setConfirmingCancellation] = useState<Order | null>(null);

  // Mode compact automatique si >5 commandes
  const currentOrders = activeTab === 'pending' ? getPendingOrders() :
      activeTab === 'served' ? getServedOrders() : getPaidOrders();
  const shouldUseCompactMode = currentOrders.length > 5 || compactMode;

  // Filtres des commandes
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return currentOrders;

    const term = searchTerm.toLowerCase();
    return currentOrders.filter(order => {
      const matchesId = order.id.toLowerCase().includes(term);
      const matchesTable = order.tableNumber?.toString().includes(term);
      const matchesClient = order.numeroClient?.toString().includes(term);
      const matchesItems = order.items.some(item =>
          item.nom.toLowerCase().includes(term)
      );
      return matchesId || matchesTable || matchesClient || matchesItems;
    });
  }, [currentOrders, searchTerm]);

  // Badge de statut responsive avec thème Talya
  const StatusBadge: React.FC<{ status: OrderStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
    const configs = {
      pending: {
        icon: <Timer size={size === 'sm' ? 12 : 16} />,
        label: 'En cours'
      },
      served: {
        icon: <CheckCircle size={size === 'sm' ? 12 : 16} />,
        label: 'Servi'
      },
      paid: {
        icon: <CreditCard size={size === 'sm' ? 12 : 16} />,
        label: 'Payé'
      },
      cancelled: {
        icon: <Ban size={size === 'sm' ? 12 : 16} />,
        label: 'Annulé'
      }
    };

    const config = configs[status];
    const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

    const getStatusColor = () => {
      switch (status) {
        case 'pending': return theme.accentColor;
        case 'served': return theme.secondaryColor;
        case 'paid': return theme.primaryColor;
        default: return '#ef4444';
      }
    };

    const statusColor = getStatusColor();

    return (
        <Badge
            className={`border ${sizeClasses} font-medium flex items-center gap-1`}
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              borderColor: `${statusColor}50`
            }}
        >
          {config.icon}
          <span className="hidden sm:inline">{config.label}</span>
        </Badge>
    );
  };

  // ✅ Actions sur les commandes - Mises à jour pour le nouveau workflow
  const handlePrintTicket = async (order: Order) => {
    setPrintingOrderId(order.id);
    try {
      // ✅ Utiliser la nouvelle fonction printTicket qui prend en charge les menus composés
      await printTicket(order);
      toast({
        title: "Ticket imprimé ✅",
        description: `Ticket ${order.mode === 'sur_place' ? `table ${order.tableNumber}` : `n°${order.numeroClient}`} envoyé à l'imprimante`
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'impression",
        description: error.message || "Impossible d'imprimer le ticket",
        variant: "destructive"
      });
    } finally {
      setPrintingOrderId(null);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // ✅ Utiliser la nouvelle fonction avec validation des transitions
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: "Statut mis à jour ✅",
        description: `Commande marquée comme ${newStatus === 'served' ? 'servie' : newStatus === 'paid' ? 'payée' : 'annulée'}`
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le statut",
        variant: "destructive"
      });
    }
  };

  const renderOrderItem = (item: OrderItem, index: number) => {
    return (
      <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium flex items-center gap-2">
            {item.nom}
            {/* ✅ Badge pour les menus composés */}
            {item.isComposed && (
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                <ChefHat size={10} className="mr-1" />
                Menu
              </Badge>
            )}
            {/* ✅ Badge pour les portions */}
            {item.portionType && item.portionType !== 'normal' && (
              <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">
                {item.portionLabel}
              </Badge>
            )}
          </h4>
          <div className="text-right">
            <div className="font-bold" style={{ color: theme.accentColor }}>
              {item.prix ? `${(item.prix * item.quantite).toFixed(2)}€` : 'Inclus'}
            </div>
            <div className="text-gray-400 text-sm">
              {item.quantite} × {item.prix ? `${item.prix.toFixed(2)}€` : 'Inclus'}
            </div>
          </div>
        </div>
  
        {/* ✅ Affichage des sélections pour les menus composés */}
        {item.isComposed && item.selectedItems && item.selectedItems.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-sm text-blue-400 font-medium">Personnalisations :</div>
            {item.selectedItems.map((selection, selIndex) => (
              <div key={selIndex} className="bg-gray-700/50 rounded p-2">
                <div className="text-xs font-medium text-yellow-400 mb-1">
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
  
        {/* ✅ NOUVEAU : Instructions spéciales via le système d'ajout de notes */}
        {item.specialInstructions && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-3">
            <div className="flex items-start gap-2">
              <StickyNote size={14} style={{ color: theme.accentColor }} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-yellow-400 mb-1">Instructions spéciales :</div>
                <span className="text-gray-200 text-sm italic">"{item.specialInstructions}"</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  // Dialogue de modification CORRIGÉ avec logique de sauvegarde
  const EditOrderDialog: React.FC<{ order: Order; onClose: () => void; onSave: (order: Order) => void }> = ({ order, onClose, onSave }) => {
    const [editedOrder, setEditedOrder] = useState<Order>({ ...order });
    const [isSaving, setIsSaving] = useState(false);

    // Recalculer le total quand les items changent
    useEffect(() => {
      const newTotal = editedOrder.items.reduce((sum, item) => sum + (item.prix || 0) * item.quantite, 0);
      setEditedOrder(prev => ({ ...prev, total: newTotal }));
    }, [editedOrder.items]);

    const handleSave = async () => {
      setIsSaving(true);
      try {
        // ✅ TODO: Implémenter la fonction updateOrder dans le hook useOrders
        // await updateOrder(editedOrder.id, editedOrder);

        onSave(editedOrder);
        toast({
          title: "Commande modifiée ✅",
          description: "Les modifications ont été sauvegardées. Le ticket peut être réimprimé avec la mention 'Commande modifiée'."
        });
        onClose();
      } catch (error: any) {
        toast({
          title: "Erreur de sauvegarde",
          description: error.message || "Impossible de sauvegarder les modifications",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    };

    const addItem = () => {
      setEditedOrder(prev => ({
        ...prev,
        items: [...prev.items, { nom: '', quantite: 1, prix: 0 }]
      }));
    };

    const removeItem = (index: number) => {
      setEditedOrder(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
      setEditedOrder(prev => ({
        ...prev,
        items: prev.items.map((item, i) => {
          if (i === index) {
            const updatedItem = { ...item, [field]: value };
            // Conversion automatique des types
            if (field === 'prix') {
              updatedItem.prix = parseFloat(value) || 0;
            } else if (field === 'quantite') {
              updatedItem.quantite = parseInt(value) || 1;
            }
            return updatedItem;
          }
          return item;
        })
      }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Edit3 size={20} style={{ color: theme.accentColor }} />
                  Modifier la commande #{order.id.substring(0, 8)}
                </CardTitle>
                <Button
                    onClick={onClose}
                    variant="ghost"
                    className="text-gray-400 hover:text-white p-2"
                >
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Info commande */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Type de service</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center`}
                        style={{
                          backgroundColor: editedOrder.mode === 'sur_place' ? `${theme.primaryColor}30` : `${theme.secondaryColor}30`,
                          color: editedOrder.mode === 'sur_place' ? theme.primaryColor : theme.secondaryColor
                        }}
                    >
                      {editedOrder.mode === 'sur_place' ? <Coffee size={16} /> : <Package size={16} />}
                    </div>
                    <span className="text-white">{editedOrder.mode === 'sur_place' ? 'Sur place' : 'À emporter'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-white">
                    {editedOrder.mode === 'sur_place' ? 'Table' : 'N° Client'}
                  </Label>
                  <Input
                      value={editedOrder.mode === 'sur_place' ? editedOrder.tableNumber || '' : editedOrder.numeroClient || ''}
                      onChange={(e) => {
                        if (editedOrder.mode === 'sur_place') {
                          setEditedOrder(prev => ({ ...prev, tableNumber: e.target.value || undefined }));
                        } else {
                          setEditedOrder(prev => ({ ...prev, numeroClient: parseInt(e.target.value) || undefined }));
                        }
                      }}
                      className="mt-1 bg-gray-800 border-gray-600 text-white"
                      placeholder={editedOrder.mode === 'sur_place' ? "Ex: 12" : "Ex: 42"}
                  />
                </div>
              </div>

              {/* Articles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white">Articles</Label>
                  <Button
                      onClick={addItem}
                      className="text-sm px-3 py-1"
                      style={{
                        backgroundColor: `${theme.secondaryColor}30`,
                        borderColor: `${theme.secondaryColor}80`,
                        color: theme.secondaryColor
                      }}
                  >
                    <Plus size={16} className="mr-1" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {editedOrder.items.map((item, index) => (
                      <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <Input
                                value={item.nom}
                                onChange={(e) => updateItem(index, 'nom', e.target.value)}
                                placeholder="Nom de l'article"
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                            />
                          </div>
                          <div>
                            <Input
                                type="number"
                                value={item.quantite}
                                onChange={(e) => updateItem(index, 'quantite', e.target.value)}
                                placeholder="Qté"
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                                min="1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                value={item.prix || 0}
                                onChange={(e) => updateItem(index, 'prix', e.target.value)}
                                placeholder="Prix"
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                                min="0"
                            />
                            <Button
                                onClick={() => removeItem(index)}
                                className="w-8 h-8 p-0 bg-red-500/20 border border-red-500/50 hover:bg-red-500 text-red-400 hover:text-white"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Textarea
                              value={item.specialInstructions || ''}
                              onChange={(e) => updateItem(index, 'specialInstructions', e.target.value)}
                              placeholder="Instructions spéciales"
                              className="bg-gray-700 border-gray-600 text-white text-sm resize-none"
                              rows={2}
                          />
                        </div>
                      </div>
                  ))}
                </div>
              </div>

              {/* Note globale */}
              <div>
                <Label className="text-white">Note de commande</Label>
                <Textarea
                    value={editedOrder.noteCommande || ''}
                    onChange={(e) => setEditedOrder(prev => ({ ...prev, noteCommande: e.target.value }))}
                    placeholder="Instructions spéciales pour la commande..."
                    className="mt-1 bg-gray-800 border-gray-600 text-white resize-none"
                    rows={3}
                />
              </div>

              {/* Total mis à jour automatiquement */}
              <div
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: `${theme.accentColor}10`,
                    borderColor: `${theme.accentColor}30`
                  }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Total recalculé</span>
                  <span
                      className="text-2xl font-bold"
                      style={{ color: theme.accentColor }}
                  >
                  {editedOrder.total.toFixed(2)}€
                </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                    onClick={handleSave}
                    className="flex-1 text-black font-medium"
                    style={{ backgroundColor: theme.accentColor }}
                    disabled={isSaving}
                >
                  {isSaving ? (
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                  ) : (
                      <Save size={16} className="mr-2" />
                  )}
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  };

  // Carte de commande responsive
  const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const isCompact = shouldUseCompactMode;

    return (
        <Card className={`bg-gray-800/50 border-gray-700 transition-all duration-300 ${
            !isCompact ? 'hover:scale-[1.02] hover:shadow-xl' : ''
        }`} style={{
          borderLeftWidth: '4px',
          borderLeftColor: order.status === 'pending' ? theme.accentColor :
              order.status === 'served' ? theme.secondaryColor :
                  order.status === 'paid' ? theme.primaryColor : '#6b7280'
        }}>
          <CardContent className={isCompact ? 'p-3' : 'p-4'}>
            {/* Header avec infos principales */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                    className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center`}
                    style={{
                      backgroundColor: order.mode === 'sur_place' ? `${theme.primaryColor}30` : `${theme.secondaryColor}30`,
                      color: order.mode === 'sur_place' ? theme.primaryColor : theme.secondaryColor
                    }}
                >
                  {order.mode === 'sur_place' ? <Coffee size={isCompact ? 16 : 18} /> : <Package size={isCompact ? 16 : 18} />}
                </div>
                <div>
                  <div className={`font-semibold text-white ${isCompact ? 'text-sm' : 'text-base'}`}>
                    {order.mode === 'sur_place' ? `Table ${order.tableNumber}` : `N°${order.numeroClient}`}
                  </div>
                  <div className={`text-gray-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    #{order.id.substring(0, 8)}
                  </div>
                </div>
              </div>
              <StatusBadge status={order.status} size={isCompact ? 'sm' : 'md'} />
            </div>

            {/* Timing info */}
            <div className={`flex items-center gap-4 mb-3 ${isCompact ? 'text-xs' : 'text-sm'} text-gray-400`}>
              <div className="flex items-center gap-1">
                <Clock size={isCompact ? 10 : 12} />
                <span>{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {order.servedAt && (
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle size={isCompact ? 10 : 12} />
                    <span>Servi {new Date(order.servedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
              )}
              {order.paidAt && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <CreditCard size={isCompact ? 10 : 12} />
                    <span>Payé {new Date(order.paidAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
              )}
            </div>

            {/* Articles avec support des menus composés */}
            <div className={`mb-3 ${isCompact ? 'space-y-1' : 'space-y-2'}`}>
              <div className={`flex items-center gap-1 text-gray-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                <Utensils size={isCompact ? 10 : 12} />
                <span>{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
                {/* ✅ Indicateur des menus composés */}
                {order.items.some(item => item.isComposed) && (
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs ml-2">
                      <ChefHat size={8} className="mr-1" />
                      Menu
                    </Badge>
                )}
              </div>
              {!isCompact && (
  <div className="space-y-1">
    {order.items.slice(0, 3).map((item, index) => (
      <div key={index} className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300 flex-1 truncate flex items-center gap-2">
            {item.quantite}× {item.nom}
            {/* ✅ Badges pour menus composés et portions */}
            {item.isComposed && (
              <ChefHat size={12} className="text-blue-400" />
            )}
            {item.portionType && item.portionType !== 'normal' && (
              <span className="text-orange-400 text-xs">{item.portionLabel}</span>
            )}
            {/* ✅ NOUVEAU : Indicateur de note spéciale */}
            {item.specialInstructions && (
              <StickyNote size={10} className="text-yellow-400" title="Instructions spéciales" />
            )}
          </span>
          {item.prix && (
            <span className="ml-2 font-medium" style={{ color: theme.accentColor }}>
              {(item.prix * item.quantite).toFixed(2)}€
            </span>
          )}
        </div>
        {/* ✅ NOUVEAU : Affichage condensé de la note spéciale */}
        {item.specialInstructions && (
          <div className="text-xs text-yellow-400 italic pl-4 truncate">
            "{ item.specialInstructions}"
          </div>
        )}
      </div>
    ))}
    {order.items.length > 3 && (
      <div className="text-xs text-gray-500">
        +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}...
      </div>
    )}
  </div>
)}
            </div>

            {/* Note commande */}
            {order.noteCommande && (
                <div className={`mb-3 bg-gray-700/30 rounded-lg p-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  <div className="flex items-start gap-2">
                    <StickyNote size={isCompact ? 12 : 14} style={{ color: theme.accentColor }} className="mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 line-clamp-2">{order.noteCommande}</span>
                  </div>
                </div>
            )}

            {/* Total */}
            <div className={`flex items-center justify-between mb-4 ${isCompact ? 'text-base' : 'text-lg'}`}>
              <span className="text-white font-medium">Total</span>
              <span className="font-bold" style={{ color: theme.accentColor }}>{order.total.toFixed(2)}€</span>
            </div>

            {/* Actions - Responsive */}
            <div className="space-y-2">
              {/* Actions principales */}
              <div className="grid grid-cols-2 gap-2">
                {order.status === 'pending' && (
                    <Button
                        onClick={() => handleStatusChange(order.id, 'served')}
                        className="border-2 hover:bg-opacity-80"
                        style={{
                          backgroundColor: `${theme.secondaryColor}20`,
                          borderColor: `${theme.secondaryColor}80`,
                          color: theme.secondaryColor
                        }}
                        size={isCompact ? 'sm' : 'default'}
                    >
                      <CheckCircle size={isCompact ? 14 : 16} className="mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Marquer servi</span>
                      <span className="sm:hidden">Servi</span>
                    </Button>
                )}
                {order.status === 'served' && (
                    <Button
                        onClick={() => handleStatusChange(order.id, 'paid')}
                        className="border-2 hover:bg-opacity-80"
                        style={{
                          backgroundColor: `${theme.primaryColor}20`,
                          borderColor: `${theme.primaryColor}80`,
                          color: theme.primaryColor
                        }}
                        size={isCompact ? 'sm' : 'default'}
                    >
                      <CreditCard size={isCompact ? 14 : 16} className="mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Marquer payé</span>
                      <span className="sm:hidden">Payé</span>
                    </Button>
                )}
                <Button
                    onClick={() => handlePrintTicket(order)}
                    disabled={printingOrderId === order.id}
                    className="bg-gray-700/50 border border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white"
                    size={isCompact ? 'sm' : 'default'}
                >
                  {printingOrderId === order.id ? (
                      <RefreshCw size={isCompact ? 14 : 16} className="mr-1 sm:mr-2 animate-spin" />
                  ) : (
                      <Printer size={isCompact ? 14 : 16} className="mr-1 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">Imprimer</span>
                  <span className="sm:hidden">Print</span>
                </Button>
              </div>

              {/* Actions secondaires */}
              <div className="grid grid-cols-2 gap-2">
                {/* <Button
                    onClick={() => setEditingOrder(order)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    size={isCompact ? 'sm' : 'default'}
                >
                  <Edit3 size={isCompact ? 14 : 16} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Modifier</span>
                  <span className="sm:hidden">Edit</span>
                </Button> */}
                <Button
                    onClick={() => setSelectedOrder(order)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    size={isCompact ? 'sm' : 'default'}
                >
                  <Eye size={isCompact ? 14 : 16} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Détails</span>
                  <span className="sm:hidden">View</span>
                </Button>
                {order.status !== 'cancelled' && (
                    <Button
                    onClick={() => setConfirmingCancellation(order)}
                                      variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        size={isCompact ? 'sm' : 'default'}
                    >
                      <X size={isCompact ? 14 : 16} className="mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Annuler</span>
                      <span className="sm:hidden">×</span>
                    </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
    );
  };

  // Vue détaillée d'une commande avec support des menus composés
  const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: order.mode === 'sur_place' ? `${theme.primaryColor}30` : `${theme.secondaryColor}30`,
                      color: order.mode === 'sur_place' ? theme.primaryColor : theme.secondaryColor
                    }}
                >
                  {order.mode === 'sur_place' ? <Coffee size={16} /> : <Package size={16} />}
                </div>
                Commande #{order.id.substring(0, 8)}
              </CardTitle>
              <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-gray-400 hover:text-white p-2"
              >
                <X size={20} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Infos générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Informations</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{order.mode === 'sur_place' ? 'Sur place' : 'À emporter'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{order.mode === 'sur_place' ? 'Table:' : 'Client:'}</span>
                    <span className="text-white">{order.mode === 'sur_place' ? order.tableNumber : order.numeroClient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Statut:</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-bold" style={{ color: theme.accentColor }}>{order.total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Timing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Créée:</span>
                    <span className="text-white">{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  {order.servedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Servie:</span>
                        <span style={{ color: theme.secondaryColor }}>{new Date(order.servedAt).toLocaleString('fr-FR')}</span>
                      </div>
                  )}
                  {order.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payée:</span>
                        <span style={{ color: theme.primaryColor }}>{new Date(order.paidAt).toLocaleString('fr-FR')}</span>
                      </div>
                  )}
                </div>
              </div>
            </div>

            {/* Articles détaillés avec support des menus composés */}
            <div>
              <h3 className="text-white font-semibold mb-3">Articles commandés</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => renderOrderItem(item, index))}
              </div>
            </div>

            {/* Note de commande */}
            {order.noteCommande && (
                <div>
                  <h3 className="text-white font-semibold mb-3">Note de commande</h3>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <StickyNote size={16} style={{ color: theme.accentColor }} className="mt-0.5" />
                      <span className="text-gray-300">{order.noteCommande}</span>
                    </div>
                  </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Fermer
              </Button>
              <Button
                  onClick={() => handlePrintTicket(order)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                  disabled={printingOrderId === order.id}
              >
                {printingOrderId === order.id ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                    <Printer size={16} className="mr-2" />
                )}
                Imprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );

  // Interface principale
  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Chargement des commandes...</h2>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md bg-gray-900 border-red-500/50">
            <CardContent className="p-8 text-center">
              <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2 text-red-400">Erreur de chargement</h2>
              <p className="text-gray-300 mb-4">{error}</p>
              <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 hover:bg-red-400 text-white"
              >
                <RefreshCw size={16} className="mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  // ✅ Obtenir les statistiques via le hook
  const stats = getOrderStats();

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 lg:p-6">
        {/* Header responsive avec statistiques */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Gestion des commandes</h1>
              <p className="text-gray-400">
                {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
                {searchTerm && ` (filtré${filteredOrders.length > 1 ? 'es' : 'e'})`}
              </p>
              {/* ✅ Statistiques du jour */}
              <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gray-400">
                📊 {stats.totalOrders} commandes aujourd'hui
              </span>
                <span className="text-green-400">
                💰 {stats.totalRevenue.toFixed(2)}€ de revenus
              </span>
                <span className="text-blue-400">
                📈 {stats.averageOrderValue.toFixed(2)}€ panier moyen
              </span>
              </div>
            </div>

            {/* Badge utilisateur avec rôle */}
            <div className="flex items-center gap-3">
              <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                <User size={20} className="text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Administrateur</div>
                <div className="text-sm" style={{ color: theme.primaryColor }}>Admin</div>
              </div>
            </div>
          </div>

          {/* Barre de recherche et mode compact */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par table, client, article..."
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 h-12"
                  style={{
                    borderColor: searchTerm ? theme.accentColor : undefined
                  }}
              />
            </div>
            <Button
                onClick={() => setCompactMode(!compactMode)}
                variant="outline"
                className={`border-gray-600 text-gray-300 hover:bg-gray-800 h-12 px-4`}
                style={{
                  borderColor: compactMode ? theme.accentColor : undefined,
                  color: compactMode ? theme.accentColor : undefined,
                  backgroundColor: compactMode ? 'rgba(55, 65, 81, 1)' : undefined
                }}
            >
              <Filter size={16} className="mr-2" />
              <span className="hidden sm:inline">Mode compact</span>
              <span className="sm:hidden">Compact</span>
            </Button>
          </div>

          {/* Onglets avec compteurs et statistiques */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700 h-12">
              <TabsTrigger
                  value="pending"
                  className="text-gray-300 flex items-center gap-2 data-[state=active]:text-black"
                  style={{
                    backgroundColor: activeTab === 'pending' ? theme.accentColor : 'transparent'
                  }}
              >
                <Timer size={16} />
                En cours ({stats.pendingOrders})
              </TabsTrigger>
              <TabsTrigger
                  value="served"
                  className="text-gray-300 flex items-center gap-2 data-[state=active]:text-black"
                  style={{
                    backgroundColor: activeTab === 'served' ? theme.secondaryColor : 'transparent'
                  }}
              >
                <CheckCircle size={16} />
                Servi ({stats.servedOrders})
              </TabsTrigger>
              <TabsTrigger
                  value="paid"
                  className="text-gray-300 flex items-center gap-2 data-[state=active]:text-black"
                  style={{
                    backgroundColor: activeTab === 'paid' ? theme.primaryColor : 'transparent'
                  }}
              >
                <CreditCard size={16} />
                Payé ({stats.paidOrders})
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets */}
            <div className="mt-6">
              <TabsContent value="pending" className="mt-0">
                {filteredOrders.length === 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-12 text-center">
                        <Timer size={64} className="mx-auto text-gray-500 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Aucune commande en cours</h3>
                        <p className="text-gray-400">Les nouvelles commandes apparaîtront ici</p>
                      </CardContent>
                    </Card>
                ) : (
                    <div className={`grid gap-4 ${
                        shouldUseCompactMode
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                            : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                    }`}>
                      {filteredOrders.map((order) => (
                          <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                )}
              </TabsContent>

              <TabsContent value="served" className="mt-0">
                {filteredOrders.length === 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-12 text-center">
                        <CheckCircle size={64} className="mx-auto text-gray-500 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Aucune commande servie</h3>
                        <p className="text-gray-400">Les commandes servies apparaîtront ici</p>
                      </CardContent>
                    </Card>
                ) : (
                    <div className={`grid gap-4 ${
                        shouldUseCompactMode
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                            : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                    }`}>
                      {filteredOrders.map((order) => (
                          <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                )}
              </TabsContent>

              <TabsContent value="paid" className="mt-0">
                {filteredOrders.length === 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-12 text-center">
                        <CreditCard size={64} className="mx-auto text-gray-500 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Aucune commande payée</h3>
                        <p className="text-gray-400">Les commandes payées apparaîtront ici</p>
                      </CardContent>
                    </Card>
                ) : (
                    <div className={`grid gap-4 ${
                        shouldUseCompactMode
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                            : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                    }`}>
                      {filteredOrders.map((order) => (
                          <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Modales */}
        {selectedOrder && (
            <OrderDetailsModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        )}

        {editingOrder && (
            <EditOrderDialog
                order={editingOrder}
                onClose={() => setEditingOrder(null)}
                onSave={async (updatedOrder) => {
                  try {
                    // ✅ TODO: Implémenter la fonction updateOrder dans le hook useOrders
                    // await updateOrder(updatedOrder.id, updatedOrder);

                    console.log('Commande modifiée:', updatedOrder);

                    // Notification avec mention spéciale pour l'impression
                    toast({
                      title: "Commande modifiée ✅",
                      description: "Les modifications ont été sauvegardées. Le ticket peut être réimprimé avec la mention 'Commande modifiée'.",
                      duration: 5000
                    });

                    setEditingOrder(null);
                  } catch (error: any) {
                    toast({
                      title: "Erreur de sauvegarde",
                      description: error.message || "Impossible de sauvegarder les modifications",
                      variant: "destructive"
                    });
                  }
                }}
            />
        )}
        {/* Modal de confirmation d'annulation */}
{confirmingCancellation && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Confirmer l'annulation
            </h3>
            <p className="text-gray-300 mb-6">
              Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Button
                  onClick={() => setConfirmingCancellation(null)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                  onClick={() => {
                    handleStatusChange(confirmingCancellation.id, 'cancelled');
                    setConfirmingCancellation(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white"
              >
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
)}
      </div>
  );
};

export default AdminOrdersView;