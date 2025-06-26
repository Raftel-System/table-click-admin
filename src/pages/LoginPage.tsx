import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase.ts';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) await handleUserRedirect(user.uid);
        });
        return () => unsubscribe();
    }, []);

    const handleUserRedirect = async (userId: string) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userSlug = userData.restaurant;
                if (userSlug) navigate(`/${userSlug}`);
                else setError('Profil utilisateur incomplet');
            } else {
                setError('Utilisateur non trouvé dans la base de données');
            }
        } catch (err) {
            console.error(err);
            setError('Erreur lors du chargement du profil');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await handleUserRedirect(userCredential.user.uid);
        } catch (err: any) {
            switch (err.code) {
                case 'auth/user-not-found':
                    setError('Aucun compte trouvé avec cette adresse email');
                    break;
                case 'auth/wrong-password':
                    setError('Mot de passe incorrect');
                    break;
                case 'auth/invalid-email':
                    setError('Adresse email invalide');
                    break;
                case 'auth/user-disabled':
                    setError('Ce compte a été désactivé');
                    break;
                case 'auth/too-many-requests':
                    setError('Trop de tentatives. Veuillez réessayer plus tard');
                    break;
                default:
                    setError('Erreur de connexion. Veuillez réessayer');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Connexion</h2>

                {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm border border-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="w-full px-4 py-2 border text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="w-full px-4 py-2 border text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full py-2 text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition"
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="text-sm text-center mt-6 space-y-2">
                    <a href="/forgot-password" className="text-blue-600 hover:underline block">
                        Mot de passe oublié ?
                    </a>
                    <a href="/register" className="text-blue-600 hover:underline block">
                        Créer un compte
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
