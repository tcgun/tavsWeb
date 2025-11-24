"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";

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
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            setError(null);
            setFirebaseUser(currentUser);

            if (currentUser) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Ensure id is included and types match
                        setUser({ id: userDoc.id, ...userData } as unknown as User);
                    } else {
                        // Handle case where user is authenticated but has no profile doc
                        // This might happen during signup flow before profile creation
                        console.warn("User profile document not found for uid:", currentUser.uid);
                        setUser(null);
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setError(err instanceof Error ? err : new Error("Unknown error fetching user data"));
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
