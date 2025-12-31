import { useEffect } from 'react';
import { useBackHandlerContext } from '../contexts/BackHandlerContext';

/**
 * Hook to register a hardware back button handler.
 * @param handler The function to call when back button is pressed. Return true if handled.
 * @param deps Dependencies that should trigger re-registration of the handler
 * @param priority Priority of the handler (higher = handled first). Default 10.
 */
export const useNativeBack = (
    handler: () => boolean,
    deps: any[] = [],
    priority: number = 10
) => {
    const { register } = useBackHandlerContext();

    useEffect(() => {
        const unregister = register(handler, priority);
        return unregister;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [register, priority, ...deps]);
};
