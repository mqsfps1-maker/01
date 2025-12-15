/**
 * Invisible Loader - Não mostra tela cinza
 * Apenas mostra ícone de loading na barra, sem bloquear interação
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface InvisibleLoaderProps {
    isLoading: boolean;
}

const InvisibleLoader: React.FC<InvisibleLoaderProps> = ({ isLoading }) => {
    if (!isLoading) return null;

    // Apenas um indicador visual leve na barra do navegador
    return (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-60 animate-pulse" />
    );
};

export default InvisibleLoader;
