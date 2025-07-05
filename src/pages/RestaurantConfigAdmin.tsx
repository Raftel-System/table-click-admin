import React, { useState, useRef } from 'react';
import {
    Settings,
    Save,
    Users,
    Upload,
    Eye,
    EyeOff,
    Building2,
    MapPin,
    Printer,
    CreditCard,
    ChefHat,
    Plus,
    Trash2,
    FileText,
    Shield,
    CheckCircle,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

// Import du hook et des types
import { useAdminConfig } from '@/hooks/useAdminConfig';
import type {
    RestaurantConfig,
    UserAccount,
    MenuCategory,
    MenuItem
} from '@/services/adminConfigService';

const RestaurantConfigAdmin: React.FC = () => {
    // Hook personnalisé pour les opérations d'administration
    const {
        loading,
        notifications,
        addNotification,
        removeNotification,
        handleCreateRestaurant,
        handleCreateUser,
        parseMenuJson,
        handleImportMenu,
        handleExportMenu,
        generateRestaurantId
    } = useAdminConfig();

    // État de l'authentification par code secret
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [secretCode, setSecretCode] = useState('');
    const [showCode, setShowCode] = useState(false);

    // États du formulaire restaurant
    const [restaurant, setRestaurant] = useState<RestaurantConfig>({
        id: generateRestaurantId(),
        nom: '',
        adresse: '',
        printerIp: '',
        serverPrinterIp: '',
        kitchenMode: 'printer',
        theme: 'talya',
        devise: 'EUR',
        dateCreation: new Date().toISOString()
    });

    // États des utilisateurs
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [newUser, setNewUser] = useState<Omit<UserAccount, 'restaurant'> & { restaurantSlug: string }>({
        email: '',
        password: '',
        role: 'serveur',
        restaurantSlug: ''
    });

    // États du menu
    const [menuJson, setMenuJson] = useState('');
    const [menuRestaurantSlug, setMenuRestaurantSlug] = useState('');
    const [exportRestaurantSlug, setExportRestaurantSlug] = useState('');
    const [parsedMenu, setParsedMenu] = useState<{categories: MenuCategory[], items: MenuItem[]} | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Gestion de l'authentification
    const handleSecretSubmit = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (secretCode === 'raftel123') {
            setIsAuthenticated(true);
            addNotification('success', 'Accès autorisé avec succès !');
        } else {
            addNotification('error', 'Code secret incorrect');
            setSecretCode('');
        }
    };

    // Création du restaurant avec le hook
    const onCreateRestaurant = async () => {
        const success = await handleCreateRestaurant(restaurant);
        if (success) {
            // Restaurant créé avec succès - les notifications sont gérées par le hook
        }
    };

    // Ajout d'un utilisateur avec le hook
    const onAddUser = async () => {
        if (!newUser.restaurantSlug) {
            addNotification('error', 'Veuillez sélectionner un restaurant');
            return;
        }

        const userWithoutSlug = {
            email: newUser.email,
            password: newUser.password,
            role: newUser.role
        };

        const success = await handleCreateUser(userWithoutSlug, newUser.restaurantSlug);
        if (success) {
            // Ajouter à la liste locale pour l'affichage
            const userToAdd: UserAccount = {
                ...userWithoutSlug,
                restaurant: newUser.restaurantSlug
            };
            setUsers(prev => [...prev, userToAdd]);
            setNewUser({ email: '', password: '', role: 'serveur', restaurantSlug: '' });
        }
    };

    // Suppression d'un utilisateur
    const handleRemoveUser = (userEmail: string) => {
        setUsers(prev => prev.filter(u => u.email !== userEmail));
        addNotification('success', 'Utilisateur supprimé de la liste');
    };

    // Parsing du JSON du menu avec le hook
    const onParseMenuJson = () => {
        const result = parseMenuJson(menuJson);
        if (result) {
            setParsedMenu(result);
        }
    };

    // Import du menu avec le hook
    const onImportMenu = async () => {
        if (!parsedMenu) {
            addNotification('error', 'Veuillez d\'abord parser le JSON du menu');
            return;
        }

        if (!menuRestaurantSlug.trim()) {
            addNotification('error', 'Veuillez saisir le slug du restaurant');
            return;
        }

        const success = await handleImportMenu(menuRestaurantSlug, parsedMenu.categories, parsedMenu.items);
        if (success) {
            // Menu importé avec succès - notification gérée par le hook
        }
    };

    // Export du menu avec le hook
    const onExportMenu = async () => {
        if (!exportRestaurantSlug.trim()) {
            addNotification('error', 'Veuillez saisir le slug du restaurant à exporter');
            return;
        }

        const success = await handleExportMenu(exportRestaurantSlug);
        if (success) {
            // Export réussi - notification gérée par le hook
        }
    };

    // Chargement d'un fichier JSON
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setMenuJson(content);
            addNotification('success', 'Fichier JSON chargé');
        };
        reader.readAsText(file);
    };

    // Affichage de l'écran de connexion
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 w-full max-w-md backdrop-blur-sm">
                    <div className="text-center mb-8">
                        <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white mb-2">Administration Restaurant</h1>
                        <p className="text-gray-400">Saisissez le code secret pour accéder à l'interface</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type={showCode ? 'text' : 'password'}
                                value={secretCode}
                                onChange={(e) => setSecretCode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSecretSubmit(e)}
                                placeholder="Code secret..."
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowCode(!showCode)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <button
                            onClick={handleSecretSubmit}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                        >
                            Accéder
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
            {/* Header */}
            <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Settings className="w-8 h-8 text-blue-400" />
                            <div>
                                <h1 className="text-2xl font-bold">Configuration Restaurant</h1>
                                <p className="text-gray-400">Interface d'administration</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAuthenticated(false)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`px-4 py-3 rounded-lg flex items-center justify-between space-x-2 ${
                                notification.type === 'success'
                                    ? 'bg-green-600 text-white'
                                    : notification.type === 'error'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-yellow-600 text-white'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                {notification.type === 'success'
                                    ? <CheckCircle className="w-5 h-5" />
                                    : <AlertCircle className="w-5 h-5" />
                                }
                                <span>{notification.message}</span>
                            </div>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="text-white/80 hover:text-white ml-2"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Contenu principal */}
            <div className="container mx-auto px-6 py-8 space-y-8">

                {/* Section Restaurant */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <Building2 className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-semibold">Configuration du Restaurant</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    ID du Restaurant *
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={restaurant.id}
                                        onChange={(e) => setRestaurant(prev => ({ ...prev, id: e.target.value }))}
                                        className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    />
                                    <button
                                        onClick={() => setRestaurant(prev => ({ ...prev, id: generateRestaurantId() }))}
                                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Générer un nouvel ID"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Identifiant unique (8 chiffres recommandé)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nom du Restaurant *
                                </label>
                                <input
                                    type="text"
                                    value={restaurant.nom}
                                    onChange={(e) => setRestaurant(prev => ({ ...prev, nom: e.target.value }))}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="Nom du restaurant..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    Adresse *
                                </label>
                                <textarea
                                    value={restaurant.adresse}
                                    onChange={(e) => setRestaurant(prev => ({ ...prev, adresse: e.target.value }))}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    rows={3}
                                    placeholder="Adresse complète..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <Printer className="w-4 h-4 inline mr-1" />
                                    Printer IP (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={restaurant.printerIp}
                                    onChange={(e) => setRestaurant(prev => ({ ...prev, printerIp: e.target.value }))}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="192.168.1.100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Server Printer IP (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={restaurant.serverPrinterIp}
                                    onChange={(e) => setRestaurant(prev => ({ ...prev, serverPrinterIp: e.target.value }))}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="192.168.1.101"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <ChefHat className="w-4 h-4 inline mr-1" />
                                    Kitchen Mode *
                                </label>
                                <select
                                    value={restaurant.kitchenMode}
                                    onChange={(e) => setRestaurant(prev => ({ ...prev, kitchenMode: e.target.value as 'printer' | 'kds' }))}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                >
                                    <option value="printer">Printer</option>
                                    <option value="kds">KDS</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <CreditCard className="w-4 h-4 inline mr-1" />
                                    Devise *
                                </label>
                                <select
                                    value={restaurant.devise}
                                    onChange={(e) => setRestaurant(prev => ({ ...prev, devise: e.target.value as 'EUR' | 'USD' | 'MAD' }))}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                >
                                    <option value="EUR">Euro (€)</option>
                                    <option value="USD">Dollar ($)</option>
                                    <option value="MAD">Dirham marocain (MAD)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <button
                            onClick={onCreateRestaurant}
                            disabled={loading === 'restaurant'}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
                        >
                            {loading === 'restaurant' ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            <span>{loading === 'restaurant' ? 'Création...' : 'Créer le Restaurant'}</span>
                        </button>
                    </div>
                </div>

                {/* Section Utilisateurs */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <Users className="w-6 h-6 text-green-400" />
                        <h2 className="text-xl font-semibold">Gestion des Utilisateurs</h2>
                    </div>

                    {/* Formulaire d'ajout d'utilisateur */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Email..."
                            className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        />
                        <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Mot de passe..."
                            className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        />
                        <input
                            type="text"
                            value={newUser.restaurantSlug}
                            onChange={(e) => setNewUser(prev => ({ ...prev, restaurantSlug: e.target.value }))}
                            placeholder="Slug restaurant..."
                            className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        />
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'serveur' }))}
                            className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        >
                            <option value="serveur">Serveur</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            onClick={onAddUser}
                            disabled={loading === 'user'}
                            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                        >
                            {loading === 'user' ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            <span>Ajouter</span>
                        </button>
                    </div>

                    {/* Liste des utilisateurs */}
                    {users.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-300">Utilisateurs créés:</h3>
                            {users.map(user => (
                                <div key={user.email} className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${user.role === 'admin' ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                                        <span className="font-medium">{user.email}</span>
                                        <span className="text-sm text-gray-400 capitalize">({user.role})</span>
                                        <span className="text-xs text-gray-500">→ {user.restaurant}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveUser(user.email)}
                                        className="text-red-400 hover:text-red-300 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section Export Menu */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <FileText className="w-6 h-6 text-orange-400" />
                        <h2 className="text-xl font-semibold">Export du Menu (JSON)</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Slug du Restaurant à Exporter *
                            </label>
                            <input
                                type="text"
                                value={exportRestaurantSlug}
                                onChange={(e) => setExportRestaurantSlug(e.target.value)}
                                placeholder="talya-bercy"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">ID du restaurant dont vous voulez exporter le menu</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onExportMenu}
                                disabled={loading === 'export'}
                                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
                            >
                                {loading === 'export' ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <FileText className="w-5 h-5" />
                                )}
                                <span>{loading === 'export' ? 'Export...' : 'Exporter Menu JSON'}</span>
                            </button>
                            <span className="text-gray-400">→ Télécharge un fichier JSON avec le menu du restaurant</span>
                        </div>
                    </div>
                </div>

                {/* Section Import Menu */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <Upload className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-semibold">Import du Menu (JSON)</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Charger fichier JSON</span>
                            </button>
                            <span className="text-gray-400">ou</span>
                            <span className="text-gray-400">Coller le JSON ci-dessous</span>
                        </div>

                        {/* Champ slug restaurant séparé */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Slug du Restaurant *
                            </label>
                            <input
                                type="text"
                                value={menuRestaurantSlug}
                                onChange={(e) => setMenuRestaurantSlug(e.target.value)}
                                placeholder="Slug du restaurant pour l'import..."
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">ID du restaurant où importer le menu</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                JSON du Menu
                            </label>
                            <textarea
                                value={menuJson}
                                onChange={(e) => setMenuJson(e.target.value)}
                                placeholder='{"categories": [...], "items": [...]}'
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm"
                                rows={8}
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onParseMenuJson}
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                            >
                                Parser JSON
                            </button>

                            {parsedMenu && (
                                <button
                                    onClick={onImportMenu}
                                    disabled={loading === 'menu'}
                                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                                >
                                    {loading === 'menu' ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    <span>{loading === 'menu' ? 'Import...' : 'Importer Menu'}</span>
                                </button>
                            )}
                        </div>

                        {/* Aperçu du menu parsé */}
                        {parsedMenu && (
                            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                                <h3 className="font-medium text-green-400 mb-3">Menu parsé avec succès ✅</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <h4 className="font-medium text-gray-300 mb-2">Catégories ({parsedMenu.categories.length}):</h4>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {parsedMenu.categories.map(cat => (
                                                <div key={cat.id} className="text-gray-400">
                                                    {cat.emoji} {cat.nom}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-300 mb-2">Articles ({parsedMenu.items.length}):</h4>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {parsedMenu.items.slice(0, 5).map(item => (
                                                <div key={item.id} className="text-gray-400">
                                                    {item.nom} - {item.prix}€
                                                </div>
                                            ))}
                                            {parsedMenu.items.length > 5 && (
                                                <div className="text-gray-500">... et {parsedMenu.items.length - 5} autres</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantConfigAdmin;