import React, { createContext, useContext, useRef, useCallback } from 'react';

type BackHandler = () => boolean;

interface BackHandlerContextType {
    register: (handler: BackHandler, priority?: number) => () => void;
    handleBack: () => boolean;
}

const BackHandlerContext = createContext<BackHandlerContextType | null>(null);

export const useBackHandlerContext = () => {
    const context = useContext(BackHandlerContext);
    if (!context) {
        throw new Error('useBackHandlerContext must be used within a BackHandlerProvider');
    }
    return context;
};

interface HandlerEntry {
    id: string;
    handler: BackHandler;
    priority: number;
    timestamp: number;
}

export const BackHandlerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const handlersRef = useRef<HandlerEntry[]>([]);

    const register = useCallback((handler: BackHandler, priority: number = 10) => {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();

        const newEntry: HandlerEntry = { id, handler, priority, timestamp };

        // Add to list
        handlersRef.current = [...handlersRef.current, newEntry];

        // Sort by priority (desc) then timestamp (desc) - LIFO within same priority
        handlersRef.current.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return b.timestamp - a.timestamp;
        });

        // Return cleanup function
        return () => {
            handlersRef.current = handlersRef.current.filter(h => h.id !== id);
        };
    }, []);

    const handleBack = useCallback(() => {
        // Iterate through handlers
        for (const entry of handlersRef.current) {
            if (entry.handler()) {
                return true; // Handled
            }
        }
        return false; // Not handled
    }, []);

    return (
        <BackHandlerContext.Provider value={{ register, handleBack }}>
            {children}
        </BackHandlerContext.Provider>
    );
};
