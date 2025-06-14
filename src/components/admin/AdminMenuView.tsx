// src/components/admin/AdminMenuView.tsx
import React from 'react';
import AdminMenuLayout from './menu/AdminMenuLayout';

const AdminMenuView: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Gestion du Menu</h2>
                <p className="text-gray-400">Gérez vos catégories et articles de menu</p>
            </div>

            {/* Layout principal */}
            <AdminMenuLayout />
        </div>
    );
};

export default AdminMenuView;