"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center">
                        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                            Bir Hata Oluştu
                        </h1>
                        <p className="text-[var(--color-muted)] mb-6">
                            Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full font-medium hover:bg-opacity-90 transition-colors"
                        >
                            Sayfayı Yenile
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
