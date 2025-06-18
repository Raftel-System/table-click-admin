// src/components/admin/AdminOrdersView.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/useToast';
import { useOrders, type Order } from '@/hooks/useOrders';
import { useRestaurantContext } from '@/contexts/RestaurantContext';
import {
    Printer,
    Clock,
    Package,
    Euro,
    StickyNote,
    Search,
    Filter,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    Download,
    TrendingUp,
    Coffee,
    Utensils
} from 'lucide-react';

interface FilterState {
    searchTerm: string;
    dateFilter: 'today' | 'week' | 'month' | 'custom';
    customDateRange: { start?: Date; end?: Date };
    statusFilter: string;
    typeFilter: string;
    amountRange: { min?: number; max?: number };
}

const AdminOrdersView: React.FC = () => {
    const { toast } = useToast();
    const { restaurant } = useRestaurantContext();
    const { orders, loading, error, printTicket, getOrderStats } = useOrders(restaurant?.id || '');
    
    // États des filtres (sans statusFilter)
    const [filters, setFilters] = useState<FilterState>({
        searchTerm: '',
        dateFilter: 'today',
        customDateRange: {},
        statusFilter: 'all', // Gardé pour éviter les erreurs mais pas utilisé
        typeFilter: 'all',
        amountRange: {}
    });

    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Calculer la plage de dates selon le filtre sélectionné
    const getDateRange = () => {
        const now = new Date();
        switch (filters.dateFilter) {
            case 'today':
                {
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                    return { start: startOfDay, end: endOfDay };
                }
            case 'week':
                {
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    return { start: startOfWeek, end: now };
                }
            case 'month':
                {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    return { start: startOfMonth, end: now };
                }
            case 'custom':
                // ✅ Validation de la plage personnalisée
                if (filters.customDateRange.start && filters.customDateRange.end) {
                    const start = new Date(filters.customDateRange.start);
                    const end = new Date(filters.customDateRange.end);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    
                    // Vérifier que start <= end
                    if (start <= end) {
                        return { start, end };
                    }
                }
                return {};
            default:
                return {};
        }
    };

    // Filtrer les commandes selon les critères actuels avec debug
    const filteredOrders = useMemo(() => {
        console.log('🔍 Filtrage des commandes:', {
            totalOrders: orders.length,
            filters,
            dateRange: getDateRange()
        });

        const dateRange = getDateRange();
        
        // ✅ Filtrage manuel amélioré
        let filtered = [...orders];
        
        // 1. Filtre par terme de recherche
        if (filters.searchTerm.trim()) {
            const term = filters.searchTerm.toLowerCase();
            const beforeSearch = filtered.length;
            filtered = filtered.filter(order => {
                const matchesId = order.id.toLowerCase().includes(term);
                const matchesTable = order.tableNumber?.toString().includes(term);
                const matchesClient = order.numeroClient?.toString().includes(term);
                const matchesItems = order.items.some(item => 
                    item.nom.toLowerCase().includes(term)
                );
                const matchesTotal = order.total.toString().includes(term);
                
                return matchesId || matchesTable || matchesClient || matchesItems || matchesTotal;
            });
            console.log(`📝 Recherche "${term}": ${beforeSearch} → ${filtered.length} commandes`);
        }

        // 2. Filtre par plage de dates
        if (dateRange.start || dateRange.end) {
            const beforeDate = filtered.length;
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt);
                const afterStart = !dateRange.start || orderDate >= dateRange.start;
                const beforeEnd = !dateRange.end || orderDate <= dateRange.end;
                return afterStart && beforeEnd;
            });
            console.log(`📅 Date: ${beforeDate} → ${filtered.length} commandes`);
        }

        // 3. Filtre par statut - SUPPRIMÉ (pas d'info statut disponible)

        // 4. Filtre par type
        if (filters.typeFilter !== 'all') {
            const beforeType = filtered.length;
            filtered = filtered.filter(order => order.mode === filters.typeFilter);
            console.log(`🏪 Type "${filters.typeFilter}": ${beforeType} → ${filtered.length} commandes`);
        }

        // 5. Filtre par montant
        if (filters.amountRange.min !== undefined || filters.amountRange.max !== undefined) {
            const beforeAmount = filtered.length;
            filtered = filtered.filter(order => {
                const total = parseFloat(order.total.toString()) || 0;
                const aboveMin = filters.amountRange.min === undefined || total >= filters.amountRange.min;
                const belowMax = filters.amountRange.max === undefined || total <= filters.amountRange.max;
                return aboveMin && belowMax;
            });
            console.log(`💰 Montant [${filters.amountRange.min}-${filters.amountRange.max}]: ${beforeAmount} → ${filtered.length} commandes`);
        }

        console.log(`✅ Résultat final: ${filtered.length} commandes filtrées`);
        return filtered;
    }, [orders, filters]);

    // Grouper les commandes filtrées par date
    const groupedOrders = useMemo(() => {
        const grouped = filteredOrders.reduce((acc, order) => {
            const date = new Date(order.createdAt).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(order);
            return acc;
        }, {} as Record<string, Order[]>);

        return Object.entries(grouped)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, orders]) => ({
                date,
                orders: orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                count: orders.length,
                totalRevenue: orders.reduce((sum, order) => sum + order.total, 0)
            }));
    }, [filteredOrders]);

    // Gérer l'impression d'un ticket
    const handlePrintTicket = async (order: Order) => {
        setPrintingOrderId(order.id);

        try {
            await printTicket(order, 'ma-cle-secrete');
            toast({
                title: "Ticket imprimé",
                description: `Ticket pour ${order.mode === 'sur_place' ? `Table ${order.tableNumber}` : `N°${order.numeroClient || 'EMPORTER'}`} envoyé à l'imprimante`
            });
        } catch (error) {
            toast({
                title: "Erreur d'impression",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setPrintingOrderId(null);
        }
    };

    // Fonction pour réinitialiser tous les filtres
    const resetFilters = () => {
        setFilters({
            searchTerm: '',
            dateFilter: 'today',
            customDateRange: {},
            statusFilter: 'all',
            typeFilter: 'all',
            amountRange: {}
        });
        setShowFilters(false);
        toast({
            title: "Filtres réinitialisés",
            description: "Tous les filtres ont été remis à zéro"
        });
    };

    // Vérifier si des filtres sont actifs (sans statusFilter)
    const hasActiveFilters = () => {
        return filters.searchTerm !== '' ||
               filters.dateFilter !== 'today' ||
               filters.typeFilter !== 'all' ||
               filters.amountRange.min !== undefined ||
               filters.amountRange.max !== undefined;
    };

    // Formater la plage de dates personnalisée
    const formatCustomDateRange = () => {
        if (filters.dateFilter !== 'custom') return null;
        
        const { start, end } = filters.customDateRange;
        
        if (!start && !end) {
            return "📅 Veuillez choisir une plage de dates";
        }
        
        if (!start || !end) {
            return "📅 Plage incomplète";
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (startDate > endDate) {
            return "⚠️ Date de début postérieure à la date de fin";
        }
        
        const formatOptions: Intl.DateTimeFormatOptions = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        };
        
        return `📅 Du ${startDate.toLocaleDateString('fr-FR', formatOptions)} au ${endDate.toLocaleDateString('fr-FR', formatOptions)}`;
    };
    const toggleDateCollapse = (date: string) => {
        const newCollapsed = new Set(collapsedDates);
        if (newCollapsed.has(date)) {
            newCollapsed.delete(date);
        } else {
            newCollapsed.add(date);
        }
        setCollapsedDates(newCollapsed);
    };

    // Exporter les commandes visibles en CSV
    const exportToCSV = () => {
        const csvData = filteredOrders.map(order => ({
            'ID': order.id,
            'Date': new Date(order.createdAt).toLocaleString('fr-FR'),
            'Type': order.mode === 'sur_place' ? 'Sur place' : 'À emporter',
            'Table/Client': order.mode === 'sur_place' ? `Table ${order.tableNumber}` : order.numeroClient || 'EMPORTER',
            'Articles': order.items.map(item => `${item.quantite}x ${item.nom}`).join('; '),
            'Total': `${order.total.toFixed(2)}€`,
            'Note': order.noteCommande || ''
        }));

        const csv = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast({
            title: "Export terminé",
            description: `${filteredOrders.length} commandes exportées`
        });
    };

    // Formatage de l'heure
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Formatage de la date relative
    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const orderTime = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Il y a ${diffInHours}h`;

        return orderTime.toLocaleDateString('fr-FR');
    };

    // Formatage de la date pour les groupes
    const formatGroupDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `📅 Aujourd'hui - ${date.toLocaleDateString('fr-FR', { weekday: 'long' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `📅 Hier - ${date.toLocaleDateString('fr-FR', { weekday: 'long' })}`;
        } else {
            return `📅 ${date.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            })}`;
        }
    };

    // Obtenir la couleur selon le type de commande
    const getOrderTypeColor = (order: Order) => {
        return order.mode === 'sur_place'
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
            : 'bg-green-500/20 text-green-400 border-green-500/50';
    };

    // Obtenir l'icône selon le type de commande
    const getOrderTypeIcon = (order: Order) => {
        return order.mode === 'sur_place' ? <Coffee size={16} /> : <Package size={16} />;
    };

    // Affichage du chargement
    if (loading) {
        return (
            <div className="space-y-6">
                {/* Skeleton des statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                            <CardContent className="p-4">
                                <div className="h-8 bg-gray-700 rounded w-16 mb-2"></div>
                                <div className="h-4 bg-gray-700 rounded w-24"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Skeleton des commandes */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                            <CardContent className="p-4">
                                <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="h-32 bg-gray-700 rounded"></div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Affichage des erreurs
    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <Card className="bg-red-500/10 border-red-500/50 max-w-md">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Erreur de chargement</h3>
                        <p className="text-red-400 text-sm">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const orderStats = getOrderStats();

    return (
        <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{orderStats.totalOrders}</div>
                        <div className="text-sm text-blue-300">Commandes aujourd'hui</div>
                    </CardContent>
                </Card>

                <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{orderStats.totalRevenue.toFixed(2)}€</div>
                        <div className="text-sm text-green-300">Chiffre d'affaires</div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-500/10 border-purple-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{orderStats.tableOrders}</div>
                        <div className="text-sm text-purple-300">Sur place</div>
                    </CardContent>
                </Card>

                <Card className="bg-orange-500/10 border-orange-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-400">{orderStats.takeawayOrders}</div>
                        <div className="text-sm text-orange-300">À emporter</div>
                    </CardContent>
                </Card>
            </div>

            {/* Barre de recherche et filtres */}
            <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Recherche */}
                        <div className="flex-1 relative">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Rechercher par table, client, plat ou montant..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                className="pl-10 input-premium"
                            />
                        </div>

                        {/* Filtres de période */}
                        <div className="flex gap-2">
                            <Select
                                value={filters.dateFilter}
                                onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateFilter: value }))}
                            >
                                <SelectTrigger className="w-40 input-premium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="today">Aujourd'hui</SelectItem>
                                    <SelectItem value="week">Cette semaine</SelectItem>
                                    <SelectItem value="month">Ce mois</SelectItem>
                                    <SelectItem value="custom">Personnalisé</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date picker personnalisé */}
                            {filters.dateFilter === 'custom' && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="input-premium">
                                            <CalendarIcon size={16} className="mr-2" />
                                            Dates
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                                        <Calendar
                                            mode="range"
                                            selected={{
                                                from: filters.customDateRange.start,
                                                to: filters.customDateRange.end
                                            }}
                                            onSelect={(range) => {
                                                console.log('📅 Date range selected:', range);
                                                setFilters(prev => ({
                                                    ...prev,
                                                    customDateRange: { 
                                                        start: range?.from, 
                                                        end: range?.to 
                                                    }
                                                }));
                                            }}
                                            numberOfMonths={2}
                                            disabled={(date) => date > new Date()} // Empêcher sélection future
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* Bouton filtres avancés */}
                            <Button
                                onClick={() => setShowFilters(!showFilters)}
                                variant="outline"
                                className="input-premium"
                            >
                                <Filter size={16} className="mr-2" />
                                Filtres
                                {hasActiveFilters() && (
                                    <div className="ml-2 w-2 h-2 bg-yellow-500 rounded-full"></div>
                                )}
                            </Button>

                            {/* Bouton réinitialiser */}
                            {hasActiveFilters() && (
                                <Button
                                    onClick={resetFilters}
                                    variant="outline"
                                    className="input-premium text-red-400 border-red-500/50 hover:bg-red-500/10"
                                >
                                    ✕ Reset
                                </Button>
                            )}

                            {/* Export CSV */}
                            <Button
                                onClick={exportToCSV}
                                variant="outline"
                                className="input-premium"
                                disabled={filteredOrders.length === 0}
                            >
                                <Download size={16} className="mr-2" />
                                CSV
                            </Button>
                        </div>
                    </div>

                    {/* Affichage de la plage de dates personnalisée */}
                    {filters.dateFilter === 'custom' && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="text-sm text-blue-300">
                                {formatCustomDateRange()}
                            </div>
                        </div>
                    )}

                    {/* Filtres avancés (sans statusFilter) */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                value={filters.typeFilter}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, typeFilter: value }))}
                            >
                                <SelectTrigger className="input-premium">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    <SelectItem value="sur_place">Sur place</SelectItem>
                                    <SelectItem value="emporter">À emporter</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min €"
                                    value={filters.amountRange.min || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        amountRange: { ...prev.amountRange, min: parseFloat(e.target.value) || undefined }
                                    }))}
                                    className="input-premium"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max €"
                                    value={filters.amountRange.max || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        amountRange: { ...prev.amountRange, max: parseFloat(e.target.value) || undefined }
                                    }))}
                                    className="input-premium"
                                />
                            </div>
                        </div>
                    )}

                    {/* Résumé des filtres actifs */}
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                        <div className="flex items-center gap-4">
                            <span>
                                {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} trouvée{filteredOrders.length !== 1 ? 's' : ''}
                            </span>
                            {filters.searchTerm && (
                                <span className="text-yellow-400">
                                    • Recherche: "{filters.searchTerm}"
                                </span>
                            )}
                            {filters.dateFilter !== 'today' && (
                                <span className="text-blue-400">
                                    • {filters.dateFilter === 'week' ? 'Cette semaine' : 
                                       filters.dateFilter === 'month' ? 'Ce mois' : 
                                       filters.dateFilter === 'custom' ? 'Plage personnalisée' : filters.dateFilter}
                                </span>
                            )}
                            {/* Pas d'affichage du statut dans le résumé */}
                            {filters.typeFilter !== 'all' && (
                                <span className="text-green-400">
                                    • Type: {filters.typeFilter === 'sur_place' ? 'Sur place' : 'À emporter'}
                                </span>
                            )}
                            {(filters.amountRange.min !== undefined || filters.amountRange.max !== undefined) && (
                                <span className="text-orange-400">
                                    • Montant: {filters.amountRange.min || '0'}€ - {filters.amountRange.max || '∞'}€
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Temps réel</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Commandes groupées par date */}
            {groupedOrders.length === 0 ? (
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {filters.searchTerm || filters.dateFilter !== 'today' || filters.typeFilter !== 'all'
                                ? 'Aucune commande correspondante'
                                : 'Aucune commande aujourd\'hui'
                            }
                        </h3>
                        <p className="text-gray-400">
                            {filters.searchTerm || filters.dateFilter !== 'today' || filters.typeFilter !== 'all'
                                ? 'Essayez de modifier vos critères de recherche'
                                : 'Les nouvelles commandes apparaîtront ici en temps réel'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {groupedOrders.map(({ date, orders, count, totalRevenue }) => (
                        <Card key={date} className="bg-gray-900/50 border-gray-700">
                            <Collapsible
                                open={!collapsedDates.has(date)}
                                onOpenChange={() => toggleDateCollapse(date)}
                            >
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-gray-800/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
                                                {formatGroupDate(date)}
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                                    {count} commande{count !== 1 ? 's' : ''}
                                                </Badge>
                                            </CardTitle>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <TrendingUp size={16} />
                                                    <span className="font-semibold">{totalRevenue.toFixed(2)}€</span>
                                                </div>
                                                {collapsedDates.has(date) ? (
                                                    <ChevronDown size={20} className="text-gray-400" />
                                                ) : (
                                                    <ChevronUp size={20} className="text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {orders.map((order) => (
                                                <Card
                                                    key={order.id}
                                                    className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                                                >
                                                    <CardContent className="p-4">
                                                        {/* Header de la commande */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1 text-gray-400">
                                                                    {getOrderTypeIcon(order)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-white text-sm">
                                                                        {order.mode === 'sur_place' 
                                                                            ? `Table ${order.tableNumber}` 
                                                                            : `N°${order.numeroClient || 'EMPORTER'}`
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-gray-400">
                                                                        {order.id.substring(0, 8)}...
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <Badge className={`text-xs ${getOrderTypeColor(order)} border`}>
                                                                {order.mode === 'sur_place' ? 'Sur place' : 'À emporter'}
                                                            </Badge>
                                                        </div>

                                                        {/* Informations temporelles */}
                                                        <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={12} />
                                                                <span>{formatTime(order.createdAt)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span>{formatRelativeTime(order.createdAt)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Articles de la commande */}
                                                        <div className="space-y-1 mb-3">
                                                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                                                <Utensils size={12} />
                                                                <span>{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
                                                            </div>
                                                            {order.items.slice(0, 3).map((item, index) => (
                                                                <div key={index} className="flex justify-between text-sm">
                                                                    <span className="text-gray-300 truncate mr-2">
                                                                        {item.quantite}x {item.nom}
                                                                    </span>
                                                                    {item.prix && (
                                                                        <span className="text-yellow-500 flex-shrink-0">
                                                                            {(item.prix * item.quantite).toFixed(2)}€
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {order.items.length > 3 && (
                                                                <div className="text-xs text-gray-500">
                                                                    +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''} article{order.items.length - 3 > 1 ? 's' : ''}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Note de commande */}
                                                        {order.noteCommande && (
                                                            <div className="mb-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                                                                <div className="flex items-start gap-2">
                                                                    <StickyNote size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                                                    <span className="text-xs text-yellow-200">{order.noteCommande}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Total et actions */}
                                                        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                                            <div className="flex items-center gap-1">
                                                                <Euro size={14} className="text-yellow-500" />
                                                                <span className="text-lg font-bold text-yellow-500">
                                                                    {order.total.toFixed(2)}€
                                                                </span>
                                                            </div>

                                                            {/* Bouton d'impression */}
                                                            <Button
                                                                onClick={() => handlePrintTicket(order)}
                                                                disabled={printingOrderId === order.id}
                                                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 text-xs px-3 py-1.5"
                                                            >
                                                                {printingOrderId === order.id ? (
                                                                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Printer size={12} className="mr-1" />
                                                                        Imprimer
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))}
                </div>
            )}

            {/* Indicateur de connexion temps réel */}
            <div className="fixed bottom-4 right-4 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400">
                        Temps réel • {orders.length} commande{orders.length !== 1 ? 's' : ''} total{orders.length !== 1 ? 'es' : 'e'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AdminOrdersView;