"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
    id: string;
    name: string;
    slug?: string;
}

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Try to fetch from 'categories' collection
                // Assuming documents have a 'name' field, or we use the ID as name
                const categoriesRef = collection(db, "categories");
                // You might want to order by a specific field if it exists, e.g., 'order' or 'name'
                // For now, let's just fetch them. If you have an 'order' field, uncomment the next line
                // const q = query(categoriesRef, orderBy("order")); 
                const q = query(categoriesRef);

                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    // Fallback if collection is empty (optional, or just return empty)
                    console.warn("No categories found in Firestore 'categories' collection.");
                    setCategories([]);
                } else {
                    const fetchedCategories: Category[] = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            name: data.name || doc.id, // Use name field or doc ID
                            slug: data.slug || doc.id.toLowerCase()
                        };
                    });

                    // Sort alphabetically if no order field
                    fetchedCategories.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

                    setCategories(fetchedCategories);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
                setError(err instanceof Error ? err : new Error("Unknown error"));
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return { categories, loading, error };
}
