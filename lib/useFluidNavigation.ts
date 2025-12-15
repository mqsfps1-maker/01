/**
 * Hook para Navegação Fluida com Cache Inteligente
 * Previne recarregamentos desnecessários e telas cinzas
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAllCache } from './dataCache';

interface NavigationConfig {
    clearCacheOnPaths?: string[]; // Limpar cache ao entrar nestas rotas
    prefetchOnPaths?: string[];    // Pré-carregar dados ao sair desta rota
    dontShowLoaderFor?: string[];  // Não mostrar loading nessas rotas
}

const DEFAULT_CONFIG: NavigationConfig = {
    clearCacheOnPaths: ['/app/pedidos', '/app/importer', '/app/estoque'],
    prefetchOnPaths: ['/app/dashboard'],
    dontShowLoaderFor: ['/app/pedidos', '/app/dashboard', '/app/bipagem'],
};

export const useFluidNavigation = (config: NavigationConfig = DEFAULT_CONFIG) => {
    const location = useLocation();
    const navigate = useNavigate();
    const lastPathRef = useRef<string>('');

    useEffect(() => {
        const currentPath = location.pathname;
        
        // Se mudou de rota
        if (lastPathRef.current !== currentPath) {
            // Limpar cache se necessário
            if (config.clearCacheOnPaths?.some(path => currentPath.startsWith(path))) {
                clearAllCache();
            }
            
            lastPathRef.current = currentPath;
        }
    }, [location.pathname, config]);

    return {
        currentPath: location.pathname,
        shouldShowLoader: !config.dontShowLoaderFor?.some(path => location.pathname.startsWith(path)),
        navigate,
    };
};

export default useFluidNavigation;
