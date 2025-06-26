// src/components/admin/PermissionWrapper.tsx
import React from 'react';
import {usePermissions, type UserPermissions} from "@/hooks/usePermission.ts";

interface PermissionWrapperProps {
    children: React.ReactNode;
    permission: keyof UserPermissions;
    fallback?: React.ReactNode;
    className?: string;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
                                                                        children,
                                                                        permission,
                                                                        fallback = null,
                                                                        className = ""
                                                                    }) => {
    const permissions = usePermissions();

    if (!permissions[permission]) {
        return fallback ? <div className={className}>{fallback}</div> : null;
    }

    return <div className={className}>{children}</div>;
};
