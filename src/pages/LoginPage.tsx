import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {auth, db} from "@/lib/firebase.ts";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Vérifier si l'utilisateur est déjà connecté au chargement de la page
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // L'utilisateur est déjà connecté, récupérer ses infos et rediriger
                await handleUserRedirect(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    // Fonction pour récupérer le slug et rediriger
    const handleUserRedirect = async (userId) => {
        try {
            // Chercher dans la collection users avec l'ID utilisateur
            const userDocRef = doc(db, 'users', userId);

            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log(userData);
                const userSlug = userData.restaurant;

                if (userSlug) {
                    // Rediriger vers la page utilisateur avec le slug
                    navigate(`/${userSlug}`);
                } else {
                    console.error('Slug utilisateur non trouvé');
                    setError('Profil utilisateur incomplet');
                }
            } else {
                console.error('Document utilisateur non trouvé');
                setError('Utilisateur non trouvé dans la base de données');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données utilisateur:', error);
            setError('Erreur lors du chargement du profil');
        }
    };

    // Fonction de connexion
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Authentification avec Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log('Utilisateur connecté:', user.uid);

            // Récupérer les données utilisateur et rediriger
            await handleUserRedirect(user.uid);

        } catch (error) {
            console.error('Erreur de connexion:', error);

            // Gestion des erreurs spécifiques
            switch (error.code) {
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
        <div className="login-container">
            <div className="login-form">
                <h2>Connexion</h2>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="votre@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="login-button"
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="login-links">
                    <a href="/forgot-password">Mot de passe oublié ?</a>
                    <a href="/register">Créer un compte</a>
                </div>
            </div>

            <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f5f5f5;
          padding: 20px;
        }
        
        .login-form {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          color: #555;
          font-weight: 500;
        }
        
        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        input:focus {
          outline: none;
          border-color: #007bff;
        }
        
        input:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }
        
        .login-button {
          width: 100%;
          padding: 12px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .login-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        .login-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }
        
        .login-links {
          text-align: center;
          margin-top: 20px;
        }
        
        .login-links a {
          color: #007bff;
          text-decoration: none;
          margin: 0 10px;
        }
        
        .login-links a:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
};

export default LoginPage;