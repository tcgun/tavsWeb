"use client";

import React, { createContext, useContext, useState } from "react";

interface ChatContextType {
    isOpen: boolean;
    toggleChat: () => void;
    closeChat: () => void;
}

const AIChatContext = createContext<ChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => setIsOpen(prev => !prev);
    const closeChat = () => setIsOpen(false);

    return (
        <AIChatContext.Provider value={{ isOpen, toggleChat, closeChat }}>
            {children}
        </AIChatContext.Provider>
    );
}

export function useAIChat() {
    const context = useContext(AIChatContext);
    if (context === undefined) {
        throw new Error("useAIChat must be used within a AIChatProvider");
    }
    return context;
}
