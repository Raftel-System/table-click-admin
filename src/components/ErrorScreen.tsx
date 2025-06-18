// src/components/ErrorScreen.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorScreenProps {
    error: string;
    slug: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, slug }) => {
    const handleRetry = () => {
        window.location.reload();
    };

    const handleHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4">
            <Card className="bg-gray-900/90 border-red-500/50 shadow-2xl max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">
                        Restaurant introuvable
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-gray-300 mb-2">
                            Le restaurant <span className="font-mono text-yellow-500">"{slug}"</span> n'existe pas.
                        </p>
                        <p className="text-sm text-gray-400">
                            {error}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Button
                            onClick={handleRetry}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Réessayer
                        </Button>

                        <Button
                            onClick={handleHome}
                            variant="outline"
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                            <Home size={16} className="mr-2" />
                            Retour à l'accueil
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};

export default ErrorScreen;