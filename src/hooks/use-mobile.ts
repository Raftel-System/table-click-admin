// src/hooks/use-mobile.ts
import { useState, useEffect } from 'react';

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Vérification initiale
        checkDevice();

        // Écouter les changements de taille d'écran
        window.addEventListener('resize', checkDevice);

        // Cleanup
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return isMobile;
}