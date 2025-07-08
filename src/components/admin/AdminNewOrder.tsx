import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { getRestaurantConfig, useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';
import { submitAdminOrder } from '@/services/ordersService';
import { 
  ArrowLeft, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OrderWorkflow from '../OrderWorkflow ';

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

interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  note?: string;
  emoji: string;
  variant?: string;
}

const AdminNewOrder: React.FC = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hooks Firebase existants
  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurant(restaurantSlug || '');
  const { categories, loading: categoriesLoading, error: categoriesError } = useMenuCategories(restaurantSlug || '');
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems(restaurantSlug || '');
  
  const currency = restaurant?.config?.devise || '€';
  const isLoading = restaurantLoading || categoriesLoading || itemsLoading;
  const hasError = restaurantError || categoriesError || itemsError;

  // Gestion de la soumission de commande
  const handleOrderSubmit = async (order: ActiveOrder): Promise<void> => {
    try {
      const orderData: any = {
        items: order.cart.map(item => ({
          nom: item.nom,
          prix: item.prix,
          quantite: item.quantite,
          ...(item.note?.trim() && { specialInstructions: item.note.trim() })
        })),
        total: order.total,
        mode: order.orderType
      };

      if (order.orderType === 'sur_place') {
        orderData.table = order.tableNumber;
      } else {
        orderData.numeroClient = order.clientNumber;
      }

      if (order.globalNote.trim()) {
        orderData.note = order.globalNote.trim();
      }

      const result = await submitAdminOrder(orderData, restaurantSlug || '');

      if (result.success) {
        // ✅ 1. Toast de succès immédiat
        toast({
          title: "Commande créée ✅",
          description: `Commande ${order.orderType === 'sur_place' ? `table ${order.tableNumber}` : `n°${order.clientNumber}`} créée avec succès`
        });

        // ✅ 2. IMPRESSION AUTOMATIQUE - En arrière-plan sans bloquer l'UI
        const orderId = result.orderId || `order_${Date.now()}`;

        // Lancer l'impression en fire-and-forget
        (async () => {
          try {
            console.log('🖨️ Démarrage impression automatique pour commande:', orderId);

            // Récupérer la configuration du restaurant
            const config = await getRestaurantConfig(restaurantSlug || '');

            if (!config || !config.printerIp) {
              console.warn('⚠️ Configuration imprimante manquante - impression ignorée');
              return;
            }

            // Préparer les données d'impression complètes
            const printData = {
              ip: config.printerIp,
              restaurantSlug: restaurantSlug,
              commandeId: orderId,
              type: order.orderType,
              table: order.orderType === 'sur_place' ? order.tableNumber : 'EMPORTER',
              numeroClient: order.orderType === 'emporter' ? order.clientNumber : undefined,
              total: order.total,
              currency: currency,
              createdAt: new Date().toISOString(),
              // ✅ Note globale de la commande
              ...(order.globalNote.trim() && {
                globalNote: order.globalNote.trim()
              }),
              // ✅ Articles avec toutes les données nécessaires
              produits: order.cart.map(item => ({
                nom: item.nom,
                quantite: item.quantite,
                prix: item.prix,
                emoji: item.emoji, // ✅ Inclure l'emoji
                // ✅ Instructions spéciales par article
                ...(item.note?.trim() && { specialInstructions: item.note.trim() })
              }))
            };

            console.log('🖨️ Envoi vers imprimante:', {
              ...printData,
              serverUrl: 'https://zeus-lab.tailfdaef5.ts.net/print-ticket'
            });

            // Envoyer la requête au serveur d'impression
            const response = await fetch('https://zeus-lab.tailfdaef5.ts.net/print-ticket', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ma-cle-secrete'
              },
              body: JSON.stringify(printData),
              signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
              throw new Error(`Erreur serveur impression: ${response.status} ${response.statusText}`);
            }

            const printResult = await response.json();
            console.log('✅ Ticket imprimé avec succès:', printResult);

            // Toast de confirmation d'impression
            toast({
              title: "Ticket imprimé 🖨️",
              description: `Ticket ${order.orderType === 'sur_place' ?
                  `table ${order.tableNumber}` :
                  `n°${order.clientNumber}`
              } envoyé à l'imprimante`,
              duration: 3000
            });

          } catch (printError: any) {
            console.error('❌ Erreur impression:', printError);

            // Toast d'erreur d'impression (non bloquant)
            toast({
              title: "Avertissement d'impression ⚠️",
              description: `Commande créée mais impression échouée: ${printError.message || 'Erreur inconnue'}`,
              variant: "destructive",
              duration: 6000
            });
          }
        })();

      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }

    } catch (error: any) {
      console.error('❌ Erreur création commande:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la commande",
        variant: "destructive"
      });
      throw error; // Re-throw pour que le workflow puisse gérer l'erreur
    }
  };

  // Navigation sécurisée vers le dashboard
  const handleGoToDashboard = () => {
    navigate(`/${restaurantSlug}`);
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

  // Rendu principal avec le nouveau workflow
  return (
    <OrderWorkflow
      categories={categories}
      items={items}
      restaurant={restaurant}
      onOrderSubmit={handleOrderSubmit}
      onBack={handleGoToDashboard}
    />
  );
};

export default AdminNewOrder;