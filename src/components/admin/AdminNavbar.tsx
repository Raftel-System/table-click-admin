// src/components/admin/AdminNavbar.tsx - Version modifiée
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurantContext } from '@/contexts/RestaurantContext';
import {usePermissions, type UserPermissions} from '@/hooks/usePermission';
import { PermissionWrapper } from '@/components/admin/PermissionWrapper';
import {
    BarChart3,
    ShoppingBag,
    LogOut,
    Bell,
    Search,
    Menu as MenuIcon,
    X,
    Clock,
    TrendingUp,
    Users,
    ChefHat,
    Plus
} from 'lucide-react';

interface AdminNavbarProps {
    user: AuthUser;
    logout: () => void;
    activeTab: 'orders' | 'stats' | 'menu';
    setActiveTab: (tab: 'orders' | 'stats' | 'menu') => void;
    orderStats: {
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        pendingOrders: number;
    };
    menuStats: {
        totalCategories: number;
        totalItems: number;
        popularItems: number;
        specialItems: number;
    };
    hasMenuData: boolean;
    menuLoading: boolean;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({
                                                     user,
                                                     logout,
                                                     activeTab,
                                                     setActiveTab,
                                                     orderStats,
                                                     menuStats,
                                                     hasMenuData,
                                                     menuLoading,
                                                 }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { restaurant, loading: restaurantLoading } = useRestaurantContext();
    const permissions = usePermissions();
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const handleNewOrder = () => {
        if (restaurant?.id) {
            window.location.href = `/${restaurant.id}/commande`;
        }
    };

    // Navigation items avec permissions
    const navigationItems = [
        {
            id: 'orders',
            label: 'Commandes',
            icon: ShoppingBag,
            badge: orderStats.pendingOrders > 0 ? orderStats.pendingOrders : null,
            color: 'text-blue-400',
            activeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
            permission: 'canManageOrders' as keyof UserPermissions
        },
        // Menu - Seulement pour les admins
        ...(permissions.canViewMenu ? [{
            id: 'menu',
            label: 'Menu',
            icon: ChefHat,
            badge: menuLoading ? '...' : (hasMenuData ? menuStats.totalCategories : null),
            color: 'text-purple-400',
            activeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
            permission: 'canViewMenu' as keyof UserPermissions
        }] : []),
        // Statistiques - Seulement pour les admins
        ...(permissions.canViewStats ? [{
            id: 'stats',
            label: 'Statistiques',
            icon: BarChart3,
            badge: null,
            color: 'text-green-400',
            activeColor: 'bg-green-500/20 text-green-400 border-green-500/50',
            permission: 'canViewStats' as keyof UserPermissions
        }] : [])
    ];

    return (
        <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800/50 shadow-2xl">
            <div className="container mx-auto px-4 py-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-4">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                                <span className="text-xl font-bold text-black">TC</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                {restaurantLoading ? (
                                    <div className="h-6 w-32 bg-gray-700 animate-pulse rounded"></div>
                                ) : (
                                    restaurant?.config.nom || 'Restaurant'
                                )}
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>{permissions.canViewStats ? 'Admin Panel' : 'Panel'}</span>
                                <span>•</span>
                                <Clock size={12} />
                                <span>{currentTime}</span>
                                {restaurant && (
                                    <>
                                        <span>•</span>
                                        <span className="text-cyan-400">{restaurant.id}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - User Info & Actions */}
                    <div className="flex items-center gap-4">
                        {/*/!* Notifications *!/*/}
                        {/*<div className="relative">*/}
                        {/*    <Button*/}
                        {/*        variant="ghost"*/}
                        {/*        size="sm"*/}
                        {/*        className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl p-2"*/}
                        {/*    >*/}
                        {/*        <Bell size={20} />*/}
                        {/*        {orderStats.pendingOrders > 0 && (*/}
                        {/*            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">*/}
                        {/*                {orderStats.pendingOrders}*/}
                        {/*            </span>*/}
                        {/*        )}*/}
                        {/*    </Button>*/}
                        {/*</div>*/}

                        {/*/!* Search *!/*/}
                        {/*<Button*/}
                        {/*    variant="ghost"*/}
                        {/*    size="sm"*/}
                        {/*    className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl p-2"*/}
                        {/*>*/}
                        {/*    <Search size={20} />*/}
                        {/*</Button>*/}

                        {/* Bouton Nouvelle Commande - Avec permission */}
                        <PermissionWrapper permission="canCreateNewOrder">
                            <Button
                                onClick={handleNewOrder}
                                disabled={!restaurant?.id || restaurantLoading}
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                            >
                                <Plus size={16} className="mr-2" />
                                <span className="hidden sm:inline">Nouvelle commande</span>
                                <span className="sm:hidden">+</span>
                            </Button>
                        </PermissionWrapper>

                        {/* User Profile */}
                        <div className="hidden md:flex items-center gap-3 bg-gray-800/50 rounded-xl px-3 py-2 border border-gray-700/50">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-gray-400">
                                    {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                                </p>
                            </div>
                        </div>

                        {/* Logout */}
                        <Button
                            onClick={logout}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl p-2"
                        >
                            <LogOut size={20} />
                        </Button>

                        {/* Mobile Menu Toggle */}
                        <Button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            variant="ghost"
                            size="sm"
                            className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl p-2"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs - Filtrée par permissions */}
                <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
                    <div className="flex flex-col md:flex-row gap-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <Button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id as any);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    variant="ghost"
                                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                        isActive
                                            ? `${item.activeColor} border shadow-lg`
                                            : `text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent`
                                    }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>

                                    {/* Badge */}
                                    {item.badge && (
                                        <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-current rounded-t-full"></div>
                                    )}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Quick Stats Bar - Avec permissions pour les données financières */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* Commandes - Toujours visible */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <ShoppingBag size={16} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Aujourd'hui</p>
                                    <p className="text-sm font-bold text-blue-400">{orderStats.totalOrders} commandes</p>
                                </div>
                            </div>
                        </div>

                        {/* Chiffre d'affaires - Seulement pour les admins */}
                        <PermissionWrapper permission="canViewFinancialData">
                            <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <TrendingUp size={16} className="text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Chiffre d'affaires</p>
                                        <p className="text-sm font-bold text-green-400">{orderStats.totalRevenue.toFixed(0)}€</p>
                                    </div>
                                </div>
                            </div>
                        </PermissionWrapper>

                        {/* En attente - Toujours visible */}
                        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                    <Users size={16} className="text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">En attente</p>
                                    <p className="text-sm font-bold text-orange-400">{orderStats.pendingOrders}</p>
                                </div>
                            </div>
                        </div>

                        {/* Catégories Menu - Seulement pour les admins */}
                        <PermissionWrapper permission="canViewMenu">
                            <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <ChefHat size={16} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Catégories</p>
                                        <p className="text-sm font-bold text-purple-400">
                                            {menuLoading ? '...' : menuStats.totalCategories}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </PermissionWrapper>

                        {/* Articles Menu - Seulement pour les admins */}
                        <PermissionWrapper permission="canViewMenu">
                            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                        <div className="text-yellow-400 text-xs font-bold">#{menuStats.totalItems}</div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Articles</p>
                                        <p className="text-sm font-bold text-yellow-400">
                                            {menuLoading ? '...' : menuStats.totalItems}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </PermissionWrapper>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminNavbar;