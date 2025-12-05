"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { doc, getDoc, onSnapshot } from "firebase/firestore"; // Updated import

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            // Do not start loading if we already have the same user
            // But here we rely on snapshot to manage loading state effectively
            setLoading(true);
            setError(null);
            setFirebaseUser(currentUser);

            // Clean up previous snapshot listener if it exists
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
            }

            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);

                // Real-time listener using onSnapshot
                unsubscribeSnapshot = onSnapshot(userDocRef,
                    (docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data();
                            setUser({ id: docSnap.id, ...userData } as unknown as User);
                        } else {
                            console.warn("User profile document not found (yet) for uid:", currentUser.uid);
                            setUser(null);
                        }
                        setLoading(false);
                    },
                    (err) => {
                        console.error("Error fetching user data:", err);
                        setError(err);
                        setUser(null);
                        setLoading(false);
                    }
                );
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
