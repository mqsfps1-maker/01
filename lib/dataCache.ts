/**
 * Smart Data Cache System
 * Melhora performance com localStorage caching + realtime sync
 */

const CACHE_PREFIX = 'thetagsflow_cache_';
const CACHE_VERSION = '1.0';
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

interface CacheEntry {
  data: any;
  timestamp: number;
  version: string;
}

/**
 * Salva dados no cache
 */
export const setCacheData = (key: string, data: any, ttlMs = CACHE_TTL) => {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    console.warn(`[Cache] Erro ao salvar ${key}:`, error);
  }
};

/**
 * Recupera dados do cache se ainda estiverem válidos
 */
export const getCacheData = (key: string, ttlMs = CACHE_TTL): any | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;

    // Se cache expirou, remove
    if (age > ttlMs) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn(`[Cache] Erro ao ler ${key}:`, error);
    return null;
  }
};

/**
 * Limpa cache específico
 */
export const clearCache = (key: string) => {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn(`[Cache] Erro ao limpar ${key}:`, error);
  }
};

/**
 * Limpa TODO o cache
 */
export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[Cache] Erro ao limpar cache:', error);
  }
};

/**
 * Atualiza cache incrementalmente (para realtime updates)
 */
export const updateCacheItem = (
  key: string,
  itemId: string,
  itemData: any,
  getIdField: (item: any) => string = (item) => item.id
) => {
  try {
    const cached = getCacheData(key);
    if (!cached || !Array.isArray(cached)) return;

    const index = cached.findIndex(item => getIdField(item) === itemId);
    if (index >= 0) {
      cached[index] = { ...cached[index], ...itemData };
    } else {
      cached.push(itemData);
    }

    setCacheData(key, cached);
  } catch (error) {
    console.warn(`[Cache] Erro ao atualizar item ${itemId}:`, error);
  }
};

/**
 * Remove item do cache
 */
export const removeCacheItem = (
  key: string,
  itemId: string,
  getIdField: (item: any) => string = (item) => item.id
) => {
  try {
    const cached = getCacheData(key);
    if (!cached || !Array.isArray(cached)) return;

    const filtered = cached.filter(item => getIdField(item) !== itemId);
    setCacheData(key, filtered);
  } catch (error) {
    console.warn(`[Cache] Erro ao remover item ${itemId}:`, error);
  }
};
