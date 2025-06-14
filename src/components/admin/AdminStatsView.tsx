// AdminStatsView.tsx - Version Corrigée et Simplifiée
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    ShoppingCart,
    Euro,
    Clock,
    Package,
    Calendar as CalendarIcon,
    Download,
    Target,
    Zap,
    Coffee,
    Utensils,
    Star,
    MapPin,
    Activity,
    Timer
} from 'lucide-react';

// Types pour les données
interface Order {
    id: string;
    customerInfo: {
        name: string;
        phone: string;
        email: string;
        address?: string;
    };
    items: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
    total: number;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
    orderType: 'delivery' | 'pickup';
    specialInstructions?: string;
    createdAt: string;
}

interface AdminStatsViewProps {
    orderStats: {
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        pendingOrders: number;
    };
    orders: Order[];
    getOrdersByStatus: (status: Order['status']) => Order[];
}

// Données mock simplifiées pour éviter les erreurs
const createMockOrders = (): Order[] => {
    const now = new Date();
    return [
        {
            id: 'ORD-001',
            customerInfo: { name: 'Ahmed', phone: '+212 600000001', email: 'ahmed@test.com' },
            items: [{ name: 'Café Express', price: 2.5, quantity: 1 }],
            total: 2.5,
            status: 'delivered',
            orderType: 'pickup',
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // il y a 2h
        },
        {
            id: 'ORD-002',
            customerInfo: { name: 'Fatima', phone: '+212 600000002', email: 'fatima@test.com' },
            items: [{ name: 'Tajine Agneau', price: 12.0, quantity: 1 }],
            total: 12.0,
            status: 'delivered',
            orderType: 'delivery',
            createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString() // il y a 4h
        },
        {
            id: 'ORD-003',
            customerInfo: { name: 'Mohamed', phone: '+212 600000003', email: 'mohamed@test.com' },
            items: [{ name: 'Couscous Royal', price: 15.0, quantity: 1 }],
            total: 15.0,
            status: 'preparing',
            orderType: 'delivery',
            createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() // il y a 1h
        },
        {
            id: 'ORD-004',
            customerInfo: { name: 'Aicha', phone: '+212 600000004', email: 'aicha@test.com' },
            items: [{ name: 'Pastilla', price: 8.5, quantity: 2 }],
            total: 17.0,
            status: 'ready',
            orderType: 'pickup',
            createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // il y a 30min
        }
    ];
};

