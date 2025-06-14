// src/components/LoadingScreen.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4">
            <Card className="bg-gray-900/90 border-gray-700 shadow-2xl max-w-md w-full">
                <CardContent className="p-8 text-center">
                    {/* Logo animé */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg shadow-yellow-500/25 animate-pulse">
                            <span className="text-2xl font-bold text-black">O2</span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-gray-900 animate-bounce"></div>
                    </div>

                    {/* Spinner */}
                    <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-6"></div>

                    {/* Texte */}
                    <h2 className="text-xl font-bold text-white mb-2">Chargement du restaurant...</h2>
                    <p className="text-gray-400 text-sm">Connexion à Firebase en cours</p>

                    {/* Points animés */}
                    <div className="flex justify-center space-x-1 mt-4">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


export default LoadingScreen;