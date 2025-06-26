import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface AuthUser {
    uid: string;
    email: string;
    role: string;
    restaurant: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Écouteur Firebase Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await loadUserData(firebaseUser);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Fonction pour charger les données Firestore de l'utilisateur
    const loadUserData = async (firebaseUser: FirebaseUser) => {
        try {
            const userDocRef = doc(db, 'users', firebaseUser.email);
            const userSnap = await getDoc(userDocRef);
            console.log(userSnap);
            if (userSnap.exists()) {
                const data = userSnap.data();
                const enrichedUser: AuthUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    role: data.role || '',
                    restaurant: data.restaurant || '',
                };
                console.log('Utilisateur connecté:', enrichedUser);
                setUser(enrichedUser);
            } else {
                console.warn('Document utilisateur introuvable');
                setUser(null);
            }
        } catch (err) {
            console.error('Erreur chargement utilisateur:', err);
            setError('Erreur lors du chargement des données utilisateur');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Connexion
    const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        setError(null);
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            await loadUserData(userCred.user);
            return { success: true };
        } catch (err: any) {
            let message = 'Erreur de connexion.';
            switch (err.code) {
                case 'auth/user-not-found':
                    message = 'Aucun compte trouvé avec cette adresse email';
                    break;
                case 'auth/wrong-password':
                    message = 'Mot de passe incorrect';
                    break;
                case 'auth/invalid-email':
                    message = 'Adresse email invalide';
                    break;
                case 'auth/user-disabled':
                    message = 'Ce compte a été désactivé';
                    break;
                case 'auth/too-many-requests':
                    message = 'Trop de tentatives. Veuillez réessayer plus tard';
                    break;
            }
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, []);

    // Déconnexion
    const signOutUser = useCallback(async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setUser(null);
        } catch (err) {
            console.error('Erreur de déconnexion:', err);
            setError('Erreur lors de la déconnexion');
        } finally {
            setLoading(false);
        }
    }, []);

    return { user, loading, error, signIn, signOutUser };
};