const AdminStatsView: React.FC<AdminStatsViewProps> = ({
    orderStats: propOrderStats,
    orders: propOrders = [],
    getOrdersByStatus
}) => {
    // Utiliser les données mock si pas de commandes fournies
    const orders = propOrders.length > 0 ? propOrders : createMockOrders();
    
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
    const [customDateRange, setCustomDateRange] = useState<{ start?: Date; end?: Date }>({});

    // Calculer la plage de dates
    const getDateRange = () => {
        const now = new Date();
        switch (dateFilter) {
            case 'today':
                return {
                    start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                };
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 6);
                weekStart.setHours(0, 0, 0, 0);
                return { start: weekStart, end: now };
            case 'month':
                return {
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: now
                };
            case 'custom':
                if (customDateRange.start && customDateRange.end) {
                    return {
                        start: new Date(customDateRange.start),
                        end: new Date(customDateRange.end)
                    };
                }
                return { start: null, end: null };
        }
    };

    // Filtrer les commandes
    const filteredOrders = useMemo(() => {
        const dateRange = getDateRange();
        if (!dateRange.start || !dateRange.end) return orders;

        return orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= dateRange.start && orderDate <= dateRange.end;
        });
    }, [orders, dateFilter, customDateRange]);

    // Calculer les statistiques
    const stats = useMemo(() => {
        const totalOrders = filteredOrders.length;
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            deliveredOrders: filteredOrders.filter(o => o.status === 'delivered').length,
            pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
            preparingOrders: filteredOrders.filter(o => o.status === 'preparing').length,
            readyOrders: filteredOrders.filter(o => o.status === 'ready').length,
            pickupOrders: filteredOrders.filter(o => o.orderType === 'pickup').length,
            deliveryOrders: filteredOrders.filter(o => o.orderType === 'delivery').length,
            totalItems: filteredOrders.reduce((sum, order) => 
                sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
            uniqueCustomers: new Set(filteredOrders.map(order => order.customerInfo.email)).size
        };
    }, [filteredOrders]);

    // Données pour les graphiques
    const chartData = useMemo(() => {
        if (dateFilter === 'today') {
            // Données par heure pour aujourd'hui
            const hourlyData = [];
            for (let hour = 0; hour < 24; hour++) {
                const hourStart = new Date();
                hourStart.setHours(hour, 0, 0, 0);
                const hourEnd = new Date();
                hourEnd.setHours(hour, 59, 59, 999);

                const ordersInHour = filteredOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= hourStart && orderDate <= hourEnd;
                });

                hourlyData.push({
                    label: `${hour}h`,
                    orders: ordersInHour.length,
                    revenue: ordersInHour.reduce((sum, order) => sum + order.total, 0)
                });
            }
            return hourlyData;
        } else {
            // Données par jour pour les autres périodes
            const dateRange = getDateRange();
            if (!dateRange.start || !dateRange.end) return [];

            const dailyData = [];
            const current = new Date(dateRange.start);
            
            while (current <= dateRange.end) {
                const dayStart = new Date(current);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(current);
                dayEnd.setHours(23, 59, 59, 999);

                const ordersInDay = filteredOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= dayStart && orderDate <= dayEnd;
                });

                dailyData.push({
                    label: current.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                    orders: ordersInDay.length,
                    revenue: ordersInDay.reduce((sum, order) => sum + order.total, 0)
                });

                current.setDate(current.getDate() + 1);
            }
            return dailyData;
        }
    }, [filteredOrders, dateFilter]);

    // Top des plats
    const topDishes = useMemo(() => {
        const dishCounts = {};
        
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (dishCounts[item.name]) {
                    dishCounts[item.name].quantity += item.quantity;
                    dishCounts[item.name].revenue += item.price * item.quantity;
                } else {
                    dishCounts[item.name] = {
                        name: item.name,
                        quantity: item.quantity,
                        revenue: item.price * item.quantity
                    };
                }
            });
        });

        return Object.values(dishCounts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [filteredOrders]);

    // Données pour le graphique circulaire
    const pieData = [
        { name: 'Sur place', value: stats.pickupOrders, color: '#3B82F6' },
        { name: 'À emporter', value: stats.deliveryOrders, color: '#10B981' }
    ];

    // Export CSV
    const exportToCSV = () => {
        const csvData = [
            ['Statistiques Restaurant'],
            ['Période', dateFilter],
            ['Total commandes', stats.totalOrders],
            ['Chiffre d\'affaires', `${stats.totalRevenue.toFixed(2)}€`],
            ['Panier moyen', `${stats.averageOrderValue.toFixed(2)}€`],
            [''],
            ['Top plats'],
            ...topDishes.map((dish, index) => [`${index + 1}. ${dish.name}`, `${dish.quantity} vendus`])
        ];

        const csv = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `stats_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast.success('Export terminé !');
    };

    // Composant carte statistique
    const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
        <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">{title}</p>
                        <p className={`text-2xl font-bold text-${color}-400 mb-1`}>{value}</p>
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                    </div>
                    <div className={`w-10 h-10 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
                        <Icon size={20} className={`text-${color}-400`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 size={28} className="text-green-400" />
                        Tableau de bord analytique
                    </h2>
                    <p className="text-gray-400 mt-1">
                        {stats.totalOrders} commande{stats.totalOrders !== 1 ? 's' : ''} • {stats.totalRevenue.toFixed(2)}€
                    </p>
                </div>

                <div className="flex gap-2">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="today">Aujourd'hui</SelectItem>
                            <SelectItem value="week">7 derniers jours</SelectItem>
                            <SelectItem value="month">Ce mois</SelectItem>
                            <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                    </Select>

                    {dateFilter === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="bg-gray-800 border-gray-600 text-white">
                                    <CalendarIcon size={16} className="mr-2" />
                                    Dates
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                                <Calendar
                                    mode="range"
                                    selected={{
                                        from: customDateRange.start,
                                        to: customDateRange.end
                                    }}
                                    onSelect={(range) => {
                                        setCustomDateRange({ 
                                            start: range?.from, 
                                            end: range?.to 
                                        });
                                    }}
                                    disabled={(date) => date > new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    )}

                    <Button onClick={exportToCSV} variant="outline" className="bg-gray-800 border-gray-600 text-white">
                        <Download size={16} className="mr-2" />
                        CSV
                    </Button>
                </div>
            </div>

            {/* Cartes statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Total commandes"
                    value={stats.totalOrders}
                    subtitle={`${stats.deliveredOrders} livrées`}
                    icon={ShoppingCart}
                    color="blue"
                />

                <StatsCard
                    title="Chiffre d'affaires"
                    value={`${stats.totalRevenue.toFixed(2)}€`}
                    subtitle="Total période"
                    icon={Euro}
                    color="green"
                />

                <StatsCard
                    title="Panier moyen"
                    value={`${stats.averageOrderValue.toFixed(2)}€`}
                    subtitle="Par commande"
                    icon={Target}
                    color="yellow"
                />

                <StatsCard
                    title="Articles vendus"
                    value={stats.totalItems}
                    subtitle={`${(stats.totalItems / stats.totalOrders || 0).toFixed(1)} /commande`}
                    icon={Package}
                    color="purple"
                />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Évolution des commandes */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Activity size={20} className="text-blue-400" />
                            Évolution des commandes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '0.5rem',
                                            color: '#F3F4F6'
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="orders" 
                                        stroke="#3B82F6" 
                                        strokeWidth={2}
                                        dot={{ fill: '#3B82F6', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Chiffre d'affaires */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-400" />
                            Chiffre d'affaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '0.5rem',
                                            color: '#F3F4F6'
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#10B981" 
                                        fill="url(#colorRevenue)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analyses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 des plats */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Star size={20} className="text-yellow-400" />
                            Top des plats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topDishes.length > 0 ? topDishes.map((dish, index) => {
                            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                            return (
                                <div key={dish.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{medals[index]}</span>
                                        <div>
                                            <p className="text-white font-medium text-sm">{dish.name}</p>
                                            <p className="text-gray-400 text-xs">{dish.quantity} vendus</p>
                                        </div>
                                    </div>
                                    <p className="text-yellow-400 font-semibold text-sm">{dish.revenue.toFixed(2)}€</p>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-6 text-gray-400">
                                <Utensils size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Aucune donnée disponible</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Répartition */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MapPin size={20} className="text-purple-400" />
                            Répartition des commandes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={60}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Coffee size={16} className="text-blue-400" />
                                    <span className="text-white">Sur place</span>
                                </div>
                                <span className="text-blue-400 font-semibold">{stats.pickupOrders}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Package size={16} className="text-green-400" />
                                    <span className="text-white">À emporter</span>
                                </div>
                                <span className="text-green-400 font-semibold">{stats.deliveryOrders}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</span>
                </div>
            </div>
        </div>
    );
};

export default AdminStatsView;