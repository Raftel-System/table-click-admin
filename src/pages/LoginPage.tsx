// src/pages/Login.tsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Se connecter avec Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Récupérer les données utilisateur depuis Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                setError('Utilisateur non trouvé dans la base de données');
                return;
            }

            const userData = userDoc.data();

            // Vérifier l'email
            if (userData.email !== email) {
                setError('Email non valide');
                return;
            }

            // Vérifier le rôle
            if (userData.role !== 'server') {
                setError('Accès non autorisé');
                return;
            }

            // Vérifier qu'il y a un restaurant associé
            if (!userData.restaurant) {
                setError('Aucun restaurant associé à ce compte');
                return;
            }

            // Rediriger vers le dashboard du restaurant
            navigate(`/admin/${userData.restaurant}`);

        } catch (error: any) {
            setError('Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-center text-white">Connexion</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="votre@email.com"
                                className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;